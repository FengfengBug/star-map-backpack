import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './styles/base.css';
import App from './App';
import { WorkspacePreview } from './components/WorkspacePreview';

const preview = new URLSearchParams(window.location.search).get('preview');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {preview === 'workspace' ? <WorkspacePreview /> : <App />}
  </StrictMode>,
);
