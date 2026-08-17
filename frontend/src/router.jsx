import { createBrowserRouter } from 'react-router-dom';
import { GlobalLayout } from '@/components/layout/GlobalLayout';

import HomePage from '@/pages/HomePage';
import CampaignsPage from '@/pages/CampaignsPage';
import CampaignDetailPage from '@/pages/CampaignDetailPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import CreateCampaignPage from '@/pages/CreateCampaignPage';
import AdminPage from '@/pages/AdminPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Application router.
 *
 * All routes are wrapped in GlobalLayout (Navbar + Footer).
 * Phase 2 will add an auth guard wrapper around protected routes
 * (dashboard, create-campaign, admin) without restructuring the tree.
 *
 * Route groups:
 * - Public: /, /campaigns, /campaigns/:slug
 * - Auth:   /login, /signup, /forgot-password, /reset-password/:token
 * - Protected (guard added in Phase 2): /dashboard, /create-campaign, /admin
 * - Catch-all: * → 404
 */
const router = createBrowserRouter([
  {
    element: <GlobalLayout />,
    children: [
      // Public routes
      { index: true, element: <HomePage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
      { path: 'campaigns/:slug', element: <CampaignDetailPage /> },

      // Auth routes (public, but will redirect if already logged in — Phase 2)
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password/:token', element: <ResetPasswordPage /> },

      // Protected routes (auth guard added in Phase 2)
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'create-campaign', element: <CreateCampaignPage /> },
      { path: 'admin', element: <AdminPage /> },

      // Catch-all
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
