import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Trash2, ExternalLink, Plus, Megaphone } from 'lucide-react';

import { getMyCampaigns, deleteCampaign } from '@/api/campaigns.api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Status badge config — maps backend status enum to human label
 * and Tailwind utility classes. Uses semantic colors from the design system.
 */
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className: 'my-campaigns-status--pending',
  },
  active: {
    label: 'Active',
    className: 'my-campaigns-status--active',
  },
  closed: {
    label: 'Closed',
    className: 'my-campaigns-status--closed',
  },
  flagged: {
    label: 'Flagged',
    className: 'my-campaigns-status--flagged',
  },
  rejected: {
    label: 'Rejected',
    className: 'my-campaigns-status--rejected',
  },
};

/**
 * Convert a hyphenated category slug to a human-readable label.
 * e.g. 'animal-welfare' → 'Animal Welfare'
 */
function formatCategory(category) {
  if (!category) return '';
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format a date as a short readable string.
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * MyCampaignsTab — lists all campaigns created by the current user.
 *
 * Shows campaigns of ALL statuses (pending, active, closed, flagged, rejected)
 * with status badges, cover image thumbnails, and Edit/Delete actions.
 * Used inside DashboardPage's tab structure.
 */
function MyCampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyCampaigns();
      setCampaigns(res.data.campaigns);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCampaign(deleteTarget.slug);
      // Remove from local list immediately — no refetch needed
      setCampaigns((prev) =>
        prev.filter((c) => c.slug !== deleteTarget.slug),
      );
      toast.success(`"${deleteTarget.title}" has been deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete campaign.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchCampaigns}>
          Try again
        </Button>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="my-campaigns-empty">
        <div className="my-campaigns-empty-icon">
          <Megaphone className="size-8 text-muted-foreground/50" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">
          You haven't created any campaigns yet.
        </p>
        <Link to="/create-campaign">
          <Button size="sm">
            <Plus className="size-4 mr-1" aria-hidden="true" />
            Create your first campaign
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Top bar */}
      <div className="my-campaigns-topbar">
        <p className="text-sm text-muted-foreground">
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
        </p>
        <Link to="/create-campaign">
          <Button size="sm">
            <Plus className="size-4 mr-1" data-icon="inline-start" aria-hidden="true" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Campaign list */}
      <div className="my-campaigns-list">
        {campaigns.map((campaign) => {
          const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.pending;

          return (
            <article key={campaign._id} className="my-campaigns-item">
              {/* Cover image thumbnail */}
              <div className="my-campaigns-item-img">
                {campaign.coverImage ? (
                  <img
                    src={campaign.coverImage}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="my-campaigns-item-img-placeholder">
                    <Megaphone className="size-5 text-muted-foreground/40" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="my-campaigns-item-info">
                <div className="my-campaigns-item-header">
                  <h3 className="my-campaigns-item-title">
                    <Link to={`/campaigns/${campaign.slug}`}>
                      {campaign.title}
                    </Link>
                  </h3>
                  <span className={`my-campaigns-status ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <div className="my-campaigns-item-meta">
                  <span>{formatCategory(campaign.category)}</span>
                  <span className="my-campaigns-item-meta-sep">·</span>
                  <span>{formatDate(campaign.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="my-campaigns-item-actions">
                <Link
                  to={`/campaigns/${campaign.slug}`}
                  aria-label={`View ${campaign.title}`}
                >
                  <Button variant="ghost" size="icon-sm">
                    <ExternalLink className="size-4" />
                  </Button>
                </Link>
                <Link
                  to={`/campaigns/${campaign.slug}/edit`}
                  aria-label={`Edit ${campaign.title}`}
                >
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="size-4" />
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete ${campaign.title}`}
                  onClick={() => setDeleteTarget(campaign)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>"{deleteTarget?.title}"</strong>? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Yes, delete campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { MyCampaignsTab };
