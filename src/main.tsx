import './index.css';
import '../app.js';

// Safe mount for React components if #root exists in the DOM
const rootEl = document.getElementById('root');
if (rootEl) {
  import('react-dom/client').then(({ createRoot }) => {
    import('./App.tsx').then(({ default: App }) => {
      createRoot(rootEl).render(<App />);
    });
  });
}
