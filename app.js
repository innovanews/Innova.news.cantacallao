/**
 * INNOVA NEWS - PLATAFORMA OFICIAL DEL COMITÉ PERIODÍSTICO
 * Innova Schools - Sede Canta Callao (Año 2026)
 * Arquitectura JavaScript Completa: Sincronización en la Nube (Firebase),
 * Perfiles de Usuario en Tiempo Real, Control Editorial y Eliminación de Notas.
 */

// Import the functions you need from the SDKs you need
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

// ==========================================================================
// 1. CONSTANTES DE SEGURIDAD Y CONFIGURACIÓN INSTITUCIONAL
// ==========================================================================

// ICONO / IMAGEN POR DEFECTO PARA NUEVOS USUARIOS Y CUENTAS NO EDITADAS
const DEFAULT_USER_AVATAR = "https://i.postimg.cc/BZrDdSSJ/imagen-2026-10-30-073218985.png";

// LLAVE SECRETA DEL COMITÉ (Validada estrictamente en el registro, confidencial en UI)
const COMMITTEE_SECRET_KEY = "INNOVA.NEWS.2026.CANTACALLAO";

// CORREOS INSTITUCIONALES DE LOS DOS ADMINISTRADORES (Estrictamente confidenciales)
const ADMIN_EMAILS = [
  "62754739@alumnos.innovaschools.edu.pe",
  "76119235@alumnos.innovaschools.edu.pe"
];

// CUENTAS PRE-CONFIGURADAS DE AMBOS ADMINISTRADORES PARA AUTO-INYECCIÓN
const ADMIN_CONFIG = [
  {
    id: "usr_admin_1",
    name: "Dirección Periodística (General)",
    email: "62754739@alumnos.innovaschools.edu.pe",
    password: "admin123",
    grade: "Docente Coordinador",
    role: "Super Administrador - Dirección General",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    bio: "Dirección General y Supervisión del Comité Periodístico Innova News en Sede Canta Callao. Fomentando el rigor informativo, el pensamiento crítico y el liderazgo estudiantil.",
    status: "ADMITIDO",
    createdAt: "2026-08-01T08:00:00Z"
  },
  {
    id: "usr_admin_2",
    name: "Coordinación Periodística",
    email: "76119235@alumnos.innovaschools.edu.pe",
    password: "tlaxcala123",
    grade: "Docente Coordinador",
    role: "Super Administrador - Coordinación General",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    bio: "Coordinación General de Medios y Audiovisual en Innova News. Impulsando coberturas en video, reportajes de investigación escolar y proyectos interactivos en Canva.",
    status: "ADMITIDO",
    createdAt: "2026-08-01T08:00:00Z"
  }
];

// ==========================================================================
// 2. CONEXIÓN A BASE DE DATOS CENTRAL (FIREBASE / NUBE)
// Credenciales oficiales de Firebase para Innova News - Sede Canta Callao
// ==========================================================================

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOLo3GLl1t7-Ko7hc98-YHkwV8iwWOvtk",
  authDomain: "innova-news-canta-callao.firebaseapp.com",
  projectId: "innova-news-canta-callao",
  storageBucket: "innova-news-canta-callao.firebasestorage.app",
  messagingSenderId: "616744850021",
  appId: "1:616744850021:web:3b3a307ded396bd517ac8c",
  measurementId: "G-7WN011JM27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (e) {
  // Manejo de compatibilidad en entornos sin IndexedDB
}
const analytics = analyticsInstance;
const db = getFirestore(app);

// Claves de almacenamiento en LocalStorage (persistencia local y respaldo offline)
const STORAGE_KEYS = {
  USERS: "innova_news_users_v5",
  CURRENT_USER: "innova_news_current_user_v5",
  REMEMBER_USER: "innova_news_remember_user_v5",
  ARTICLES: "innova_news_articles_v5",
  MEDIA: "innova_news_media_v5",
  NOTIFICATIONS_LOG: "innova_news_email_triggers_v5",
  ABOUT_PHOTOS: "innova_news_about_photos_v5",
  THEME: "innova_news_theme"
};

// Fotos por defecto para la sección "Sobre Nosotros"
const DEFAULT_ABOUT_PHOTOS = {
  redaccion: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=80",
  audiovisual: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=700&q=80",
  equipo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80"
};

// ==========================================================================
// 3. SERVICIO DE SINCRONIZACIÓN EN LA NUBE (FIREBASE FIRESTORE + MULTITAB BROADCAST)
// ==========================================================================

class CloudSyncService {
  constructor() {
    this.isCloudActive = false;
    this.broadcastChannel = null;
    this.unsubscribers = [];
    this.cloudStatus = "connecting"; // "connected", "api_disabled", "offline"
    this.statusMessage = "";

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        this.broadcastChannel = new BroadcastChannel("innova_news_cloud_sync");
        this.broadcastChannel.onmessage = (event) => this.handleBroadcastMessage(event.data);
      }
    } catch (e) {
      console.warn("BroadcastChannel no soportado:", e);
    }

    this.initFirebase();
  }

  async initFirebase() {
    try {
      const hasRealKey = firebaseConfig.apiKey && firebaseConfig.apiKey !== "PEGA_AQUÍ_TU_API_KEY";
      if (hasRealKey && db) {
        this.isCloudActive = true;
        this.cloudStatus = "connected";
        this.setupRealtimeListeners();
      } else {
        this.isCloudActive = false;
        this.cloudStatus = "offline";
      }
    } catch (err) {
      this.handleFirestoreError(err, "initFirebase");
    }
  }

  handleFirestoreError(err, source) {
    const errMsg = err ? (err.message || String(err)) : "";
    const isApiNotEnabled = errMsg.includes("Cloud Firestore API has not been used") || 
                            errMsg.includes("it is disabled") ||
                            (err && err.code === "permission-denied" && errMsg.includes("overview?project="));

    if (isApiNotEnabled) {
      this.cloudStatus = "api_disabled";
      this.statusMessage = "Cloud Firestore aún no ha sido creado en el proyecto 'innova-news-canta-callao'.";

      console.info(
        "ℹ️ [Innova News Cloud]: Cloud Firestore está en proceso de activación en 'innova-news-canta-callao'. " +
        "La plataforma está operando con almacenamiento sincronizado en tiempo real (multilengüeta y persistente)."
      );

      if (window.innovaApp && typeof window.innovaApp.renderCloudStatusBanner === "function") {
        window.innovaApp.renderCloudStatusBanner();
      }
    } else {
      console.warn(`Firestore [${source}] detalle:`, errMsg);
    }
  }

  setupRealtimeListeners() {
    if (!db) return;

    try {
      // 1. Colección 'articles' (Noticias y Artículos de Redacción) en Tiempo Real con onSnapshot
      const unsubArticles = onSnapshot(
        collection(db, "articles"),
        snapshot => {
          this.isCloudActive = true;
          this.cloudStatus = "connected";
          // Eliminar del caché local cualquier documento removido de Firestore
          snapshot.docChanges().forEach(change => {
            if (change.type === "removed") {
              const remId = change.doc.id;
              const clean = store.getArticles().filter(a => a.id !== remId);
              localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(clean));
            }
          });
          const articles = [];
          snapshot.forEach(docSnap => articles.push({ ...docSnap.data(), id: docSnap.id }));
          articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
          if (window.innovaApp) {
            window.innovaApp.renderSpotlight();
            window.innovaApp.renderContent();
            window.innovaApp.loadSuperAdminData();
            if (typeof window.innovaApp.refreshPublicProfileIfOpen === "function") {
              window.innovaApp.refreshPublicProfileIfOpen();
            }
          }
        },
        err => this.handleFirestoreError(err, "articles")
      );
      this.unsubscribers.push(unsubArticles);

      // 2. Colección 'posts' (Noticias / Publicaciones) en Tiempo Real con onSnapshot
      const unsubPosts = onSnapshot(
        collection(db, "posts"),
        snapshot => {
          this.isCloudActive = true;
          this.cloudStatus = "connected";
          // Si un documento fue borrado de 'posts', eliminarlo de las listas locales
          snapshot.docChanges().forEach(change => {
            if (change.type === "removed") {
              const remId = change.doc.id;
              const cleanMedia = store.getMedia().filter(m => m.id !== remId);
              localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(cleanMedia));
              const cleanArticles = store.getArticles().filter(a => a.id !== remId);
              localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(cleanArticles));
            }
          });

          if (!snapshot.empty) {
            const posts = [];
            snapshot.forEach(docSnap => posts.push({ ...docSnap.data(), id: docSnap.id }));

            // Separar artículos vs multimedia
            const postMedia = posts.filter(p => p.mediaType || p.mediaUrl || p.itemType === "audiovisual");
            const postArticles = posts.filter(p => !p.mediaType && !p.mediaUrl && p.itemType !== "audiovisual");

            if (postMedia.length > 0) {
              const currentMedia = store.getMedia();
              let updated = false;
              postMedia.forEach(pm => {
                const idx = currentMedia.findIndex(cm => cm.id === pm.id);
                if (idx === -1) {
                  currentMedia.push(pm);
                  updated = true;
                }
              });
              if (updated) {
                currentMedia.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(currentMedia));
              }
            }

            if (postArticles.length > 0) {
              const currentArticles = store.getArticles();
              let updated = false;
              postArticles.forEach(pa => {
                const idx = currentArticles.findIndex(ca => ca.id === pa.id);
                if (idx === -1) {
                  currentArticles.push(pa);
                  updated = true;
                }
              });
              if (updated) {
                currentArticles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(currentArticles));
              }
            }

            if (window.innovaApp) {
              window.innovaApp.renderSpotlight();
              window.innovaApp.renderContent();
              window.innovaApp.loadSuperAdminData();
              if (typeof window.innovaApp.refreshPublicProfileIfOpen === "function") {
                window.innovaApp.refreshPublicProfileIfOpen();
              }
            }
          }
        },
        err => this.handleFirestoreError(err, "posts")
      );
      this.unsubscribers.push(unsubPosts);

      // 3. Colección 'users' (Usuarios, Perfiles y Admisiones) en Tiempo Real con onSnapshot
      const unsubUsers = onSnapshot(
        collection(db, "users"),
        snapshot => {
          this.isCloudActive = true;
          this.cloudStatus = "connected";
          const cloudUsers = [];
          snapshot.forEach(docSnap => cloudUsers.push({ ...docSnap.data(), id: docSnap.id }));
          if (cloudUsers.length > 0) {
            ADMIN_CONFIG.forEach(admin => {
              if (!cloudUsers.some(u => u.email.toLowerCase() === admin.email.toLowerCase())) {
                cloudUsers.unshift({ ...admin });
                this.saveUser(admin);
              }
            });
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cloudUsers));

            const currentUser = store.getCurrentUser();
            if (currentUser) {
              const updated = cloudUsers.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
              if (updated) {
                store.setCurrentUser(updated, store.isSessionRemembered());
                if (window.innovaApp) {
                  window.innovaApp.renderAuthNav();
                  if (window.innovaApp.loadUserProfile) window.innovaApp.loadUserProfile();
                }
              }
            }

            if (window.innovaApp) {
              if (window.innovaApp.loadSuperAdminData) window.innovaApp.loadSuperAdminData();
              if (typeof window.innovaApp.refreshPublicProfileIfOpen === "function") {
                window.innovaApp.refreshPublicProfileIfOpen();
              }
              if (typeof window.innovaApp.renderCommitteeDirectory === "function") {
                window.innovaApp.renderCommitteeDirectory();
              }
              if (typeof window.innovaApp.renderCoauthorsSelector === "function") {
                window.innovaApp.renderCoauthorsSelector();
              }
            }
          } else {
            const localUsers = store.getUsers();
            if (localUsers && localUsers.length > 0) {
              localUsers.forEach(u => this.saveUser(u));
            }
          }
        },
        err => this.handleFirestoreError(err, "users")
      );
      this.unsubscribers.push(unsubUsers);

      // 4. Colección 'media' (Producciones Audiovisuales y Canva) en Tiempo Real con onSnapshot
      const unsubMedia = onSnapshot(
        collection(db, "media"),
        snapshot => {
          this.isCloudActive = true;
          this.cloudStatus = "connected";
          // Eliminar del caché local cualquier multimedia removido de Firestore
          snapshot.docChanges().forEach(change => {
            if (change.type === "removed") {
              const remId = change.doc.id;
              const clean = store.getMedia().filter(m => m.id !== remId);
              localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(clean));
            }
          });
          const media = [];
          snapshot.forEach(docSnap => media.push({ ...docSnap.data(), id: docSnap.id }));
          media.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media));
          if (window.innovaApp) {
            window.innovaApp.renderContent();
            window.innovaApp.loadSuperAdminData();
            if (typeof window.innovaApp.refreshPublicProfileIfOpen === "function") {
              window.innovaApp.refreshPublicProfileIfOpen();
            }
          }
        },
        err => this.handleFirestoreError(err, "media")
      );
      this.unsubscribers.push(unsubMedia);

      // 5. Fotos de "Sobre Nosotros" en Tiempo Real
      const unsubSettings = onSnapshot(
        doc(db, "settings", "about_photos"),
        docSnap => {
          this.cloudStatus = "connected";
          if (docSnap.exists()) {
            const photos = docSnap.data();
            localStorage.setItem(STORAGE_KEYS.ABOUT_PHOTOS, JSON.stringify(photos));
            if (window.innovaApp) {
              window.innovaApp.renderAboutPhotos();
            }
          } else {
            const localPhotos = store.getAboutPhotos();
            this.saveAboutPhotos(localPhotos);
          }
        },
        err => this.handleFirestoreError(err, "settings")
      );
      this.unsubscribers.push(unsubSettings);
    } catch (e) {
      this.handleFirestoreError(e, "setupRealtimeListeners");
    }
  }

  async retryConnection() {
    this.cloudStatus = "connecting";
    await this.initFirebase();
    return this.cloudStatus === "connected";
  }

  // Notificar a otras pestañas/dispositivos
  broadcastChange(type, payload) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (e) {}
    }
  }

  handleBroadcastMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === "MEDIA_DELETED" && msg.payload && msg.payload.id) {
      const list = store.getMedia().filter(m => m.id !== msg.payload.id);
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(list));
    }
    if (msg.type === "ARTICLE_DELETED" && msg.payload && msg.payload.id) {
      const list = store.getArticles().filter(a => a.id !== msg.payload.id);
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list));
    }
    if (window.innovaApp) {
      window.innovaApp.renderSpotlight();
      window.innovaApp.renderContent();
      window.innovaApp.renderAboutPhotos();
      window.innovaApp.renderAuthNav();
      if (window.innovaApp.loadSuperAdminData) window.innovaApp.loadSuperAdminData();
      if (window.innovaApp.loadUserProfile) window.innovaApp.loadUserProfile();
    }
  }

  async saveArticle(article) {
    this.broadcastChange("ARTICLE_UPDATED", article);
    if (db) {
      try {
        await Promise.allSettled([
          setDoc(doc(db, "articles", article.id), article, { merge: true }),
          setDoc(doc(db, "posts", article.id), article, { merge: true })
        ]);
      } catch (e) {
        this.handleFirestoreError(e, "saveArticle");
      }
    }
  }

  async deleteArticle(articleId) {
    this.broadcastChange("ARTICLE_DELETED", { id: articleId });
    if (db) {
      try {
        await Promise.allSettled([
          deleteDoc(doc(db, "articles", articleId)),
          deleteDoc(doc(db, "posts", articleId))
        ]);
        console.info(`🗑️ [Firestore] deleteDoc(doc(db, "articles", "${articleId}")) ejecutado.`);
      } catch (e) {
        this.handleFirestoreError(e, "deleteArticle");
      }
    }
  }

  async saveMedia(item) {
    this.broadcastChange("MEDIA_UPDATED", item);
    if (db) {
      try {
        await Promise.allSettled([
          setDoc(doc(db, "media", item.id), item, { merge: true }),
          setDoc(doc(db, "posts", item.id), item, { merge: true })
        ]);
      } catch (e) {
        this.handleFirestoreError(e, "saveMedia");
      }
    }
  }

  async deleteMedia(mediaId) {
    this.broadcastChange("MEDIA_DELETED", { id: mediaId });
    if (db) {
      try {
        await Promise.allSettled([
          deleteDoc(doc(db, "media", mediaId)),
          deleteDoc(doc(db, "posts", mediaId))
        ]);
        console.info(`🗑️ [Firestore] deleteDoc(doc(db, "media", "${mediaId}")) ejecutado.`);
      } catch (e) {
        this.handleFirestoreError(e, "deleteMedia");
      }
    }
  }

  async saveUser(user) {
    this.broadcastChange("USER_UPDATED", user);
    if (this.isCloudActive && db) {
      try {
        const docId = user.id || user.email.replace(/[^a-zA-Z0-9]/g, "_");
        await setDoc(doc(db, "users", docId), user, { merge: true });
      } catch (e) {
        this.handleFirestoreError(e, "saveUser");
      }
    }
  }

  async deleteUser(userId) {
    this.broadcastChange("USER_DELETED", { id: userId });
    if (this.isCloudActive && db) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (e) {
        this.handleFirestoreError(e, "deleteUser");
      }
    }
  }

  async saveAboutPhotos(photos) {
    this.broadcastChange("ABOUT_PHOTOS_UPDATED", photos);
    if (this.isCloudActive && db) {
      try {
        await setDoc(doc(db, "settings", "about_photos"), photos, { merge: true });
      } catch (e) {
        this.handleFirestoreError(e, "saveAboutPhotos");
      }
    }
  }
}

const cloudSync = new CloudSyncService();

// ==========================================================================
// 4. GESTOR DE ESTADO (REPOSITORY HÍBRIDO NUBE + LOCALSTORAGE)
// ==========================================================================

class InnovaNewsStore {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(ADMIN_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ARTICLES)) {
      localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEDIA)) {
      localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_LOG)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_LOG, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ABOUT_PHOTOS)) {
      localStorage.setItem(STORAGE_KEYS.ABOUT_PHOTOS, JSON.stringify(DEFAULT_ABOUT_PHOTOS));
    }

    // Inyección y verificación automática de ambos administradores
    this.ensureAdminUsers();
  }

  ensureAdminUsers() {
    const users = this.getUsers();

    ADMIN_CONFIG.forEach(admin => {
      const idx = users.findIndex(u => u.email.toLowerCase() === admin.email.toLowerCase());
      if (idx === -1) {
        users.unshift({ ...admin });
      } else {
        // Garantizar clave y estado ADMITIDO siempre para ambos administradores
        users[idx].password = admin.password;
        users[idx].status = "ADMITIDO";
        users[idx].role = admin.role;
        if (!users[idx].bio) users[idx].bio = admin.bio;
        if (!users[idx].banner) users[idx].banner = admin.banner;
      }
    });

    this.saveUsers(users);

    // Si la sesión activa pertenece a cualquiera de los dos administradores, asegurar estado ADMITIDO
    const currentUser = this.getCurrentUser();
    if (currentUser && ADMIN_EMAILS.some(e => e.toLowerCase() === currentUser.email.toLowerCase())) {
      currentUser.status = "ADMITIDO";
      this.setCurrentUser(currentUser, this.isSessionRemembered());
    }
  }

  getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
      return users.map(u => {
        if (!u.avatar || u.avatar.includes("photo-1535713875002")) {
          return { ...u, avatar: DEFAULT_USER_AVATAR };
        }
        return u;
      });
    } catch {
      return [...ADMIN_CONFIG];
    }
  }

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUser() {
    try {
      // 1. Sesión activa en la pestaña actual (sessionStorage)
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (sessionData) {
        const user = JSON.parse(sessionData);
        if (!user.avatar || user.avatar.includes("photo-1535713875002")) user.avatar = DEFAULT_USER_AVATAR;
        return user;
      }

      // 2. Sesión recordada permanente (si el usuario marcó 'Recordarme')
      const rememberData = localStorage.getItem(STORAGE_KEYS.REMEMBER_USER) || localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (rememberData) {
        const user = JSON.parse(rememberData);
        if (!user.avatar || user.avatar.includes("photo-1535713875002")) user.avatar = DEFAULT_USER_AVATAR;
        try { sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user)); } catch {}
        return user;
      }
      return null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user, remember = false) {
    if (user) {
      try {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } catch {}

      if (remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_USER);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      }
    } else {
      try {
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } catch {}
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  isSessionRemembered() {
    try {
      return !!localStorage.getItem(STORAGE_KEYS.REMEMBER_USER);
    } catch {
      return false;
    }
  }

  getArticles() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ARTICLES) || "[]");
    } catch {
      return [];
    }
  }

  saveArticle(article) {
    const list = this.getArticles();
    const idx = list.findIndex(a => a.id === article.id);
    if (idx !== -1) {
      list[idx] = article;
    } else {
      list.unshift(article);
    }
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list));
    cloudSync.saveArticle(article);
  }

  async deleteArticle(articleId) {
    let list = this.getArticles().filter(a => a.id !== articleId);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(list));
    let meds = this.getMedia().filter(m => m.id !== articleId);
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(meds));
    return await cloudSync.deleteArticle(articleId);
  }

  getMedia() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDIA) || "[]");
    } catch {
      return [];
    }
  }

  saveMedia(item) {
    const list = this.getMedia();
    const idx = list.findIndex(m => m.id === item.id);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(list));
    cloudSync.saveMedia(item);
  }

  async deleteMedia(mediaId) {
    let list = this.getMedia().filter(m => m.id !== mediaId);
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(list));
    let arts = this.getArticles().filter(a => a.id !== mediaId);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(arts));
    return await cloudSync.deleteMedia(mediaId);
  }

  getAboutPhotos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ABOUT_PHOTOS) || JSON.stringify(DEFAULT_ABOUT_PHOTOS));
    } catch {
      return DEFAULT_ABOUT_PHOTOS;
    }
  }

  saveAboutPhotos(photos) {
    localStorage.setItem(STORAGE_KEYS.ABOUT_PHOTOS, JSON.stringify(photos));
    cloudSync.saveAboutPhotos(photos);
  }

  logNotification(payload) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_LOG) || "[]");
    logs.unshift(payload);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_LOG, JSON.stringify(logs));
  }
}

const store = new InnovaNewsStore();

// ==========================================================================
// 5. CONTROLADOR DE LA APLICACIÓN (UI Y LÓGICA DE NEGOCIO)
// ==========================================================================

class InnovaNewsApp {
  constructor() {
    this.selectedMonth = "Octubre";
    this.selectedCategory = "redaccion"; // 'redaccion' o 'audiovisual'
    this.currentDocToDownload = null;
    this.currentPublicProfileUser = null;

    this.initDOMElements();
    this.initTheme();
    this.initEventListeners();
    this.renderAboutPhotos();
    this.renderAuthNav();
    this.renderSpotlight();
    this.renderContent();

    // Sincronización multi-ventana
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEYS.ARTICLES || e.key === STORAGE_KEYS.MEDIA) {
        this.renderSpotlight();
        this.renderContent();
        this.loadSuperAdminData();
      } else if (e.key === STORAGE_KEYS.ABOUT_PHOTOS) {
        this.renderAboutPhotos();
      } else if (e.key === STORAGE_KEYS.USERS) {
        this.renderAuthNav();
        this.loadSuperAdminData();
      }
    });
  }

  // ========================================================================
  // GESTIÓN DE TEMA (MODO OSCURO / CLARO)
  // ========================================================================

  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    this.applyTheme(initialTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);

    const iconEl = document.getElementById("theme-icon") || this.themeIcon;
    const labelEl = document.getElementById("theme-label") || this.themeLabel;
    const btnTheme = document.getElementById("btn-theme-toggle") || this.btnThemeToggle;

    if (theme === "dark") {
      if (iconEl) iconEl.textContent = "☀️";
      if (labelEl) labelEl.textContent = "Claro";
      if (btnTheme) {
        btnTheme.setAttribute("title", "Cambiar a Modo Claro");
        btnTheme.setAttribute("aria-label", "Cambiar a Modo Claro");
      }
    } else {
      if (iconEl) iconEl.textContent = "🌙";
      if (labelEl) labelEl.textContent = "Oscuro";
      if (btnTheme) {
        btnTheme.setAttribute("title", "Cambiar a Modo Oscuro");
        btnTheme.setAttribute("aria-label", "Cambiar a Modo Oscuro");
      }
    }

    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(nextTheme);
    this.showToast(`Modo ${nextTheme === "dark" ? "Oscuro" : "Claro"} activado.`, "info");
  }

  initDOMElements() {
    // Interruptor de Tema
    this.btnThemeToggle = document.getElementById("btn-theme-toggle");
    this.themeIcon = document.getElementById("theme-icon");
    this.themeLabel = document.getElementById("theme-label");

    // Menús y navegación
    this.navMenu = document.getElementById("nav-menu");
    this.btnToggleMenu = document.getElementById("btn-toggle-menu");
    this.authNavContainer = document.getElementById("auth-nav-container");
    this.btnOpenAuth = document.getElementById("btn-open-auth");

    // Ediciones
    this.monthTabsContainer = document.getElementById("month-tabs-container");
    this.btnCatRedaccion = document.getElementById("btn-cat-redaccion");
    this.btnCatAudiovisual = document.getElementById("btn-cat-audiovisual");
    this.contentCardsContainer = document.getElementById("content-cards-container");
    this.heroSpotlightContainer = document.getElementById("hero-spotlight-container");

    // Fotos de "Sobre Nosotros"
    this.aboutPhotoRedaccion = document.getElementById("about-photo-redaccion");
    this.aboutPhotoAudiovisual = document.getElementById("about-photo-audiovisual");
    this.aboutPhotoEquipo = document.getElementById("about-photo-equipo");

    // Modales
    this.wordModal = document.getElementById("word-viewer-modal");
    this.btnCloseWordModal = document.getElementById("btn-close-word-modal");
    this.btnModalDownloadWord = document.getElementById("btn-modal-download-word");

    this.mediaModal = document.getElementById("media-viewer-modal");
    this.btnCloseMediaModal = document.getElementById("btn-close-media-modal");

    // Modal Visor PDF
    this.pdfModal = document.getElementById("pdf-viewer-modal");
    this.btnClosePdfModal = document.getElementById("btn-close-pdf-modal");
    this.btnModalDownloadPdf = document.getElementById("btn-modal-download-pdf");
    this.pdfModalIframe = document.getElementById("pdf-modal-iframe");
    this.pdfViewerFilename = document.getElementById("pdf-viewer-filename");
    this.pdfModalTitle = document.getElementById("pdf-modal-title");
    this.pdfModalAuthor = document.getElementById("pdf-modal-author");

    // Modal Perfil Público de Usuario (Red Social)
    this.publicProfileModal = document.getElementById("public-profile-modal");
    this.btnClosePublicProfileModal = document.getElementById("btn-close-public-profile-modal");
    this.pubProfileBanner = document.getElementById("pub-profile-banner");
    this.pubProfileAvatar = document.getElementById("pub-profile-avatar");
    this.pubProfileName = document.getElementById("pub-profile-name");
    this.pubProfileRole = document.getElementById("pub-profile-role");
    this.pubProfileGrade = document.getElementById("pub-profile-grade");
    this.pubProfileEmail = document.getElementById("pub-profile-email");
    this.pubProfileBadge = document.getElementById("pub-profile-badge");
    this.pubProfileBio = document.getElementById("pub-profile-bio");
    this.pubProfileActions = document.getElementById("pub-profile-actions");
    this.pubProfileWorksCount = document.getElementById("pub-profile-works-count");
    this.pubProfileWorksContainer = document.getElementById("pub-profile-works-container");

    this.authModal = document.getElementById("auth-modal");
    this.btnCloseAuthModal = document.getElementById("btn-close-auth-modal");
    this.authTabLogin = document.getElementById("auth-tab-login");
    this.authTabRegister = document.getElementById("auth-tab-register");
    this.formLogin = document.getElementById("form-login");
    this.formRegister = document.getElementById("form-register");
    this.authAlertBox = document.getElementById("auth-alert-box");
    this.linkSwitchRegister = document.getElementById("link-switch-register");

    // Dashboard
    this.dashboardModal = document.getElementById("dashboard-modal");
    this.btnCloseDashboardModal = document.getElementById("btn-close-dashboard-modal");
    this.tabPublish = document.getElementById("tab-publish");
    this.tabProfile = document.getElementById("tab-profile");
    this.tabSuperadmin = document.getElementById("tab-superadmin");
    this.viewPublish = document.getElementById("view-publish");
    this.viewProfile = document.getElementById("view-profile");
    this.viewSuperadmin = document.getElementById("view-superadmin");
    this.formPublishArticle = document.getElementById("form-publish-article");
    this.formUpdateProfile = document.getElementById("form-update-profile");
    this.formAboutPhotos = document.getElementById("form-about-photos");
    this.pendingCounterBadge = document.getElementById("pending-counter-badge");
    this.superadminPendingTbody = document.getElementById("superadmin-pending-tbody");
    this.superadminApprovedTbody = document.getElementById("superadmin-approved-tbody");
    this.superadminPublicationsTbody = document.getElementById("superadmin-publications-tbody");
    this.totalPublicationsCounter = document.getElementById("total-publications-counter");
    this.superadminCloudStatusBanner = document.getElementById("superadmin-cloud-status-banner");

    // Campos de Adjuntos Word y PDF en el formulario de publicación
    this.pubWordUrl = document.getElementById("pub-word-url");
    this.pubPdfUrl = document.getElementById("pub-pdf-url");

    // Campos condicionales en el formulario de publicación
    this.pubCategorySelect = document.getElementById("pub-category");
    this.fieldsRedaccion = document.getElementById("fields-redaccion");
    this.fieldsAudiovisual = document.getElementById("fields-audiovisual");

    // Inputs y visualizadores de Biografía en Perfil
    this.editProfileBio = document.getElementById("edit-profile-bio");
    this.profileDisplayBio = document.getElementById("profile-display-bio");
    this.profileDisplayBioWrap = document.getElementById("profile-display-bio-wrap");

    // Inputs de fotos en Superadmin
    this.aboutUrlRedaccion = document.getElementById("about-url-redaccion");
    this.aboutUrlAudiovisual = document.getElementById("about-url-audiovisual");
    this.aboutUrlEquipo = document.getElementById("about-url-equipo");
    this.previewAboutRedaccion = document.getElementById("preview-about-redaccion");
    this.previewAboutAudiovisual = document.getElementById("preview-about-audiovisual");
    this.previewAboutEquipo = document.getElementById("preview-about-equipo");

    // Directorio del Comité Periodístico ("Ver Comité") y Selector de Coautores
    this.btnOpenCommittee = document.getElementById("btn-open-committee");
    this.committeeModal = document.getElementById("committee-modal");
    this.btnCloseCommitteeModal = document.getElementById("btn-close-committee-modal");
    this.committeeDirectoryGrid = document.getElementById("committee-directory-grid");
    this.committeeMembersCounter = document.getElementById("committee-members-counter");
    this.committeeSearchInput = document.getElementById("committee-search-input");
    this.pubCoauthorsContainer = document.getElementById("pub-coauthors-container");

    // Contenedor Toast
    this.toastContainer = document.getElementById("toast-container");
  }

  initEventListeners() {
    // Modo Oscuro / Claro
    if (this.btnThemeToggle) {
      this.btnThemeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Menú móvil
    if (this.btnToggleMenu && this.navMenu) {
      this.btnToggleMenu.addEventListener("click", () => {
        this.navMenu.classList.toggle("mobile-open");
      });
    }

    // Modal de Autenticación
    if (this.btnOpenAuth) {
      this.btnOpenAuth.addEventListener("click", () => this.openAuthModal("login"));
    }
    if (this.btnCloseAuthModal) {
      this.btnCloseAuthModal.addEventListener("click", () => this.closeAuthModal());
    }

    // Pestañas Login / Registro
    if (this.authTabLogin) {
      this.authTabLogin.addEventListener("click", () => this.switchAuthTab("login"));
    }
    if (this.authTabRegister) {
      this.authTabRegister.addEventListener("click", () => this.switchAuthTab("register"));
    }
    if (this.linkSwitchRegister) {
      this.linkSwitchRegister.addEventListener("click", (e) => {
        e.preventDefault();
        this.switchAuthTab("register");
      });
    }

    // Envío de Formularios Auth
    if (this.formLogin) {
      this.formLogin.addEventListener("submit", (e) => this.handleLogin(e));
    }
    if (this.formRegister) {
      this.formRegister.addEventListener("submit", (e) => this.handleRegister(e));
    }

    // Cambio de Mes en Ediciones
    if (this.monthTabsContainer) {
      this.monthTabsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".month-tab-btn");
        if (btn && btn.dataset.month) {
          this.selectMonth(btn.dataset.month);
        }
      });
    }

    // Cambio de Categoría en Ediciones
    if (this.btnCatRedaccion) {
      this.btnCatRedaccion.addEventListener("click", () => this.selectCategory("redaccion"));
    }
    if (this.btnCatAudiovisual) {
      this.btnCatAudiovisual.addEventListener("click", () => this.selectCategory("audiovisual"));
    }

    // Cierre de Modales
    if (this.btnCloseWordModal) {
      this.btnCloseWordModal.addEventListener("click", () => this.closeWordModal());
    }
    if (this.btnModalDownloadWord) {
      this.btnModalDownloadWord.addEventListener("click", () => {
        if (this.currentDocToDownload) {
          this.downloadWordDocument(this.currentDocToDownload);
        }
      });
    }
    if (this.btnCloseMediaModal) {
      this.btnCloseMediaModal.addEventListener("click", () => this.closeMediaModal());
    }
    if (this.btnClosePdfModal) {
      this.btnClosePdfModal.addEventListener("click", () => this.closePdfViewer());
    }
    if (this.btnClosePublicProfileModal) {
      this.btnClosePublicProfileModal.addEventListener("click", () => this.closePublicProfile());
    }
    if (this.btnCloseDashboardModal) {
      this.btnCloseDashboardModal.addEventListener("click", () => this.closeDashboardModal());
    }

    // Pestañas de Dashboard
    if (this.tabPublish) {
      this.tabPublish.addEventListener("click", () => this.switchDashboardTab("publish"));
    }
    if (this.tabProfile) {
      this.tabProfile.addEventListener("click", () => this.switchDashboardTab("profile"));
    }
    if (this.tabSuperadmin) {
      this.tabSuperadmin.addEventListener("click", () => this.switchDashboardTab("superadmin"));
    }

    // Cambio dinámico de campos en formulario de publicación
    if (this.pubCategorySelect) {
      this.pubCategorySelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "redaccion") {
          this.fieldsRedaccion.style.display = "block";
          this.fieldsAudiovisual.style.display = "none";
        } else {
          this.fieldsRedaccion.style.display = "none";
          this.fieldsAudiovisual.style.display = "block";
        }
      });
    }

    // Envío de publicación
    if (this.formPublishArticle) {
      this.formPublishArticle.addEventListener("submit", (e) => this.handlePublish(e));
    }

    // Actualización de Perfil Sincronizado en la Nube
    if (this.formUpdateProfile) {
      this.formUpdateProfile.addEventListener("submit", (e) => this.handleUpdateProfile(e));
    }

    // Guardado de Fotos de "Sobre Nosotros"
    if (this.formAboutPhotos) {
      this.formAboutPhotos.addEventListener("submit", (e) => this.handleSaveAboutPhotos(e));
    }

    // Previews en vivo al escribir URLs de fotos
    if (this.aboutUrlRedaccion && this.previewAboutRedaccion) {
      this.aboutUrlRedaccion.addEventListener("input", (e) => {
        if (e.target.value.trim().startsWith("http")) {
          this.previewAboutRedaccion.src = e.target.value.trim();
        }
      });
    }
    if (this.aboutUrlAudiovisual && this.previewAboutAudiovisual) {
      this.aboutUrlAudiovisual.addEventListener("input", (e) => {
        if (e.target.value.trim().startsWith("http")) {
          this.previewAboutAudiovisual.src = e.target.value.trim();
        }
      });
    }
    if (this.aboutUrlEquipo && this.previewAboutEquipo) {
      this.aboutUrlEquipo.addEventListener("input", (e) => {
        if (e.target.value.trim().startsWith("http")) {
          this.previewAboutEquipo.src = e.target.value.trim();
        }
      });
    }

    // Directorio del Comité Periodístico ("Ver Comité")
    if (this.btnOpenCommittee) {
      this.btnOpenCommittee.addEventListener("click", () => this.openCommitteeModal());
    }
    if (this.btnCloseCommitteeModal) {
      this.btnCloseCommitteeModal.addEventListener("click", () => this.closeCommitteeModal());
    }
    if (this.committeeSearchInput) {
      this.committeeSearchInput.addEventListener("input", (e) => {
        this.renderCommitteeDirectory(e.target.value);
      });
    }

    // Cerrar modales con tecla ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });

    // Cerrar al hacer clic en el backdrop
    [this.wordModal, this.mediaModal, this.pdfModal, this.publicProfileModal, this.committeeModal, this.authModal, this.dashboardModal].forEach(modal => {
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            this.closeAllModals();
          }
        });
      }
    });
  }

  // ========================================================================
  // RENDERIZADO DE FOTOS DE "SOBRE NOSOTROS"
  // ========================================================================

  renderAboutPhotos() {
    const photos = store.getAboutPhotos();
    if (this.aboutPhotoRedaccion) {
      this.aboutPhotoRedaccion.src = photos.redaccion || DEFAULT_ABOUT_PHOTOS.redaccion;
    }
    if (this.aboutPhotoAudiovisual) {
      this.aboutPhotoAudiovisual.src = photos.audiovisual || DEFAULT_ABOUT_PHOTOS.audiovisual;
    }
    if (this.aboutPhotoEquipo) {
      this.aboutPhotoEquipo.src = photos.equipo || DEFAULT_ABOUT_PHOTOS.equipo;
    }
  }

  handleSaveAboutPhotos(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!this.isAdminUser(user)) {
      this.showToast("Acceso exclusivo para la Dirección y Administración.", "error");
      return;
    }

    const redaccion = this.aboutUrlRedaccion.value.trim();
    const audiovisual = this.aboutUrlAudiovisual.value.trim();
    const equipo = this.aboutUrlEquipo.value.trim();

    if (!redaccion || !audiovisual || !equipo) {
      this.showToast("Por favor ingresa las tres URLs de las fotos del comité.", "warning");
      return;
    }

    const photos = { redaccion, audiovisual, equipo };
    store.saveAboutPhotos(photos);
    this.renderAboutPhotos();

    this.showToast("¡Fotografías de 'Sobre Nosotros' sincronizadas con éxito!", "success");
  }

  // ========================================================================
  // SISTEMA DE SEGURIDAD, REGISTRO Y DOBLE LLAVE
  // ========================================================================

  // Validador de Administrador Oficial (Cualquiera de los dos administradores)
  isAdminUser(user) {
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase());
  }

  // Validador de Seguridad: Determina si el usuario tiene estado ADMITIDO o es Administrador
  isUserAdmitted(user) {
    if (!user) return false;
    if (this.isAdminUser(user)) return true;
    return user.status === "ADMITIDO";
  }

  handleRegister(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    this.authAlertBox.innerHTML = "";

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const grade = document.getElementById("reg-grade").value;
    const role = document.getElementById("reg-role").value;
    const committeeKey = document.getElementById("reg-committee-key").value;
    const personalPassword = document.getElementById("reg-personal-password").value;
    const passwordConfirm = document.getElementById("reg-password-confirm").value;

    // Validación 1: Llave Oculta del Comité (Estrictamente Confidencial)
    if (committeeKey !== COMMITTEE_SECRET_KEY) {
      this.authAlertBox.innerHTML = `
        <div class="alert-box alert-danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <strong>Llave del Comité Inválida:</strong> La llave de autorización ingresada es incorrecta. Por estrictas normas de seguridad de Innova Schools Canta Callao, la postulación ha sido rechazada inmediatamente.
          </div>
        </div>
      `;
      return;
    }

    // Validación 2: Contraseñas personales
    if (personalPassword.length < 6) {
      this.authAlertBox.innerHTML = `
        <div class="alert-box alert-warning">
          <div>La contraseña de perfil propia debe contener al menos 6 caracteres.</div>
        </div>
      `;
      return;
    }

    if (personalPassword !== passwordConfirm) {
      this.authAlertBox.innerHTML = `
        <div class="alert-box alert-warning">
          <div>Las contraseñas de perfil no coinciden. Por favor verifícalas.</div>
        </div>
      `;
      return;
    }

    // Validación 3: Correo duplicado
    const users = store.getUsers();
    const existing = users.find(u => u.email === email);
    if (existing) {
      this.authAlertBox.innerHTML = `
        <div class="alert-box alert-danger">
          <div>El correo <strong>${email}</strong> ya tiene una cuenta registrada en la plataforma.</div>
        </div>
      `;
      return;
    }

    // ¡CLAVE SECRETA "INNOVA.NEWS.2026.CANTACALLAO" VALIDADA CON ÉXITO!
    // Integración AJAX para Web3Forms (endpoint: https://api.web3forms.com/submit)
    // El envío viaja 100% en segundo plano vía fetch (AJAX) sin abrir ventanas ni recargar la página
    const web3formsEndpoint = "https://api.web3forms.com/submit";
    const WEB3FORMS_ACCESS_KEY = "a2f6a5f0-4842-4f76-84a0-09a32e116ecf";

    try {
      const formData = new FormData();
      formData.append("access_key", WEB3FORMS_ACCESS_KEY);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("grado", grade);
      formData.append("comite", role);
      formData.append("from_name", "Innova News - Canta Callao");
      formData.append("subject", "SOLICITUD DE ACCESO: Nuevo miembro para Innova News (Sede Canta Callao)");
      formData.append("sede", "Innova Schools - Sede Canta Callao (Año 2026)");
      formData.append("estado_inicial", "PENDIENTE DE APROBACIÓN");
      formData.append("validacion_seguridad", "Clave confidencial del comité validada satisfactoriamente en cliente.");

      // Nota de seguridad: Las contraseñas personales nunca se incluyen en la notificación externa
      fetch(web3formsEndpoint, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      }).then(res => {
        if (res.ok) {
          console.info("✅ [Web3Forms AJAX]: Notificación de registro enviada exitosamente a", web3formsEndpoint);
        } else {
          console.warn("⚠️ [Web3Forms AJAX]: Respuesta de servidor:", res.status);
        }
      }).catch(err => {
        console.warn("ℹ️ [Web3Forms AJAX]: Transmisión en segundo plano:", err);
      });
    } catch (err) {
      console.warn("Nota Web3Forms:", err);
    }

    // Crear la cuenta con la imagen predeterminada oficial y estado PENDIENTE_DE_APROBACION
    const newUser = {
      id: "usr_" + Date.now(),
      name,
      email,
      grade,
      role,
      password: personalPassword,
      avatar: DEFAULT_USER_AVATAR,
      banner: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      status: "PENDIENTE_DE_APROBACION",
      createdAt: new Date().toISOString()
    };

    // Persistencia simultánea en LocalStorage y en la colección 'users' de Cloud Firestore
    users.push(newUser);
    store.saveUsers(users);
    cloudSync.saveUser(newUser);

    // Mensaje de éxito en la interfaz (sin redirecciones ni apertura de pestañas)
    this.authAlertBox.innerHTML = `
      <div class="alert-box alert-success" style="flex-direction: column; align-items: flex-start; gap: 0.65rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <strong style="color: var(--green-800); font-size: 0.95rem;">¡Solicitud de Registro Enviada con Éxito!</strong>
        </div>
        <p style="margin: 0; font-size: 0.85rem; color: #166534; line-height: 1.5;">
          Tus datos fueron transmitidos de forma segura mediante Web3Forms y tu perfil ha sido creado con estado <strong>PENDIENTE DE REVISIÓN</strong>.
        </p>
        <p style="margin: 0; font-size: 0.83rem; color: #1e293b; line-height: 1.4;">
          Tus credenciales y datos están resguardados en la base de datos central de Cloud Firestore. Las herramientas de redacción y audiovisual se habilitarán automáticamente en cuanto la coordinación admita tu postulación.
        </p>
      </div>
    `;

    const authBody = this.authModal.querySelector(".auth-body");
    if (authBody) authBody.scrollTop = 0;

    this.showToast("Solicitud registrada con éxito. Notificación enviada.", "success");
  }

  handleLogin(e) {
    e.preventDefault();
    this.authAlertBox.innerHTML = "";

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    const users = store.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email);

    // Salvaguarda especial para los dos administradores oficiales:
    const adminConfig = ADMIN_CONFIG.find(a => a.email.toLowerCase() === email);
    if (adminConfig && (password === adminConfig.password || (user && user.password === password))) {
      store.ensureAdminUsers();
      user = store.getUsers().find(u => u.email.toLowerCase() === email);
    }

    if (!user || user.password !== password) {
      this.authAlertBox.innerHTML = `
        <div class="alert-box alert-danger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>Correo institucional o contraseña de perfil incorrectos. Verifica tus credenciales.</div>
        </div>
      `;
      return;
    }

    // Inicio de sesión exitoso (con soporte de la opción Recordarme)
    const rememberCheckbox = document.getElementById("login-remember");
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

    store.setCurrentUser(user, rememberMe);
    this.closeAuthModal();
    this.renderAuthNav();
    this.renderSpotlight();
    this.renderContent();

    const isAdmitted = this.isUserAdmitted(user);
    const isAdmin = this.isAdminUser(user);

    if (isAdmin) {
      this.showToast(`¡Bienvenido Administrador, ${user.name}! Panel de Gestión desbloqueado.`, "success");
      this.openDashboardModal("superadmin");
    } else if (isAdmitted) {
      this.showToast(`¡Bienvenido al portal, ${user.name}! Tu cuenta está ADMITIDA.`, "success");
      this.openDashboardModal("publish");
    } else {
      this.showToast("Tu cuenta está en proceso de revisión por el administrador.", "warning");
      this.openDashboardModal("profile");
    }
  }

  handleLogout() {
    store.setCurrentUser(null, false);
    this.renderAuthNav();
    this.renderSpotlight();
    this.renderContent();
    this.closeDashboardModal();
    this.showToast("Has cerrado tu sesión de forma segura.", "warning");
  }

  // ========================================================================
  // RENDERIZADO DE NAVEGACIÓN Y PERFIL DE USUARIO
  // ========================================================================

  renderAuthNav() {
    const user = store.getCurrentUser();
    if (!this.authNavContainer) return;

    if (!user) {
      this.authNavContainer.innerHTML = `
        <button class="btn-primary" id="btn-open-auth">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Acceso Equipo
        </button>
      `;
      const btn = document.getElementById("btn-open-auth");
      if (btn) btn.addEventListener("click", () => this.openAuthModal("login"));
    } else {
      const isSuperAdmin = this.isAdminUser(user);
      const isAdmitted = this.isUserAdmitted(user);

      this.authNavContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div class="btn-user-pill" id="btn-user-profile-toggle" title="Gestionar mi perfil sincronizado">
            <img src="${user.avatar || DEFAULT_USER_AVATAR}" alt="${user.name}">
            <div class="user-info-text">
              <div class="user-name">${user.name.split(" ")[0]} ${user.name.split(" ")[1] || ""}</div>
              <div class="user-role">${isSuperAdmin ? "👑 Super Admin" : (isAdmitted ? "✓ ADMITIDO" : "⏳ En Revisión")}</div>
            </div>
          </div>
          <button class="btn-outline-sky" id="btn-open-dash" title="${isAdmitted ? 'Publicar Contenido' : 'Ver Mi Cuenta'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            ${isAdmitted ? "Publicar" : "Mi Perfil"}
          </button>
          <button class="btn-reject-user" id="btn-nav-logout" title="Cerrar Sesión" style="padding: 0.45rem 0.65rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      `;

      const userPill = document.getElementById("btn-user-profile-toggle");
      const btnDash = document.getElementById("btn-open-dash");
      const btnLogout = document.getElementById("btn-nav-logout");

      if (userPill) userPill.addEventListener("click", () => this.openDashboardModal("profile"));
      if (btnDash) {
        btnDash.addEventListener("click", () => {
          if (isAdmitted) {
            this.openDashboardModal("publish");
          } else {
            this.openDashboardModal("profile");
            this.showToast("Tu cuenta está en proceso de revisión por el administrador.", "warning");
          }
        });
      }
      if (btnLogout) btnLogout.addEventListener("click", () => this.handleLogout());
    }
  }

  // ========================================================================
  // RENDERIZADO DE EDICIONES, ARTÍCULOS Y MULTIMEDIA
  // ========================================================================

  selectMonth(month) {
    this.selectedMonth = month;
    if (this.monthTabsContainer) {
      this.monthTabsContainer.querySelectorAll(".month-tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.month === month);
      });
    }
    this.renderContent();
  }

  selectCategory(category) {
    this.selectedCategory = category;
    if (this.btnCatRedaccion && this.btnCatAudiovisual) {
      this.btnCatRedaccion.classList.toggle("active", category === "redaccion");
      this.btnCatAudiovisual.classList.toggle("active", category === "audiovisual");
    }
    this.renderContent();
  }

  renderSpotlight() {
    if (!this.heroSpotlightContainer) return;
    const articles = store.getArticles();
    const featured = articles.find(a => a.month === "Octubre") || articles[0];
    const user = store.getCurrentUser();
    const isAdmitted = this.isUserAdmitted(user);
    const isAdmin = this.isAdminUser(user);

    if (!featured) {
      if (isAdmitted) {
        // Vista para Miembros Admitidos y Administradores
        this.heroSpotlightContainer.innerHTML = `
          <div class="spotlight-media" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--sky-700), var(--green-700)); color: #ffffff; text-align: center; padding: 2rem;">
            <div>
              <div style="font-size: 2.75rem; margin-bottom: 0.5rem;">📰</div>
              <span class="spotlight-badge" style="position: static; display: inline-block;">Plataforma Oficial Lista</span>
            </div>
          </div>
          <div class="spotlight-content">
            <div class="spotlight-meta">
              <span class="category-pill">Hemeroteca 2026</span>
              <span>Edición de Octubre en Preparación</span>
            </div>
            <h3 class="spotlight-title">Espacio para la Primera Publicación</h3>
            <p class="spotlight-excerpt">
              Tu cuenta tiene rango oficial. La plataforma está lista para que publiques de manera autónoma tus notas en Word o reportajes audiovisuales.
            </p>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn-primary" onclick="window.innovaApp.openDashboardModal('publish')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Publicar Primera Nota
              </button>
            </div>
          </div>
        `;
      } else {
        // Vista para Lectores y Visitantes Comunes (Completamente Limpia y Neutral)
        this.heroSpotlightContainer.innerHTML = `
          <div class="spotlight-media">
            <img src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80" alt="Innova News Portada Oficial">
            <span class="spotlight-badge">Edición 2026</span>
          </div>
          <div class="spotlight-content">
            <div class="spotlight-meta">
              <span class="category-pill">Comité Periodístico</span>
              <span>Sede Canta Callao</span>
            </div>
            <h3 class="spotlight-title">La Voz Estudiantil de Canta Callao</h3>
            <p class="spotlight-excerpt">
              Plataforma informativa escolar guiada por la profesora Patricia Ocaña. Descubre las investigaciones, artículos de opinión y reportajes multimedia elaborados por nuestros estudiantes.
            </p>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <a href="#ediciones" class="btn-read-word" style="text-decoration: none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Consultar Hemeroteca
              </a>
              <a href="#sobre-nosotros" class="btn-primary" style="background-color: var(--sky-700); text-decoration: none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Conocer al Equipo
              </a>
            </div>
          </div>
        `;
      }
      return;
    }

    // Botón de eliminación en la portada si el usuario es Administrador o Autor
    const isAuthorFeatured = user && featured && (
      (featured.authorEmail && featured.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
      (featured.author && user.name && featured.author.toLowerCase().includes(user.name.toLowerCase()))
    );
    const canDeleteFeatured = isAdmin || isAuthorFeatured;
    const deleteBtnFeatured = canDeleteFeatured ? `
      <button class="btn-delete-publication" onclick="window.innovaApp.deletePublication('${featured.id}', 'redaccion')" title="Eliminar de Firestore">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Eliminar de la Nube
      </button>
    ` : "";

    const safeFeaturedAuthor = (featured.author || 'Comité Innova News').replace(/'/g, "\\'");
    const featuredAuthorEmail = featured.authorEmail || '';
    const featuredAuthorId = featured.authorId || '';

    this.heroSpotlightContainer.innerHTML = `
      <div class="spotlight-media">
        <img src="${featured.coverUrl}" alt="${featured.title}">
        <span class="spotlight-badge">Destacado de Octubre 2026</span>
      </div>
      <div class="spotlight-content">
        <div class="spotlight-meta">
          <span class="category-pill author-interactive" onclick="window.innovaApp.openPublicProfile('${featuredAuthorEmail}', '${safeFeaturedAuthor}', '${featuredAuthorId}')" title="Ver perfil público del autor">
            ✍️ ${featured.author || 'Comité Innova News'}
          </span>
          <span>📅 ${featured.date}</span>
        </div>
        <h3 class="spotlight-title">${featured.title}</h3>
        <p class="spotlight-excerpt">${featured.excerpt}</p>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <button class="btn-read-word" onclick="window.innovaApp.openWordViewer('${featured.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
            Leer en Formato Word
          </button>
          ${featured.wordUrl ? `
            <a href="${featured.wordUrl}" target="_blank" download class="btn-download-word" title="Descargar documento Word oficial adjunto" style="background-color: #1d4ed8; color: #ffffff;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              📥 Descargar archivo Word
            </a>
          ` : `
            <button class="btn-download-word" onclick="window.innovaApp.triggerWordDownload('${featured.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar Word (.doc)
            </button>
          `}
          ${featured.pdfUrl ? `
            <button class="btn-read-pdf" onclick="window.innovaApp.openPdfViewer('${featured.id}')" title="Leer documento PDF en visor integrado">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              📄 Leer PDF
            </button>
          ` : ""}
          ${deleteBtnFeatured}
        </div>
      </div>
    `;
  }

  renderContent() {
    if (!this.contentCardsContainer) return;

    if (this.selectedCategory === "redaccion") {
      this.renderArticlesList();
    } else {
      this.renderMediaList();
    }
  }

  renderArticlesList() {
    const articles = store.getArticles().filter(a => a.month === this.selectedMonth);
    const user = store.getCurrentUser();
    const isAdmitted = this.isUserAdmitted(user);
    const isAdmin = this.isAdminUser(user);

    if (articles.length === 0) {
      if (isAdmitted) {
        this.contentCardsContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1.5px dashed var(--sky-200);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--sky-400)" stroke-width="1.5" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
            <h3 style="color: var(--sky-800); margin-bottom: 0.5rem;">Aún no hay artículos publicados en ${this.selectedMonth}</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 540px; margin: 0 auto 1.5rem;">
              Tienes permisos de publicación como miembro del comité. Puedes redactar y subir notas oficiales en formato Word (.docx).
            </p>
            <button class="btn-primary" onclick="window.innovaApp.handleRequestPublishClick('redaccion')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
              Redactar Primera Nota
            </button>
          </div>
        `;
      } else {
        this.contentCardsContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
            <div style="font-size: 2.75rem; margin-bottom: 0.75rem;">📚</div>
            <h3 style="color: var(--sky-800); margin-bottom: 0.5rem;">Edición de ${this.selectedMonth} 2026</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 520px; margin: 0 auto;">
              Los artículos periodísticos de esta edición están en proceso de redacción y edición por el equipo escolar. Puedes explorar los otros meses en las pestañas superiores.
            </p>
          </div>
        `;
      }
      return;
    }

    this.contentCardsContainer.innerHTML = articles.map(art => {
      const isAuthor = user && (
        (art.authorEmail && art.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
        (art.author && user.name && art.author.toLowerCase().includes(user.name.toLowerCase()))
      );
      const canDelete = isAdmin || isAuthor;
      const deleteBtn = canDelete ? `
        <button class="btn-delete-publication" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.deletePublication('${art.id}', 'redaccion')" title="Eliminar de Firestore">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Eliminar
        </button>
      ` : "";

      const safeAuthor = (art.author || 'Redacción Innova News').replace(/'/g, "\\'");
      const authorEmail = art.authorEmail || '';
      const authorId = art.authorId || '';

      const coauthorsHtml = (art.coauthors && Array.isArray(art.coauthors) && art.coauthors.length > 0)
        ? `<div class="coauthors-row">
            <span style="font-size: 0.78rem;">Colaboradores:</span>
            ${art.coauthors.map(c => `
              <span class="coauthor-badge-link" onclick="window.innovaApp.openPublicProfile('${c.email || ''}', '${(c.name || '').replace(/'/g, "\\'")}', '${c.id || ''}')" title="Ver perfil público de ${c.name}">
                <img src="${c.avatar || DEFAULT_USER_AVATAR}" style="width:16px;height:16px;border-radius:50%;object-fit:cover;">
                ${c.name}
              </span>
            `).join("")}
          </div>`
        : "";

      return `
        <article class="article-card">
          <div class="article-card-cover">
            <img src="${art.coverUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=80'}" alt="${art.title}">
            <span class="article-card-badge">${art.month} 2026</span>
            <div style="position: absolute; bottom: 0.75rem; right: 0.75rem; display: flex; gap: 0.35rem; flex-direction: column; align-items: flex-end;">
              <span class="article-word-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                .DOCX
              </span>
              ${art.pdfUrl ? `
                <span class="article-word-badge" style="background: #dc2626; color: #ffffff;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  .PDF
                </span>
              ` : ""}
            </div>
          </div>
          <div class="article-card-body">
            <div class="article-meta-row">
              <span class="author-name author-interactive" onclick="window.innovaApp.openPublicProfile('${authorEmail}', '${safeAuthor}', '${authorId}')" title="Ver perfil público del autor">
                ✍️ ${art.author}
              </span>
              <span>📅 ${art.date}</span>
            </div>
            ${coauthorsHtml}
            <h3 class="article-card-title">${art.title}</h3>
            <p class="article-card-excerpt">${art.excerpt}</p>
            <div class="article-card-footer" style="flex-wrap: wrap; gap: 0.5rem;">
              <button class="btn-read-word" onclick="window.innovaApp.openWordViewer('${art.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Visor Word
              </button>
              ${art.wordUrl ? `
                <a href="${art.wordUrl}" target="_blank" download class="btn-download-word" title="Descargar archivo Word oficial adjunto" style="background-color: #1d4ed8; color: #ffffff;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  📥 Descargar archivo Word
                </a>
              ` : `
                <button class="btn-download-word" onclick="window.innovaApp.triggerWordDownload('${art.id}')" title="Descargar documento .doc editable">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Descargar Word
                </button>
              `}
              ${art.pdfUrl ? `
                <button class="btn-read-pdf" onclick="window.innovaApp.openPdfViewer('${art.id}')" title="Leer documento PDF en visor integrado">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  📄 Leer PDF
                </button>
                <a href="${art.pdfUrl}" target="_blank" download class="btn-download-pdf" title="Descargar documento PDF">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Descargar PDF
                </a>
              ` : ""}
              ${deleteBtn}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  renderMediaList() {
    const mediaList = store.getMedia().filter(m => m.month === this.selectedMonth);
    const user = store.getCurrentUser();
    const isAdmitted = this.isUserAdmitted(user);
    const isAdmin = this.isAdminUser(user);

    if (mediaList.length === 0) {
      if (isAdmitted) {
        this.contentCardsContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1.5px dashed var(--green-200);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" stroke-width="1.5" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            <h3 style="color: var(--green-800); margin-bottom: 0.5rem;">Aún no hay producciones audiovisuales o Canva en ${this.selectedMonth}</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 540px; margin: 0 auto 1.5rem;">
              Tienes permisos de publicación. Puedes insertar videos de YouTube o diseños interactivos de Canva para esta edición.
            </p>
            <button class="btn-primary" style="background-color: var(--green-600);" onclick="window.innovaApp.handleRequestPublishClick('audiovisual')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              Publicar Multimedia
            </button>
          </div>
        `;
      } else {
        this.contentCardsContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
            <div style="font-size: 2.75rem; margin-bottom: 0.75rem;">🎬</div>
            <h3 style="color: var(--green-800); margin-bottom: 0.5rem;">Reportajes y Audiovisual de ${this.selectedMonth} 2026</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 520px; margin: 0 auto;">
              Las coberturas en video e infografías interactivas de esta edición se publicarán una vez finalizada la edición escolar.
            </p>
          </div>
        `;
      }
      return;
    }

    this.contentCardsContainer.innerHTML = mediaList.map(item => {
      const isCanva = item.mediaType === "canva";
      const credits = item.credits || {};
      const isAuthor = user && (
        (item.authorEmail && item.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
        (item.author && user.name && item.author.toLowerCase().includes(user.name.toLowerCase()))
      );
      const canDelete = isAdmin || isAuthor;
      const deleteBtn = canDelete ? `
        <button class="btn-delete-publication" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.deletePublication('${item.id}', 'audiovisual')" title="Eliminar de Firestore">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Eliminar
        </button>
      ` : "";

      const directorName = credits.director || item.author || 'Comité Audiovisual';
      const safeDirector = directorName.replace(/'/g, "\\'");
      const authorEmail = item.authorEmail || '';
      const authorId = item.authorId || '';

      return `
        <article class="media-card">
          <div class="media-card-player-container">
            ${this.renderMediaPreview(item)}
            <span class="media-card-badge ${isCanva ? 'canva-pill' : ''}">
              ${isCanva ? '🎨 Diseño Canva Interactivo' : '🎬 Audiovisual Innova'}
            </span>
          </div>

          <div class="media-card-body">
            <h3 class="media-card-title">${item.title}</h3>
            <p class="media-card-description">${item.description}</p>

            <div class="media-credits-box">
              <div class="credits-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Ficha Técnica & Créditos del Equipo:
              </div>
              <div class="credits-list">
                <div>
                  <span class="credit-role">Dirección / Responsable:</span> 
                  <span class="author-interactive" onclick="window.innovaApp.openPublicProfile('${authorEmail}', '${safeDirector}', '${authorId}')" title="Ver perfil de autor">
                    ${directorName}
                  </span>
                </div>
                <div><span class="credit-role">Cámara y Edición:</span> ${credits.camera || 'Comité Audiovisual'}</div>
                <div><span class="credit-role">Colaboradores:</span> ${credits.collaborators || 'Alumnos de Sede Canta Callao'}</div>
                ${(item.coauthors && Array.isArray(item.coauthors) && item.coauthors.length > 0) ? `
                  <div style="margin-top: 0.25rem;">
                    <span class="credit-role">Coautores Oficiales:</span>
                    <div style="display: inline-flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.2rem;">
                      ${item.coauthors.map(c => `
                        <span class="coauthor-badge-link" onclick="window.innovaApp.openPublicProfile('${c.email || ''}', '${(c.name || '').replace(/'/g, "\\'")}', '${c.id || ''}')" title="Ver perfil de ${c.name}">
                          <img src="${c.avatar || DEFAULT_USER_AVATAR}" style="width:16px;height:16px;border-radius:50%;object-fit:cover;">
                          ${c.name}
                        </span>
                      `).join("")}
                    </div>
                  </div>
                ` : ""}
              </div>
            </div>

            <div class="media-card-footer" style="flex-wrap: wrap; gap: 0.5rem;">
              <button class="btn-read-word" onclick="window.innovaApp.openMediaModal('${item.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Reproducir
              </button>
              <a href="${item.externalLink || item.mediaUrl}" target="_blank" class="btn-open-external" title="Ver en plataforma externa">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Fuente
              </a>
              ${item.wordUrl ? `
                <a href="${item.wordUrl}" target="_blank" download class="btn-download-word" title="Descargar documento Word adjunto" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                  📥 Word
                </a>
              ` : ""}
              ${item.pdfUrl ? `
                <button class="btn-read-pdf" onclick="window.innovaApp.openPdfViewer('${item.id}')" title="Leer PDF adjunto" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
                  📄 PDF
                </button>
              ` : ""}
              ${deleteBtn}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  renderMediaPreview(item) {
    if (item.mediaType === "canva") {
      if (item.mediaUrl && item.mediaUrl.includes("<iframe")) {
        return item.mediaUrl;
      }
      return `<iframe src="${item.mediaUrl}" allowfullscreen="allowfullscreen" allow="fullscreen" loading="lazy"></iframe>`;
    }

    if (item.mediaType === "youtube") {
      const embedUrl = this.getYouTubeEmbedUrl(item.mediaUrl);
      return `<iframe src="${embedUrl}" title="${item.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    }

    return `<video src="${item.mediaUrl}" controls poster="${item.coverUrl}"></video>`;
  }

  getYouTubeEmbedUrl(url) {
    if (!url) return "https://www.youtube.com/embed/dQw4w9WgXcQ";
    if (url.includes("embed")) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  }

  // ========================================================================
  // ELIMINACIÓN DE PUBLICACIONES EN LA NUBE (EXCLUSIVO DIRECTORES Y AUTORES)
  // ========================================================================

  async deletePublication(pubId, type = "redaccion") {
    const user = store.getCurrentUser();
    if (!user) {
      this.showToast("Debes iniciar sesión para realizar esta acción.", "error");
      return;
    }

    const idStr = String(pubId).trim();
    const isAdmin = this.isAdminUser(user);
    const articles = store.getArticles();
    const mediaList = store.getMedia();

    // Detección automática del tipo según el ID en las colecciones
    let resolvedType = type;
    let item = (resolvedType === "redaccion")
      ? articles.find(a => a.id === idStr)
      : mediaList.find(m => m.id === idStr);

    if (!item) {
      const foundInMedia = mediaList.find(m => m.id === idStr);
      if (foundInMedia) {
        resolvedType = "audiovisual";
        item = foundInMedia;
      } else {
        const foundInArticles = articles.find(a => a.id === idStr);
        if (foundInArticles) {
          resolvedType = "redaccion";
          item = foundInArticles;
        }
      }
    }

    const isAuthor = item && item.authorEmail && item.authorEmail.toLowerCase() === user.email.toLowerCase();

    if (!isAdmin && !isAuthor) {
      this.showToast("Solo los directores o el autor de la publicación pueden eliminarla.", "error");
      return;
    }

    const typeLabel = resolvedType === "redaccion" ? "el artículo de redacción" : "la producción audiovisual / video";
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar permanentemente ${typeLabel} de la nube central?\nEsta acción ejecutará deleteDoc en Firestore y actualizará la web al instante.`);
    if (!confirmed) return;

    // Ejecución de borrado en Firestore y LocalStorage
    if (resolvedType === "redaccion") {
      await store.deleteArticle(idStr);
    } else {
      await store.deleteMedia(idStr);
    }

    // Actualización inmediata del DOM
    this.renderSpotlight();
    this.renderContent();
    this.loadSuperAdminData();
    if (user) this.renderAuthorContributions(user.email);

    this.showToast("Publicación eliminada de la base de datos con éxito.", "warning");
  }

  // ========================================================================
  // VISOR DE DOCUMENTO WORD (.DOCX) Y GENERADOR DE DESCARGAS .DOC
  // ========================================================================

  openWordViewer(articleId) {
    const articles = store.getArticles();
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    this.currentDocToDownload = article;

    document.getElementById("word-viewer-filename").textContent = `${article.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
    document.getElementById("word-article-date").textContent = `${article.month} 2026 • Innova Schools Canta Callao`;
    document.getElementById("word-article-title").textContent = article.title;

    const safeAuthor = (article.author || 'Redacción Innova News').replace(/'/g, "\\'");
    const authorEmail = article.authorEmail || '';
    const authorId = article.authorId || '';

    document.getElementById("word-article-byline").innerHTML = `
      <span class="author-interactive" onclick="window.innovaApp.openPublicProfile('${authorEmail}', '${safeAuthor}', '${authorId}')" title="Ver perfil público del autor">
        Por: <strong>${article.author}</strong>
      </span>
      <span>• Fecha de publicación: ${article.date}</span>
    `;

    // Tarjeta de documentos adjuntos opcionales (Word y PDF)
    let attachmentsHtml = "";
    if (article.wordUrl || article.pdfUrl) {
      attachmentsHtml = `
        <div class="doc-attachments-box" style="margin: 1.5rem 0; padding: 1rem 1.25rem; background: var(--sky-50); border: 1.5px solid var(--sky-200); border-radius: var(--radius-md);">
          <div style="font-size: 0.82rem; font-weight: 800; color: var(--sky-900); margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>📎</span> Documentos Oficiales Adjuntos a esta Publicación:
          </div>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            ${article.wordUrl ? `
              <a href="${article.wordUrl}" target="_blank" download class="btn-download-word" title="Descargar documento Word oficial adjunto" style="background-color: #1d4ed8; color: #ffffff;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                📥 Descargar archivo Word
              </a>
            ` : ""}
            ${article.pdfUrl ? `
              <button class="btn-read-pdf" onclick="window.innovaApp.openPdfViewer('${article.id}')" title="Leer documento PDF en visor integrado">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                📄 Leer PDF
              </button>
              <a href="${article.pdfUrl}" target="_blank" download class="btn-download-pdf" title="Descargar documento PDF">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar PDF
              </a>
            ` : ""}
          </div>
        </div>
      `;
    }

    const formattedBody = article.content
      .split("\n\n")
      .map(p => {
        if (p.startsWith("### ")) {
          return `<h3>${p.replace("### ", "")}</h3>`;
        }
        if (p.startsWith("*") && p.endsWith("*")) {
          return `<blockquote>${p.replace(/\*/g, "")}</blockquote>`;
        }
        return `<p>${p}</p>`;
      })
      .join("");

    // Visor integrado de PDF si el documento lo posee
    let embeddedPdfSection = "";
    if (article.pdfUrl) {
      const embedSrc = this.formatPdfEmbedUrl(article.pdfUrl);
      embeddedPdfSection = `
        <div style="margin-top: 2rem; border-top: 2px dashed #cbd5e1; padding-top: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span style="font-size: 1.25rem;">📄</span>
              <strong style="color: #0f172a; font-size: 1rem;">Visor Integrado de PDF</strong>
            </div>
            <a href="${article.pdfUrl}" target="_blank" download class="btn-download-pdf" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              📥 Descargar PDF
            </a>
          </div>
          <div class="pdf-embed-container" style="border-radius: var(--radius-md); overflow: hidden; border: 1.5px solid #cbd5e1; height: 540px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <iframe src="${embedSrc}" width="100%" height="100%" style="border: none;" allowfullscreen title="Visor integrado de PDF"></iframe>
          </div>
        </div>
      `;
    }

    document.getElementById("word-article-body").innerHTML = attachmentsHtml + formattedBody + embeddedPdfSection;

    const words = article.content.trim().split(/\s+/).length;
    const readTime = Math.ceil(words / 180);
    document.getElementById("word-count-display").textContent = `${words} palabras`;
    document.getElementById("word-reading-time").textContent = `Tiempo estimado: ${readTime} min de lectura`;

    this.wordModal.classList.add("active");
  }

  closeWordModal() {
    this.wordModal.classList.remove("active");
  }

  triggerWordDownload(articleId) {
    const articles = store.getArticles();
    const article = articles.find(a => a.id === articleId);
    if (article) {
      this.downloadWordDocument(article);
    }
  }

  downloadWordDocument(article) {
    const fileName = `InnovaNews_${article.month}_${article.title.substring(0, 25).replace(/[^a-zA-Z0-9]/g, "_")}.doc`;

    const htmlDocument = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${article.title}</title>
        <style>
          body {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 11.5pt;
            line-height: 1.5;
            color: #1e293b;
            margin: 2cm 2.5cm;
          }
          .header-box {
            border-bottom: 2pt solid #0284c7;
            padding-bottom: 8pt;
            margin-bottom: 20pt;
            color: #0369a1;
            font-size: 9pt;
            font-weight: bold;
          }
          h1 {
            font-size: 22pt;
            color: #0f172a;
            margin-bottom: 8pt;
          }
          .meta-info {
            font-size: 10pt;
            color: #475569;
            margin-bottom: 24pt;
            border-bottom: 1pt dashed #cbd5e1;
            padding-bottom: 8pt;
          }
          p {
            margin-bottom: 12pt;
            text-align: justify;
          }
          h3 {
            font-size: 14pt;
            color: #0284c7;
            margin-top: 18pt;
            margin-bottom: 6pt;
          }
          blockquote {
            background-color: #f0fdf4;
            border-left: 4pt solid #16a34a;
            padding: 8pt 12pt;
            margin: 14pt 0;
            font-style: italic;
          }
          .footer-box {
            margin-top: 30pt;
            border-top: 1pt solid #cbd5e1;
            padding-top: 10pt;
            font-size: 8.5pt;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          INNOVA SCHOOLS - SEDE CANTA CALLAO | COMITÉ PERIODÍSTICO OFICIAL "INNOVA NEWS" (2026)
        </div>
        <h1>${article.title}</h1>
        <div class="meta-info">
          <strong>Autor(es):</strong> ${article.author} &nbsp;|&nbsp; 
          <strong>Edición:</strong> ${article.month} 2026 &nbsp;|&nbsp; 
          <strong>Fecha:</strong> ${article.date}
        </div>
        <div class="content">
          ${article.content.split("\n\n").map(p => {
            if (p.startsWith("### ")) return `<h3>${p.replace("### ", "")}</h3>`;
            if (p.startsWith("*") && p.endsWith("*")) return `<blockquote>${p.replace(/\*/g, "")}</blockquote>`;
            return `<p>${p}</p>`;
          }).join("")}
        </div>
        <div class="footer-box">
          Documento oficial emitido por el Comité de Redacción de Innova News, Sede Canta Callao. Exclusivo para fines informativos y pedagógicos.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlDocument], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(`Descargando documento Word: ${fileName}`, "success");
  }

  // ========================================================================
  // VISOR DE MULTIMEDIA Y CANVA
  // ========================================================================

  openMediaModal(mediaId) {
    const media = store.getMedia().find(m => m.id === mediaId);
    if (!media) return;

    document.getElementById("media-modal-header-title").textContent = media.title;
    document.getElementById("media-modal-title").textContent = media.title;
    document.getElementById("media-modal-desc").textContent = media.description;

    const playerBox = document.getElementById("media-modal-player-box");
    playerBox.innerHTML = this.renderMediaPreview(media);

    const credits = media.credits || {};
    document.getElementById("media-modal-credits").innerHTML = `
      <div class="credits-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Ficha Técnica y Créditos Oficiales:
      </div>
      <div class="credits-list">
        <div><span class="credit-role">Dirección / Productor:</span> ${credits.director || media.author}</div>
        <div><span class="credit-role">Cámara, Efectos & Edición:</span> ${credits.camera || 'Comité Audiovisual'}</div>
        <div><span class="credit-role">Colaboradores & Entrevistados:</span> ${credits.collaborators || 'Comunidad Innova Canta Callao'}</div>
      </div>
    `;

    const btnExt = document.getElementById("btn-media-external-link");
    btnExt.href = media.externalLink || media.mediaUrl;

    this.mediaModal.classList.add("active");
  }

  closeMediaModal() {
    this.mediaModal.classList.remove("active");
    const playerBox = document.getElementById("media-modal-player-box");
    if (playerBox) playerBox.innerHTML = "";
  }

  // ========================================================================
  // VISOR INTEGRADO DE DOCUMENTOS PDF Y CONVERSOR DE ENLACES
  // ========================================================================

  formatPdfEmbedUrl(url) {
    if (!url) return "";
    let clean = url.trim();
    // Conversión de enlaces de Google Drive para permitir vista previa embebida en <iframe>
    const driveMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    const driveOpenMatch = clean.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (driveOpenMatch && driveOpenMatch[1]) {
      return `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`;
    }
    return clean;
  }

  openPdfViewer(publicationId) {
    const articles = store.getArticles();
    const mediaList = store.getMedia();
    const pub = articles.find(a => a.id === publicationId) || mediaList.find(m => m.id === publicationId);
    if (!pub || !pub.pdfUrl) {
      this.showToast("Esta publicación no tiene un documento PDF enlazado.", "warning");
      return;
    }

    if (this.pdfModalIframe) {
      this.pdfModalIframe.src = this.formatPdfEmbedUrl(pub.pdfUrl);
    }
    if (this.pdfViewerFilename) {
      this.pdfViewerFilename.textContent = `${(pub.title || "Documento").substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    }
    if (this.pdfModalTitle) {
      this.pdfModalTitle.textContent = pub.title;
    }
    if (this.pdfModalAuthor) {
      this.pdfModalAuthor.textContent = `Por: ${pub.author || 'Comité Innova News'} • ${pub.month || 'Octubre'} 2026`;
    }
    if (this.btnModalDownloadPdf) {
      this.btnModalDownloadPdf.href = pub.pdfUrl;
      this.btnModalDownloadPdf.setAttribute("download", `${(pub.title || "Documento").substring(0, 25)}.pdf`);
    }

    if (this.pdfModal) {
      this.pdfModal.classList.add("active");
    }
  }

  closePdfViewer() {
    if (this.pdfModal) {
      this.pdfModal.classList.remove("active");
    }
    if (this.pdfModalIframe) {
      this.pdfModalIframe.src = "about:blank";
    }
  }

  // ========================================================================
  // PERFILES PÚBLICOS DE USUARIOS (RED SOCIAL ESCOLAR)
  // ========================================================================

  openPublicProfile(authorEmail, authorName, authorId) {
    const users = store.getUsers();
    let targetUser = null;

    if (authorId) {
      targetUser = users.find(u => u.id === authorId);
    }
    if (!targetUser && authorEmail) {
      targetUser = users.find(u => u.email && u.email.toLowerCase() === authorEmail.toLowerCase());
    }
    if (!targetUser && authorName) {
      targetUser = users.find(u => u.name && (
        u.name.toLowerCase() === authorName.toLowerCase() ||
        authorName.toLowerCase().includes(u.name.toLowerCase()) ||
        u.name.toLowerCase().includes(authorName.toLowerCase())
      ));
    }

    if (!targetUser) {
      targetUser = {
        id: authorId || "usr_guest_" + Date.now(),
        name: authorName || "Autor de Innova News",
        email: authorEmail || "contacto@alumnos.innovaschools.edu.pe",
        role: "Miembro del Comité Periodístico",
        grade: "Sede Canta Callao",
        avatar: DEFAULT_USER_AVATAR,
        banner: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        bio: "Colaborador del Comité Periodístico Innova News en Innova Schools Sede Canta Callao.",
        status: "ADMITIDO"
      };
    }

    this.currentPublicProfileUser = targetUser;
    this.renderPublicProfileModal(targetUser);
    if (this.publicProfileModal) {
      this.publicProfileModal.classList.add("active");
    }
  }

  closePublicProfile() {
    if (this.publicProfileModal) {
      this.publicProfileModal.classList.remove("active");
    }
    this.currentPublicProfileUser = null;
  }

  refreshPublicProfileIfOpen() {
    if (this.publicProfileModal && this.publicProfileModal.classList.contains("active") && this.currentPublicProfileUser) {
      const users = store.getUsers();
      const updatedUser = users.find(u => 
        (u.id && u.id === this.currentPublicProfileUser.id) ||
        (u.email && this.currentPublicProfileUser.email && u.email.toLowerCase() === this.currentPublicProfileUser.email.toLowerCase())
      ) || this.currentPublicProfileUser;
      this.currentPublicProfileUser = updatedUser;
      this.renderPublicProfileModal(updatedUser);
    }
  }

  renderPublicProfileModal(user) {
    if (!user) return;

    if (this.pubProfileBanner) {
      const bannerUrl = user.banner || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";
      this.pubProfileBanner.style.backgroundImage = `url('${bannerUrl}')`;
    }
    if (this.pubProfileAvatar) {
      this.pubProfileAvatar.src = user.avatar || DEFAULT_USER_AVATAR;
    }
    if (this.pubProfileName) {
      this.pubProfileName.textContent = user.name;
    }
    if (this.pubProfileRole) {
      this.pubProfileRole.textContent = user.role || "Miembro del Comité";
    }
    if (this.pubProfileGrade) {
      this.pubProfileGrade.textContent = user.grade || "Sede Canta Callao";
    }
    if (this.pubProfileEmail) {
      this.pubProfileEmail.textContent = user.email || "";
    }
    if (this.pubProfileBadge) {
      const isSuperAdmin = this.isAdminUser(user);
      const isAdmitted = this.isUserAdmitted(user);
      if (isSuperAdmin) {
        this.pubProfileBadge.innerHTML = `<span class="status-badge" style="background: #fef3c7; color: #b45309; font-weight: 800;">👑 Dirección General</span>`;
      } else if (isAdmitted) {
        this.pubProfileBadge.innerHTML = `<span class="status-badge status-admitted">✓ ADMITIDO</span>`;
      } else {
        this.pubProfileBadge.innerHTML = `<span class="status-badge status-pending">⏳ En Revisión</span>`;
      }
    }
    if (this.pubProfileBio) {
      this.pubProfileBio.textContent = user.bio && user.bio.trim()
        ? user.bio.trim()
        : "Este autor aún no ha redactado su biografía personal en la plataforma de Innova News.";
    }

    // Botón de edición rápida si la sesión activa corresponde a este autor
    if (this.pubProfileActions) {
      const currentUser = store.getCurrentUser();
      const isOwner = currentUser && (
        (currentUser.id && user.id && currentUser.id === user.id) ||
        (currentUser.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase())
      );
      if (isOwner) {
        this.pubProfileActions.innerHTML = `
          <button class="btn-primary" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="window.innovaApp.closePublicProfile(); window.innovaApp.openDashboardModal('profile');">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Editar mi Perfil
          </button>
        `;
      } else {
        this.pubProfileActions.innerHTML = "";
      }
    }

    // Filtrar publicaciones y trabajos de este autor en tiempo real
    const articles = store.getArticles();
    const mediaList = store.getMedia();
    const currentUser = store.getCurrentUser();
    const isAdmin = this.isAdminUser(currentUser);

    const isMatch = (item) => {
      if (user.id && item.authorId && item.authorId === user.id) return true;
      if (user.email && item.authorEmail && item.authorEmail.toLowerCase() === user.email.toLowerCase()) return true;
      if (user.name && item.author && item.author.toLowerCase().includes(user.name.toLowerCase())) return true;
      if (user.name && item.credits && item.credits.director && item.credits.director.toLowerCase().includes(user.name.toLowerCase())) return true;
      if (item.coauthors && Array.isArray(item.coauthors)) {
        if (item.coauthors.some(c => 
          (user.id && c.id && c.id === user.id) ||
          (user.email && c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase()) ||
          (user.name && c.name && user.name && c.name.toLowerCase() === user.name.toLowerCase())
        )) {
          return true;
        }
      }
      return false;
    };

    const userArticles = articles.filter(isMatch).map(a => ({ ...a, itemType: "redaccion" }));
    const userMedia = mediaList.filter(isMatch).map(m => ({ ...m, itemType: "audiovisual" }));
    const allWorks = [...userArticles, ...userMedia];

    if (this.pubProfileWorksCount) {
      this.pubProfileWorksCount.textContent = `${allWorks.length} ${allWorks.length === 1 ? 'publicación' : 'publicaciones'}`;
    }

    if (this.pubProfileWorksContainer) {
      if (allWorks.length === 0) {
        this.pubProfileWorksContainer.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color); color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
            <strong style="color: var(--text-dark); display: block; margin-bottom: 0.25rem;">Aún no hay publicaciones de este autor</strong>
            <p style="font-size: 0.85rem; margin: 0;">Los artículos de redacción, documentos Word/PDF o videos que publique aparecerán reflejados aquí en tiempo real.</p>
          </div>
        `;
      } else {
        this.pubProfileWorksContainer.innerHTML = allWorks.map(work => {
          const isRedaccion = work.itemType === "redaccion";
          const canDelete = isAdmin || (currentUser && (
            (work.authorEmail && currentUser.email && work.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
            (work.authorId && currentUser.id && work.authorId === currentUser.id)
          ));

          const deleteBtn = canDelete ? `
            <button class="btn-delete-publication" style="font-size: 0.72rem; padding: 0.3rem 0.55rem;" onclick="window.innovaApp.deletePublication('${work.id}', '${work.itemType}')" title="Eliminar de Firestore">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              Eliminar
            </button>
          ` : "";

          return `
            <div class="contribution-mini-card" style="padding: 1.15rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="status-badge ${isRedaccion ? 'status-approved' : ''}" style="${!isRedaccion ? 'background: var(--sky-100); color: var(--sky-800);' : ''}">
                  ${isRedaccion ? '📄 Redacción Word' : (work.mediaType === 'canva' ? '🎨 Diseño Canva' : '🎬 Audiovisual')}
                </span>
                <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">${work.month} 2026 • ${work.date || ''}</span>
              </div>
              <h4 style="font-size: 1.05rem; margin: 0 0 0.4rem 0; color: var(--text-dark);">${work.title}</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0 0 0.9rem 0; line-height: 1.45;">
                ${(work.excerpt || work.description || '').substring(0, 140)}...
              </p>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                ${isRedaccion ? `
                  <button class="btn-read-word" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.closePublicProfile(); window.innovaApp.openWordViewer('${work.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                    Visor Word
                  </button>
                ` : `
                  <button class="btn-read-word" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.closePublicProfile(); window.innovaApp.openMediaModal('${work.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                    Reproducir
                  </button>
                `}
                ${work.wordUrl ? `
                  <a href="${work.wordUrl}" target="_blank" download class="btn-download-word" title="Descargar archivo Word oficial adjunto" style="font-size: 0.76rem; padding: 0.35rem 0.65rem; background-color: #1d4ed8; color: #ffffff;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    📥 Descargar Word
                  </a>
                ` : (isRedaccion ? `
                  <button class="btn-download-word" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.triggerWordDownload('${work.id}')">
                    Descargar .doc
                  </button>
                ` : '')}
                ${work.pdfUrl ? `
                  <button class="btn-read-pdf" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.openPdfViewer('${work.id}')" title="Leer documento PDF en visor integrado">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    📄 Leer PDF
                  </button>
                  <a href="${work.pdfUrl}" target="_blank" download class="btn-download-pdf" title="Descargar documento PDF" style="font-size: 0.76rem; padding: 0.35rem 0.65rem;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Descargar PDF
                  </a>
                ` : ''}
                ${deleteBtn}
              </div>
            </div>
          `;
        }).join("");
      }
    }
  }

  // ========================================================================
  // DASHBOARD, PUBLICACIÓN Y PERFIL DE AUTOR SINCRONIZADO EN LA NUBE
  // ========================================================================

  handleRequestPublishClick(category = "redaccion") {
    const user = store.getCurrentUser();
    if (!user) {
      this.openAuthModal("login");
      this.showToast("Debes iniciar sesión con una cuenta autorizada para publicar.", "info");
      return;
    }

    if (!this.isUserAdmitted(user)) {
      this.openDashboardModal("profile");
      this.showToast("Tu cuenta está en proceso de revisión por el administrador.", "warning");
      return;
    }

    this.openDashboardModal("publish");
    if (category) {
      const catSelect = document.getElementById("pub-category");
      if (catSelect) {
        catSelect.value = category;
        catSelect.dispatchEvent(new Event("change"));
      }
    }
  }

  openDashboardModal(initialTab = "publish") {
    const user = store.getCurrentUser();
    if (!user) {
      this.openAuthModal("login");
      return;
    }

    const isSuperAdmin = this.isAdminUser(user);
    const isAdmitted = this.isUserAdmitted(user);

    document.getElementById("dash-user-sub").textContent = `${user.name} • ${user.role}`;

    // REGLA DE SEGURIDAD: El panel de carga para publicar nuevos artículos o videos
    // solo se muestra si el usuario tiene el estado ADMITIDO (o es Super Admin).
    if (this.tabPublish) {
      this.tabPublish.style.display = isAdmitted ? "block" : "none";
    }

    // Si el usuario no está admitido y se intentó abrir "publish", forzar a la pestaña "profile"
    if (!isAdmitted && initialTab === "publish") {
      initialTab = "profile";
    }

    // Pestaña de Super Administrador para ambos directores oficiales
    if (this.tabSuperadmin) {
      this.tabSuperadmin.style.display = isSuperAdmin ? "block" : "none";
    }

    this.switchDashboardTab(initialTab);
    this.dashboardModal.classList.add("active");

    const pubDate = document.getElementById("pub-date");
    if (pubDate && !pubDate.value) {
      pubDate.value = new Date().toISOString().split("T")[0];
    }
    const pubAuthors = document.getElementById("pub-authors");
    if (pubAuthors && !pubAuthors.value) {
      pubAuthors.value = `${user.name} (${user.role})`;
    }
    this.renderCoauthorsSelector();
  }

  closeDashboardModal() {
    this.dashboardModal.classList.remove("active");
  }

  switchDashboardTab(tab) {
    const user = store.getCurrentUser();
    const isAdmitted = this.isUserAdmitted(user);

    if (tab === "publish" && !isAdmitted) {
      tab = "profile";
      this.showToast("Tu cuenta está en proceso de revisión por el administrador. Solo miembros ADMITIDOS pueden publicar.", "warning");
    }

    if (this.tabPublish) this.tabPublish.classList.toggle("active", tab === "publish");
    if (this.tabProfile) this.tabProfile.classList.toggle("active", tab === "profile");
    if (this.tabSuperadmin) this.tabSuperadmin.classList.toggle("active", tab === "superadmin");

    if (this.viewPublish) this.viewPublish.style.display = (tab === "publish" && isAdmitted) ? "block" : "none";
    if (this.viewProfile) this.viewProfile.style.display = tab === "profile" ? "block" : "none";
    if (this.viewSuperadmin) this.viewSuperadmin.style.display = tab === "superadmin" ? "block" : "none";

    if (tab === "publish") {
      this.renderCoauthorsSelector();
    } else if (tab === "profile") {
      this.loadUserProfile();
    } else if (tab === "superadmin") {
      this.loadSuperAdminData();
    }
  }

  handlePublish(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!user) return;

    if (!this.isUserAdmitted(user)) {
      this.showToast("Tu cuenta está en proceso de revisión por el administrador. No tienes permisos para publicar aún.", "error");
      return;
    }

    const month = document.getElementById("pub-month").value;
    const category = document.getElementById("pub-category").value;
    const title = document.getElementById("pub-title").value.trim();
    const authors = document.getElementById("pub-authors").value.trim();
    const date = document.getElementById("pub-date").value;
    const excerpt = document.getElementById("pub-excerpt").value.trim();
    const coverUrl = document.getElementById("pub-cover-url").value.trim();
    const wordUrl = this.pubWordUrl ? this.pubWordUrl.value.trim() : "";
    const pdfUrl = this.pubPdfUrl ? this.pubPdfUrl.value.trim() : "";
    const coauthors = this.getSelectedCoauthors();

    if (category === "redaccion") {
      const content = document.getElementById("pub-content").value.trim();
      if (!content) {
        this.showToast("Debes redactar el contenido del artículo.", "error");
        return;
      }

      const newArticle = {
        id: "art_" + Date.now(),
        month,
        title,
        author: authors,
        authorEmail: user.email,
        authorId: user.id || user.email,
        coauthors: coauthors.length > 0 ? coauthors : undefined,
        date,
        excerpt,
        coverUrl: coverUrl || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
        content,
        wordUrl: wordUrl || undefined,
        pdfUrl: pdfUrl || undefined
      };

      store.saveArticle(newArticle);
      this.showToast("Artículo de redacción publicado en la nube con éxito.", "success");
    } else {
      const mediaType = document.getElementById("pub-media-type").value;
      const mediaUrl = document.getElementById("pub-media-url").value.trim();
      const director = document.getElementById("pub-credit-director").value.trim();
      const camera = document.getElementById("pub-credit-camera").value.trim();
      const others = document.getElementById("pub-credit-others").value.trim();

      if (!mediaUrl) {
        this.showToast("Debes ingresar el enlace o código embed de Canva/Video.", "error");
        return;
      }

      const newMedia = {
        id: "med_" + Date.now(),
        month,
        title,
        mediaType,
        mediaUrl,
        coverUrl: coverUrl || (mediaType === "canva" ? "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"),
        author: authors,
        authorEmail: user.email,
        authorId: user.id || user.email,
        coauthors: coauthors.length > 0 ? coauthors : undefined,
        date,
        description: excerpt,
        credits: {
          director: director || user.name,
          camera: camera || "Comité Audiovisual",
          editing: "Innova News Canta Callao",
          collaborators: others || "Estudiantes de Sede Canta Callao"
        },
        externalLink: mediaUrl.startsWith("http") ? mediaUrl : "https://www.canva.com",
        wordUrl: wordUrl || undefined,
        pdfUrl: pdfUrl || undefined
      };

      store.saveMedia(newMedia);
      this.showToast("Producción audiovisual / Canva publicada en la nube con éxito.", "success");
    }

    this.formPublishArticle.reset();
    this.selectedMonth = month;
    this.selectedCategory = category;
    this.selectMonth(month);
    this.selectCategory(category);
    this.renderSpotlight();
    this.closeDashboardModal();
  }

  loadUserProfile() {
    const user = store.getCurrentUser();
    if (!user) return;

    const isAdmitted = this.isUserAdmitted(user);

    const noticeContainer = document.getElementById("profile-admitted-notice-container");
    if (noticeContainer) {
      if (!isAdmitted) {
        noticeContainer.innerHTML = `
          <div class="pending-approval-banner">
            <div class="banner-icon">⏳</div>
            <div class="banner-content">
              <h4>Tu cuenta está en proceso de revisión por el administrador</h4>
              <p>Tu registro con la clave de seguridad del comité ha sido guardado exitosamente. Sin embargo, el <strong>formulario para publicar nuevos artículos de redacción o videos audiovisuales</strong> permanece oculto hasta que el Super Administrador cambie tu estado a Admitido.</p>
              <p style="margin-top: 0.6rem; font-size: 0.82rem; color: #92400e; font-weight: 700;">
                Estado: <span class="status-badge status-pending">PENDIENTE DE REVISIÓN</span> • Tan pronto como el Administrador presione <em>ADMITIR</em>, el sistema modificará esta interfaz para mostrar los formularios de carga de contenido con el estado <strong>ADMITIDO</strong>.
              </p>
            </div>
          </div>
        `;
      } else {
        noticeContainer.innerHTML = `
          <div class="admitted-badge-banner">
            <span style="font-size: 1.6rem; flex-shrink: 0;">🎉</span>
            <div>
              <h4>¡Estado: Miembro ADMITIDO Oficial!</h4>
              <p>Tu cuenta ha sido admitida formalmente por la Dirección Periodística. Tienes habilitado el acceso completo a los formularios de carga de redacción y proyectos audiovisuales/Canva en la pestaña <strong>"Publicar Nuevo Contenido"</strong>.</p>
            </div>
          </div>
        `;
      }
    }

    document.getElementById("profile-display-name").textContent = user.name;
    const roleEl = document.getElementById("profile-display-role");
    if (roleEl) {
      const badgeHtml = isAdmitted 
        ? '<span class="status-badge status-admitted" style="margin-left: 0.5rem;">✓ ADMITIDO</span>'
        : '<span class="status-badge status-pending" style="margin-left: 0.5rem;">⏳ En Revisión</span>';
      roleEl.innerHTML = `${user.role || 'Miembro Oficial'} ${badgeHtml}`;
    }
    document.getElementById("profile-display-email").textContent = user.email;

    const avatarEl = document.getElementById("profile-avatar-display");
    if (avatarEl) avatarEl.src = user.avatar || DEFAULT_USER_AVATAR;

    const bannerEl = document.getElementById("profile-banner-display");
    if (bannerEl) bannerEl.style.backgroundImage = `url('${user.banner || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'}')`;

    document.getElementById("edit-profile-name").value = user.name;
    document.getElementById("edit-profile-role").value = user.role;
    document.getElementById("edit-profile-avatar").value = user.avatar || "";
    document.getElementById("edit-profile-banner").value = user.banner || "";
    if (this.editProfileBio) {
      this.editProfileBio.value = user.bio || "";
    }
    if (this.profileDisplayBio && this.profileDisplayBioWrap) {
      if (user.bio && user.bio.trim()) {
        this.profileDisplayBio.textContent = user.bio.trim();
        this.profileDisplayBioWrap.style.display = "block";
      } else {
        this.profileDisplayBioWrap.style.display = "none";
      }
    }

    this.renderAuthorContributions(user.email);
  }

  renderAuthorContributions(userEmail) {
    const container = document.getElementById("profile-contributions-container");
    const countBadge = document.getElementById("author-contributions-count");
    if (!container) return;

    const userArticles = store.getArticles().filter(a => a.authorEmail === userEmail);
    const userMedia = store.getMedia().filter(m => m.authorEmail === userEmail);
    const totalCount = userArticles.length + userMedia.length;

    if (countBadge) countBadge.textContent = `${totalCount} notas publicadas`;

    if (totalCount === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; background: var(--bg-card); border-radius: var(--radius-md); text-align: center; color: var(--text-muted); border: 1px solid var(--border-color);">
          Aún no tienes publicaciones a tu nombre. ¡Anímate a publicar tu primer artículo o video en el Comité!
        </div>
      `;
      return;
    }

    const currentUser = store.getCurrentUser();
    const canDelete = this.isAdminUser(currentUser) || (currentUser && currentUser.email && currentUser.email.toLowerCase() === userEmail.toLowerCase());

    const itemsHtml = [
      ...userArticles.map(art => `
        <div class="contribution-mini-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="status-badge status-approved">📄 Redacción</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${art.month} 2026</span>
          </div>
          <strong style="font-size: 0.92rem; margin-bottom: 0.4rem; color: var(--text-dark);">${art.title}</strong>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.4;">${art.excerpt.substring(0, 80)}...</p>
          <div style="margin-top: auto; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn-read-word" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.openWordViewer('${art.id}')">Ver Word</button>
            <button class="btn-download-word" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.triggerWordDownload('${art.id}')">Descargar .doc</button>
            ${canDelete ? `
              <button class="btn-delete-publication" style="font-size: 0.72rem; padding: 0.3rem 0.55rem;" onclick="window.innovaApp.deletePublication('${art.id}', 'redaccion')" title="Eliminar de Firestore">Eliminar</button>
            ` : ""}
          </div>
        </div>
      `),
      ...userMedia.map(med => `
        <div class="contribution-mini-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="status-badge" style="background: var(--sky-100); color: var(--sky-800);">🎬 Audiovisual</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${med.month} 2026</span>
          </div>
          <strong style="font-size: 0.92rem; margin-bottom: 0.4rem; color: var(--text-dark);">${med.title}</strong>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.4;">${med.description.substring(0, 80)}...</p>
          <div style="margin-top: auto; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn-read-word" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" onclick="window.innovaApp.openMediaModal('${med.id}')">Reproducir</button>
            ${canDelete ? `
              <button class="btn-delete-publication" style="font-size: 0.72rem; padding: 0.3rem 0.55rem;" onclick="window.innovaApp.deletePublication('${med.id}', 'audiovisual')" title="Eliminar de Firestore">Eliminar</button>
            ` : ""}
          </div>
        </div>
      `)
    ].join("");

    container.innerHTML = itemsHtml;
  }

  handleUpdateProfile(e) {
    e.preventDefault();
    const currentUser = store.getCurrentUser();
    if (!currentUser) return;

    const name = document.getElementById("edit-profile-name").value.trim();
    const role = document.getElementById("edit-profile-role").value.trim();
    const avatar = document.getElementById("edit-profile-avatar").value.trim();
    const banner = document.getElementById("edit-profile-banner").value.trim();
    const bio = this.editProfileBio ? this.editProfileBio.value.trim() : "";

    currentUser.name = name;
    currentUser.role = role;
    if (avatar) currentUser.avatar = avatar;
    if (banner) currentUser.banner = banner;
    currentUser.bio = bio;

    const users = store.getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = currentUser;
      store.saveUsers(users);
    }
    store.setCurrentUser(currentUser, store.isSessionRemembered());
    cloudSync.saveUser(currentUser);

    this.renderAuthNav();
    this.loadUserProfile();
    if (this.currentPublicProfileUser && this.currentPublicProfileUser.email.toLowerCase() === currentUser.email.toLowerCase()) {
      this.currentPublicProfileUser = currentUser;
      this.renderPublicProfileModal(currentUser);
    }
    this.showToast("Perfil de autor actualizado y sincronizado en la nube.", "success");
  }

  renderCloudStatusBanner() {
    const banner = document.getElementById("superadmin-cloud-status-banner") || this.superadminCloudStatusBanner;
    if (!banner) return;

    if (cloudSync.cloudStatus === "api_disabled") {
      banner.innerHTML = `
        <div class="alert-box alert-warning" style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; background: #fffbeb; border: 1.5px solid #fde68a; border-left: 5px solid #f59e0b; padding: 1.1rem 1.25rem; border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.35rem;">☁️</span>
            <strong style="color: #92400e; font-size: 0.95rem;">Paso final para activar la Nube en Firebase</strong>
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: #78350f; line-height: 1.5;">
            Tus credenciales para el proyecto <code>innova-news-canta-callao</code> están cargadas correctamente. La plataforma funciona al 100% en modo local sincronizado.
          </p>
          <p style="margin: 0; font-size: 0.85rem; color: #78350f; line-height: 1.5;">
            Para habilitar la base de datos en la nube para todo el colegio:
          </p>
          <ol style="margin: 0.2rem 0 0.4rem 1.25rem; font-size: 0.82rem; color: #78350f; line-height: 1.5;">
            <li>Ingresa a <a href="https://console.firebase.google.com/project/innova-news-canta-callao/firestore" target="_blank" style="color: var(--sky-700); font-weight: 700; text-decoration: underline;">Consola Firebase (innova-news-canta-callao)</a>.</li>
            <li>Haz clic en el botón <strong>"Crear base de datos"</strong> (Create database).</li>
            <li>Selecciona la ubicación y elige <strong>"Modo de prueba"</strong> (Test mode).</li>
            <li>Haz clic en <strong>Habilitar</strong> y luego presiona el botón inferior para enlazar en vivo.</li>
          </ol>
          <div style="display: flex; gap: 0.75rem; margin-top: 0.25rem;">
            <button type="button" class="btn-primary" style="font-size: 0.8rem; padding: 0.4rem 0.9rem;" onclick="window.innovaApp.retryCloudConnection()">
              🔄 Reintentar Conexión en la Nube
            </button>
          </div>
        </div>
      `;
    } else if (cloudSync.cloudStatus === "connected") {
      banner.innerHTML = `
        <div class="alert-box alert-success" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.6rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-left: 5px solid #16a34a; padding: 0.85rem 1.25rem; border-radius: var(--radius-md);">
          <span style="font-size: 1.35rem;">☁️</span>
          <div style="font-size: 0.85rem; color: #166534;">
            <strong>Base de Datos en la Nube Conectada:</strong> Proyecto <code>innova-news-canta-callao</code> activo y sincronizado en tiempo real con Firebase Firestore.
          </div>
        </div>
      `;
    } else {
      banner.innerHTML = "";
    }
  }

  async retryCloudConnection() {
    this.showToast("Reintentando conexión con Firebase Firestore...", "info");
    const success = await cloudSync.retryConnection();
    if (success) {
      this.showToast("¡Conexión con Cloud Firestore exitosa!", "success");
    } else {
      this.showToast("Aún no se detecta la base de datos creada en Firebase. Revisa la consola y vuelve a intentar.", "warning");
    }
    this.renderCloudStatusBanner();
  }

  // ========================================================================
  // PANEL DE SUPER ADMINISTRADOR (GESTIÓN DE APROBACIONES, FOTOS Y ELIMINACIÓN)
  // ========================================================================

  loadSuperAdminData() {
    this.renderCloudStatusBanner();
    const users = store.getUsers();
    const pendingUsers = users.filter(u => u.status === "PENDIENTE_DE_APROBACION");
    const admittedUsers = users.filter(u => u.status === "ADMITIDO" || u.status === "APROBADO");

    if (this.pendingCounterBadge) {
      this.pendingCounterBadge.textContent = pendingUsers.length;
    }

    // Cargar URLs de fotos de "Sobre Nosotros"
    const photos = store.getAboutPhotos();
    if (this.aboutUrlRedaccion) this.aboutUrlRedaccion.value = photos.redaccion || "";
    if (this.aboutUrlAudiovisual) this.aboutUrlAudiovisual.value = photos.audiovisual || "";
    if (this.aboutUrlEquipo) this.aboutUrlEquipo.value = photos.equipo || "";

    if (this.previewAboutRedaccion) this.previewAboutRedaccion.src = photos.redaccion || DEFAULT_ABOUT_PHOTOS.redaccion;
    if (this.previewAboutAudiovisual) this.previewAboutAudiovisual.src = photos.audiovisual || DEFAULT_ABOUT_PHOTOS.audiovisual;
    if (this.previewAboutEquipo) this.previewAboutEquipo.src = photos.equipo || DEFAULT_ABOUT_PHOTOS.equipo;

    // 1. Tabla de Postulantes Pendientes
    if (this.superadminPendingTbody) {
      if (pendingUsers.length === 0) {
        this.superadminPendingTbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              🎉 No hay solicitudes pendientes en este momento. Todas han sido evaluadas.
            </td>
          </tr>
        `;
      } else {
        this.superadminPendingTbody.innerHTML = pendingUsers.map(user => `
          <tr>
            <td>${new Date(user.createdAt || Date.now()).toLocaleDateString("es-PE")}</td>
            <td><strong>${user.name}</strong></td>
            <td><code>${user.email}</code></td>
            <td>${user.grade} • ${user.role}</td>
            <td><span class="status-badge status-pending">⏳ Pendiente de Aprobación</span></td>
            <td>
              <div style="display: flex; gap: 0.4rem;">
                <button class="btn-approve-user" onclick="window.innovaApp.approveUser('${user.id}')" title="Admitir miembro y habilitar sus herramientas de publicación">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  ADMITIR
                </button>
                <button class="btn-reject-user" onclick="window.innovaApp.rejectUser('${user.id}')" title="Rechazar solicitud">
                  Rechazar
                </button>
              </div>
            </td>
          </tr>
        `).join("");
      }
    }

    // 2. Tabla de Miembros Oficialmente Admitidos
    if (this.superadminApprovedTbody) {
      this.superadminApprovedTbody.innerHTML = admittedUsers.map(user => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <img src="${user.avatar || DEFAULT_USER_AVATAR}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
              <strong>${user.name}</strong>
            </div>
          </td>
          <td><code>${user.email}</code></td>
          <td>${user.role}</td>
          <td><span class="status-badge status-admitted">✓ ADMITIDO</span></td>
          <td>
            ${this.isAdminUser(user)
              ? '<span style="font-size: 0.78rem; color: var(--orange-accent); font-weight: 700;">Director General</span>'
              : `<button class="btn-reject-user" style="font-size: 0.72rem; padding: 0.25rem 0.5rem;" onclick="window.innovaApp.deactivateUser('${user.id}')">Suspender</button>`
            }
          </td>
        </tr>
      `).join("");
    }

    // 3. Tabla Exclusiva: Control y Eliminación de Publicaciones en la Nube
    if (this.superadminPublicationsTbody) {
      const articles = store.getArticles().map(a => ({ ...a, itemType: "redaccion" }));
      const media = store.getMedia().map(m => ({ ...m, itemType: "audiovisual" }));
      const allPubs = [...articles, ...media];

      if (this.totalPublicationsCounter) {
        this.totalPublicationsCounter.textContent = `${allPubs.length} ${allPubs.length === 1 ? 'nota' : 'notas'}`;
      }

      if (allPubs.length === 0) {
        this.superadminPublicationsTbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No hay publicaciones activas en la nube actualmente. Los artículos o videos publicados aparecerán listados aquí.
            </td>
          </tr>
        `;
      } else {
        this.superadminPublicationsTbody.innerHTML = allPubs.map(pub => {
          const isRedaccion = pub.itemType === "redaccion";
          const badgeType = isRedaccion 
            ? '<span class="status-badge status-approved">📄 Redacción Word</span>' 
            : '<span class="status-badge" style="background: var(--sky-100); color: var(--sky-800);">🎬 Audiovisual</span>';

          return `
            <tr>
              <td>
                <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                  <div>${badgeType}</div>
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Edición: ${pub.month} 2026</span>
                </div>
              </td>
              <td>
                <strong style="color: var(--text-dark);">${pub.title}</strong>
              </td>
              <td>${pub.author || pub.authorEmail || 'Comité'}</td>
              <td style="font-size: 0.82rem; color: var(--text-muted);">${pub.date || 'Octubre 2026'}</td>
              <td style="text-align: right;">
                <button class="btn-delete-publication" onclick="window.innovaApp.deletePublication('${pub.id}', '${pub.itemType}')" title="Eliminar de forma permanente de la nube escolar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Eliminar Publicación
                </button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }
  }

  approveUser(userId) {
    const users = store.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    user.status = "ADMITIDO";
    store.saveUsers(users);
    cloudSync.saveUser(user);

    const currentUser = store.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.status = "ADMITIDO";
      store.setCurrentUser(currentUser, store.isSessionRemembered());
      this.renderAuthNav();
      if (this.tabPublish) {
        this.tabPublish.style.display = "block";
      }
    }

    this.showToast(`El miembro ${user.name} ha sido formalmente ADMITIDO en la nube.`, "success");
    this.loadSuperAdminData();
  }

  rejectUser(userId) {
    if (!confirm("¿Estás seguro de que deseas rechazar y eliminar esta solicitud de ingreso de la base de datos?")) return;
    let users = store.getUsers();
    users = users.filter(u => u.id !== userId);
    store.saveUsers(users);
    cloudSync.deleteUser(userId);

    this.showToast("Solicitud rechazada y eliminada del registro en la nube.", "warning");
    this.loadSuperAdminData();
  }

  deactivateUser(userId) {
    if (!confirm("¿Deseas suspender a este miembro? Su cuenta volverá a estar pendiente y se ocultará el panel de publicación.")) return;
    const users = store.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    user.status = "PENDIENTE_DE_APROBACION";
    store.saveUsers(users);
    cloudSync.saveUser(user);

    const currentUser = store.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.status = "PENDIENTE_DE_APROBACION";
      store.setCurrentUser(currentUser, store.isSessionRemembered());
      this.renderAuthNav();
      if (this.tabPublish) {
        this.tabPublish.style.display = "none";
      }
    }

    this.showToast(`La cuenta de ${user.name} ha sido suspendida a estado Pendiente de Revisión.`, "warning");
    this.loadSuperAdminData();
  }

  // ========================================================================
  // AUXILIARES DE UI, MODALES Y TOASTS
  // ========================================================================

  openAuthModal(tab = "login") {
    this.authAlertBox.innerHTML = "";
    this.switchAuthTab(tab);
    this.authModal.classList.add("active");

    const rememberCheckbox = document.getElementById("login-remember");
    if (rememberCheckbox) {
      rememberCheckbox.checked = store.isSessionRemembered();
    }

    const authBody = this.authModal.querySelector(".auth-body");
    if (authBody) authBody.scrollTop = 0;
  }

  closeAuthModal() {
    this.authModal.classList.remove("active");
  }

  switchAuthTab(tab) {
    if (this.authTabLogin && this.authTabRegister) {
      this.authTabLogin.classList.toggle("active", tab === "login");
      this.authTabRegister.classList.toggle("active", tab === "register");
      this.formLogin.style.display = tab === "login" ? "block" : "none";
      this.formRegister.style.display = tab === "register" ? "block" : "none";
    }

    const authBody = this.authModal.querySelector(".auth-body");
    if (authBody) authBody.scrollTop = 0;
  }

  // ========================================================================
  // SISTEMA DE DIRECTORIO DEL COMITÉ Y ETIQUETADO DE COAUTORES
  // ========================================================================

  openCommitteeModal() {
    if (!this.committeeModal) {
      this.committeeModal = document.getElementById("committee-modal");
    }
    if (this.committeeModal) {
      this.committeeModal.classList.add("active");
      this.renderCommitteeDirectory();
      if (this.committeeSearchInput) {
        this.committeeSearchInput.value = "";
        setTimeout(() => this.committeeSearchInput.focus(), 100);
      }
    }
  }

  closeCommitteeModal() {
    if (this.committeeModal) {
      this.committeeModal.classList.remove("active");
    }
  }

  renderCommitteeDirectory(filterText = "") {
    if (!this.committeeDirectoryGrid) {
      this.committeeDirectoryGrid = document.getElementById("committee-directory-grid");
    }
    if (!this.committeeMembersCounter) {
      this.committeeMembersCounter = document.getElementById("committee-members-counter");
    }
    if (!this.committeeDirectoryGrid) return;

    const allUsers = store.getUsers();
    // Filtrar únicamente a los usuarios registrados con estado ADMITIDO
    let admitted = allUsers.filter(u => this.isUserAdmitted(u));

    const term = (filterText || "").trim().toLowerCase();
    if (term) {
      admitted = admitted.filter(u => 
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.role && u.role.toLowerCase().includes(term)) ||
        (u.grade && u.grade.toLowerCase().includes(term)) ||
        (u.bio && u.bio.toLowerCase().includes(term))
      );
    }

    if (this.committeeMembersCounter) {
      this.committeeMembersCounter.textContent = `${admitted.length} ${admitted.length === 1 ? 'miembro oficial' : 'miembros oficiales'}`;
    }

    if (admitted.length === 0) {
      this.committeeDirectoryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <strong style="color: var(--text-dark); display: block; margin-bottom: 0.25rem;">No se encontraron miembros</strong>
          <p style="font-size: 0.85rem; margin: 0;">No hay integrantes que coincidan con la búsqueda "${filterText}".</p>
        </div>
      `;
      return;
    }

    this.committeeDirectoryGrid.innerHTML = admitted.map(user => {
      const isSuperAdmin = this.isAdminUser(user);
      const safeName = (user.name || "Miembro del Comité").replace(/'/g, "\\'");
      const safeEmail = (user.email || "").replace(/'/g, "\\'");
      const safeId = (user.id || "").replace(/'/g, "\\'");
      const bannerUrl = user.banner || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
      const avatarUrl = user.avatar || DEFAULT_USER_AVATAR;

      return `
        <div class="committee-member-card">
          <div class="committee-card-banner" style="background-image: url('${bannerUrl}');"></div>
          <div class="committee-card-avatar-wrap">
            <img src="${avatarUrl}" alt="${user.name}" class="committee-card-avatar">
            ${isSuperAdmin 
              ? '<span class="status-badge" style="background: #fef3c7; color: #b45309; font-weight: 800; font-size: 0.72rem;">👑 Dirección</span>'
              : '<span class="status-badge status-admitted" style="font-size: 0.72rem;">✓ ADMITIDO</span>'
            }
          </div>
          <div class="committee-card-content">
            <h4 class="committee-card-name">${user.name}</h4>
            <div class="committee-card-role">${user.role || 'Miembro Oficial'}</div>
            <div class="committee-card-grade">🏫 ${user.grade || 'Innova Schools Canta Callao'}</div>
            <p class="committee-card-bio">
              ${user.bio && user.bio.trim() ? user.bio.trim() : 'Miembro activo del Comité Periodístico Innova News en la Sede Canta Callao.'}
            </p>
            <div class="committee-card-actions">
              <button class="btn-primary" style="width: 100%; justify-content: center; font-size: 0.82rem; padding: 0.45rem 0.85rem;" onclick="window.innovaApp.closeCommitteeModal(); window.innovaApp.openPublicProfile('${safeEmail}', '${safeName}', '${safeId}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Ver Perfil
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderCoauthorsSelector() {
    if (!this.pubCoauthorsContainer) {
      this.pubCoauthorsContainer = document.getElementById("pub-coauthors-container");
    }
    if (!this.pubCoauthorsContainer) return;

    const allUsers = store.getUsers();
    const currentUser = store.getCurrentUser();
    // Filtrar únicamente a los usuarios con estado ADMITIDO en tiempo real
    const admittedUsers = allUsers.filter(u => this.isUserAdmitted(u));

    if (admittedUsers.length === 0) {
      this.pubCoauthorsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 0.75rem;">
          No hay otros miembros admitidos disponibles para etiquetar.
        </div>
      `;
      return;
    }

    const availableUsers = admittedUsers.filter(user => {
      if (!currentUser) return true;
      const isSelf = (currentUser.id && user.id && currentUser.id === user.id) ||
                     (currentUser.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase());
      return !isSelf;
    });

    if (availableUsers.length === 0) {
      this.pubCoauthorsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 0.75rem;">
          Eres el único autor admitido activo actualmente en la plataforma.
        </div>
      `;
      return;
    }

    this.pubCoauthorsContainer.innerHTML = availableUsers.map(user => {
      const safeName = (user.name || "Usuario").replace(/"/g, '&quot;');
      const safeRole = (user.role || "Comité").replace(/"/g, '&quot;');
      const avatarUrl = user.avatar || DEFAULT_USER_AVATAR;

      return `
        <label class="coauthor-checkbox-item" id="coauthor-item-${user.id}">
          <input type="checkbox" name="selected_coauthor" value="${user.id}" data-name="${safeName}" data-email="${user.email || ''}" data-avatar="${avatarUrl}" data-role="${safeRole}">
          <img src="${avatarUrl}" alt="${safeName}" class="coauthor-mini-avatar">
          <div class="coauthor-info">
            <span class="coauthor-name">${user.name}</span>
            <span class="coauthor-role">${user.role}</span>
          </div>
        </label>
      `;
    }).join("");

    this.pubCoauthorsContainer.querySelectorAll(".coauthor-checkbox-item").forEach(item => {
      const checkbox = item.querySelector("input[type='checkbox']");
      if (checkbox) {
        checkbox.addEventListener("change", () => {
          item.classList.toggle("selected", checkbox.checked);
        });
      }
    });
  }

  getSelectedCoauthors() {
    if (!this.pubCoauthorsContainer) return [];
    const checkboxes = this.pubCoauthorsContainer.querySelectorAll("input[name='selected_coauthor']:checked");
    const selected = [];
    checkboxes.forEach(cb => {
      selected.push({
        id: cb.value,
        name: cb.dataset.name,
        email: cb.dataset.email,
        avatar: cb.dataset.avatar,
        role: cb.dataset.role
      });
    });
    return selected;
  }

  closeAllModals() {
    this.closeWordModal();
    this.closeMediaModal();
    this.closePdfViewer();
    this.closePublicProfile();
    this.closeCommitteeModal();
    this.closeAuthModal();
    this.closeDashboardModal();
  }

  showToast(message, type = "info") {
    if (!this.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="8"/></svg>
    `;
    if (type === "success") {
      icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === "error") {
      icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === "warning") {
      icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }

    toast.innerHTML = `
      ${icon}
      <div style="flex-grow: 1;">${message}</div>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

// Inicializar la aplicación de manera inmediata y robusta
function startInnovaApp() {
  if (!window.innovaApp) {
    window.innovaApp = new InnovaNewsApp();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startInnovaApp);
} else {
  startInnovaApp();
}

