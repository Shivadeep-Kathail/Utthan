import { useEffect } from 'react';
import axiosClient from '@/api/axiosClient';

// TODO: decide — map/geocoding library (react-leaflet vs @react-google-maps/api)
// TODO: decide — image-upload approach (direct S3/Cloudinary vs backend-proxy)

/**
 * Root application component.
 * In Phase 1, this only renders the router (via main.jsx's RouterProvider)
 * and runs a throwaway integration check against /users/me.
 */
function App() {
  // TODO: remove — replaced by AuthContext in Phase 2
  // Throwaway integration check: proves React → Axios → VITE_API_BASE_URL → Express works.
  // Expected result: 401 (unauthenticated). This should NOT trigger a redirect.
  useEffect(() => {
    axiosClient
      .get('/users/me')
      .then((res) => {
        console.log('[Phase 1 Integration Check] /users/me succeeded:', res.data);
      })
      .catch((err) => {
        console.log('[Phase 1 Integration Check] /users/me responded:', {
          status: err.status,
          code: err.code,
          message: err.message,
        });
      });
  }, []);

  return null; // Layout is rendered by RouterProvider via GlobalLayout
}

export default App;
