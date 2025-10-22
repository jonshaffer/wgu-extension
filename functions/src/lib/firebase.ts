import {initializeApp, getApps} from "firebase-admin/app";
import {getAuth as _getAuth} from "firebase-admin/auth";
import {getFirestore as _getFirestore} from "firebase-admin/firestore";

// Initialize Admin SDK once per process
if (getApps().length === 0) {
  initializeApp();
}

export const db = _getFirestore();
export const auth = _getAuth();
