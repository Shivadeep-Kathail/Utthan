import { useParams } from 'react-router-dom';

/**
 * Single campaign detail page — placeholder for Phase 3.
 * Will show campaign info, progress, donations, and participation.
 */
function CampaignDetailPage() {
  const { slug } = useParams();

  return (
    <section className="space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Campaign Detail
        </h1>
        <p className="text-muted-foreground">
          Viewing campaign: <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{slug}</code>
        </p>
      </div>

      <div className="flex min-h-[40vh] items-center justify-center rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-muted-foreground">
          Campaign details will be available in Phase 3.
        </p>
      </div>
    </section>
  );
}

export default CampaignDetailPage;
