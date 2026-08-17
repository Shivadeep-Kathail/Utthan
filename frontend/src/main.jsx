import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import './index.css';
import router from '@/router';
import App from '@/App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
    <App />
    <Toaster position="bottom-right" richColors closeButton />
  </StrictMode>,
);
