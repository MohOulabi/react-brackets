import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@react-brackets/theme/theme.css';
import './page.css';
import { App } from './app';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
