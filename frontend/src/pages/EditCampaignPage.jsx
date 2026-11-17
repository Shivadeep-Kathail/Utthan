import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PenLine, AlertCircle } from 'lucide-react';

import { getCampaignBySlug, updateCampaign, getPayoutDetails } from '@/api/campaigns.api';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { Spinner } from '@/components/ui/spinner';

/**
 * EditCampaignPage — edit an existing campaign.
 *
 * Uses the shared CampaignForm component in "edit" mode.
 * Fetches the campaign data by slug, pre-fills the form,
 * and submits changes via PATCH /api/campaign/:slug.
 *
 * For fundraising campaigns, also loads payout details from the
 * dedicated endpoint and merges them into the initial data.
 */
function EditCampaignPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [payoutLoadError, setPayoutLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCampaign() {
      try {
        const res = await getCampaignBySlug(slug);
        const campaignData = res.data.campaign;

        // For fundraising campaigns, also load payout details
        if (campaignData.type === 'fundraising') {
          try {
            const payoutRes = await getPayoutDetails(slug);
            campaignData.payoutDetails = payoutRes.data.payoutDetails;
          } catch {
            if (!cancelled) {
              setPayoutLoadError(
                'Could not load existing payout details. You can still add or update them.',
              );
            }
          }
        }

        if (!cancelled) {
          setCampaign(campaignData);
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

      {/* Payout details load warning */}
      {payoutLoadError && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-4">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {payoutLoadError}
          </p>
        </div>
      )}

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
