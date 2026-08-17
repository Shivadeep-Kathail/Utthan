import { Search } from 'lucide-react';

/**
 * Campaigns discovery page — placeholder for Phase 3.
 * Will have filtering, search, and campaign cards grid.
 */
function CampaignsPage() {
  return (
    <section className="space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Discover Campaigns
        </h1>
        <p className="text-muted-foreground">
          Find and support causes that matter to you.
        </p>
      </div>

      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8">
        <Search className="size-10 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Campaign discovery will be available in Phase 3.
        </p>
      </div>
    </section>
  );
}

export default CampaignsPage;
