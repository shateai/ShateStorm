
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { InputSection } from './components/InputSection';
import { OutlineViewer } from './components/OutlineViewer';
import { LoadingScreen } from './components/LoadingScreen';
import { PresentationViewer } from './components/PresentationViewer';
import { Gallery } from './components/Gallery';
import { Explore } from './components/Explore';
import { PublicViewer } from './components/PublicViewer';
import { Navbar } from './components/Navbar';
import { AppState, Slide, Presentation, UserStats } from './types';
import { generateOutline, generatePresentationFromOutline, generateSlideImage, generateSlideAudio, validateImage } from './services/geminiService';
import { 
  ensureAuth, 
  createPresentation, 
  updatePresentation, 
  getPresentations, 
  deletePresentation, 
  signInWithGoogle, 
  uploadAudio, 
  updateSlideAtIndex,
  getUserStats,
  incrementImageCount,
  getPresentationById,
  testConnection,
  auth 
} from './services/firebaseService';
import { uploadToCloudinary } from './services/cloudinaryService';

const MAX_FREE_PRESENTATIONS = 15;
const MAX_DAILY_IMAGES = 50;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'explore',
    topic: '',
    voice: 'Kore',
    slideCount: 5,
    files: [],
    filePreviews: [],
    presentation: null,
    outline: null,
    currentSlideIndex: 0,
    loadingStatus: '',
    progress: 0,
    presentations: []
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ dailyImageCount: 0, lastImageGenerationDate: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    testConnection();
    const params = new URLSearchParams(window.location.search);
    const publicId = params.get('id');
    if (publicId) {
      getPresentationById(publicId).then(p => {
        if (p && p.isPublic) {
          setState(prev => ({ ...prev, step: 'public_view', presentation: p }));
        }
      });
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    ensureAuth().then(async user => {
      setUserId(user.uid);
      setIsAuthLoading(false);
      
      const stats = await getUserStats(user.uid);
      setUserStats(stats);

      unsubscribe = getPresentations(user.uid, (presentations) => {
        setState(prev => ({ ...prev, presentations }));
      });
    }).catch(err => {
      console.warn("Auto-auth failed, user needs to sign in manually:", err);
      setIsAuthLoading(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const user = await signInWithGoogle();
      setUserId(user.uid);
      const stats = await getUserStats(user.uid);
      setUserStats(stats);
      getPresentations(user.uid, (presentations) => {
        setState(prev => ({ ...prev, presentations }));
      });
    } catch (error) {
      alert("Nepodařilo se přihlásit.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const getRandomShape = () => {
    const shapes = ['rounded-2xl', 'rounded-3xl', 'rounded-xl', 'rounded-2xl'];
    return shapes[Math.floor(Math.random() * shapes.length)];
  };

  const getCoordinates = (index: number) => {
      const colWidth = 1600;
      const rowHeight = 1000;
      const cols = 3; 
      const row = Math.floor(index / cols);
      const colPos = index % cols;
      const actualCol = row % 2 === 0 ? colPos : (cols - 1) - colPos;
      return { x: actualCol * colWidth, y: row * rowHeight };
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setState(prev => ({ ...prev, presentations: [], step: 'dashboard' }));
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  const handleCreateNew = async () => {
    if (!userId) {
      alert("Probíhá přihlašování... Zkuste to prosím za okamžik.");
      return;
    }

    if (state.presentations.length >= MAX_FREE_PRESENTATIONS) {
      alert(`Dosáhli jste limitu ${MAX_FREE_PRESENTATIONS} prezentací. Před vytvořením nové prosím nějakou smažte.`);
      return;
    }
    
    setIsCreatingNew(true);
    try {
      const id = await createPresentation(userId);
      if (id) {
        setState(prev => ({
          ...prev,
          step: 'input',
          topic: '',
          presentation: {
            id,
            userId,
            topic: '',
            presentationTitle: 'Nová prezentace',
            slides: [],
            sources: [],
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }));
      } else {
        alert("Nepodařilo se vytvořit prezentaci. Zkuste to znovu.");
      }
    } catch (error) {
      alert("Chyba při vytváření prezentace.");
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePresentation(id);
      // Only reset step if the deleted presentation was the one being edited/viewed
      if (state.presentation?.id === id) {
        setState(prev => ({ ...prev, step: 'dashboard', presentation: null }));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Nepodařilo se smazat prezentaci. Zkontrolujte prosím připojení.");
    }
  };

  const handleSelect = (p: Presentation) => {
    setState(prev => ({
      ...prev,
      step: p.status === 'complete' ? 'preview' : 'input',
      topic: p.topic,
      presentation: p
    }));
  };

  const handleGenerateOutline = async () => {
    if (!state.topic.trim()) {
      alert("Zadejte prosím téma nebo vložte poznámky.");
      return;
    }
    
    // Ensure we have a presentation ID, create one if it somehow went missing
    let currentId = state.presentation?.id;
    if (!currentId && userId) {
      try {
        currentId = await createPresentation(userId);
        if (!currentId) throw new Error("Failed to create presentation");
      } catch (err) {
        alert("Nepodařilo se inicializovat prezentaci.");
        return;
      }
    }

    setState(prev => ({ 
      ...prev, 
      step: 'generating', 
      loadingStatus: 'Provádím průzkum tématu a sestavuji osnovu...', 
      progress: 20 
    }));
    
    try {
      const outline = await generateOutline(state.topic, state.slideCount, state.files);
      if (!outline || outline.length === 0) {
        throw new Error("Generování osnovy selhalo (prázdný výsledek).");
      }
      setState(prev => ({ ...prev, step: 'outline', outline, progress: 100 }));
    } catch (error) {
      console.error("Generate outline error:", error);
      alert("Chyba při generování osnovy. Zkuste to prosím znovu.");
      setState(prev => ({ ...prev, step: 'input' }));
    }
  };

  const handleGenerateFinal = async () => {
    if (!state.presentation || !state.outline) {
      alert("Chybí podklady pro generování. Zkuste se prosím vrátit na začátek.");
      setState(p => ({ ...p, step: 'input' }));
      return;
    }
    setState(prev => ({ ...prev, step: 'generating', loadingStatus: 'Generuji finální slidy a vizuály...', progress: 10 }));
    try {
      const { slides, sources, title } = await generatePresentationFromOutline(state.topic, state.outline, state.files);
      const processedSlides: Slide[] = slides.map((s, index) => {
          const coords = getCoordinates(index);
          return { 
            ...s, 
            shape: getRandomShape(), 
            x: coords.x, 
            y: coords.y, 
            layout: s.layout || (index % 2 === 0 ? 'standard' : 'reversed') 
          };
      });
      
      const updatedPresentation: Presentation = {
        ...state.presentation,
        topic: state.topic,
        presentationTitle: title,
        slides: processedSlides,
        sources,
        status: 'complete'
      };

      await updatePresentation(state.presentation.id, {
        topic: state.topic,
        presentationTitle: title,
        slides: processedSlides,
        sources,
        status: 'complete'
      });

      setState(prev => ({ ...prev, step: 'preview', presentation: updatedPresentation, progress: 100 }));
      generateContentBackground(processedSlides, state.voice, state.presentation?.id || '');
    } catch (error) {
      alert("Chyba při finálním generování.");
      setState(prev => ({ ...prev, step: 'outline' }));
    }
  };

  const handleShowDemo = () => {
    const demoSlides: Slide[] = [
      {
        id: 0,
        title: "Vesmírný výzkum v roce 2026",
        bulletPoints: ["Klonování na Marsu", "Nové motory na anti-hmotu", "Dovolená na Měsíci"],
        speakerNotes: "Vítejte u prezentace o budoucnosti.",
        imagePrompt: "Futuristic space station above Earth, high quality, 8k",
        layout: 'classic',
        shape: getRandomShape(),
        x: 0,
        y: 0
      },
      {
        id: 1,
        title: "Robotika a AI",
        bulletPoints: ["Autonomní domácnosti", "Emoční inteligence u strojů", "Konec nudné práce"],
        speakerNotes: "Roboti jsou všude kolem nás.",
        imagePrompt: "Friendly humanoid robot helping in a kitchen, warm lighting",
        layout: 'reversed',
        shape: getRandomShape(),
        x: 1600,
        y: 0
      },
      {
        id: 2,
        title: "Udržitelná energie",
        bulletPoints: ["Fúze v každém městě", "Solární barvy na budovy", "Grafenové baterie"],
        speakerNotes: "Energie bude zdarma.",
        imagePrompt: "Green city with solar panels and wind turbines, lush vegetation",
        layout: 'classic',
        shape: getRandomShape(),
        x: 1600,
        y: 1000
      }
    ];

    setState(prev => ({
      ...prev,
      step: 'preview',
      presentation: {
        topic: "Ukázková prezentace",
        presentationTitle: "Ukázka rozložení a funkcí",
        slides: demoSlides,
        sources: [
          { title: "Wikipedie - Vesmír", uri: "https://cs.wikipedia.org/wiki/Vesmír" },
          { title: "NASA - Budoucnost", uri: "https://www.nasa.gov" }
        ]
      }
    }));
  };

  const getAspectRatio = (layout?: string) => {
    switch (layout) {
      case 'full-image': return "16:9";
      case 'vertical': return "16:9";
      case 'standard':
      case 'reversed': return "4:3";
      case 'big-title': return "1:1";
      default: return "1:1";
    }
  };

  const generateContentBackground = async (slides: Slide[], voice: string, presentationId: string) => {
      // Parallel Image Generation
      const imagePromises = slides.map(async (slide, i) => {
          if (slide.layout === 'text-only') return;
          try {
              // Check image quota before generating
              const currentStats = await getUserStats(userId!);
              if (currentStats.dailyImageCount >= MAX_DAILY_IMAGES) {
                 console.warn("Image quota exceeded for today");
                 return;
              }

              const img = await generateSlideImage(slide.imagePrompt, getAspectRatio(slide.layout));
              if (img) {
                // Increment quota
                const newCount = await incrementImageCount(userId!);
                if (newCount) setUserStats(prev => ({ ...prev, dailyImageCount: newCount }));

                const validation = await validateImage(img, slide.title, slide.bulletPoints);
                const url = await uploadToCloudinary(img);
                
                if (url) {
                  updateSlide(i, { 
                    imageBase64: img, 
                    imageUrl: url,
                    imageValidation: validation 
                  });
                  setTimeout(() => updateSlide(i, { imageBase64: undefined }), 5000);
                } else {
                  updateSlide(i, { imageBase64: img, imageValidation: validation });
                }
              }
          } catch (e) {
              console.error(`Image generation failed for slide ${i}:`, e);
          }
      });

      // Parallel Audio Generation (with slight staggering to avoid rate limits if many slides)
      const audioPromises = slides.map(async (slide, i) => {
          try {
              // Stagger start times slightly
              await new Promise(r => setTimeout(r, i * 500));
              const audio = await generateSlideAudio(slide.speakerNotes, voice);
              if (audio) {
                const url = await uploadAudio(presentationId, i, audio);
                updateSlide(i, { 
                  audioBase64: audio,
                  audioUrl: url || undefined
                });
              }
          } catch (e) {
              console.error(`Audio generation failed for slide ${i}:`, e);
          }
      });

      // Show global status while generating
      setState(prev => ({ ...prev, loadingStatus: 'Generuji vizuály a dabing...' }));
      
      await Promise.allSettled([...imagePromises, ...audioPromises]);
      setState(prev => ({ ...prev, loadingStatus: 'Hotovo.' }));
  };

  const handleRegenerateAudio = async (index: number) => {
    if (!state.presentation || !state.presentation.id) return;
    const slide = state.presentation.slides[index];
    if (!slide) return;

    try {
      setState(prev => ({ ...prev, loadingStatus: `Předělávám dabing pro slide ${index + 1}...` }));
      const audio = await generateSlideAudio(slide.speakerNotes, state.voice);
      if (audio) {
        const url = await uploadAudio(state.presentation.id, index, audio);
        updateSlide(index, { 
          audioBase64: audio,
          audioUrl: url || undefined
        });
      }
    } catch (e) {
      console.error("Manual audio regen failed:", e);
      alert("Nepodařilo se přegenerovat zvuk.");
    } finally {
      setState(prev => ({ ...prev, loadingStatus: '' }));
    }
  };

  const handleRegenerateImage = async (index: number) => {
    if (!state.presentation || !state.presentation.id) return;
    const slide = state.presentation.slides[index];
    if (!slide) return;

    try {
      // Quota check
      const currentStats = await getUserStats(userId!);
      if (currentStats.dailyImageCount >= MAX_DAILY_IMAGES) {
        alert("Dosáhli jste denního limitu pro generování vizuálů (50). Zkuste to prosím zítra.");
        return;
      }

      setState(prev => ({ ...prev, loadingStatus: `Generuji nový vizuál pro slide ${index + 1}...` }));
      const img = await generateSlideImage(slide.imagePrompt, getAspectRatio(slide.layout));
      if (img) {
         // Increment quota
         const newCount = await incrementImageCount(userId!);
         if (newCount) setUserStats(prev => ({ ...prev, dailyImageCount: newCount }));

         const validation = await validateImage(img, slide.title, slide.bulletPoints);
         const url = await uploadToCloudinary(img);
         
         if (url) {
           updateSlide(index, { imageBase64: img, imageUrl: url, imageValidation: validation });
           setTimeout(() => updateSlide(index, { imageBase64: undefined }), 5000);
         } else {
           updateSlide(index, { imageBase64: img, imageValidation: validation });
         }
      }
    } catch (e) {
      console.error("Manual image regen failed:", e);
      alert("Nepodařilo se vygenerovat obrázek.");
    } finally {
      setState(prev => ({ ...prev, loadingStatus: '' }));
    }
  };

  const navigateTo = (step: 'dashboard' | 'gallery' | 'explore') => {
    setState(prev => ({ ...prev, step, presentation: null }));
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
      setState(cur => {
          if (!cur.presentation) return cur;
          const newSlides = [...cur.presentation.slides];
          if (newSlides[index]) newSlides[index] = { ...newSlides[index], ...updates };
          
          // Persistence - surgical update
          if (cur.presentation.id && cur.presentation.status === 'complete') {
             updateSlideAtIndex(cur.presentation.id, index, updates);
          }
          
          return { ...cur, presentation: { ...cur.presentation, slides: newSlides } };
      });
  };

  const addSlide = (title: string, bulletPoints: string[]) => {
    setState(cur => {
      if (!cur.presentation) return cur;
      const lastSlide = cur.presentation.slides[cur.presentation.slides.length - 1];
      const coords = getCoordinates(cur.presentation.slides.length);
      
      const newSlide: Slide = {
        id: cur.presentation.slides.length,
        title,
        bulletPoints,
        speakerNotes: `Zde jsou poznámky k novému slidu: ${title}`,
        imagePrompt: `${title}, realistic style, high quality`,
        layout: 'standard',
        shape: getRandomShape(),
        x: coords.x,
        y: coords.y
      };

      const newSlides = [...cur.presentation.slides, newSlide];
      
      if (cur.presentation.id) {
         updatePresentation(cur.presentation.id, { slides: newSlides });
         // Also trigger image generation for the new slide
         generateSlideImage(newSlide.imagePrompt).then(async img => {
           if (img) {
              const url = await uploadToCloudinary(img);
              updateSlideAtIndex(cur.presentation.id!, newSlide.id, { imageUrl: url || undefined, imageBase64: img });
           }
         });
      }

      return { ...cur, presentation: { ...cur.presentation, slides: newSlides } };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      <Navbar 
        currentStep={state.step} 
        onNavigate={navigateTo} 
        userEmail={auth.currentUser?.email}
        onSignOut={handleSignOut}
      />
      
      {state.step === 'dashboard' && (
        <Dashboard 
          presentations={state.presentations} 
          onCreateNew={handleCreateNew} 
          onSelect={handleSelect}
          onDelete={handleDelete}
          userId={userId}
          isAuthLoading={isAuthLoading || isCreatingNew}
          onSignIn={handleSignIn}
          quotaLimit={MAX_FREE_PRESENTATIONS}
          quotaUsed={state.presentations.length}
          imageQuotaLimit={MAX_DAILY_IMAGES}
          imageQuotaUsed={userStats.dailyImageCount}
        />
      )}
      {state.step === 'gallery' && (
        <Gallery 
          presentations={state.presentations}
          onBack={() => navigateTo('dashboard')}
        />
      )}
      {state.step === 'explore' && (
        <Explore 
          onSelect={(p) => setState(prev => ({ ...prev, step: 'public_view', presentation: p }))}
          onBack={() => navigateTo('dashboard')}
        />
      )}
      {state.step === 'public_view' && state.presentation && (
        <PublicViewer 
          presentation={state.presentation}
          onBackToExplore={() => navigateTo('explore')}
        />
      )}
      {state.step === 'input' && (
        <div className="container mx-auto px-4 py-4 md:py-8">
          <InputSection 
            {...state} 
            setTopic={t => setState(p => ({...p, topic: t}))} 
            setSlideCount={c => setState(p => ({...p, slideCount: c}))} 
            setVoice={v => setState(p => ({...p, voice: v}))} 
            setFiles={f => setState(p => ({...p, files: f}))} 
            onGenerate={handleGenerateOutline} 
            onShowDemo={handleShowDemo} 
            isGenerating={state.step === 'generating'} 
          />
        </div>
      )}
      {state.step === 'outline' && state.outline && (
        <OutlineViewer 
          topic={state.topic}
          outline={state.outline}
          onUpdate={o => setState(p => ({ ...p, outline: o }))}
          onGenerate={handleGenerateFinal}
          onCancel={() => setState(p => ({ ...p, step: 'input' }))}
          slideCount={state.slideCount}
          setSlideCount={c => setState(p => ({ ...p, slideCount: c }))}
          onRegenerate={handleGenerateOutline}
          isRegenerating={state.step === 'generating'}
        />
      )}
      {state.step === 'generating' && <LoadingScreen status={state.loadingStatus} progress={state.progress} />}
      {state.step === 'preview' && state.presentation && (
        <PresentationViewer 
          data={state.presentation} 
          loadingStatus={state.loadingStatus} 
          onReset={() => setState(p => ({...p, step: 'dashboard', presentation: null}))} 
          onUpdateSlide={updateSlide} 
          onAddSlide={addSlide}
          onDelete={handleDelete}
          onRegenerateAudio={handleRegenerateAudio}
          onRegenerateImage={handleRegenerateImage}
          onTogglePublic={(id, isPublic) => {
            setState(prev => {
              if (prev.presentation?.id === id) {
                return { ...prev, presentation: { ...prev.presentation, isPublic } };
              }
              return prev;
            });
          }}
        />
      )}
    </div>
  );
};

export default App;
