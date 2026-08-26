import { LayoutDashboard, Megaphone, Heart, Bell } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/**
 * User dashboard page — tabbed container for activity data.
 *
 * Restructured: account-settings components moved to /profile (ProfilePage).
 * Tabs:
 *  - My Campaigns  → Phase 4 content
 *  - My Donations  → Phase 5/6 content
 *  - Notifications → Phase 8 content (Socket.io-based)
 *
 * Each tab is a placeholder until its corresponding phase lands.
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
            Track your campaigns, donations, and notifications.
          </p>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Megaphone className="size-4" data-icon="inline-start" aria-hidden="true" />
            My Campaigns
          </TabsTrigger>
          <TabsTrigger value="donations">
            <Heart className="size-4" data-icon="inline-start" aria-hidden="true" />
            My Donations
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-4" data-icon="inline-start" aria-hidden="true" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
            <p className="text-sm text-muted-foreground">
              Your created campaigns will appear here. Coming in Phase 4.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="donations">
          <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
            <p className="text-sm text-muted-foreground">
              Your donation history will appear here. Coming soon.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
            <p className="text-sm text-muted-foreground">
              Real-time notifications will appear here. Coming soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default DashboardPage;
