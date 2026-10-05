import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PenLine } from 'lucide-react';

import { getCampaignBySlug, updateCampaign } from '@/api/campaigns.api';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { Spinner } from '@/components/ui/spinner';

/**
 * EditCampaignPage — edit an existing campaign.
 *
 * Uses the shared CampaignForm component in "edit" mode.
 * Fetches the campaign data by slug, pre-fills the form,
 * and submits changes via PATCH /api/campaign/:slug.
 */
function EditCampaignPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCampaign() {
      try {
        const res = await getCampaignBySlug(slug);
        if (!cancelled) {
          setCampaign(res.data.campaign);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || 'Failed to load campaign.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCampaign();
    return () => { cancelled = true; };
  }, [slug]);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await updateCampaign(slug, data);
      const updatedSlug = res.data.campaign.slug;

      toast.success('Campaign updated successfully!', { duration: 4000 });
      navigate(`/campaigns/${updatedSlug}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to update campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="create-campaign-page">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="create-campaign-page">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">{loadError}</p>
          <button
            className="text-sm text-primary underline underline-offset-3"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="create-campaign-page">
      {/* Header */}
      <div className="create-campaign-header">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <PenLine className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Edit Campaign
          </h1>
          <p className="text-sm text-muted-foreground">
            Update your campaign details. Type and goals cannot be changed.
          </p>
        </div>
      </div>

      <CampaignForm
        mode="edit"
        initialData={campaign}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </section>
  );
}

export default EditCampaignPage;
