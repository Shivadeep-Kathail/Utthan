import { PenLine } from 'lucide-react';

/**
 * Campaign creation page — placeholder for Phase 4.
 * Phase 2 will wrap this with an auth guard.
 */
function CreateCampaignPage() {
  return (
    <section className="space-y-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <PenLine className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create a Campaign
          </h1>
          <p className="text-sm text-muted-foreground">
            Start fundraising, rally participants, or collect goods.
          </p>
        </div>
      </div>

      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-muted-foreground">
          Campaign creation will be available in Phase 4.
        </p>
      </div>
    </section>
  );
}

export default CreateCampaignPage;
