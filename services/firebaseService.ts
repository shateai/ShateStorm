
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  onSnapshot,
  deleteField,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { Presentation, Slide, UserStats } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// User Stats
export const getUserStats = async (userId: string): Promise<UserStats> => {
  const path = `users/${userId}/stats/daily`;
  try {
    const docRef = doc(db, 'users', userId, 'stats', 'daily');
    const docSnap = await getDoc(docRef);
    const today = new Date().toISOString().split('T')[0];

    if (docSnap.exists()) {
      const data = docSnap.data() as UserStats;
      if (data.lastImageGenerationDate === today) {
        return data;
      }
    }
    
    // Default or new day
    return {
      dailyImageCount: 0,
      lastImageGenerationDate: today
    };
  } catch (e) {
    console.error("Error getting user stats:", e);
    return { dailyImageCount: 0, lastImageGenerationDate: new Date().toISOString().split('T')[0] };
  }
};

export const incrementImageCount = async (userId: string, count: number = 1) => {
  const path = `users/${userId}/stats/daily`;
  try {
    const docRef = doc(db, 'users', userId, 'stats', 'daily');
    const stats = await getUserStats(userId);
    const newCount = stats.dailyImageCount + count;
    
    await setDoc(docRef, {
      dailyImageCount: newCount,
      lastImageGenerationDate: stats.lastImageGenerationDate
    });
    return newCount;
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const ensureAuth = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        // Try anonymous first, if fails, it might need Google Sign In
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user);
        } catch (e) {
          console.warn("Anonymous sign-in failed, waiting for user action or manual sign-in might be required", e);
          // Don't reject yet, just wait for manual sign-in or let caller handle it
          // In this environment, we might want to try Google Sign In if possible
          // but that usually requires a button click.
          unsubscribe();
          reject(e);
        }
      }
    });
  });
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error", error);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};

export const createPresentation = async (userId: string, title: string = 'Nová prezentace'): Promise<string> => {
  const path = 'presentations';
  try {
    const docRef = await addDoc(collection(db, path), {
      userId,
      presentationTitle: title,
      topic: '',
      slides: [],
      sources: [],
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, path);
    return '';
  }
};

export const updateSlideAtIndex = async (id: string, index: number, slideUpdates: Partial<Slide>) => {
  const path = `presentations/${id}`;
  try {
    const docRef = doc(db, 'presentations', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Prezentace nenalezena");
    }

    const data = docSnap.data();
    const slides = [...(data.slides || [])];
    
    if (index >= 0 && index < slides.length) {
      // Merge updates into the specific slide
      slides[index] = { ...slides[index], ...slideUpdates };
      
      // Sanitization: remove redundant base64 if URL is present
      if (slides[index].imageUrl && slides[index].imageBase64) delete slides[index].imageBase64;
      if (slides[index].audioUrl && slides[index].audioBase64) delete slides[index].audioBase64;
      
      // Update the entire slides array (surgical array updates are not supported by dot notation in Firestore)
      await updateDoc(docRef, {
        slides: slides,
        updatedAt: serverTimestamp()
      });
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
  }
};

export const updatePresentation = async (id: string, updates: Partial<Presentation>) => {
  const path = `presentations/${id}`;
  try {
    const docRef = doc(db, 'presentations', id);
    
    // 1. Sanitize slides: if a slide has a URL, remove the base64 to save space
    const sanitizedUpdates: any = {};
    
    // Only map defined keys to the update object
    Object.keys(updates).forEach(key => {
      const val = (updates as any)[key];
      if (val !== undefined && key !== 'id') {
        sanitizedUpdates[key] = val;
      }
    });

    if (sanitizedUpdates.slides && Array.isArray(sanitizedUpdates.slides)) {
      sanitizedUpdates.slides = sanitizedUpdates.slides.map((slide: any) => {
        const s = { ...slide };
        // If we have an exterior URL, we don't need to store the heavy base64 in Firestore
        if (s.imageUrl && s.imageBase64) {
          delete s.imageBase64;
        }
        if (s.audioUrl && s.audioBase64) {
          delete s.audioBase64;
        }
        // Remove undefined fields in slides
        Object.keys(s).forEach(k => {
          if (s[k] === undefined) delete s[k];
        });
        return s;
      });
    }

    await updateDoc(docRef, {
      ...sanitizedUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
  }
};

export const getPresentations = (userId: string, callback: (presentations: Presentation[]) => void) => {
  const path = 'presentations';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const results: Presentation[] = [];
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as Presentation);
    });
    callback(results);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const deletePresentation = async (id: string) => {
  const path = `presentations/${id}`;
  try {
    await deleteDoc(doc(db, 'presentations', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, path);
  }
};

export const togglePresentationPublic = async (id: string, isPublic: boolean) => {
  const path = `presentations/${id}`;
  try {
    const docRef = doc(db, 'presentations', id);
    await updateDoc(docRef, {
      isPublic,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
  }
};

export const getPublicPresentations = async (): Promise<Presentation[]> => {
  const path = 'presentations';
  try {
    const q = query(
      collection(db, path),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const results: Presentation[] = [];
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as Presentation);
    });
    return results;
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
};

export const getPresentationById = async (id: string): Promise<Presentation | null> => {
  const path = `presentations/${id}`;
  try {
    const docRef = doc(db, 'presentations', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Presentation;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, path);
    return null;
  }
};

export const uploadImage = async (presentationId: string, slideIndex: number, base64: string): Promise<string> => {
    try {
        const storageRef = ref(storage, `presentations/${presentationId}/slide_${slideIndex}.png`);
        await uploadString(storageRef, base64, 'base64');
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (error) {
        console.error("Error uploading image to storage:", error);
        return '';
    }
};

export const uploadAudio = async (presentationId: string, slideIndex: number, base64: string): Promise<string> => {
    try {
        const storageRef = ref(storage, `presentations/${presentationId}/audio_${slideIndex}.mp3`);
        await uploadString(storageRef, base64, 'base64');
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (error) {
        console.error("Error uploading audio to storage:", error);
        return '';
    }
};
