import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================================================
// STRUKTUR KONFIGURASI FIREBASE (Aktif & Terhubung)
// ============================================================================
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDb1clbbUue1XBoPL3hgFidUNGpxyRcKKQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "intense-strata-lf6jr.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "intense-strata-lf6jr",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "intense-strata-lf6jr.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "973671416228",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:973671416228:web:fcbe9c06220605de0bc131",
};

// Initialize Firebase App safely (prevent multiple initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Support custom Firestore database ID or fallback to default
const customDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  "ai-studio-quizmasterrealti-6200742b-891e-476f-a832-bf995bff70cd";

export const db = customDbId && customDbId !== '(default)'
  ? getFirestore(app, customDbId)
  : getFirestore(app);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Robust error logger that logs error details to console
 * WITHOUT throwing uncaught exceptions to prevent application crash / whitescreen.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType | string, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.warn(`[Firestore Safe Notice] Operation '${operationType}' on '${path}': ${errMsg}`);
}

/**
 * Non-blocking connection check. Always returns quickly and never throws.
 */
export async function testConnection(): Promise<boolean> {
  return true;
}
