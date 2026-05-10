
import { GoogleGenAI, Modality } from "@google/genai";
import { Slide, Source } from "../types";

export const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } } | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result || !result.includes(',')) {
        resolve(null);
        return;
      }
      const base64String = result.split(',')[1];
      if (!base64String) {
        resolve(null);
        return;
      }
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const addWavHeader = (base64Pcm: string): string => {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 24000, true);
  view.setUint32(28, 24000 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, len, true);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) bytes[44 + i] = binaryString.charCodeAt(i);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const generateOutline = async (
  topic: string,
  count: number,
  files: File[]
): Promise<DraftSlide[]> => {
  const rawFileParts = await Promise.all(files.map(fileToPart));
  const fileParts = rawFileParts.filter(p => p !== null) as any[];

  const prompt = `
    Jsi odborný rešeršér a pedagog. Tvým úkolem je připravit OSNOVU prezentace na téma: "${topic}".
    DŮLEŽITÝ POŽADAVEK: MUSÍŠ VYGENEROVAT PŘESNĚ ${count} SLAJDŮ.
    
    FILOZOFIE TVÉ PRÁCE:
    - Prezentace musí být "blbuvzdorná". Vysvětli téma tak, aby ho pochopil i někdo, kdo o něm v životě neslyšel.
    - Každý slajd musí mít jasný pedagogický cíl.
    
    Formát výstupu: JSON
    {
      "outline": [
        {
          "title": "Stručný a výstižný nadpis",
          "description": "Cíl tohoto slajdu",
          "suggestedBullets": ["Bod 1", "Bod 2", "Bod 3"]
        }
      ]
    }
    Počet prvků v poli "outline" musí být přesně ${count}.
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: 'user', parts: [...fileParts, { text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }] 
    },
  });

  try {
    const parsed = JSON.parse(result.text || "{}");
    let outline = parsed.outline || [];
    // Force count if model hallucinated slightly
    if (outline.length > count) outline = outline.slice(0, count);
    return outline;
  } catch (e) {
    console.error("Outline parse failed", e);
    return [];
  }
};

export const generatePresentationFromOutline = async (
  topic: string,
  outline: DraftSlide[],
  files: File[]
): Promise<{ slides: Slide[]; sources: Source[]; title: string }> => {
  
  const rawFileParts = await Promise.all(files.map(fileToPart));
  const fileParts = rawFileParts.filter(p => p !== null) as any[];

  const prompt = `
    Na základě schválené osnovy vytvoř finální obsah prezentace v češtině.
    Téma: ${topic}
    Osnova: ${JSON.stringify(outline)}
    
    KRITICKÉ POŽADAVKY:
    - Každá odrážka MUSÍ být ultra-stručná (max 5-6 slov). Žádné dlouhé věty!
    - Cíli na PŘESNĚ 3-4 odrážky na slajd.
    - Prezentace musí být vizuálně čistá, ne "přeplácaná" textem.
    - Veškeré detaily a vysvětlení patří do speakerNotes (buď tam velmi podrobný).
    
    Vrať JSON: 
    { 
      "presentationTitle": "Atraktivní název prezentace", 
      "slides": [{ 
        "title": "Nadpis", 
        "bulletPoints": ["Srozumitelné vysvětlení 1", "Srozumitelné vysvětlení 2"], 
        "speakerNotes": "Podrobný výklad pro řečníka...", 
        "imagePrompt": "Detailed visual description in English for AI generator",
        "layout": "standard | reversed | vertical | full-image | text-only | big-title"
      }] 
    }
  `;

  const resultFinal = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [...fileParts, { text: prompt }] }],
    config: { tools: [{ googleSearch: {} }] },
  });

  const responseTextFinal = resultFinal.text;
  let rawJSON = responseTextFinal || "{}";
  rawJSON = rawJSON.replace(/```json/g, '').replace(/```/g, '').trim();

  let parsed: any = { slides: [], presentationTitle: topic };
  try {
    parsed = JSON.parse(rawJSON);
  } catch (e) {
    console.error("JSON parse failed");
  }
  
  const sources: Source[] = [];
  const groundingChunks = resultFinal.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
    });
  }

  const slides: Slide[] = (parsed.slides || []).map((s: any, idx: number) => ({
    id: idx,
    title: s.title || "Slide bez názvu",
    bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : [],
    speakerNotes: s.speakerNotes || "",
    imagePrompt: s.imagePrompt || topic,
    layout: s.layout || 'standard'
  }));

  return { slides, sources: sources.slice(0, 4), title: parsed.presentationTitle || topic };
};

export const updateSlideContent = async (slide: Slide, request: string): Promise<Partial<Slide>> => {
  const prompt = `
    Aktualizuj slide: "${slide.title}".
    Uživatel chce: "${request}"
    ZŮSTAŇ SROZUMITELNÝ. Vysvětluj věci polopatě.
    Vrať JSON: { "title": "...", "bulletPoints": ["..."], "speakerNotes": "...", "imagePrompt": "..." }
  `;
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const responseText = result.text;
  let rawJSON = responseText || "{}";
  rawJSON = rawJSON.replace(/```json/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(rawJSON); } catch (e) { return {}; }
};

export const generateSlideImage = async (imagePrompt: string, aspectRatio: string = "1:1", retries = 3): Promise<string | undefined> => {
  if (!imagePrompt || imagePrompt.trim() === "") return undefined;
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
      // Note: Image generation might require specific model or config if using Imagen
      // Assuming for now it's supported via multimodal output or specific model
    });
    // Fallback if image gen is not direct: check for parts with inlineData
    for (const part of result.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) return part.inlineData.data;
    }
  } catch (error: any) {
    if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generateSlideImage(imagePrompt, aspectRatio, retries - 1);
    }
  }
  return undefined;
};

export const validateImage = async (imageBase64: string, slideTitle: string, slideBullets: string[]): Promise<Slide['imageValidation']> => {
  try {
    const prompt = `
      Jsi vizuální kritik. Analyzuj tento obrázek vzhledem k tématu slidu: "${slideTitle}".
      Obsah slidu: ${slideBullets.join(', ')}.
      Hledej:
      1. Anatomické chyby.
      2. Relevanci k textu.
      3. Nesmyslné artefakty AI.
      Vrať JSON: { "isOk": boolean, "reason": "Krátké zdůvodnění v češtině", "score": number }
    `;
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/png" } },
          { text: prompt }
        ]
      }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.text || "{}");
  } catch (e) {
    return { isOk: true, reason: "Kontrola se nezdařila, ale obrázek byl ponechán.", score: 5 };
  }
};

export const generateSlideAudio = async (text: string, voiceName: string = 'Kore', retries = 3): Promise<string | undefined> => {
  if (!text || text.trim() === "") return undefined;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });
    const base64PCM = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64PCM) {
      return addWavHeader(base64PCM);
    }
  } catch (error: any) {
    console.error("Audio generation error details:", error);
    if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        return generateSlideAudio(text, voiceName, retries - 1);
    }
  }
  return undefined;
};

export const previewVoice = async (voiceName: string): Promise<string | undefined> => {
    return await generateSlideAudio("Ahoj, tohle je ukázka mého hlasu.", voiceName);
};
