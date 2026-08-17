import { Shield } from 'lucide-react';

/**
 * Admin panel page — placeholder for Phase 7.
 * Phase 2 will wrap this with a role-based auth guard (admin only).
 */
function AdminPage() {
  return (
    <section className="space-y-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Campaign moderation, user management, and analytics.
          </p>
        </div>
      </div>

      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-muted-foreground">
          Admin features will be available in Phase 7.
        </p>
      </div>
    </section>
  );
}

export default AdminPage;
