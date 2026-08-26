import { UserCog } from 'lucide-react';

import { UpdateProfileForm } from '@/components/dashboard/UpdateProfileForm';
import { ChangePasswordForm } from '@/components/dashboard/ChangePasswordForm';
import { DeleteAccountSection } from '@/components/dashboard/DeleteAccountSection';

/**
 * Profile / account-settings page.
 *
 * Houses the three self-contained settings components that previously
 * lived on DashboardPage (Phase 2). Moved here as part of the
 * dashboard restructure — no internal logic was changed.
 */
function ProfilePage() {

  return (
    <section className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <UserCog className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Profile &amp; Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account details, password, and preferences.
          </p>
        </div>
      </div>

      {/* Account Settings — moved as-is from DashboardPage */}
      <div className="space-y-6 max-w-2xl">
        <UpdateProfileForm />
        <ChangePasswordForm />
        <DeleteAccountSection />
      </div>
    </section>
  );
}

export default ProfilePage;
