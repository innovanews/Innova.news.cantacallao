/**
 * INNOVA NEWS - SEDE CANTA CALLAO
 * Configuración oficial y conexión directa a Firebase Firestore
 * Credenciales en texto literal para despliegues estáticos (GitHub Pages / Vite)
 */
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDOLo3GLl1t7-Ko7hc98-YHkwV8iwWOvtk",
  authDomain: "innova-news-canta-callao.firebaseapp.com",
  projectId: "innova-news-canta-callao",
  storageBucket: "innova-news-canta-callao.firebasestorage.app",
  messagingSenderId: "616744850021",
  appId: "1:616744850021:web:3b3a307ded396bd517ac8c",
  measurementId: "G-7WN011JM27"
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);

export { doc, setDoc, collection, deleteDoc, onSnapshot };
export default app;
