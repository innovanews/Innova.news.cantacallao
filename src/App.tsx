import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  Video, 
  FileText, 
  Download, 
  ExternalLink, 
  Moon, 
  Sun, 
  User, 
  LogIn, 
  LogOut, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  AlertCircle,
  Menu,
  Shield,
  Layers,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

// ============================================================================
// 1. CONFIGURACIÓN INSTITUCIONAL Y FIREBASE
// ============================================================================

const DEFAULT_USER_AVATAR = "https://i.postimg.cc/BZrDdSSJ/imagen-2026-10-30-073218985.png";
const COMMITTEE_SECRET_KEY = "INNOVA.NEWS.2026.CANTACALLAO";

const firebaseConfig = {
  apiKey: "AIzaSyDOLo3GLl1t7-Ko7hc98-YHkwV8iwWOvtk",
  authDomain: "innova-news-canta-callao.firebaseapp.com",
  projectId: "innova-news-canta-callao",
  storageBucket: "innova-news-canta-callao.firebasestorage.app",
  messagingSenderId: "616744850021",
  appId: "1:616744850021:web:3b3a307ded396bd517ac8c",
  measurementId: "G-7WN011JM27"
};

// Inicialización segura de Firebase
let db: any = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.info("Firebase inicializado previamente o en modo desconectado.");
}

// ============================================================================
// 2. DATOS LOCALES POR DEFECTO (FALLBACK DATA PARA FIREBASE)
// ============================================================================

export interface Coauthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface Article {
  id: string;
  month: 'Octubre' | 'Septiembre' | 'Agosto';
  title: string;
  author: string;
  authorEmail?: string;
  authorId?: string;
  coauthors?: Coauthor[];
  date: string;
  excerpt: string;
  content: string;
  coverUrl?: string;
  wordUrl?: string;
  pdfUrl?: string;
}

export interface MediaItem {
  id: string;
  month: 'Octubre' | 'Septiembre' | 'Agosto';
  title: string;
  mediaType: 'youtube' | 'canva' | 'direct';
  mediaUrl: string;
  coverUrl?: string;
  author: string;
  authorEmail?: string;
  authorId?: string;
  coauthors?: Coauthor[];
  date: string;
  description: string;
  credits: {
    director: string;
    camera?: string;
    editing?: string;
    collaborators?: string;
  };
  externalLink?: string;
  wordUrl?: string;
  pdfUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  grade: string;
  role: string;
  avatar: string;
  banner: string;
  bio: string;
  status: 'ADMITIDO' | 'PENDIENTE_DE_APROBACION';
  createdAt?: string;
}

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: "usr_admin_1",
    name: "Dirección Periodística (General)",
    email: "62754739@alumnos.innovaschools.edu.pe",
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
    grade: "Docente Coordinador",
    role: "Super Administrador - Coordinación General",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    bio: "Coordinación General de Medios y Audiovisual en Innova News. Impulsando coberturas en video, reportajes de investigación escolar y proyectos interactivos en Canva.",
    status: "ADMITIDO",
    createdAt: "2026-08-01T08:00:00Z"
  },
  {
    id: "usr_member_1",
    name: "Camila Sofía Morales",
    email: "camila.morales@alumnos.innovaschools.edu.pe",
    grade: "4to Secundaria",
    role: "Redactora Jefa & Cronista",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    bio: "Apasionada por la literatura, el periodismo escolar y el debate ético. Liderando la cobertura de ciencia y tecnología en Innova Schools Sede Canta Callao.",
    status: "ADMITIDO",
    createdAt: "2026-08-15T10:00:00Z"
  },
  {
    id: "usr_member_2",
    name: "Mateo Ramos Silva",
    email: "mateo.ramos@alumnos.innovaschools.edu.pe",
    grade: "5to Secundaria",
    role: "Director de Cámara y Audiovisual",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
    bio: "Realizador audiovisual escolar. Producción de cápsulas informativas para YouTube, diseño de gráficos en Canva y edición de audio institucional.",
    status: "ADMITIDO",
    createdAt: "2026-08-16T11:00:00Z"
  },
  {
    id: "usr_member_3",
    name: "Valeria Mendoza Prado",
    email: "valeria.mendoza@alumnos.innovaschools.edu.pe",
    grade: "3ro Secundaria",
    role: "Reportera de Deportes y Comunidad",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1200&q=80",
    bio: "Cronista de eventos deportivos escolares y actividades extracurriculares. Comprometida con la veracidad y el trabajo colaborativo.",
    status: "ADMITIDO",
    createdAt: "2026-08-20T14:00:00Z"
  }
];

export const DEFAULT_ARTICLES: Article[] = [
  {
    id: "art_default_1",
    month: "Octubre",
    title: "Inauguración de la Semana de Innovación y Ciencias 2026 en Canta Callao",
    author: "Camila Sofía Morales",
    authorEmail: "camila.morales@alumnos.innovaschools.edu.pe",
    authorId: "usr_member_1",
    coauthors: [
      {
        id: "usr_admin_2",
        name: "Coordinación Periodística",
        email: "76119235@alumnos.innovaschools.edu.pe",
        role: "Super Administrador - Coordinación General",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
      }
    ],
    date: "2026-10-18",
    excerpt: "Estudiantes de todos los grados de secundaria presentaron proyectos tecnológicos orientados a la sostenibilidad ambiental y la robótica escolar.",
    content: "La sede Canta Callao de Innova Schools vivió una jornada histórica durante la apertura de la Semana de Innovación y Ciencias 2026. Con la presencia de directivos, docentes y delegaciones escolares, los salones de innovación se convirtieron en centros de investigación aplicada.\n\nLos proyectos abordaron problemáticas del entorno local, destacando sistemas de filtración de agua automatizados mediante sensores Arduino y aplicaciones móviles de reciclaje inteligente. En palabras de la coordinación pedagógica: 'El objetivo primordial es cultivar la curiosidad rigurosa y demostrar que la tecnología puede resolver desafíos cotidianos'.\n\nEl comité periodístico realizó una cobertura exhaustiva recopilando testimonios y proyectos destacados que serán publicados en la presente edición escolar.",
    coverUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    wordUrl: "https://file-examples.com/wp-content/storage/2017/02/file-sample_100kB.doc",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "art_default_2",
    month: "Octubre",
    title: "Torneo de Debate Escolar: Pensamiento Crítico y Retórica en Secundaria",
    author: "Diego Alonso Vargas",
    authorEmail: "62754739@alumnos.innovaschools.edu.pe",
    authorId: "usr_admin_1",
    coauthors: [
      {
        id: "usr_member_1",
        name: "Camila Sofía Morales",
        email: "camila.morales@alumnos.innovaschools.edu.pe",
        role: "Redactora Jefa & Cronista",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
      }
    ],
    date: "2026-10-10",
    excerpt: "El equipo de 4to de secundaria se coronó campeón tras una final electrizante en torno a la ética de la inteligencia artificial en la educación.",
    content: "La argumentación fundamentada y la oratoria persuasiva fueron las protagonistas del Torneo Anual de Debate Interaulas 2026. Durante tres jornadas intensas, los estudiantes debatieron mociones complejas respetando tiempos reglamentarios y estructuras de contra-argumentación formal.\n\nLa mesa de jueces elogió la madurez conceptual de las exposiciones y el uso prolijo de evidencias estadísticas.",
    coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    wordUrl: "https://file-examples.com/wp-content/storage/2017/02/file-sample_100kB.doc",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    id: "art_default_3",
    month: "Septiembre",
    title: "Olimpiadas Deportivas 2026: Celebración del Talento y Confraternidad Escolar",
    author: "Valeria Mendoza Prado",
    authorEmail: "valeria.mendoza@alumnos.innovaschools.edu.pe",
    authorId: "usr_member_3",
    date: "2026-09-24",
    excerpt: "Más de 600 alumnos compitieron en atletismo, vóleibol y básquetbol en una fiesta de juego limpio y espíritu de superación.",
    content: "Con una ceremonia llena de color y banderas representativas de cada sección, las Olimpiadas Deportivas Canta Callao 2026 marcaron el cierre del mes de la primavera. El evento promovió hábitos saludables y respeto recíproco dentro y fuera del campo deportivo.",
    coverUrl: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80",
    wordUrl: "https://file-examples.com/wp-content/storage/2017/02/file-sample_100kB.doc"
  },
  {
    id: "art_default_4",
    month: "Agosto",
    title: "Comienzo del Segundo Semestre: Metas Académicas y Talleres Artísticos",
    author: "Dirección Periodística (General)",
    authorEmail: "62754739@alumnos.innovaschools.edu.pe",
    authorId: "usr_admin_1",
    date: "2026-08-14",
    excerpt: "Innova Schools inicia la segunda mitad del ciclo 2026 con nuevas metodologías de aprendizaje activo y fortalecimiento del periódico escolar.",
    content: "La comunidad educativa de Canta Callao renovó sus compromisos de excelencia académica y participación ciudadana. Se anunciaron nuevos espacios para la práctica teatral, periodística y de programación.",
    coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    wordUrl: "https://file-examples.com/wp-content/storage/2017/02/file-sample_100kB.doc"
  }
];

export const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: "med_default_1",
    month: "Octubre",
    title: "Reportaje Especial: Cápsula Informativa de Octubre en Sede Canta Callao",
    mediaType: "youtube",
    mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    coverUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
    author: "Mateo Ramos Silva",
    authorEmail: "mateo.ramos@alumnos.innovaschools.edu.pe",
    authorId: "usr_member_2",
    coauthors: [
      {
        id: "usr_member_1",
        name: "Camila Sofía Morales",
        email: "camila.morales@alumnos.innovaschools.edu.pe",
        role: "Redactora Jefa & Cronista",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
      }
    ],
    date: "2026-10-20",
    description: "Recorrido en video por las aulas de ciencias, entrevistas a coordinadores y el resumen audiovisual de las actividades institucionales.",
    credits: {
      director: "Mateo Ramos Silva",
      camera: "Comité Audiovisual",
      editing: "Innova News Canta Callao",
      collaborators: "Alumnos de 4to y 5to de Secundaria"
    },
    externalLink: "https://www.youtube.com"
  },
  {
    id: "med_default_2",
    month: "Octubre",
    title: "Infografía Interactiva Canva: Decálogo del Buen Periodismo Escolar",
    mediaType: "canva",
    mediaUrl: "https://www.canva.com",
    coverUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    author: "Camila Sofía Morales",
    authorEmail: "camila.morales@alumnos.innovaschools.edu.pe",
    authorId: "usr_member_1",
    date: "2026-10-15",
    description: "Diseño interactivo con pautas deontológicas, verificación de fuentes y recomendaciones para reporteros escolares noveles.",
    credits: {
      director: "Camila Morales",
      camera: "Diseño Multimedia",
      editing: "Canva Pro Innova",
      collaborators: "Equipo de Redacción"
    },
    externalLink: "https://www.canva.com"
  },
  {
    id: "med_default_3",
    month: "Septiembre",
    title: "Cápsula Audiovisual: Mejores Jugadas de las Olimpiadas 2026",
    mediaType: "youtube",
    mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    coverUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    author: "Mateo Ramos Silva",
    authorEmail: "mateo.ramos@alumnos.innovaschools.edu.pe",
    authorId: "usr_member_2",
    date: "2026-09-25",
    description: "Tomas en cámara lenta y narración deportiva de los encuentros finales en básquetbol y vóleibol interaulas.",
    credits: {
      director: "Mateo Ramos",
      camera: "Comité Audiovisual",
      editing: "Innova News",
      collaborators: "Docentes de Educación Física"
    },
    externalLink: "https://www.youtube.com"
  }
];

export const DEFAULT_ABOUT_PHOTOS = {
  redaccion: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=80",
  audiovisual: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=700&q=80",
  equipo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80"
};

// ============================================================================
// 3. COMPONENTE PRINCIPAL APP
// ============================================================================

export default function App() {
  // Estados de navegación y vistas principales (useState)
  const [activeSection, setActiveSection] = useState<'inicio' | 'ediciones' | 'sobre-nosotros' | 'comite'>('inicio');
  const [selectedMonth, setSelectedMonth] = useState<'Octubre' | 'Septiembre' | 'Agosto'>('Octubre');
  const [selectedCategory, setSelectedCategory] = useState<'redaccion' | 'audiovisual'>('redaccion');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem("innova_news_theme");
      return (saved === 'dark' || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Estados de modales
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPublicProfileOpen, setIsPublicProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Elementos activos seleccionados
  const [activeArticle, setActiveArticle] = useState<Article | null>(DEFAULT_ARTICLES[0]);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [activeProfileUser, setActiveProfileUser] = useState<UserProfile | null>(DEFAULT_USERS[0]);
  const [committeeSearch, setCommitteeSearch] = useState('');

  // Colecciones reactivas con fallback data
  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const cached = localStorage.getItem("innova_news_articles_v5");
      return cached ? JSON.parse(cached) : DEFAULT_ARTICLES;
    } catch {
      return DEFAULT_ARTICLES;
    }
  });

  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    try {
      const cached = localStorage.getItem("innova_news_media_v5");
      return cached ? JSON.parse(cached) : DEFAULT_MEDIA;
    } catch {
      return DEFAULT_MEDIA;
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const cached = localStorage.getItem("innova_news_users_v5");
      return cached ? JSON.parse(cached) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const session = sessionStorage.getItem("innova_news_current_user_v5") || localStorage.getItem("innova_news_remember_user_v5");
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  });

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sincronización de tema claro/oscuro
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("innova_news_theme", theme);
  }, [theme]);

  // Sincronización en tiempo real con Firebase Firestore con fallback elegante
  useEffect(() => {
    if (!db) return;

    // 1. Escuchar artículos en tiempo real
    let unsubArticles: (() => void) | undefined;
    try {
      unsubArticles = onSnapshot(collection(db, "articles"), (snap) => {
        if (!snap.empty) {
          const cloudArticles: Article[] = [];
          snap.forEach(d => cloudArticles.push({ ...(d.data() as Article), id: d.id }));
          cloudArticles.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
          setArticles(cloudArticles);
          localStorage.setItem("innova_news_articles_v5", JSON.stringify(cloudArticles));
        }
      }, (err) => {
        console.warn("Firestore articles usando datos locales:", err.message);
      });
    } catch (e) {
      console.warn("Conexión Firestore articles offline:", e);
    }

    // 2. Escuchar producciones multimedia en tiempo real
    let unsubMedia: (() => void) | undefined;
    try {
      unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
        if (!snap.empty) {
          const cloudMedia: MediaItem[] = [];
          snap.forEach(d => cloudMedia.push({ ...(d.data() as MediaItem), id: d.id }));
          cloudMedia.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
          setMediaList(cloudMedia);
          localStorage.setItem("innova_news_media_v5", JSON.stringify(cloudMedia));
        }
      }, (err) => {
        console.warn("Firestore media usando datos locales:", err.message);
      });
    } catch (e) {
      console.warn("Conexión Firestore media offline:", e);
    }

    // 3. Escuchar usuarios y comité en tiempo real
    let unsubUsers: (() => void) | undefined;
    try {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        if (!snap.empty) {
          const cloudUsers: UserProfile[] = [];
          snap.forEach(d => cloudUsers.push({ ...(d.data() as UserProfile), id: d.id }));
          
          // Asegurar siempre las cuentas de los administradores oficiales
          DEFAULT_USERS.slice(0, 2).forEach(admin => {
            if (!cloudUsers.some(u => u.email.toLowerCase() === admin.email.toLowerCase())) {
              cloudUsers.unshift(admin);
            }
          });

          setUsers(cloudUsers);
          localStorage.setItem("innova_news_users_v5", JSON.stringify(cloudUsers));
        }
      }, (err) => {
        console.warn("Firestore users usando datos locales:", err.message);
      });
    } catch (e) {
      console.warn("Conexión Firestore users offline:", e);
    }

    return () => {
      if (unsubArticles) unsubArticles();
      if (unsubMedia) unsubMedia();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Artículo destacado del mes seleccionado
  const featuredArticle = useMemo(() => {
    return articles.find(a => a.month === selectedMonth) || articles[0] || DEFAULT_ARTICLES[0];
  }, [articles, selectedMonth]);

  // Artículos filtrados por mes
  const filteredArticles = useMemo(() => {
    return articles.filter(a => a.month === selectedMonth);
  }, [articles, selectedMonth]);

  // Multimedia filtrada por mes
  const filteredMedia = useMemo(() => {
    return mediaList.filter(m => m.month === selectedMonth);
  }, [mediaList, selectedMonth]);

  // Miembros admitidos del comité
  const admittedMembers = useMemo(() => {
    const list = users.filter(u => u.status === 'ADMITIDO');
    if (!committeeSearch.trim()) return list;
    const term = committeeSearch.toLowerCase();
    return list.filter(u => 
      u.name.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      u.grade.toLowerCase().includes(term) ||
      (u.bio && u.bio.toLowerCase().includes(term))
    );
  }, [users, committeeSearch]);

  // Manejador para abrir perfil público
  const handleOpenProfile = (email?: string, name?: string, id?: string) => {
    const found = users.find(u => 
      (id && u.id === id) || 
      (email && u.email.toLowerCase() === email.toLowerCase()) ||
      (name && u.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (found) {
      setActiveProfileUser(found);
    } else {
      setActiveProfileUser({
        id: id || "temp_" + Date.now(),
        name: name || "Autor de Innova News",
        email: email || "comite@alumnos.innovaschools.edu.pe",
        grade: "Sede Canta Callao",
        role: "Miembro del Comité Periodístico",
        avatar: DEFAULT_USER_AVATAR,
        banner: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        bio: "Colaborador del Comité Periodístico Innova News en Innova Schools Sede Canta Callao.",
        status: "ADMITIDO"
      });
    }
    setIsPublicProfileOpen(true);
  };

  // Trabajos de un autor para su perfil público
  const profileAuthorWorks = useMemo(() => {
    if (!activeProfileUser) return [];
    return [
      ...articles.filter(a => 
        (a.authorEmail && a.authorEmail.toLowerCase() === activeProfileUser.email.toLowerCase()) ||
        (a.authorId && a.authorId === activeProfileUser.id) ||
        (a.author && a.author.toLowerCase().includes(activeProfileUser.name.toLowerCase())) ||
        (a.coauthors && a.coauthors.some(c => c.id === activeProfileUser.id || c.email.toLowerCase() === activeProfileUser.email.toLowerCase()))
      ).map(a => ({ ...a, itemType: 'redaccion' as const })),
      ...mediaList.filter(m => 
        (m.authorEmail && m.authorEmail.toLowerCase() === activeProfileUser.email.toLowerCase()) ||
        (m.authorId && m.authorId === activeProfileUser.id) ||
        (m.credits?.director && m.credits.director.toLowerCase().includes(activeProfileUser.name.toLowerCase())) ||
        (m.coauthors && m.coauthors.some(c => c.id === activeProfileUser.id || c.email.toLowerCase() === activeProfileUser.email.toLowerCase()))
      ).map(m => ({ ...m, itemType: 'audiovisual' as const }))
    ];
  }, [activeProfileUser, articles, mediaList]);

  // Simulación de descarga de documento Word
  const handleDownloadWord = (article: Article) => {
    if (article.wordUrl && article.wordUrl.startsWith("http")) {
      window.open(article.wordUrl, "_blank");
      showToast(`Descargando archivo oficial de: ${article.title}`, "success");
      return;
    }
    const blobContent = `
================================================================================
INNOVA NEWS - PLATAFORMA OFICIAL DEL COMITÉ PERIODÍSTICO
Innova Schools - Sede Canta Callao (Año Académico 2026)
================================================================================

TÍTULO: ${article.title}
EDICIÓN: ${article.month} 2026
FECHA DE EMISIÓN: ${article.date}
AUTOR(ES): ${article.author}
${article.coauthors ? `COLABORADORES: ${article.coauthors.map(c => c.name).join(", ")}` : ""}

--------------------------------------------------------------------------------
RESUMEN:
${article.excerpt}

--------------------------------------------------------------------------------
CONTENIDO DEL ARTÍCULO:
${article.content}

--------------------------------------------------------------------------------
Órgano Periodístico Escolar de Innova Schools - Sede Canta Callao.
    `;
    const blob = new Blob([blobContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${article.title.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Documento Word generado y descargado con éxito.`, "success");
  };

  return (
    <div className="min-h-screen flex flex-col bg-main text-dark transition-colors duration-200">
      
      {/* 1. BARRA DE ANUNCIO SUPERIOR INSTITUCIONAL */}
      <div className="top-notice-bar">
        <span>COMUNICADO OFICIAL</span> Órgano Periodístico Escolar de Innova Schools • Sede Canta Callao • Año Académico 2026
      </div>

      {/* 2. NAVEGACIÓN PRINCIPAL */}
      <header className="site-header sticky top-0 z-40 bg-card border-b border-color">
        <div className="container navbar flex items-center justify-between py-3">
          <a 
            href="#inicio" 
            className="brand-wrapper flex items-center gap-3 no-underline"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('inicio');
              document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <img 
              src="logo-innova-news.png" 
              alt="Innova News Logo" 
              className="logo-site w-10 h-10 object-contain rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const badge = document.getElementById('brand-fallback-badge-react');
                if (badge) badge.style.display = 'flex';
              }} 
            />
            <div id="brand-fallback-badge-react" className="brand-logo-badge hidden w-10 h-10 bg-sky-600 text-white font-extrabold rounded items-center justify-center">
              IN
            </div>
            <div className="brand-text">
              <h1 className="text-xl font-extrabold m-0 leading-tight">
                INNOVA <span className="news-tag text-orange-500">NEWS</span>
              </h1>
              <p className="text-xs text-muted m-0 tracking-wider">SEDE CANTA CALLAO • COMITÉ OFICIAL</p>
            </div>
          </a>

          {/* Menú de Navegación con verificación activa de useState */}
          <ul className={`nav-links flex items-center gap-6 m-0 p-0 list-none ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li>
              <a 
                href="#inicio" 
                className={`nav-link ${activeSection === 'inicio' ? 'active font-bold text-sky-600' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('inicio');
                  setIsMobileMenuOpen(false);
                  document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Inicio
              </a>
            </li>
            <li>
              <a 
                href="#ediciones" 
                className={`nav-link ${activeSection === 'ediciones' ? 'active font-bold text-sky-600' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('ediciones');
                  setIsMobileMenuOpen(false);
                  document.getElementById('ediciones')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ediciones <span className="nav-badge-pill ml-1">Octubre 2026</span>
              </a>
            </li>
            <li>
              <a 
                href="#sobre-nosotros" 
                className={`nav-link ${activeSection === 'sobre-nosotros' ? 'active font-bold text-sky-600' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection('sobre-nosotros');
                  setIsMobileMenuOpen(false);
                  document.getElementById('sobre-nosotros')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Sobre Nosotros
              </a>
            </li>
            <li>
              <button 
                type="button" 
                className="nav-link nav-btn-link cursor-pointer flex items-center gap-1.5"
                onClick={() => {
                  setActiveSection('comite');
                  setIsCommitteeModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                title="Ver Directorio del Comité Periodístico"
              >
                <Users className="w-4 h-4 text-sky-600" />
                <span>Ver Comité</span>
              </button>
            </li>
          </ul>

          <div className="nav-actions flex items-center gap-3">
            {/* Interruptor de tema (Modo Oscuro / Claro) */}
            <button 
              className="theme-toggle-btn cursor-pointer p-2 rounded-full border border-color flex items-center gap-1.5"
              type="button"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar tema claro/oscuro"
              title={`Cambiar a Modo ${theme === 'dark' ? 'Claro' : 'Oscuro'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-700" />}
              <span className="text-xs font-semibold">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
            </button>

            {/* Acceso de equipo / perfil */}
            <button 
              className="btn-primary cursor-pointer flex items-center gap-1.5 text-sm py-2 px-3 rounded"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <LogIn className="w-4 h-4" />
              <span>Acceso Equipo</span>
            </button>

            {/* Botón hamburguesa móvil */}
            <button 
              className="mobile-menu-btn md:hidden p-2 rounded cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. SECCIÓN HERO / PORTADA PRINCIPAL */}
      <section className="hero-section py-12 border-b border-color" id="inicio">
        <div className="container hero-grid grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="hero-text-col lg:col-span-7 space-y-5">
            <div className="hero-tag inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              <span className="pulse-dot w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Edición Central de Octubre 2026 en Circulación</span>
            </div>

            <h2 className="hero-title text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              La voz, las ideas y el talento de <span className="highlight-green text-emerald-600">Innova Schools</span> <span className="highlight-orange text-orange-500">Canta Callao</span>
            </h2>

            <p className="hero-description text-base text-muted leading-relaxed">
              Innova News es una plataforma web oficial desarrollada por estudiantes y para estudiantes de Innova Schools Sede Canta Callao. Nuestro comité periodístico está dirigido actualmente por la profesora Patricia Ocaña, promoviendo la libre expresión, la investigación y el talento audiovisual escolar.
            </p>

            {/* BOTONES CON CAMBIO EXPLÍCITO DE ESTADO (USESTATE) */}
            <div className="hero-cta-group flex flex-wrap gap-4 pt-2">
              <button 
                type="button" 
                className="btn-primary cursor-pointer flex items-center gap-2 py-3 px-5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  setActiveSection('ediciones');
                  setSelectedCategory('redaccion');
                  document.getElementById('ediciones')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <BookOpen className="w-5 h-5" />
                <span>Explorar Ediciones 2026</span>
              </button>

              <button 
                type="button" 
                className="btn-outline-sky cursor-pointer flex items-center gap-2 py-3 px-5 rounded-lg font-bold border border-sky-400 text-sky-700 hover:bg-sky-50 transition-all"
                onClick={() => {
                  setActiveSection('sobre-nosotros');
                  document.getElementById('sobre-nosotros')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Users className="w-5 h-5" />
                <span>Conoce al Equipo</span>
              </button>
            </div>
          </div>

          {/* Tarjeta Spotlight destacada */}
          <div className="hero-spotlight-col lg:col-span-5">
            <div className="hero-spotlight-card bg-card rounded-2xl shadow-lg border border-color overflow-hidden">
              <div className="spotlight-media relative h-52 overflow-hidden bg-slate-900">
                <img 
                  src={featuredArticle.coverUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"} 
                  alt={featuredArticle.title} 
                  className="w-full h-full object-cover"
                />
                <span className="spotlight-badge absolute top-3 left-3 bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  ⭐ Nota Destacada del Mes
                </span>
              </div>

              <div className="spotlight-content p-6 space-y-3">
                <div className="spotlight-meta flex items-center justify-between text-xs text-muted">
                  <span className="category-pill font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                    Hemeroteca {featuredArticle.month} 2026
                  </span>
                  <span>📅 {featuredArticle.date}</span>
                </div>

                <h3 className="spotlight-title text-lg font-bold text-dark leading-snug">
                  {featuredArticle.title}
                </h3>

                <p className="spotlight-excerpt text-xs text-muted line-clamp-3">
                  {featuredArticle.excerpt}
                </p>

                {/* Coautores en Spotlight */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <span 
                    className="font-bold text-sky-800 cursor-pointer hover:underline"
                    onClick={() => handleOpenProfile(featuredArticle.authorEmail, featuredArticle.author, featuredArticle.authorId)}
                  >
                    ✍️ {featuredArticle.author}
                  </span>
                  {featuredArticle.coauthors && featuredArticle.coauthors.map(c => (
                    <span 
                      key={c.id} 
                      className="coauthor-badge-link flex items-center gap-1 cursor-pointer"
                      onClick={() => handleOpenProfile(c.email, c.name, c.id)}
                    >
                      <img src={c.avatar || DEFAULT_USER_AVATAR} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{c.name}</span>
                    </span>
                  ))}
                </div>

                {/* Acciones de lectura y descarga */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-color">
                  <button 
                    className="btn-read-word flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded bg-sky-600 text-white cursor-pointer"
                    onClick={() => {
                      setActiveArticle(featuredArticle);
                      setIsWordModalOpen(true);
                    }}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Visor Word</span>
                  </button>

                  <button 
                    className="btn-download-word flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded border border-color cursor-pointer text-muted hover:text-dark"
                    onClick={() => handleDownloadWord(featuredArticle)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .doc</span>
                  </button>

                  {featuredArticle.pdfUrl && (
                    <button 
                      className="btn-read-pdf flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded bg-red-600 text-white cursor-pointer"
                      onClick={() => {
                        setActiveArticle(featuredArticle);
                        setIsPdfModalOpen(true);
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Leer PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN EDICIONES Y CONTENIDOS (AGOSTO, SEPTIEMBRE, OCTUBRE) */}
      <section className="ediciones-section py-16" id="ediciones">
        <div className="container space-y-8">
          
          <div className="section-header text-center max-w-2xl mx-auto space-y-2">
            <span className="section-badge inline-block text-xs font-extrabold uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
              Hemeroteca Escolar Digital
            </span>
            <h2 className="section-title text-3xl font-extrabold">Ediciones del Comité 2026</h2>
            <p className="section-subtitle text-sm text-muted">
              Selecciona el mes que deseas consultar y navega entre los artículos redactados estilo Word o los reportajes y diseños audiovisuales interactivos.
            </p>
          </div>

          {/* Selector de Meses con useState */}
          <div className="month-selector-bar flex justify-center gap-3 flex-wrap">
            {(['Agosto', 'Septiembre', 'Octubre'] as const).map(month => (
              <button 
                key={month}
                type="button"
                className={`month-tab-btn cursor-pointer py-2 px-5 rounded-full font-bold transition-all ${selectedMonth === month ? 'active bg-sky-600 text-white shadow' : 'bg-subtle text-muted hover:bg-sky-50'}`}
                onClick={() => setSelectedMonth(month)}
              >
                <span>📅 {month} 2026</span>
                {month === 'Octubre' && <span className="badge-current ml-2 text-xs bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">Mes Actual ★</span>}
              </button>
            ))}
          </div>

          {/* Selector de Categoría (Redacción / Audiovisual) con useState */}
          <div className="category-filter-bar flex justify-center">
            <div className="category-switch inline-flex p-1 bg-subtle rounded-xl border border-color">
              <button 
                type="button"
                className={`category-btn flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-bold cursor-pointer transition-all ${selectedCategory === 'redaccion' ? 'active bg-white text-sky-700 shadow-sm' : 'text-muted'}`}
                onClick={() => setSelectedCategory('redaccion')}
              >
                <FileText className="w-4 h-4" />
                <span>Redacción Periodística (Word .docx)</span>
              </button>
              <button 
                type="button"
                className={`category-btn flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-bold cursor-pointer transition-all ${selectedCategory === 'audiovisual' ? 'active bg-white text-emerald-700 shadow-sm' : 'text-muted'}`}
                onClick={() => setSelectedCategory('audiovisual')}
              >
                <Video className="w-4 h-4" />
                <span>Audiovisual & Diseños Canva</span>
              </button>
            </div>
          </div>

          {/* CONTENEDOR DINÁMICO DE TARJETAS */}
          <div className="content-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            
            {/* Categoría Redacción */}
            {selectedCategory === 'redaccion' && (
              filteredArticles.length > 0 ? (
                filteredArticles.map(art => (
                  <article key={art.id} className="article-card bg-card rounded-xl border border-color shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="article-card-cover relative h-48 overflow-hidden bg-slate-100">
                      <img 
                        src={art.coverUrl || "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=80"} 
                        alt={art.title} 
                        className="w-full h-full object-cover"
                      />
                      <span className="article-card-badge absolute top-3 left-3 bg-sky-900/80 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {art.month} 2026
                      </span>
                      <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
                        <span className="article-word-badge text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                          .DOCX
                        </span>
                        {art.pdfUrl && (
                          <span className="article-word-badge text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                            .PDF
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="article-card-body p-5 flex flex-col flex-1 space-y-3">
                      <div className="article-meta-row flex items-center justify-between text-xs text-muted">
                        <span 
                          className="author-name author-interactive font-bold text-sky-700 cursor-pointer hover:underline"
                          onClick={() => handleOpenProfile(art.authorEmail, art.author, art.authorId)}
                          title="Ver perfil del autor"
                        >
                          ✍️ {art.author}
                        </span>
                        <span>📅 {art.date}</span>
                      </div>

                      {/* Coautores en tarjeta */}
                      {art.coauthors && art.coauthors.length > 0 && (
                        <div className="coauthors-row flex flex-wrap gap-1 text-[11px] items-center">
                          <span className="text-muted">Colaboradores:</span>
                          {art.coauthors.map(c => (
                            <span 
                              key={c.id} 
                              className="coauthor-badge-link cursor-pointer"
                              onClick={() => handleOpenProfile(c.email, c.name, c.id)}
                            >
                              <img src={c.avatar || DEFAULT_USER_AVATAR} alt={c.name} className="w-3.5 h-3.5 rounded-full inline mr-1" />
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3 className="article-card-title text-base font-bold text-dark leading-snug">
                        {art.title}
                      </h3>

                      <p className="article-card-excerpt text-xs text-muted line-clamp-3 flex-1">
                        {art.excerpt}
                      </p>

                      <div className="article-card-footer flex flex-wrap gap-2 pt-3 border-t border-color mt-auto">
                        <button 
                          className="btn-read-word flex items-center gap-1 py-1 px-2.5 text-xs font-bold rounded bg-sky-600 text-white cursor-pointer"
                          onClick={() => {
                            setActiveArticle(art);
                            setIsWordModalOpen(true);
                          }}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Visor Word</span>
                        </button>

                        <button 
                          className="btn-download-word flex items-center gap-1 py-1 px-2.5 text-xs font-bold rounded border border-color cursor-pointer text-muted hover:text-dark"
                          onClick={() => handleDownloadWord(art)}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Word</span>
                        </button>

                        {art.pdfUrl && (
                          <button 
                            className="btn-read-pdf flex items-center gap-1 py-1 px-2.5 text-xs font-bold rounded bg-red-600 text-white cursor-pointer"
                            onClick={() => {
                              setActiveArticle(art);
                              setIsPdfModalOpen(true);
                            }}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Leer PDF</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-card rounded-xl border border-dashed border-color text-muted">
                  <FileText className="w-12 h-12 mx-auto text-sky-400 mb-2 opacity-60" />
                  <p className="text-base font-bold text-dark">No hay artículos de redacción para {selectedMonth} 2026</p>
                  <p className="text-xs">Los artículos redactados para este mes se mostrarán automáticamente en tiempo real.</p>
                </div>
              )
            )}

            {/* Categoría Audiovisual */}
            {selectedCategory === 'audiovisual' && (
              filteredMedia.length > 0 ? (
                filteredMedia.map(item => (
                  <article key={item.id} className="media-card bg-card rounded-xl border border-color shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="media-card-player-container relative h-48 overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img 
                        src={item.coverUrl || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=700&q=80"} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                      <span className="media-card-badge absolute top-3 left-3 bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {item.mediaType === 'canva' ? '🎨 Diseño Canva' : '🎬 Audiovisual Innova'}
                      </span>
                    </div>

                    <div className="media-card-body p-5 flex flex-col flex-1 space-y-3">
                      <h3 className="media-card-title text-base font-bold text-dark leading-snug">
                        {item.title}
                      </h3>

                      <p className="media-card-description text-xs text-muted line-clamp-3">
                        {item.description}
                      </p>

                      <div className="media-credits-box p-3 bg-subtle rounded-lg text-xs space-y-1">
                        <div className="credits-title font-bold text-sky-800 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Ficha Técnica & Créditos:</span>
                        </div>
                        <div>
                          <span className="text-muted">Dirección: </span>
                          <span 
                            className="font-bold text-sky-700 cursor-pointer hover:underline"
                            onClick={() => handleOpenProfile(item.authorEmail, item.credits?.director || item.author, item.authorId)}
                          >
                            {item.credits?.director || item.author}
                          </span>
                        </div>
                        {item.credits?.camera && <div><span className="text-muted">Cámara: </span>{item.credits.camera}</div>}
                        
                        {item.coauthors && item.coauthors.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1 items-center">
                            <span className="text-muted">Coautores:</span>
                            {item.coauthors.map(c => (
                              <span 
                                key={c.id} 
                                className="coauthor-badge-link cursor-pointer"
                                onClick={() => handleOpenProfile(c.email, c.name, c.id)}
                              >
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="media-card-footer flex flex-wrap gap-2 pt-3 border-t border-color mt-auto">
                        <a 
                          href={item.externalLink || item.mediaUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-open-external flex items-center gap-1 py-1 px-3 text-xs font-bold rounded bg-emerald-600 text-white cursor-pointer no-underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ver en {item.mediaType === 'canva' ? 'Canva' : 'YouTube'}</span>
                        </a>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-card rounded-xl border border-dashed border-color text-muted">
                  <Video className="w-12 h-12 mx-auto text-emerald-400 mb-2 opacity-60" />
                  <p className="text-base font-bold text-dark">No hay videos ni diseños en {selectedMonth} 2026</p>
                  <p className="text-xs">Las cápsulas informativas y reportajes se publicarán en el cierre del mes.</p>
                </div>
              )
            )}

          </div>

        </div>
      </section>

      {/* 5. SECCIÓN SOBRE NOSOTROS Y COMITÉS */}
      <section className="about-section py-16 bg-subtle border-t border-color" id="sobre-nosotros">
        <div className="container space-y-10">
          
          <div className="section-header text-center max-w-2xl mx-auto space-y-2">
            <span className="section-badge inline-block text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Nuestra Comunidad y Vocación
            </span>
            <h2 className="section-title text-3xl font-extrabold">Sobre Innova News</h2>
            <p className="section-subtitle text-sm text-muted">
              Conoce a los equipos estudiantiles que lideran la cobertura informativa, el análisis de opinión y la creatividad multimedia en Innova Schools Sede Canta Callao.
            </p>
          </div>

          <div className="about-intro-box bg-card p-8 rounded-2xl shadow-sm border border-color space-y-4">
            <h3 className="text-xl font-bold text-sky-900">Misión Periodística y Formativa</h3>
            <p className="text-sm text-muted leading-relaxed">
              Innova News nació en la sede Canta Callao como un espacio formativo e independiente de expresión estudiantil, fundamentado en la búsqueda rigurosa de la verdad, el desarrollo del pensamiento crítico, la alfabetización mediática y la celebración del talento de nuestra comunidad escolar.
            </p>
            <div className="values-chips flex flex-wrap gap-2 pt-2">
              <span className="value-chip text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">✓ Veracidad y Verificación</span>
              <span className="value-chip text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">✓ Creatividad Multimedia</span>
              <span className="value-chip text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">✓ Ética Escolar</span>
              <span className="value-chip text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">✓ Trabajo Colaborativo</span>
              <span className="value-chip text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200">✓ Orgullo Canta Callao</span>
            </div>
          </div>

          <div className="committees-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Tarjeta 1: Comité de Redacción */}
            <div className="committee-card bg-card rounded-xl border border-color overflow-hidden shadow-sm flex flex-col">
              <div className="committee-photo-placeholder relative h-48 bg-slate-100">
                <img src={DEFAULT_ABOUT_PHOTOS.redaccion} alt="Comité de Redacción" className="w-full h-full object-cover" />
                <span className="committee-tag-overlay absolute bottom-2 left-2 bg-sky-900/80 text-white text-xs px-2.5 py-0.5 rounded font-bold">
                  Redacción Escrita
                </span>
              </div>
              <div className="committee-body p-5 flex flex-col flex-1 space-y-3">
                <h3 className="committee-title text-lg font-bold text-dark">Comité de Redacción</h3>
                <p className="committee-desc text-xs text-muted leading-relaxed">
                  Encargados de redactar crónicas, entrevistas en profundidad, reportajes de investigación escolar y notas de opinión con estructura periodística formal.
                </p>
                <ul className="committee-roles-list text-xs text-muted space-y-1 pt-2 border-t border-color mt-auto list-none p-0">
                  <li><span className="text-sky-600 font-bold mr-1">●</span> Crónicas y Notas de Opinión</li>
                  <li><span className="text-sky-600 font-bold mr-1">●</span> Corrección de Estilo y Ortografía</li>
                  <li><span className="text-sky-600 font-bold mr-1">●</span> Maquetación en Microsoft Word</li>
                </ul>
              </div>
            </div>

            {/* Tarjeta 2: Comité Audiovisual */}
            <div className="committee-card bg-card rounded-xl border border-color overflow-hidden shadow-sm flex flex-col">
              <div className="committee-photo-placeholder relative h-48 bg-slate-100">
                <img src={DEFAULT_ABOUT_PHOTOS.audiovisual} alt="Comité Audiovisual" className="w-full h-full object-cover" />
                <span className="committee-tag-overlay absolute bottom-2 left-2 bg-emerald-900/80 text-white text-xs px-2.5 py-0.5 rounded font-bold">
                  Producción & Canva
                </span>
              </div>
              <div className="committee-body p-5 flex flex-col flex-1 space-y-3">
                <h3 className="committee-title text-lg font-bold text-dark">Comité Audiovisual</h3>
                <p className="committee-desc text-xs text-muted leading-relaxed">
                  Responsables de la captura en video de los eventos institucionales, producción de reels informativos, locución y diseño de infografías interactivas en Canva.
                </p>
                <ul className="committee-roles-list text-xs text-muted space-y-1 pt-2 border-t border-color mt-auto list-none p-0">
                  <li><span className="text-emerald-600 font-bold mr-1">●</span> Grabación de Cápsulas y Entrevistas</li>
                  <li><span className="text-emerald-600 font-bold mr-1">●</span> Edición de Video, Efectos y Sonido</li>
                  <li><span className="text-emerald-600 font-bold mr-1">●</span> Diseños Interactivos en Canva</li>
                </ul>
              </div>
            </div>

            {/* Tarjeta 3: Dirección General */}
            <div className="committee-card bg-card rounded-xl border border-color overflow-hidden shadow-sm flex flex-col">
              <div className="committee-photo-placeholder relative h-48 bg-slate-100">
                <img src={DEFAULT_ABOUT_PHOTOS.equipo} alt="Dirección General" className="w-full h-full object-cover" />
                <span className="committee-tag-overlay absolute bottom-2 left-2 bg-amber-900/80 text-white text-xs px-2.5 py-0.5 rounded font-bold">
                  Equipo General & Dirección
                </span>
              </div>
              <div className="committee-body p-5 flex flex-col flex-1 space-y-3">
                <h3 className="committee-title text-lg font-bold text-dark">Dirección y Coordinación</h3>
                <p className="committee-desc text-xs text-muted leading-relaxed">
                  Liderado por la profesora Patricia Ocaña y la coordinación escolar para guiar el calendario editorial, moderar debates y asegurar el rigor periodístico.
                </p>
                <ul className="committee-roles-list text-xs text-muted space-y-1 pt-2 border-t border-color mt-auto list-none p-0">
                  <li><span className="text-amber-600 font-bold mr-1">●</span> Supervisión Editorial y Ética</li>
                  <li><span className="text-amber-600 font-bold mr-1">●</span> Convocatorias y Admisión de Miembros</li>
                  <li><span className="text-amber-600 font-bold mr-1">●</span> Representación Institucional</li>
                </ul>
              </div>
            </div>

          </div>

          <div className="text-center pt-4">
            <button 
              className="btn-primary inline-flex items-center gap-2 py-3 px-6 rounded-xl font-bold cursor-pointer shadow hover:shadow-md"
              onClick={() => {
                setActiveSection('comite');
                setIsCommitteeModalOpen(true);
              }}
            >
              <Users className="w-5 h-5" />
              <span>Ver Directorio Completo del Comité Escolar</span>
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="site-footer bg-card border-t border-color py-8 mt-auto">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sky-700">INNOVA NEWS</span>
            <span>• Órgano Periodístico de Innova Schools - Sede Canta Callao</span>
          </div>
          <div>
            <span>© 2026 Todos los derechos reservados • Desarrollado para estudiantes</span>
          </div>
        </div>
      </footer>

      {/* ======================================================================
          MODALES Y DIÁLOGOS REACTIVOS
          ====================================================================== */}

      {/* MODAL 1: DIRECTORIO DEL COMITÉ ("VER COMITÉ") */}
      {isCommitteeModalOpen && (
        <div className="modal-backdrop active fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="committee-modal-card bg-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-color animate-in fade-in zoom-in-95 duration-150">
            
            <div className="committee-modal-header p-6 bg-gradient-to-r from-sky-800 to-emerald-800 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <h3 className="text-2xl font-bold text-white">Comité Periodístico Escolar</h3>
                  <span className="badge-counter ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-sky-900">
                    {admittedMembers.length} miembros oficiales
                  </span>
                </div>
                <p className="text-xs text-white/80 max-w-xl">
                  Directorio oficial en tiempo real de directores, redactores, editores audiovisuales y reporteros escolares admitidos de Innova Schools - Sede Canta Callao (2026).
                </p>
              </div>
              <button 
                className="committee-modal-close p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                onClick={() => setIsCommitteeModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de búsqueda dentro del directorio */}
            <div className="committee-modal-filter-bar p-4 bg-subtle border-b border-color flex items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input 
                  type="text" 
                  value={committeeSearch}
                  onChange={(e) => setCommitteeSearch(e.target.value)}
                  placeholder="Buscar compañero por nombre, cargo o grado escolar..." 
                  className="w-full pl-9 pr-4 py-2 bg-card border border-color rounded-full text-xs text-dark focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="committee-modal-body p-6 overflow-y-auto flex-1">
              <div className="committee-directory-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {admittedMembers.map(member => (
                  <div key={member.id} className="committee-member-card bg-card rounded-xl border border-color overflow-hidden flex flex-col shadow-sm hover:shadow transition-shadow">
                    <div 
                      className="committee-card-banner h-20 bg-cover bg-center" 
                      style={{ backgroundImage: `url('${member.banner || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"}')` }}
                    />
                    <div className="committee-card-avatar-wrap px-4 -mt-7 flex items-end justify-between">
                      <img 
                        src={member.avatar || DEFAULT_USER_AVATAR} 
                        alt={member.name} 
                        className="committee-card-avatar w-14 h-14 rounded-full border-2 border-white object-cover shadow" 
                      />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ✓ ADMITIDO
                      </span>
                    </div>
                    <div className="committee-card-content p-4 flex flex-col flex-1 space-y-1.5">
                      <h4 className="committee-card-name text-sm font-bold text-dark leading-tight">{member.name}</h4>
                      <p className="committee-card-role text-xs text-emerald-700 font-bold">{member.role}</p>
                      <p className="committee-card-grade text-[11px] text-muted">🏫 {member.grade}</p>
                      <p className="committee-card-bio text-xs text-muted line-clamp-2 pt-1 flex-1">
                        {member.bio || "Miembro activo del Comité Periodístico Innova News en la Sede Canta Callao."}
                      </p>
                      <div className="committee-card-actions pt-3 mt-auto">
                        <button 
                          className="btn-primary w-full py-1.5 px-3 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer"
                          onClick={() => {
                            setActiveProfileUser(member);
                            setIsPublicProfileOpen(true);
                          }}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Ver Perfil</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PERFIL PÚBLICO DE USUARIO (RED SOCIAL) */}
      {isPublicProfileOpen && activeProfileUser && (
        <div className="modal-backdrop active fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="public-profile-card bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-color animate-in fade-in zoom-in-95 duration-150">
            
            <div 
              className="public-profile-header relative h-36 bg-cover bg-center p-4 flex justify-end"
              style={{ backgroundImage: `url('${activeProfileUser.banner || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"}')` }}
            >
              <button 
                className="public-profile-close p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white cursor-pointer h-8 w-8 flex items-center justify-center shadow"
                onClick={() => setIsPublicProfileOpen(false)}
                aria-label="Cerrar perfil"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="public-profile-top-info px-6 pb-4 border-b border-color relative -mt-10 space-y-3">
              <div className="flex items-end justify-between">
                <img 
                  src={activeProfileUser.avatar || DEFAULT_USER_AVATAR} 
                  alt={activeProfileUser.name} 
                  className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md"
                />
                <span className="status-badge px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  ✓ MIEMBRO OFICIAL
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-dark leading-tight">{activeProfileUser.name}</h3>
                <p className="text-xs font-bold text-emerald-700">{activeProfileUser.role}</p>
                <p className="text-xs text-muted">🏫 {activeProfileUser.grade} • {activeProfileUser.email}</p>
              </div>

              <div className="public-profile-bio-box p-3 bg-subtle rounded-lg text-xs leading-relaxed border-l-4 border-sky-500">
                <p className="text-dark font-medium">{activeProfileUser.bio || "Este autor aún no ha redactado su biografía personal en la plataforma de Innova News."}</p>
              </div>
            </div>

            <div className="public-profile-body p-6 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h4 className="font-bold text-dark flex items-center gap-1.5 text-sm">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span>Publicaciones y Portafolio del Autor</span>
                </h4>
                <span className="text-muted font-bold">{profileAuthorWorks.length} notas</span>
              </div>

              <div className="space-y-3">
                {profileAuthorWorks.length > 0 ? (
                  profileAuthorWorks.map(work => (
                    <div key={work.id} className="p-3 bg-subtle rounded-xl border border-color space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span className="font-bold text-sky-700">Edición: {work.month} 2026</span>
                        <span>📅 {work.date}</span>
                      </div>
                      <h5 className="text-sm font-bold text-dark leading-snug">{work.title}</h5>
                      <p className="text-xs text-muted line-clamp-2">{'excerpt' in work ? work.excerpt : work.description}</p>
                      
                      <div className="pt-1 flex gap-2">
                        {work.itemType === 'redaccion' ? (
                          <button 
                            className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                            onClick={() => {
                              setActiveArticle(work as Article);
                              setIsWordModalOpen(true);
                            }}
                          >
                            Abrir en Visor Word →
                          </button>
                        ) : (
                          <a 
                            href={(work as MediaItem).externalLink || (work as MediaItem).mediaUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs font-bold text-emerald-600 hover:underline no-underline"
                          >
                            Ver Producción Multimedia →
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted text-xs">
                    No se registran notas publicadas por este autor aún.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: VISOR DE MICROSOFT WORD */}
      {isWordModalOpen && activeArticle && (
        <div className="modal-backdrop active fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="word-modal-card bg-card rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-color animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 bg-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <span className="text-sm font-bold">Microsoft Word Online • Hemeroteca Innova News</span>
              </div>
              <button 
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                onClick={() => setIsWordModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4">
              <div className="bg-white p-8 rounded-lg shadow border border-slate-200 max-w-2xl mx-auto space-y-4 font-serif">
                <div className="border-b pb-3 border-slate-200 space-y-1">
                  <h1 className="text-2xl font-bold text-slate-900 leading-snug">{activeArticle.title}</h1>
                  <p className="text-xs text-slate-500 font-sans">
                    Por {activeArticle.author} • Edición: {activeArticle.month} 2026 • {activeArticle.date}
                  </p>
                </div>

                <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-line space-y-3">
                  {activeArticle.content}
                </div>
              </div>
            </div>

            <div className="p-4 bg-card border-t border-color flex items-center justify-between">
              <span className="text-xs text-muted">Archivo preparado para Microsoft Word (.doc)</span>
              <button 
                className="btn-primary py-2 px-4 rounded text-xs font-bold flex items-center gap-2 cursor-pointer"
                onClick={() => handleDownloadWord(activeArticle)}
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo Word (.doc)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: VISOR DE PDF */}
      {isPdfModalOpen && activeArticle && activeArticle.pdfUrl && (
        <div className="modal-backdrop active fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="pdf-modal-card bg-card rounded-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-color animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 bg-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <span className="text-sm font-bold">Visor de Documento PDF • {activeArticle.title}</span>
              </div>
              <button 
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                onClick={() => setIsPdfModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-200 overflow-hidden relative">
              <iframe 
                src={activeArticle.pdfUrl} 
                className="w-full h-full border-none"
                title={activeArticle.title}
              />
            </div>

            <div className="p-4 bg-card border-t border-color flex items-center justify-between">
              <span className="text-xs text-muted">Lectura integrada de PDF en plataforma</span>
              <a 
                href={activeArticle.pdfUrl} 
                target="_blank" 
                rel="noreferrer"
                download
                className="btn-primary py-2 px-4 rounded text-xs font-bold flex items-center gap-2 no-underline cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF Original</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: ACCESO EQUIPO (AUTH MODAL) */}
      {isAuthModalOpen && (
        <div className="modal-backdrop active fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="auth-modal-card bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-color animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-color pb-3">
              <div>
                <h3 className="text-lg font-bold text-dark">Portal del Equipo Periodístico</h3>
                <p className="text-xs text-muted">Innova Schools • Sede Canta Callao</p>
              </div>
              <button 
                className="p-1 text-muted hover:text-dark rounded cursor-pointer"
                onClick={() => setIsAuthModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-sky-50 rounded-lg text-xs text-sky-900 space-y-1 border border-sky-200">
                <strong className="block font-bold">Cuentas Institucionales Activas:</strong>
                <p>• Dirección: <code>62754739@alumnos.innovaschools.edu.pe</code> (admin123)</p>
                <p>• Coordinación: <code>76119235@alumnos.innovaschools.edu.pe</code> (tlaxcala123)</p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const email = target.email.value.trim();
                  const pass = target.password.value.trim();
                  
                  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                  if (found) {
                    setCurrentUser(found);
                    sessionStorage.setItem("innova_news_current_user_v5", JSON.stringify(found));
                    setIsAuthModalOpen(false);
                    showToast(`Bienvenido de nuevo, ${found.name}`, "success");
                  } else {
                    showToast("Credenciales no registradas o en revisión.", "warning");
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Correo Institucional</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    defaultValue="62754739@alumnos.innovaschools.edu.pe"
                    className="w-full px-3 py-2 text-xs rounded border border-color bg-subtle text-dark focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Contraseña</label>
                  <input 
                    type="password" 
                    name="password" 
                    required 
                    defaultValue="admin123"
                    className="w-full px-3 py-2 text-xs rounded border border-color bg-subtle text-dark focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-primary w-full py-2.5 rounded font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al Portal</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* TOAST FLOTANTE DE NOTIFICACIONES */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 p-3.5 rounded-xl shadow-lg border text-xs font-bold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
          toast.type === 'error' ? 'bg-red-50 text-red-900 border-red-300' :
          toast.type === 'warning' ? 'bg-amber-50 text-amber-900 border-amber-300' :
          'bg-sky-50 text-sky-900 border-sky-300'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
          {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-sky-600" />}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
