import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Users, Search } from 'lucide-react';

import { getMyParticipations, leaveCampaign } from '@/api/campaigns.api';
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

/* ── Campaign status badge config ─────────────────────────────── */

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'my-campaigns-status--pending' },
  active: { label: 'Active', className: 'my-campaigns-status--active' },
  closed: { label: 'Closed', className: 'my-campaigns-status--closed' },
  flagged: { label: 'Flagged', className: 'my-campaigns-status--flagged' },
  rejected: { label: 'Rejected', className: 'my-campaigns-status--rejected' },
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

/* ── Row skeleton ──────────────────────────────────────────────── */

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

/* ── Main component ────────────────────────────────────────────── */

function ParticipationTab() {
  const [participations, setParticipations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leave confirmation dialog state
  const [leaveTarget, setLeaveTarget] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await getMyParticipations();
      setParticipations(res.data?.participations ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLeaveConfirm = async () => {
    if (!leaveTarget) return;

    const slug = leaveTarget.campaign?.slug;
    if (!slug) {
      toast.error('Cannot leave — campaign is unavailable.');
      setLeaveTarget(null);
      return;
    }

    setIsLeaving(true);
    try {
      await leaveCampaign(slug);
      // Remove from local list
      setParticipations((prev) =>
        prev.filter((p) => p._id !== leaveTarget._id),
      );
      toast.success('You have left the campaign.');
      setLeaveTarget(null);
    } catch (err) {
      toast.error(err?.message ?? 'Failed to leave campaign.');
    } finally {
      setIsLeaving(false);
    }
  };

  /* ── Loading state ── */

  if (isLoading) {
    return (
      <div className="donations-list">
        {Array.from({ length: 3 }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  /* ── Error state ── */

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-destructive">
          {error?.message ?? 'Failed to load participation history.'}
        </p>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Try again
        </Button>
      </div>
    );
  }

  /* ── Empty state ── */

  if (participations.length === 0) {
    return (
      <div className="my-campaigns-empty">
        <div className="my-campaigns-empty-icon">
          <Users className="size-8 text-muted-foreground/50" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">
          You haven&apos;t joined any campaigns yet.
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
      <div className="donations-section">
        <div className="donations-section-header">
          <p className="text-sm text-muted-foreground">
            {participations.length} campaign
            {participations.length !== 1 ? 's' : ''} joined
          </p>
        </div>

        <div className="donations-list">
          {participations.map((participation) => {
            const campaign = participation.campaign;
            const hasValidCampaign = campaign?.title && campaign?.slug;

            const statusCfg = hasValidCampaign
              ? STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.pending
              : null;

            return (
              <article key={participation._id} className="donations-row">
                <div className="donations-row-main">
                  {hasValidCampaign ? (
                    <Link
                      to={`/campaigns/${campaign.slug}`}
                      className="donations-campaign-link"
                    >
                      {campaign.title}
                    </Link>
                  ) : (
                    <span className="donations-unavailable">
                      Campaign unavailable
                    </span>
                  )}
                </div>
                <div className="donations-row-end">
                  {statusCfg && (
                    <span
                      className={`my-campaigns-status ${statusCfg.className}`}
                    >
                      {statusCfg.label}
                    </span>
                  )}
                  <span className="donations-date">
                    Joined {formatDate(participation.createdAt)}
                  </span>
                  {hasValidCampaign && campaign.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setLeaveTarget(participation)}
                    >
                      Leave
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ── Leave confirmation dialog ── */}
      <Dialog
        open={!!leaveTarget}
        onOpenChange={(open) => {
          if (!open) setLeaveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave{' '}
              <strong>
                &quot;{leaveTarget?.campaign?.title ?? 'this campaign'}&quot;
              </strong>
              ? You can rejoin later if the campaign is still active.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeaveTarget(null)}
              disabled={isLeaving}
            >
              Stay
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeaveConfirm}
              loading={isLeaving}
            >
              Yes, leave campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { ParticipationTab };

