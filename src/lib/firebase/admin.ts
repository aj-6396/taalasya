import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;

export function getAdminFirestore(): Firestore {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getFirestore(existingApps[0]);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(parsed),
      });
      firestoreDb = getFirestore(adminApp);
      return firestoreDb;
    } catch (err) {
      console.error("[Firebase Admin] Failed parsing FIREBASE_SERVICE_ACCOUNT_KEY JSON", err);
    }
  }

  if (projectId && clientEmail && rawPrivateKey) {
    try {
      const privateKey = formatPrivateKey(rawPrivateKey);
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firestoreDb = getFirestore(adminApp);
      return firestoreDb;
    } catch (err) {
      console.error("[Firebase Admin] Failed initializing with credentials", err);
    }
  }

  // If running in environment with default Google Application credentials
  try {
    adminApp = initializeApp({
      projectId: projectId || undefined,
    });
    firestoreDb = getFirestore(adminApp);
    return firestoreDb;
  } catch (err) {
    console.warn(
      "[Firebase Admin] Warning: Firebase Admin credentials not fully configured in environment variables. " +
      "Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local."
    );
    throw new Error(
      "Firebase Admin is not configured. Please supply FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local"
    );
  }
}
