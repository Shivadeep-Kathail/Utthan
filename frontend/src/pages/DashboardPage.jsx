import { LayoutDashboard } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { UpdateProfileForm } from '@/components/dashboard/UpdateProfileForm';
import { ChangePasswordForm } from '@/components/dashboard/ChangePasswordForm';
import { DeleteAccountSection } from '@/components/dashboard/DeleteAccountSection';

/**
 * User dashboard page.
 *
 * Phase 2: Account settings (profile, password, delete).
 * Phase 6: Will add campaign/donation data sections below.
 * Built to compose cleanly — each section is a self-contained component.
 */
function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <LayoutDashboard className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and activity.
          </p>
        </div>
      </div>

      {/* Account Settings */}
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground">
          Account Settings
        </h2>

        <UpdateProfileForm />
        <ChangePasswordForm />
        <DeleteAccountSection />
      </div>

      {/* Phase 6 stub — campaigns & donations */}
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground">
          Your Activity
        </h2>
        <div className="flex min-h-[20vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
          <p className="text-sm text-muted-foreground">
            Campaign and donation data will appear here in a future update.
          </p>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
