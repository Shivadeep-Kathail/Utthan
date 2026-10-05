import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PenLine } from 'lucide-react';

import { createCampaign } from '@/api/campaigns.api';
import { CampaignForm } from '@/components/campaigns/CampaignForm';

/**
 * CreateCampaignPage — campaign creation page.
 *
 * Uses the shared CampaignForm component in "create" mode.
 * Protected by ProtectedRoute (Phase 2).
 * On successful creation, shows "under review" message and redirects
 * to /campaigns/:slug so the creator can view their pending campaign.
 */
function CreateCampaignPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await createCampaign(data);
      const slug = res.data.campaign.slug;

      toast.success(
        'Your campaign is under review and will be visible publicly once approved.',
        { duration: 6000 },
      );

      navigate(`/campaigns/${slug}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="create-campaign-page">
      {/* Header */}
      <div className="create-campaign-header">
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

      <CampaignForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </section>
  );
}

export default CreateCampaignPage;
