import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Heart, Package, Search } from 'lucide-react';

import { getMyDonations } from '@/api/donations.api';
import { getMyPledges, cancelPledge } from '@/api/goodsDonations.api';
import { getCampaigns } from '@/api/campaigns.api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/* ── Status badge configs ──────────────────────────────────────── */

const DONATION_STATUS = {
  created: { label: 'Pending', className: 'donations-status--pending' },
  captured: { label: 'Captured', className: 'donations-status--captured' },
  failed: { label: 'Failed', className: 'donations-status--failed' },
  refunded: { label: 'Refunded', className: 'donations-status--refunded' },
};

const PLEDGE_STATUS = {
  pledged: { label: 'Pledged', className: 'donations-status--pledged' },
  collected: { label: 'Collected', className: 'donations-status--collected' },
  cancelled: { label: 'Cancelled', className: 'donations-status--cancelled' },
};

/* ── Helpers ───────────────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Fallback slugifier matching backend slugify(title, { lower: true, strict: true }). */
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Safely get campaign title from a donation; campaign may be null. */
function getCampaignTitle(donation) {
  return donation?.campaign?.title ?? null;
}

/** Safely get campaign slug from a donation, using slug map or fallback slugify. */
function getCampaignSlug(donation, slugMap = {}) {
  if (donation?.campaign?.slug) return donation.campaign.slug;
  const id = donation?.campaign?._id;
  if (id && slugMap[id]) return slugMap[id];
  const title = getCampaignTitle(donation);
  if (title) return slugify(title);
  return null;
}

/* ── Row skeleton (for loading state) ──────────────────────────── */

function RowSkeleton() {
  return (
    <div className="donations-row" aria-hidden="true">
      <div className="donations-row-main">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="donations-row-end">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/* ── Campaign link (handles missing campaign) ──────────────────── */

function CampaignLink({ donation, slugMap }) {
  const title = getCampaignTitle(donation);
  const slug = getCampaignSlug(donation, slugMap);

  if (!title) {
    return <span className="donations-unavailable">Campaign unavailable</span>;
  }

  if (slug) {
    return (
      <Link
        to={`/campaigns/${slug}`}
        className="donations-campaign-link"
      >
        {title}
      </Link>
    );
  }

  return <span className="donations-campaign-title font-medium text-sm text-foreground">{title}</span>;
}

/* ── Main component ────────────────────────────────────────────── */

function MyDonationsTab() {
  const [donations, setDonations] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [slugMap, setSlugMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancel pledge confirmation dialog state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [donationsRes, pledgesRes, campaignsRes] = await Promise.all([
        getMyDonations(),
        getMyPledges(),
        getCampaigns().catch(() => ({ data: { campaigns: [] } })),
      ]);

      setDonations(donationsRes.data?.donations ?? []);
      setPledges(pledgesRes.data?.donations ?? []);

      const map = {};
      for (const c of campaignsRes.data?.campaigns ?? []) {
        if (c._id && c.slug) {
          map[c._id] = c.slug;
        }
      }
      setSlugMap(map);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await cancelPledge(cancelTarget._id);
      // Update locally — set status to cancelled
      setPledges((prev) =>
        prev.map((p) =>
          p._id === cancelTarget._id ? { ...p, status: 'cancelled' } : p,
        ),
      );
      toast.success('Pledge cancelled.');
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.message ?? 'Failed to cancel pledge.');
    } finally {
      setIsCancelling(false);
    }
  };

  /* ── Computed values ── */

  const totalDonated = donations
    .filter((d) => d.status === 'captured')
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  /* ── Loading state ── */

  if (isLoading) {
    return (
      <div className="donations-sections">
        <section className="donations-section">
          <h3 className="donations-section-title">
            <Heart className="size-4" aria-hidden="true" />
            Donations
          </h3>
          <div className="donations-list">
            {Array.from({ length: 3 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </section>
        <section className="donations-section">
          <h3 className="donations-section-title">
            <Package className="size-4" aria-hidden="true" />
            Goods Pledges
          </h3>
          <div className="donations-list">
            {Array.from({ length: 2 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ── Error state ── */

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-destructive">
          {error?.message ?? 'Failed to load donation history.'}
        </p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Try again
        </Button>
      </div>
    );
  }

  /* ── Empty state (neither donations nor pledges) ── */

  const hasDonations = donations.length > 0;
  const hasPledges = pledges.length > 0;

  if (!hasDonations && !hasPledges) {
    return (
      <div className="my-campaigns-empty">
        <div className="my-campaigns-empty-icon">
          <Heart className="size-8 text-muted-foreground/50" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">
          You haven&apos;t made any donations or pledges yet.
        </p>
        <Link to="/campaigns">
          <Button size="sm">
            <Search className="size-4 mr-1" aria-hidden="true" />
            Browse campaigns
          </Button>
        </Link>
      </div>
    );
  }

  /* ── Data ── */

  return (
    <>
      <div className="donations-sections">
        {/* ── Monetary donations section ── */}
        <section className="donations-section">
          <div className="donations-section-header">
            <h3 className="donations-section-title">
              <Heart className="size-4" aria-hidden="true" />
              Donations
            </h3>
            {totalDonated > 0 && (
              <p className="donations-total">
                Total donated: <strong>{formatCurrency(totalDonated)}</strong>
              </p>
            )}
          </div>

          {!hasDonations ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No monetary donations yet.{' '}
              <Link to="/campaigns" className="text-primary hover:underline">
                Find a campaign to support
              </Link>
            </p>
          ) : (
            <div className="donations-list">
              {donations.map((donation) => {
                const statusCfg =
                  DONATION_STATUS[donation.status] ?? DONATION_STATUS.created;
                return (
                  <article key={donation._id} className="donations-row">
                    <div className="donations-row-main">
                      <CampaignLink donation={donation} slugMap={slugMap} />
                      <span className="donations-amount">
                        {formatCurrency(donation.amount)}
                      </span>
                    </div>
                    <div className="donations-row-end">
                      <span
                        className={`donations-status ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </span>
                      <span className="donations-date">
                        {formatDate(donation.createdAt)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Goods pledges section ── */}
        <section className="donations-section">
          <h3 className="donations-section-title">
            <Package className="size-4" aria-hidden="true" />
            Goods Pledges
          </h3>

          {!hasPledges ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No goods pledges yet.{' '}
              <Link to="/campaigns" className="text-primary hover:underline">
                Find a goods-donation campaign
              </Link>
            </p>
          ) : (
            <div className="donations-list">
              {pledges.map((pledge) => {
                const statusCfg =
                  PLEDGE_STATUS[pledge.status] ?? PLEDGE_STATUS.pledged;
                return (
                  <article key={pledge._id} className="donations-row donations-row--pledge">
                    <div className="donations-row-main">
                      <CampaignLink donation={pledge} slugMap={slugMap} />
                      <div className="donations-items">
                        {(pledge.items ?? []).map((item, idx) => (
                          <span key={idx} className="donations-item-chip">
                            {item.quantity} × {item.item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="donations-row-end">
                      <span
                        className={`donations-status ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </span>
                      <span className="donations-date">
                        {formatDate(pledge.createdAt)}
                      </span>
                      {pledge.status === 'pledged' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelTarget(pledge)}
                        >
                          Cancel pledge
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Cancel pledge confirmation dialog ── */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Pledge</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your pledge of{' '}
              <strong>
                {(cancelTarget?.items ?? [])
                  .map((i) => `${i.quantity} × ${i.item}`)
                  .join(', ')}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
            >
              Keep pledge
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelConfirm}
              loading={isCancelling}
            >
              Yes, cancel pledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { MyDonationsTab };

