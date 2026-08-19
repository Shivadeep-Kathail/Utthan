import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import router from '@/router';

// TODO: decide — map/geocoding library (react-leaflet vs @react-google-maps/api)
// TODO: decide — image-upload approach (direct S3/Cloudinary vs backend-proxy)

/**
 * Root application component.
 *
 * Wraps the router and global UI (Toaster). AuthProvider lives inside
 * the router tree (GlobalLayout) so it has access to useNavigate().
 */
function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;
