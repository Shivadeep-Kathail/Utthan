import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import * as campaignsApi from '@/api/campaigns.api';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CardSkeleton } from '@/components/feedback/CardSkeleton';

const FEATURED_LIMIT = 4;

/**
 * Homepage "Featured Campaigns" section.
 *
 * Fetches a small set of the most recent active campaigns and renders
 * them using the shared CampaignCard component. On error or if no
 * campaigns exist, the section is silently hidden (non-critical).
 */
function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await campaignsApi.getCampaigns({
        limit: FEATURED_LIMIT,
        sort: '-createdAt',
      });
      const items = res.data?.campaigns ?? [];
      setCampaigns(items);
      setHasData(items.length > 0);
    } catch {
      // Non-critical section — hide on error
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // Hide entire section if no campaigns to show (and not loading)
  if (!loading && !hasData) return null;

  return (
    <section
      id="featured-campaigns"
      className="featured-campaigns-section"
      aria-labelledby="featured-campaigns-heading"
    >
      <div className="featured-campaigns-header">
        <div>
          <span className="featured-campaigns-eyebrow">Making a difference</span>
          <h2
            id="featured-campaigns-heading"
            className="featured-campaigns-title"
          >
            Featured Campaigns
          </h2>
        </div>
        <Link to="/campaigns" className="featured-campaigns-view-all">
          View all campaigns
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="featured-campaigns-grid">
        {loading
          ? Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          : campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
      </div>
    </section>
  );
}

export default FeaturedCampaigns;
