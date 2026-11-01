import { useState, useEffect } from 'react';

// Constantes oficiales de respaldo (Fallback de alta fidelidad)
export const DEFAULT_USER_AVATAR = "https://i.postimg.cc/BZrDdSSJ/imagen-2026-10-30-073218985.png";

export interface AuthorUser {
  id: string;
  name: string;
  email: string;
  grade: string;
  role: string;
  avatar: string;
  banner: string;
  bio: string;
  status: string;
}

export interface Coauthor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface ArticleItem {
  id: string;
  month: string;
  title: string;
  author: string;
  authorEmail: string;
  authorId: string;
  coauthors?: Coauthor[];
  date: string;
  excerpt: string;
  coverUrl: string;
  wordUrl?: string;
  pdfUrl?: string;
  content: string;
}

export interface MediaItem {
  id: string;
  month: string;
  title: string;
  mediaType: string;
  mediaUrl: string;
  coverUrl: string;
  author: string;
  authorEmail: string;
  authorId: string;
  coauthors?: Coauthor[];
  credits?: {
    director?: string;
    camara?: string;
    edicion?: string;
  };
  date: string;
  excerpt: string;
}

export const FALLBACK_USERS: AuthorUser[] = [
  {
    id: "usr_admin_1",
    name: "Dirección Periodística (General)",
    email: "62754739@alumnos.innovaschools.edu.pe",
    grade: "Docente Coordinador",
    role: "Super Administrador - Dirección General",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    bio: "Dirección General y Supervisión del Comité Periodístico Innova News en Sede Canta Callao.",
    status: "ADMITIDO"
  },
  {
    id: "usr_admin_2",
    name: "Coordinación Periodística",
    email: "76119235@alumnos.innovaschools.edu.pe",
    grade: "Docente Coordinador",
    role: "Super Administrador - Coordinación General",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    bio: "Coordinación General de Medios y Audiovisual en Innova News.",
    status: "ADMITIDO"
  },
  {
    id: "usr_student_1",
    name: "Camila Sofía Morales",
    email: "camila.morales@alumnos.innovaschools.edu.pe",
    grade: "4to Secundaria",
    role: "Editora en Jefe & Comité de Redacción",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    bio: "Editora escolar de Innova News. Apasionada por la oratoria y el periodismo escolar.",
    status: "ADMITIDO"
  },
  {
    id: "usr_student_2",
    name: "Diego Vargas Mendoza",
    email: "diego.vargas@alumnos.innovaschools.edu.pe",
    grade: "3ro Secundaria",
    role: "Reportero de Ciencia y Cultura Escolar",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    bio: "Cronista de eventos científicos y medioambientales en Canta Callao.",
    status: "ADMITIDO"
  }
];

export const FALLBACK_ARTICLES: ArticleItem[] = [
  {
    id: "art_oct_01",
    month: "Octubre",
    title: "Debate Escolar 2026: Liderazgo y Oratoria Estudiantil en Canta Callao",
    author: "Camila Sofía Morales",
    authorEmail: "camila.morales@alumnos.innovaschools.edu.pe",
    authorId: "usr_student_1",
    date: "2026-10-18",
    excerpt: "Estudiantes de 3ro a 5to de secundaria culminaron una destacada jornada de deliberación escolar y oratoria preparando su participación en el encuentro intersedes.",
    coverUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
    wordUrl: "https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fcalibre-ebook.com%2Fdownloads%2Fdemos%2Fdemo.docx",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    content: "Debate escolar en Innova Schools Sede Canta Callao 2026."
  },
  {
    id: "art_oct_02",
    month: "Octubre",
    title: "Feria de Ciencias y Tecnología 2026: Proyectos Ecológicos para el Callao",
    author: "Diego Vargas Mendoza",
    authorEmail: "diego.vargas@alumnos.innovaschools.edu.pe",
    authorId: "usr_student_2",
    date: "2026-10-12",
    excerpt: "Prototipos de purificación de agua marina, paneles solares de bajo costo y biohuertos verticales sorprendieron al jurado.",
    coverUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    wordUrl: "https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fcalibre-ebook.com%2Fdownloads%2Fdemos%2Fdemo.docx",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    content: "Feria de Ciencias 2026."
  },
  {
    id: "art_sep_01",
    month: "Septiembre",
    title: "Semana de la Juventud: Pasión, Deporte y Confraternidad en Canta Callao",
    author: "Mateo Ramos Castillo",
    authorEmail: "mateo.ramos@alumnos.innovaschools.edu.pe",
    authorId: "usr_student_3",
    date: "2026-09-24",
    excerpt: "El patio central vibró con los torneos interaulas de básquet y vóley en una semana dedicada a la salud y el esfuerzo escolar.",
    coverUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    content: "Semana de la juventud 2026."
  },
  {
    id: "art_ago_01",
    month: "Agosto",
    title: "Editorial de Bienvenida: Renovando Nuestro Compromiso Periodístico 2026",
    author: "Dirección Periodística (General)",
    authorEmail: "62754739@alumnos.innovaschools.edu.pe",
    authorId: "usr_admin_1",
    date: "2026-08-16",
    excerpt: "Iniciamos el segundo semestre académico 2026 reforzando el periodismo escolar veraz, la ética y la participación activa.",
    coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    content: "Editorial de bienvenida."
  }
];

export const FALLBACK_MEDIA: MediaItem[] = [
  {
    id: "med_oct_01",
    month: "Octubre",
    title: "Infografía Interactiva: Guía del Ecosistema Marino del Litoral Chalaco",
    mediaType: "canva",
    mediaUrl: "https://www.canva.com",
    coverUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    author: "Sofía Mendoza (Comité Audiovisual)",
    authorEmail: "sofia.mendoza@alumnos.innovaschools.edu.pe",
    authorId: "usr_student_4",
    date: "2026-10-20",
    excerpt: "Visualización gráfica sobre biodiversidad y conservación marina en el litoral chalaco."
  }
];

export default function App() {
  // Manejo de estado local (useState) para navegación y secciones
  const [activeSection, setActiveSection] = useState<'inicio' | 'ediciones' | 'sobre-nosotros'>('inicio');
  const [selectedMonth, setSelectedMonth] = useState<'Octubre' | 'Septiembre' | 'Agosto'>('Octubre');
  const [selectedCategory, setSelectedCategory] = useState<'redaccion' | 'audiovisual'>('redaccion');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isCommitteeOpen, setIsCommitteeOpen] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [selectedWordArticle, setSelectedWordArticle] = useState<ArticleItem | null>(null);
  const [selectedPdfArticle, setSelectedPdfArticle] = useState<ArticleItem | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<AuthorUser | null>(null);

  // Inicializar tema y datos locales
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem("innova_news_theme") as 'light' | 'dark') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem("innova_news_theme", next);
    } catch {}
  };

  const handleNavigate = (section: 'inicio' | 'ediciones' | 'sobre-nosotros') => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Artículos y multimedia filtrados con respaldo garantizado
  const filteredArticles = FALLBACK_ARTICLES.filter(a => a.month === selectedMonth);
  const filteredMedia = FALLBACK_MEDIA.filter(m => m.month === selectedMonth);
  const spotlightArticle = FALLBACK_ARTICLES.find(a => a.month === 'Octubre') || FALLBACK_ARTICLES[0];

  const filteredMembers = FALLBACK_USERS.filter(u => 
    u.status === 'ADMITIDO' && (
      u.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      u.role.toLowerCase().includes(searchMember.toLowerCase()) ||
      u.grade.toLowerCase().includes(searchMember.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Barra de anuncio superior */}
      <div className="bg-sky-900 text-white text-xs py-2 px-4 text-center font-medium">
        <span className="bg-sky-700 uppercase px-2 py-0.5 rounded font-bold mr-2 text-[10px]">COMUNICADO OFICIAL</span>
        Órgano Periodístico Escolar • Innova Schools - Sede Canta Callao • Año 2026
      </div>

      {/* Navegación Principal con useState */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => handleNavigate('inicio')} 
            className="flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-700 text-white font-extrabold flex items-center justify-center text-lg">
              IN
            </div>
            <div>
              <div className="font-extrabold text-base tracking-wide text-sky-900 dark:text-sky-400">
                INNOVA <span className="text-orange-500">NEWS</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                SEDE CANTA CALLAO • COMITÉ OFICIAL
              </div>
            </div>
          </button>

          {/* Botones de navegación con estado local */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleNavigate('inicio')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeSection === 'inicio' 
                  ? 'text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('ediciones')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeSection === 'ediciones' 
                  ? 'text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Ediciones <span className="ml-1 text-xs bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.5 rounded-full font-bold">Octubre 2026</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('sobre-nosotros')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeSection === 'sobre-nosotros' 
                  ? 'text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Sobre Nosotros
            </button>
            <button
              type="button"
              onClick={() => setIsCommitteeOpen(true)}
              className="px-3 py-2 rounded-md text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>👥</span> Ver Comité
            </button>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cambiar Modo Claro/Oscuro"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('ediciones')}
              className="bg-sky-700 hover:bg-sky-800 text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              Explorar
            </button>
          </div>
        </div>
      </header>

      {/* SECCIÓN INICIO */}
      <main>
        <section id="inicio" className="py-12 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Introducción */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Edición Central de Octubre 2026 en Circulación
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                La voz, las ideas y el talento de <span className="text-sky-700 dark:text-sky-400">Innova Schools</span> <span className="text-orange-500">Canta Callao</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                Innova News es una plataforma web oficial desarrollada por y para estudiantes de Innova Schools Sede Canta Callao. Nuestro comité periodístico está dirigido actualmente por la profesora Patricia Ocaña, promoviendo la investigación veraz y el talento audiovisual escolar.
              </p>
              {/* Botones de acción vinculados a useState */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('ediciones')}
                  className="bg-sky-700 hover:bg-sky-800 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow transition-all cursor-pointer flex items-center gap-2"
                >
                  📖 Explorar Ediciones 2026
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('sobre-nosotros')}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  👥 Conoce al Equipo
                </button>
              </div>
            </div>

            {/* Columna Lateral Derecha (Spotlight): Garantizada con datos de respaldo sin congelarse */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
              <div className="relative aspect-video">
                <img 
                  src={spotlightArticle.coverUrl} 
                  alt={spotlightArticle.title}
                  className="w-full h-full object-cover" 
                />
                <span className="absolute top-3 left-3 bg-sky-900 text-white text-xs px-2.5 py-1 rounded font-bold shadow">
                  Destacado de {spotlightArticle.month} 2026
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      const author = FALLBACK_USERS.find(u => u.name === spotlightArticle.author) || FALLBACK_USERS[2];
                      setSelectedUserForProfile(author);
                    }}
                    className="font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    ✍️ {spotlightArticle.author}
                  </button>
                  <span>📅 {spotlightArticle.date}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">
                  {spotlightArticle.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {spotlightArticle.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWordArticle(spotlightArticle)}
                    className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    📄 Visor Word
                  </button>
                  {spotlightArticle.wordUrl && (
                    <a
                      href={spotlightArticle.wordUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      📥 Descargar archivo Word
                    </a>
                  )}
                  {spotlightArticle.pdfUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedPdfArticle(spotlightArticle)}
                      className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      📄 Leer PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN EDICIONES */}
        <section id="ediciones" className="py-12 bg-slate-100/60 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Ediciones Escolares 2026
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Explora las publicaciones mensuales y coberturas de Innova Schools - Sede Canta Callao.
                </p>
              </div>

              {/* Selector de Mes con useState */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['Octubre', 'Septiembre', 'Agosto'] as const).map(month => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMonth(month)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedMonth === month
                        ? 'bg-sky-700 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Categoría con useState */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('redaccion')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === 'redaccion'
                    ? 'bg-sky-700 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                ✍️ Redacción & Artículos (.docx)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('audiovisual')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === 'audiovisual'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                🎬 Audiovisual & Canva
              </button>
            </div>

            {/* Lista de Tarjetas de Contenido */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategory === 'redaccion' && (
                filteredArticles.map(art => (
                  <div key={art.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-video">
                        <img src={art.coverUrl} alt={art.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-sky-900/90 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                          {art.month} 2026
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              const author = FALLBACK_USERS.find(u => u.name === art.author) || FALLBACK_USERS[2];
                              setSelectedUserForProfile(author);
                            }}
                            className="text-sky-700 dark:text-sky-400 font-semibold hover:underline"
                          >
                            ✍️ {art.author}
                          </button>
                          <span>{art.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-2">
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedWordArticle(art)}
                        className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        Visor Word
                      </button>
                      {art.wordUrl && (
                        <a
                          href={art.wordUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all"
                        >
                          📥 Word
                        </a>
                      )}
                      {art.pdfUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedPdfArticle(art)}
                          className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer"
                        >
                          📄 PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {selectedCategory === 'audiovisual' && (
                filteredMedia.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-video">
                        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-emerald-800 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                          {item.mediaType.toUpperCase()}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            🎬 {item.author}
                          </span>
                          <span>{item.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                          {item.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      <a
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all"
                      >
                        Abrir Diseño Canva
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* SECCIÓN SOBRE NOSOTROS */}
        <section id="sobre-nosotros" className="py-12 max-w-7xl mx-auto px-4 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Sobre Nuestro Comité Periodístico
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Formación ciudadana, libertad de prensa y producción digital en Innova Schools Sede Canta Callao.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-3">
              <div className="text-3xl">✍️</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Equipo de Redacción</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Investigación periodística, redacción de crónicas escolares, columnas de opinión y revisión de estilo.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-3">
              <div className="text-3xl">🎬</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Producción Audiovisual</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Cobertura en video, entrevistas en vivo, edición de cápsulas y diseño interactivo en Canva.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-3">
              <div className="text-3xl">🎓</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Dirección & Asesoría</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Acompañamiento docente liderado por la profesora Patricia Ocaña, promoviendo el pensamiento crítico y la ética informativa.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Directorio del Comité ("Ver Comité") con useState */}
      {isCommitteeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-sky-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span>👥</span> Comité Periodístico Escolar
                </h3>
                <p className="text-xs text-sky-200">
                  Directorio en tiempo real de directores, redactores y reporteros admitidos (2026).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCommitteeOpen(false)}
                className="text-white hover:bg-sky-700 p-1.5 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o grado escolar..."
                value={searchMember}
                onChange={e => setSearchMember(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-sky-600"
              />
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <img src={member.avatar || DEFAULT_USER_AVATAR} alt={member.name} className="w-11 h-11 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{member.name}</h4>
                      <p className="text-xs text-sky-700 dark:text-sky-400 font-semibold">{member.role}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.grade}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCommitteeOpen(false);
                      setSelectedUserForProfile(member);
                    }}
                    className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    Ver Perfil
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Visor Word */}
      {selectedWordArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>📄</span> Visor de Documento Word (.docx)
              </h3>
              <button
                type="button"
                onClick={() => setSelectedWordArticle(null)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              {selectedWordArticle.content}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedWordArticle(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
              {selectedWordArticle.wordUrl && (
                <a
                  href={selectedWordArticle.wordUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  📥 Descargar Word Oficial
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Visor PDF */}
      {selectedPdfArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-rose-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>📄</span> Visor de Documento PDF
                </h3>
                <p className="text-xs text-rose-200">{selectedPdfArticle.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPdfArticle(null)}
                className="text-white hover:bg-rose-700 p-1.5 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-900">
              {selectedPdfArticle.pdfUrl ? (
                <iframe
                  src={selectedPdfArticle.pdfUrl}
                  title="Visor PDF"
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="p-8 text-center text-slate-500">Documento PDF no disponible.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Perfil de Usuario */}
      {selectedUserForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="h-32 bg-sky-700 relative">
              <img src={selectedUserForProfile.banner} alt="Portada" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setSelectedUserForProfile(null)}
                className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6 pt-0 relative space-y-3">
              <div className="-mt-12 mb-2">
                <img
                  src={selectedUserForProfile.avatar || DEFAULT_USER_AVATAR}
                  alt={selectedUserForProfile.name}
                  className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 object-cover shadow"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {selectedUserForProfile.name}
                </h3>
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                  {selectedUserForProfile.role} • {selectedUserForProfile.grade}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedUserForProfile.email}
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {selectedUserForProfile.bio}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedUserForProfile(null)}
                  className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
