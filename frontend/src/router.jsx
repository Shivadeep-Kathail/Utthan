import { createBrowserRouter } from 'react-router-dom';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GuestRoute } from '@/components/auth/GuestRoute';

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
 * Route groups:
 * - Public:    /, /campaigns, /campaigns/:slug
 * - Guest:     /login, /signup, /forgot-password (redirect if logged in)
 * - Public:    /reset-password/:token (user may not have a session)
 * - Protected: /dashboard, /create-campaign, /admin (must be logged in)
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

      // Guest-only routes (redirect to dashboard if already logged in)
      {
        element: <GuestRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ],
      },

      // Reset password — public (user might not have a session yet)
      { path: 'reset-password/:token', element: <ResetPasswordPage /> },

      // Protected routes (must be logged in)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'create-campaign', element: <CreateCampaignPage /> },
          { path: 'admin', element: <AdminPage /> },
        ],
      },

      // Catch-all
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
