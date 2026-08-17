import { LayoutDashboard } from 'lucide-react';

/**
 * User dashboard page — placeholder for Phase 6.
 * Will show user's campaigns, donations, activity.
 * Phase 2 will wrap this with an auth guard.
 */
function DashboardPage() {
  return (
    <section className="space-y-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <LayoutDashboard className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Your campaigns, donations, and activity.
          </p>
        </div>
      </div>

      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-muted-foreground">
          Dashboard features will be available in Phase 6.
        </p>
      </div>
    </section>
  );
}

export default DashboardPage;
