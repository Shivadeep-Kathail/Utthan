import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Package,
  Users,
  Heart,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  Inbox,
  RefreshCw,
} from 'lucide-react';

import { getCampaignPledges, markCollected } from '@/api/goodsDonations.api';
import {
  getParticipants,
  getCampaignDonations,
  getCampaignBySlug,
  getPayoutDetails,
} from '@/api/campaigns.api';
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

const PLEDGE_STATUS = {
  pledged: { label: 'Pledged', className: 'donations-status--pledged' },
  collected: { label: 'Collected', className: 'donations-status--collected' },
  cancelled: { label: 'Cancelled', className: 'donations-status--cancelled' },
};

const DONATION_STATUS = {
  created: { label: 'Pending', className: 'donations-status--pending' },
  captured: { label: 'Captured', className: 'donations-status--captured' },
  failed: { label: 'Failed', className: 'donations-status--failed' },
  refunded: { label: 'Refunded', className: 'donations-status--refunded' },
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

/* ── Goods Pledges Management View ─────────────────────────────── */

function ManageGoodsPledges({ campaign, onCampaignUpdate }) {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Collect confirmation dialog state
  const [collectTarget, setCollectTarget] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const fetchPledges = useCallback(async () => {
    if (!campaign?.slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCampaignPledges(campaign.slug);
      setPledges(res.data?.donations ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load pledges.');
    } finally {
      setLoading(false);
    }
  }, [campaign?.slug]);

  useEffect(() => {
    fetchPledges();
  }, [fetchPledges]);

  // Sort pledges: pledged first, then collected, then cancelled (latest date within each)
  const sortedPledges = useMemo(() => {
    return [...pledges].sort((a, b) => {
      const rank = { pledged: 0, collected: 1, cancelled: 2 };
      const diff = (rank[a.status] ?? 3) - (rank[b.status] ?? 3);
      if (diff !== 0) return diff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [pledges]);

  const handleCollectConfirm = async () => {
    if (!collectTarget) return;
    setIsCollecting(true);
    try {
      await markCollected(collectTarget._id);
      // Update pledge row in place
      setPledges((prev) =>
        prev.map((p) =>
          p._id === collectTarget._id ? { ...p, status: 'collected' } : p,
        ),
      );
      toast.success('Pledge marked as collected.');

      // Quietly refetch the campaign so received counts reflect the update
      try {
        const fresh = await getCampaignBySlug(campaign.slug);
        if (fresh.data?.campaign && onCampaignUpdate) {
          onCampaignUpdate(fresh.data.campaign);
        }
      } catch {
        // Silent background sync failure
      }

      setCollectTarget(null);
    } catch (err) {
      // On 400/403 show backend's message in a toast and leave row unchanged
      toast.error(err?.message ?? 'Failed to mark pledge as collected.');
      setCollectTarget(null);
    } finally {
      setIsCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-empty-state">
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchPledges}>
          <RefreshCw className="size-3.5 mr-1" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  if (sortedPledges.length === 0) {
    return (
      <div className="manage-empty-state">
        <Inbox className="size-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No pledges have been made to this campaign yet.
        </p>
      </div>
    );
  }

  const pledgedCount = sortedPledges.filter((p) => p.status === 'pledged').length;
  const collectedCount = sortedPledges.filter((p) => p.status === 'collected').length;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <span>
          <strong>{sortedPledges.length}</strong> total pledge
          {sortedPledges.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-primary font-medium">
            {pledgedCount} pending collection
          </span>
          <span>·</span>
          <span>{collectedCount} collected</span>
        </div>
      </div>

      {/* Pledges list */}
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {sortedPledges.map((pledge) => {
          const statusCfg =
            PLEDGE_STATUS[pledge.status] ?? PLEDGE_STATUS.pledged;
          const donorName = pledge.donor?.name || 'Anonymous donor';

          return (
            <article
              key={pledge._id}
              className="manage-card flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 transition-colors"
            >
              {/* Header: Donor & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-3.5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {donorName}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      Pledged {formatDate(pledge.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`donations-status ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                  {pledge.status === 'pledged' && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setCollectTarget(pledge)}
                    >
                      <CheckCircle2 className="size-3.5 mr-1" aria-hidden="true" />
                      Mark collected
                    </Button>
                  )}
                </div>
              </div>

              {/* Items chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(pledge.items ?? []).map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-foreground border border-border/50"
                  >
                    {item.quantity} × {item.item}
                  </span>
                ))}
              </div>

              {/* Pickup & preferred date info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                  <span className="truncate">
                    <strong>Pickup:</strong> {pledge.address}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                  <span>
                    <strong>Preferred date:</strong>{' '}
                    {formatDate(pledge.preferredCollectionDate)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Confirmation Dialog for Mark Collected ── */}
      <Dialog
        open={!!collectTarget}
        onOpenChange={(open) => {
          if (!open) setCollectTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md z-[60]">
          <DialogHeader>
            <DialogTitle>Mark Pledge Collected</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this pledge from{' '}
              <strong>
                {collectTarget?.donor?.name || 'this donor'}
              </strong>{' '}
              as collected?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1.5">
            <p className="font-semibold text-foreground">Items to collect:</p>
            <p className="text-muted-foreground">
              {(collectTarget?.items ?? [])
                .map((i) => `${i.quantity} × ${i.item}`)
                .join(', ')}
            </p>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              Pickup address: {collectTarget?.address}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollectTarget(null)}
              disabled={isCollecting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCollectConfirm}
              loading={isCollecting}
            >
              Yes, mark collected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Participation Management View ─────────────────────────────── */

function ManageParticipants({ campaign }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParticipants = useCallback(async () => {
    if (!campaign?.slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getParticipants(campaign.slug);
      setParticipants(res.data?.participants ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load participants.');
    } finally {
      setLoading(false);
    }
  }, [campaign?.slug]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-empty-state">
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchParticipants}>
          <RefreshCw className="size-3.5 mr-1" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="manage-empty-state">
        <Users className="size-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No participants have joined this campaign yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <span>
          <strong>{participants.length}</strong> volunteer
          {participants.length !== 1 ? 's' : ''} joined
        </span>
        {campaign.participantGoal && (
          <span>
            Goal: <strong>{campaign.participantGoal}</strong>
          </span>
        )}
      </div>

      {/* Participants list */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {participants.map((item) => {
          const participantName =
            item.participant?.name || 'Anonymous participant';

          return (
            <div
              key={item._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {participantName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Fundraising Donations Management View ─────────────────────── */

function ManageDonations({ campaign }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDonations = useCallback(async () => {
    if (!campaign?.slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCampaignDonations(campaign.slug);
      setDonations(res.data?.donations ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load donations.');
    } finally {
      setLoading(false);
    }
  }, [campaign?.slug]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-empty-state">
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDonations}>
          <RefreshCw className="size-3.5 mr-1" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="manage-empty-state">
        <Heart className="size-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No donations have been received for this campaign yet.
        </p>
      </div>
    );
  }

  // Summary computed strictly from captured donations
  const totalCaptured = donations
    .filter((d) => d.status === 'captured')
    .reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <span>
          Total received:{' '}
          <strong className="text-foreground text-sm font-bold">
            {formatCurrency(totalCaptured)}
          </strong>
        </span>
        <span>
          {donations.length} donation{donations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Donations list */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {donations.map((donation) => {
          const statusCfg =
            DONATION_STATUS[donation.status] ?? DONATION_STATUS.created;
          const donorName = donation.donor?.name || 'Anonymous donor';

          return (
            <div
              key={donation._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {donorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(donation.paidAt || donation.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-semibold text-foreground">
                  {formatCurrency(donation.amount)}
                </span>
                <span className={`donations-status ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Manage Campaign Dialog ───────────────────────────────── */

function ManageCampaignDialog({ campaign, open, onOpenChange, onCampaignUpdate }) {
  const [payoutMissing, setPayoutMissing] = useState(false);

  useEffect(() => {
    if (!campaign || campaign.type !== 'fundraising' || !open) {
      setPayoutMissing(false);
      return;
    }

    getPayoutDetails(campaign.slug)
      .then((res) => setPayoutMissing(!res.data?.payoutDetails))
      .catch(() => setPayoutMissing(false));
  }, [campaign, open]);

  if (!campaign) return null;

  const TypeIcon =
    campaign.type === 'goods-donation'
      ? Package
      : campaign.type === 'participation'
        ? Users
        : Heart;

  const typeLabel =
    campaign.type === 'goods-donation'
      ? 'Goods Donation'
      : campaign.type === 'participation'
        ? 'Participation'
        : 'Fundraising';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <TypeIcon className="size-3.5" aria-hidden="true" />
            <span>{typeLabel} Management</span>
          </div>
          <DialogTitle className="text-lg font-bold truncate">
            Manage: {campaign.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            View activity, donations, and take creator management actions.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 flex-1 overflow-y-auto">
          {/* Payout details warning for fundraising campaigns */}
          {campaign.type === 'fundraising' && payoutMissing && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-3">
              <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium">Payout details not set</p>
                <p className="mt-0.5">
                  Add payout details so we can send you the funds raised.{' '}
                  <Link
                    to={`/campaigns/${campaign.slug}/edit`}
                    className="font-medium underline underline-offset-2"
                  >
                    Edit campaign
                  </Link>
                </p>
              </div>
            </div>
          )}

          {campaign.type === 'goods-donation' && (
            <ManageGoodsPledges
              campaign={campaign}
              onCampaignUpdate={onCampaignUpdate}
            />
          )}

          {campaign.type === 'participation' && (
            <ManageParticipants campaign={campaign} />
          )}

          {campaign.type === 'fundraising' && (
            <ManageDonations campaign={campaign} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ManageCampaignDialog };
