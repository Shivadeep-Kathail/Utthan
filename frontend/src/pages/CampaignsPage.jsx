import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX, ChevronLeft, ChevronRight } from 'lucide-react';
import * as campaignsApi from '@/api/campaigns.api';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CardSkeleton } from '@/components/feedback/CardSkeleton';
import { PageError } from '@/components/feedback/PageError';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

/** Items per page for the campaigns grid. */
const PAGE_LIMIT = 12;

/** Backend type enum values → display labels. */
const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'participation', label: 'Participation' },
  { value: 'goods-donation', label: 'Goods Donation' },
];

/** Backend category enum values → display labels. */
const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'medical', label: 'Medical' },
  { value: 'education', label: 'Education' },
  { value: 'social', label: 'Social' },
  { value: 'animal-welfare', label: 'Animal Welfare' },
  { value: 'disaster-relief', label: 'Disaster Relief' },
  { value: 'women-empowerment', label: 'Women Empowerment' },
  { value: 'child-welfare', label: 'Child Welfare' },
  { value: 'environment', label: 'Environment' },
  { value: 'community-development', label: 'Community Development' },
  { value: 'other', label: 'Other' },
];

/** Sort options. Values match backend ApiFeatures sort format. */
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'title', label: 'A → Z' },
  { value: '-title', label: 'Z → A' },
];

/**
 * Campaign discovery page — browsable grid with type/category filters,
 * sort control, and page-based pagination.
 *
 * Filter state is synced with URL search params so links from
 * CampaignTypes (e.g. /campaigns?type=fundraising) work on arrival.
 */
function CampaignsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Derive filter state from URL search params
  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  // Stable key for useEffect dependency (re-fetch when URL changes)
  const queryKey = searchParams.toString();

  /** Update a single URL param, resetting page to 1 for filter/sort changes. */
  const updateParam = useCallback(
    (key, value, resetPage = true) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (resetPage && key !== 'page') {
        params.delete('page');
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  /** Fetch campaigns based on current URL params. */
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: PAGE_LIMIT, sort };
      if (type) params.type = type;
      if (category) params.category = category;

      const res = await campaignsApi.getCampaigns(params);
      const items = res.data?.campaigns ?? [];
      setCampaigns(items);
      setHasMore(items.length >= PAGE_LIMIT);
    } catch (err) {
      setError(err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ── Render helpers ───────────────────────────────────────────

  const hasActiveFilters = type || category;

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  // ── UI ───────────────────────────────────────────────────────

  return (
    <section className="campaigns-page" aria-labelledby="campaigns-heading">
      {/* Header */}
      <div className="campaigns-page-header">
        <div>
          <h1 id="campaigns-heading" className="campaigns-page-title">
            Discover Campaigns
          </h1>
          <p className="campaigns-page-subtitle">
            Find and support causes that matter to you.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="campaigns-controls">
        <div className="campaigns-filters">
          <SlidersHorizontal
            className="campaigns-filters-icon"
            aria-hidden="true"
          />

          {/* Type filter */}
          <Select value={type} onValueChange={(val) => updateParam('type', val)}>
            <SelectTrigger className="campaigns-select-trigger" aria-label="Filter by type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select
            value={category}
            onValueChange={(val) => updateParam('category', val)}
          >
            <SelectTrigger className="campaigns-select-trigger" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sort} onValueChange={(val) => updateParam('sort', val)}>
            <SelectTrigger className="campaigns-select-trigger" aria-label="Sort campaigns">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="campaigns-clear-filters"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Content area ── */}
      {error ? (
        <PageError error={error} onRetry={fetchCampaigns} />
      ) : loading ? (
        <div className="campaigns-grid" aria-busy="true">
          {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        /* Empty state */
        <div className="campaigns-empty" role="status">
          <div className="campaigns-empty-icon-wrapper">
            <SearchX
              className="campaigns-empty-icon"
              aria-hidden="true"
            />
          </div>
          <h2 className="campaigns-empty-title">No campaigns found</h2>
          <p className="campaigns-empty-text">
            {hasActiveFilters
              ? 'No campaigns match your current filters. Try adjusting your criteria or clear all filters.'
              : 'There are no campaigns available right now. Check back soon!'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Campaign grid */}
          <div className="campaigns-grid">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>

          {/* Pagination */}
          <nav className="campaigns-pagination" aria-label="Campaign pages">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1), false)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>

            <span className="campaigns-pagination-info">
              Page {page}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => updateParam('page', String(page + 1), false)}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}

export default CampaignsPage;
