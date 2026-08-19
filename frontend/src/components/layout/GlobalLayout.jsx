import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * Root layout: AuthProvider → Navbar → main content (via Outlet) → Footer.
 *
 * AuthProvider lives here (inside the router tree) because it needs
 * useNavigate() for logout redirect. All child routes have access
 * to auth context via useAuth().
 */
function GlobalLayout() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export { GlobalLayout };
