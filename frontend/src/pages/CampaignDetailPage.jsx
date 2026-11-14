import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MapPin,
  Calendar,
  User,
  Heart,
  Users,
  Package,
  Tag,
  ArrowLeft,
  IndianRupee,
  LogOut,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import * as campaignsApi from '@/api/campaigns.api';
import * as paymentsApi from '@/api/payments.api';
import * as goodsDonationsApi from '@/api/goodsDonations.api';
import { PageSpinner } from '@/components/feedback/PageSpinner';
import { PageError } from '@/components/feedback/PageError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

/** Type configuration for badges and CTAs. */
const TYPE_CONFIG = {
  fundraising: {
    label: 'Fundraising',
    badgeClass: 'detail-badge--fundraising',
    progressClass: 'detail-progress-fill--fundraising',
    ctaLabel: 'Donate now',
    ctaIcon: Heart,
  },
  participation: {
    label: 'Participation',
    badgeClass: 'detail-badge--participation',
    progressClass: 'detail-progress-fill--participation',
    ctaLabel: 'Join campaign',
    ctaIcon: Users,
  },
  'goods-donation': {
    label: 'Goods Donation',
    badgeClass: 'detail-badge--goods',
    progressClass: 'detail-progress-fill--goods-donation',
    ctaLabel: 'Donate goods',
    ctaIcon: Package,
  },
};

const STATUS_LABELS = {
  active: 'Active',
  closed: 'Closed',
  pending: 'Pending review',
  flagged: 'Under review',
  rejected: 'Rejected',
};

function formatCategory(category) {
  if (!category) return '';
  return category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compute goodsProgress locally from campaign.items to avoid stale virtual.
 * Mirrors the backend virtual: campaignSchema.virtual('goodsProgress').
 */
function computeGoodsProgress(items) {
  if (!items || items.length === 0) return 0;
  const needed = items.reduce((sum, item) => sum + item.needed, 0);
  const received = items.reduce((sum, item) => sum + (item.received ?? 0), 0);
  if (needed === 0) return 0;
  return (received / needed) * 100;
}

/**
 * Single campaign detail page — fetches by slug, renders
 * type-specific content with auth-gated CTAs.
 *
 * Fundraising → amount raised/needed + progress bar + "Donate" CTA (Phase 5a — live)
 * Participation → participant count/goal + progress bar + "Join"/"Leave" CTA (Phase 5b — live)
 * Goods-donation → items list + overall progress + "Donate goods" CTA (Phase 5c — live)
 */
function CampaignDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Donate dialog state (fundraising only) ─────────────────────
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donatePhase, setDonatePhase] = useState('idle'); // idle | creating | checkout | verifying | done

  // ── Participation join/leave state ─────────────────────────────
  const [hasJoined, setHasJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinStatusLoading, setJoinStatusLoading] = useState(false);

  // ── Goods pledge dialog state (goods-donation) ─────────────────
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [pledgeItems, setPledgeItems] = useState([{ item: '', quantity: '' }]);
  const [pledgeAddress, setPledgeAddress] = useState('');
  const [pledgeDate, setPledgeDate] = useState('');
  const [pledgeLoading, setPledgeLoading] = useState(false);
  const [pledgeError, setPledgeError] = useState('');
  const [pledgeCancelLoading, setPledgeCancelLoading] = useState(null); // donation _id being cancelled

  // ── User's own pledges for this campaign ────────────────────────
  const [myPledges, setMyPledges] = useState([]);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await campaignsApi.getCampaignBySlug(slug);
      setCampaign(res.data?.campaign ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  /** Quietly refetch campaign data without showing a spinner or resetting scroll. */
  const refetchCampaignQuietly = useCallback(async () => {
    try {
      const res = await campaignsApi.getCampaignBySlug(slug);
      const fresh = res.data?.campaign;
      if (fresh) setCampaign(fresh);
    } catch {
      // Silently ignore — optimistic state is already shown
    }
  }, [slug]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Fetch join status when campaign loads (authenticated + participation only)
  useEffect(() => {
    if (
      !campaign ||
      campaign.type !== 'participation' ||
      !isAuthenticated ||
      authLoading
    ) {
      return;
    }
    let cancelled = false;
    setJoinStatusLoading(true);
    campaignsApi
      .getParticipationStatus(slug)
      .then((res) => {
        if (!cancelled) setHasJoined(res.data?.joined ?? false);
      })
      .catch(() => {
        // Silently fail — the 409 safety net on click still works
      })
      .finally(() => {
        if (!cancelled) setJoinStatusLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?._id, campaign?.type, slug, isAuthenticated, authLoading]);

  // ── Fetch user's pledges for this goods-donation campaign ──────
  const fetchMyPledges = useCallback(async () => {
    if (!isAuthenticated || !campaign || campaign.type !== 'goods-donation') return;
    try {
      const res = await goodsDonationsApi.getMyPledges();
      const all = res.data?.donations ?? [];
      // Filter to this campaign
      const forCampaign = all.filter((d) => {
        const cId = typeof d.campaign === 'object' ? d.campaign._id : d.campaign;
        return cId === campaign._id;
      });
      setMyPledges(forCampaign);
    } catch {
      // Silently fail
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, campaign?._id, campaign?.type]);

  useEffect(() => {
    fetchMyPledges();
  }, [fetchMyPledges]);

  /**
   * Auth-gated CTA click handler.
   * Fundraising → opens donate dialog.
   * Participation → join/leave flow (Phase 5b).
   * Goods-donation → opens pledge dialog (Phase 5c).
   */
  const handleCtaClick = () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (campaign?.type === 'fundraising') {
      setDonateAmount('');
      setDonatePhase('idle');
      setDonateOpen(true);
      return;
    }

    if (campaign?.type === 'participation') {
      if (hasJoined) {
        handleLeaveCampaign();
      } else {
        handleJoinCampaign();
      }
      return;
    }

    if (campaign?.type === 'goods-donation') {
      // Reset pledge dialog state with one empty row
      setPledgeItems([{ item: '', quantity: '' }]);
      setPledgeAddress('');
      setPledgeDate('');
      setPledgeError('');
      setPledgeOpen(true);
      return;
    }
  };

  // ── Join campaign (participation) ──────────────────────────────
  const handleJoinCampaign = async () => {
    setJoinLoading(true);

    // Optimistic update
    setHasJoined(true);
    setCampaign((prev) =>
      prev
        ? { ...prev, participantCount: (prev.participantCount ?? 0) + 1 }
        : prev,
    );

    try {
      await campaignsApi.joinCampaign(slug);
      toast.success('You have joined this campaign!');
      // Quietly reconcile with the server in the background
      refetchCampaignQuietly();
    } catch (err) {
      if (err?.status === 409) {
        // Already joined — keep the flipped state, it was correct
        toast.info('You have already joined this campaign.');
        return;
      }
      // Rollback optimistic update on any other error
      setHasJoined(false);
      setCampaign((prev) =>
        prev
          ? { ...prev, participantCount: Math.max((prev.participantCount ?? 1) - 1, 0) }
          : prev,
      );
      toast.error(err?.message ?? 'Failed to join campaign.');
    } finally {
      setJoinLoading(false);
    }
  };

  // ── Leave campaign (participation) ─────────────────────────────
  const handleLeaveCampaign = async () => {
    setJoinLoading(true);

    // Optimistic update
    setHasJoined(false);
    setCampaign((prev) =>
      prev
        ? { ...prev, participantCount: Math.max((prev.participantCount ?? 1) - 1, 0) }
        : prev,
    );

    try {
      await campaignsApi.leaveCampaign(slug);
      toast.success('You have left this campaign.');
      // Quietly reconcile with the server in the background
      refetchCampaignQuietly();
    } catch (err) {
      if (err?.status === 409) {
        // Already left — keep the flipped state, it was correct
        toast.info('You have already left this campaign.');
        return;
      }
      // Rollback optimistic update
      setHasJoined(true);
      setCampaign((prev) =>
        prev
          ? { ...prev, participantCount: (prev.participantCount ?? 0) + 1 }
          : prev,
      );
      toast.error(err?.message ?? 'Failed to leave campaign.');
    } finally {
      setJoinLoading(false);
    }
  };

  // ── Participation CTA edge-state logic ─────────────────────────
  const getParticipationCtaState = () => {
    if (!campaign || campaign.type !== 'participation') return null;

    // Campaign not active
    if (campaign.status !== 'active') {
      return {
        disabled: true,
        label: campaign.status === 'closed' ? 'Campaign closed' : 'Campaign not active',
        icon: Users,
      };
    }

    // Creator cannot join their own campaign
    if (
      isAuthenticated &&
      user &&
      campaign.creator &&
      (campaign.creator._id === user._id || campaign.creator === user._id)
    ) {
      return {
        disabled: true,
        label: 'You created this campaign',
        icon: Users,
      };
    }

    // Campaign full (participantCount >= participantGoal)
    if (
      !hasJoined &&
      campaign.participantGoal &&
      (campaign.participantCount ?? 0) >= campaign.participantGoal
    ) {
      return {
        disabled: true,
        label: 'Campaign is full',
        icon: Users,
      };
    }

    // Normal join/leave state
    if (hasJoined) {
      return {
        disabled: false,
        label: 'Leave campaign',
        icon: LogOut,
      };
    }

    return {
      disabled: false,
      label: 'Join campaign',
      icon: Users,
    };
  };

  // ── Goods-donation CTA edge-state logic ────────────────────────
  const getGoodsCtaState = () => {
    if (!campaign || campaign.type !== 'goods-donation') return null;

    // Campaign not active
    if (campaign.status !== 'active') {
      return {
        disabled: true,
        label: campaign.status === 'closed' ? 'Campaign closed' : 'Campaign not active',
        reason: campaign.status === 'closed'
          ? 'This campaign is no longer accepting donations.'
          : 'This campaign is not yet accepting donations.',
      };
    }

    // All items fully received
    const items = campaign.items ?? [];
    const allFull = items.length > 0 && items.every((item) => (item.received ?? 0) >= item.needed);
    if (allFull) {
      return {
        disabled: true,
        label: 'All items fulfilled',
        reason: 'All needed items have been received.',
      };
    }

    return {
      disabled: false,
      label: 'Pledge goods',
    };
  };

  // ── Multi-item goods pledge handlers ───────────────────────────
  const handleItemChange = (index, value) => {
    setPledgeItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, item: value, quantity: '' } : row)),
    );
    setPledgeError('');
  };

  const handleQuantityChange = (index, value) => {
    setPledgeItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, quantity: value } : row)),
    );
    setPledgeError('');
  };

  const handleAddRow = () => {
    setPledgeItems((prev) => [...prev, { item: '', quantity: '' }]);
    setPledgeError('');
  };

  const handleRemoveRow = (index) => {
    if (pledgeItems.length <= 1) return;
    setPledgeItems((prev) => prev.filter((_, i) => i !== index));
    setPledgeError('');
  };

  const getRowValidationError = (row) => {
    if (!row.item) return '';
    const selectedCampaignItem = campaign?.items?.find((i) => i.name === row.item);
    if (!selectedCampaignItem) return 'Invalid item selected.';
    const remaining = selectedCampaignItem.needed - (selectedCampaignItem.received ?? 0);
    if (remaining <= 0) return `${selectedCampaignItem.name} is already fulfilled.`;

    if (row.quantity !== '' && row.quantity !== undefined) {
      const qty = Number(row.quantity);
      if (isNaN(qty) || qty <= 0) {
        return 'Quantity must be at least 1.';
      }
      if (qty > remaining) {
        return `Only ${remaining} ${selectedCampaignItem.name} still needed.`;
      }
    }
    return '';
  };

  // ── Handle goods pledge submission ─────────────────────────────
  const handlePledgeSubmit = async () => {
    if (!campaign || pledgeItems.length === 0) return;

    // Validate each row
    const validatedItems = [];
    for (let i = 0; i < pledgeItems.length; i++) {
      const row = pledgeItems[i];
      if (!row.item) {
        setPledgeError(`Please select an item for row ${i + 1}.`);
        return;
      }
      const selectedCampaignItem = campaign.items?.find((item) => item.name === row.item);
      if (!selectedCampaignItem) {
        setPledgeError(`Item "${row.item}" is not valid for this campaign.`);
        return;
      }
      const qty = Number(row.quantity);
      const remaining = selectedCampaignItem.needed - (selectedCampaignItem.received ?? 0);

      if (!qty || isNaN(qty) || qty <= 0) {
        setPledgeError(`Please enter a valid quantity for ${selectedCampaignItem.name}.`);
        return;
      }
      if (qty > remaining) {
        setPledgeError(`Only ${remaining} ${selectedCampaignItem.name} still needed.`);
        return;
      }
      validatedItems.push({ item: row.item, quantity: qty });
    }

    // Check for duplicate items
    const names = validatedItems.map((v) => v.item);
    if (new Set(names).size !== names.length) {
      setPledgeError('Please ensure each item type is only selected once.');
      return;
    }

    if (!pledgeAddress.trim()) {
      setPledgeError('Please enter a pickup address.');
      return;
    }
    if (!pledgeDate) {
      setPledgeError('Please select a preferred collection date.');
      return;
    }
    const dateObj = new Date(pledgeDate);
    if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
      setPledgeError('Collection date must be in the future.');
      return;
    }

    setPledgeError('');
    setPledgeLoading(true);

    try {
      await goodsDonationsApi.pledgeGoods(slug, {
        address: pledgeAddress.trim(),
        items: validatedItems,
        preferredCollectionDate: dateObj.toISOString(),
      });

      const summary = validatedItems.map((v) => `${v.quantity} × ${v.item}`).join(', ');
      toast.success(`Pledged ${summary} — thank you!`);
      setPledgeOpen(false);

      // Quietly refetch campaign to get accurate server-computed goodsProgress
      refetchCampaignQuietly();
      // Also refresh user's pledges
      fetchMyPledges();
    } catch (err) {
      setPledgeError(err?.message ?? 'Failed to submit pledge. Please try again.');
    } finally {
      setPledgeLoading(false);
    }
  };

  // ── Handle pledge cancellation ─────────────────────────────────
  const handleCancelPledge = async (donationId) => {
    setPledgeCancelLoading(donationId);
    try {
      await goodsDonationsApi.cancelPledge(donationId);
      toast.success('Pledge cancelled.');
      // Refresh pledges and campaign data
      fetchMyPledges();
      refetchCampaignQuietly();
    } catch (err) {
      toast.error(err?.message ?? 'Failed to cancel pledge.');
    } finally {
      setPledgeCancelLoading(null);
    }
  };

  /**
   * Full Razorpay donation flow:
   *   1. Call createOrder with campaign _id + amount
   *   2. Open Razorpay Checkout with returned order details
   *   3. On Razorpay success → call verifyPayment
   *   4. Show success toast, refetch campaign for updated amountRaised
   *
   * verify-payment marks the donation as 'captured' and increments
   * amountRaised synchronously (confirmed from paymentController.js).
   * The webhook is a redundant backup — so we can show true success,
   * not just "processing".
   */
  const handleDonate = async () => {
    const amt = Number(donateAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setDonateLoading(true);
    setDonatePhase('creating');

    try {
      // ── Step 1: create Razorpay order ──────────────────────────
      const orderRes = await paymentsApi.createOrder(campaign._id, amt);
      const { order, donationId: _donationId } = orderRes.data;

      setDonatePhase('checkout');

      // ── Step 2: open Razorpay Checkout ─────────────────────────
      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        toast.error('Payment configuration missing. Please try again later.');
        setDonateLoading(false);
        setDonatePhase('idle');
        return;
      }

      const options = {
        key: rzpKey,
        amount: order.amount, // in paise, from Razorpay order
        currency: order.currency,
        name: 'Utthan',
        description: `Donation to "${campaign.title}"`,
        order_id: order.id,
        prefill: {
          name: user?.name ?? '',
          email: user?.email ?? '',
        },
        theme: {
          color: '#6d5dfc',
        },
        handler: async (response) => {
          // ── Step 3: verify payment ────────────────────────────
          setDonatePhase('verifying');
          try {
            await paymentsApi.verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            setDonatePhase('done');
            setDonateOpen(false);
            toast.success(
              `Thank you! Your donation of ${formatCurrency(amt)} has been verified.`,
            );

            // Refetch campaign to pick up updated amountRaised
            fetchCampaign();
          } catch (verifyErr) {
            toast.error(
              verifyErr?.message ?? 'Payment verification failed. Please contact support.',
            );
          } finally {
            setDonateLoading(false);
            setDonatePhase('idle');
          }
        },
        modal: {
          // User-initiated cancel — not an error
          ondismiss: () => {
            setDonateLoading(false);
            setDonatePhase('idle');
          },
          escape: true,
          confirm_close: true,
        },
      };

      const rzp = new window.Razorpay(options);

      // Payment failure callback (distinct from user cancel)
      rzp.on('payment.failed', (failResponse) => {
        toast.error(
          failResponse?.error?.description ?? 'Payment failed. Please try again.',
        );
        setDonateLoading(false);
        setDonatePhase('idle');
      });

      rzp.open();
    } catch (err) {
      toast.error(err?.message ?? 'Could not create donation order. Please try again.');
      setDonateLoading(false);
      setDonatePhase('idle');
    }
  };

  // ── Loading / Error states ────────────────────────────────────

  if (loading) {
    return <PageSpinner message="Loading campaign…" />;
  }

  if (error) {
    return <PageError error={error} onRetry={fetchCampaign} />;
  }

  if (!campaign) {
    return <PageError error="Campaign not found." />;
  }

  // ── Derived data ──────────────────────────────────────────────

  const config = TYPE_CONFIG[campaign.type] ?? TYPE_CONFIG.fundraising;
  const CtaIcon = config.ctaIcon;

  const getProgress = () => {
    switch (campaign.type) {
      case 'fundraising':
        return campaign.fundingProgress ?? 0;
      case 'participation': {
        // Derive from local state so it updates immediately on join/leave
        const count = campaign.participantCount ?? 0;
        const goal = campaign.participantGoal ?? 0;
        const raw = goal > 0 ? (count / goal) * 100 : 0;
        return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 100) : 0;
      }
      case 'goods-donation':
        // Recompute locally from items to avoid stale server virtual
        return computeGoodsProgress(campaign.items);
      default:
        return 0;
    }
  };

  const rawProgress = getProgress();
  const progress = Number.isFinite(rawProgress) ? Math.min(Math.max(rawProgress, 0), 100) : 0;

  // ── Multi-item pledge dialog helper derivations ────────────────
  const totalPledgeQuantity = pledgeItems.reduce(
    (sum, row) => sum + (Number(row.quantity) > 0 ? Number(row.quantity) : 0),
    0,
  );

  const availableCampaignItems = (campaign?.items ?? []).filter(
    (item) => item.needed - (item.received ?? 0) > 0,
  );
  const canAddMoreItems = pledgeItems.length < availableCampaignItems.length;

  const hasRowErrors = pledgeItems.some((row) => {
    if (!row.item || !row.quantity) return true;
    const q = Number(row.quantity);
    if (isNaN(q) || q <= 0) return true;
    const item = campaign?.items?.find((i) => i.name === row.item);
    if (!item) return true;
    const rem = item.needed - (item.received ?? 0);
    return q > rem;
  });

  const isPledgeSubmitDisabled =
    pledgeLoading ||
    pledgeItems.length === 0 ||
    hasRowErrors ||
    !pledgeAddress.trim() ||
    !pledgeDate;

  // ── Render ────────────────────────────────────────────────────

  return (
    <article className="detail-page">
      {/* Back navigation */}
      <Link to="/campaigns" className="detail-back-link">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All campaigns
      </Link>

      {/* Cover image */}
      <div className="detail-cover-wrapper">
        {campaign.coverImage && (
          <img
            src={campaign.coverImage}
            alt={campaign.title}
            className="detail-cover-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="detail-cover-scrim" aria-hidden="true" />
      </div>

      {/* Main content grid */}
      <div className="detail-content">
        {/* ── Left column: info ── */}
        <div className="detail-main">
          {/* Badges */}
          <div className="detail-badges">
            <span className={`detail-badge ${config.badgeClass}`}>
              {config.label}
            </span>
            <span className="detail-badge detail-badge--category">
              <Tag className="size-3" aria-hidden="true" />
              {formatCategory(campaign.category)}
            </span>
            <span className={`detail-badge detail-badge--status detail-badge--status-${campaign.status}`}>
              {STATUS_LABELS[campaign.status] ?? campaign.status}
            </span>
          </div>

          {/* Title */}
          <h1 className="detail-title">{campaign.title}</h1>

          {/* Meta row */}
          <div className="detail-meta">
            {campaign.creator?.name && (
              <span className="detail-meta-item">
                <User className="size-4" aria-hidden="true" />
                {campaign.creator.name}
              </span>
            )}
            {campaign.createdAt && (
              <span className="detail-meta-item">
                <Calendar className="size-4" aria-hidden="true" />
                {formatDistanceToNow(new Date(campaign.createdAt), {
                  addSuffix: true,
                })}
              </span>
            )}
            {campaign.location?.address && (
              <span className="detail-meta-item">
                <MapPin className="size-4" aria-hidden="true" />
                {campaign.location.address}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="detail-description">
            <h2 className="detail-section-heading">About this campaign</h2>
            <p>{campaign.description}</p>
          </div>

          {/* ── Type-specific content ── */}
          {campaign.type === 'fundraising' && (
            <FundraisingSection campaign={campaign} progress={progress} config={config} />
          )}
          {campaign.type === 'participation' && (
            <ParticipationSection campaign={campaign} progress={progress} config={config} />
          )}
          {campaign.type === 'goods-donation' && (
            <GoodsDonationSection campaign={campaign} progress={progress} config={config} />
          )}

          {/* Gallery */}
          {campaign.images?.length > 0 && (
            <div className="detail-gallery">
              <h2 className="detail-section-heading">Gallery</h2>
              <div className="detail-gallery-grid">
                {campaign.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${campaign.title} — photo ${i + 1}`}
                    className="detail-gallery-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: CTA sidebar ── */}
        <aside className="detail-sidebar">
          <div className="detail-cta-card">
            {/* Progress */}
            <div className="detail-cta-progress">
              <div className="detail-progress-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={`detail-progress-fill ${config.progressClass}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="detail-cta-progress-pct">
                {Math.round(progress)}% complete
              </span>
            </div>

            {/* Type-specific stats in sidebar */}
            {campaign.type === 'fundraising' && (
              <div className="detail-cta-stats">
                <div className="detail-cta-stat">
                  <span className="detail-cta-stat-value">
                    {formatCurrency(campaign.amountRaised ?? 0)}
                  </span>
                  <span className="detail-cta-stat-label">raised</span>
                </div>
                <div className="detail-cta-stat">
                  <span className="detail-cta-stat-value">
                    {formatCurrency(campaign.amountNeeded ?? 0)}
                  </span>
                  <span className="detail-cta-stat-label">goal</span>
                </div>
              </div>
            )}
            {campaign.type === 'participation' && (
              <div className="detail-cta-stats">
                <div className="detail-cta-stat">
                  <span className="detail-cta-stat-value">
                    {campaign.participantCount ?? 0}
                  </span>
                  <span className="detail-cta-stat-label">joined</span>
                </div>
                <div className="detail-cta-stat">
                  <span className="detail-cta-stat-value">
                    {campaign.participantGoal ?? 0}
                  </span>
                  <span className="detail-cta-stat-label">goal</span>
                </div>
              </div>
            )}
            {campaign.type === 'goods-donation' && (
              <div className="detail-cta-stats">
                <div className="detail-cta-stat">
                  <span className="detail-cta-stat-value">
                    {campaign.items?.reduce((s, i) => s + (i.received ?? 0), 0) ?? 0}
                  </span>
                  <span className="detail-cta-stat-label">items received</span>
                </div>
                <div className="detail-cta-stat">
                  <span className="detail-cta-stat-value">
                    {campaign.items?.reduce((s, i) => s + i.needed, 0) ?? 0}
                  </span>
                  <span className="detail-cta-stat-label">items needed</span>
                </div>
              </div>
            )}

            {/* CTA button */}
            {campaign.type === 'participation' ? (() => {
              const ctaState = getParticipationCtaState();
              const CtaIconResolved = ctaState?.icon ?? Users;
              return (
                <Button
                  size="lg"
                  className={`detail-cta-button ${hasJoined ? 'detail-cta-button--leave' : ''}`}
                  onClick={handleCtaClick}
                  disabled={ctaState?.disabled || joinLoading || joinStatusLoading}
                  loading={joinLoading || joinStatusLoading}
                >
                  <CtaIconResolved className="size-4" data-icon="inline-start" aria-hidden="true" />
                  {joinStatusLoading ? 'Checking…' : (ctaState?.label ?? config.ctaLabel)}
                </Button>
              );
            })() : campaign.type === 'goods-donation' ? (() => {
              const goodsState = getGoodsCtaState();
              return (
                <>
                  <Button
                    size="lg"
                    className="detail-cta-button"
                    onClick={handleCtaClick}
                    disabled={goodsState?.disabled}
                  >
                    <Package className="size-4" data-icon="inline-start" aria-hidden="true" />
                    {goodsState?.label ?? config.ctaLabel}
                  </Button>
                  {goodsState?.reason && (
                    <div className="detail-cta-disabled-reason">
                      <AlertCircle className="size-3" aria-hidden="true" />
                      {goodsState.reason}
                    </div>
                  )}
                </>
              );
            })() : (
              <Button
                size="lg"
                className="detail-cta-button"
                onClick={handleCtaClick}
                disabled={campaign.status === 'closed'}
              >
                <CtaIcon className="size-4" data-icon="inline-start" aria-hidden="true" />
                {campaign.status === 'closed' ? 'Campaign closed' : config.ctaLabel}
              </Button>
            )}

            {/* My pledges (goods-donation) */}
            {campaign.type === 'goods-donation' && isAuthenticated && myPledges.length > 0 && (
              <>
                <span className="pledge-section-heading">Your pledges</span>
                <div className="pledge-list">
                  {myPledges.map((pledge) => (
                    <div key={pledge._id} className="pledge-card">
                      <div className="pledge-card-header">
                        <span className="pledge-card-items">
                          {pledge.items?.map((pi) => `${pi.quantity} × ${pi.item}`).join(', ')}
                        </span>
                        <span className={`pledge-card-status pledge-card-status--${pledge.status}`}>
                          {pledge.status}
                        </span>
                      </div>
                      <span className="pledge-card-meta">
                        {pledge.createdAt && formatDistanceToNow(new Date(pledge.createdAt), { addSuffix: true })}
                      </span>
                      {pledge.status === 'pledged' && (
                        <div className="pledge-card-actions">
                          <button
                            type="button"
                            className="pledge-card-action pledge-card-action--cancel"
                            disabled={pledgeCancelLoading === pledge._id}
                            onClick={() => handleCancelPledge(pledge._id)}
                          >
                            {pledgeCancelLoading === pledge._id ? 'Cancelling…' : 'Cancel pledge'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Creator info */}
            {campaign.creator?.name && (
              <div className="detail-cta-creator">
                <div className="detail-cta-creator-avatar">
                  {campaign.creator.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="detail-cta-creator-label">Organized by</span>
                  <span className="detail-cta-creator-name">
                    {campaign.creator.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Donate dialog (fundraising only) ── */}
      {campaign.type === 'fundraising' && (
        <Dialog open={donateOpen} onOpenChange={setDonateOpen}>
          <DialogContent showCloseButton={!donateLoading}>
            <DialogHeader>
              <DialogTitle>Make a Donation</DialogTitle>
              <DialogDescription>
                Support <strong>{campaign.title}</strong> with a monetary contribution.
              </DialogDescription>
            </DialogHeader>

            <div className="donate-dialog-body">
              <label className="donate-dialog-label" htmlFor="donate-amount">
                Amount (₹)
              </label>
              <div className="donate-dialog-input-wrapper">
                <IndianRupee className="size-4 donate-dialog-input-icon" aria-hidden="true" />
                <Input
                  id="donate-amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 500"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  disabled={donateLoading}
                  className="donate-dialog-input"
                  autoFocus
                />
              </div>

              {/* Quick-pick amounts */}
              <div className="donate-dialog-presets">
                {[100, 500, 1000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="donate-dialog-preset"
                    disabled={donateLoading}
                    onClick={() => setDonateAmount(String(preset))}
                  >
                    ₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Phase indicator */}
              {donateLoading && (
                <p className="donate-dialog-status">
                  {donatePhase === 'creating' && 'Creating order…'}
                  {donatePhase === 'checkout' && 'Waiting for payment…'}
                  {donatePhase === 'verifying' && 'Verifying payment…'}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDonateOpen(false)}
                disabled={donateLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDonate}
                loading={donateLoading}
                disabled={donateLoading || !donateAmount || Number(donateAmount) <= 0}
              >
                <Heart className="size-4" data-icon="inline-start" aria-hidden="true" />
                Donate {donateAmount && Number(donateAmount) > 0 ? formatCurrency(Number(donateAmount)) : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Goods pledge dialog (multi-item) ── */}
      {campaign.type === 'goods-donation' && (
        <Dialog open={pledgeOpen} onOpenChange={setPledgeOpen}>
          <DialogContent showCloseButton={!pledgeLoading} className="max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Pledge Goods</DialogTitle>
              <DialogDescription>
                Pledge items for <strong>{campaign.title}</strong>. You will be contacted for collection.
              </DialogDescription>
            </DialogHeader>

            <div className="pledge-dialog-body">
              {/* Multi-item picker section */}
              <div className="pledge-dialog-field">
                <div className="pledge-dialog-section-header">
                  <label className="pledge-dialog-label">
                    Items to pledge
                  </label>
                  <span className="pledge-dialog-hint">
                    {pledgeItems.length} {pledgeItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="pledge-items-list">
                  {pledgeItems.map((row, index) => {
                    const rowError = getRowValidationError(row);
                    const selectedCampaignItem = campaign.items?.find((i) => i.name === row.item);
                    const remaining = selectedCampaignItem
                      ? selectedCampaignItem.needed - (selectedCampaignItem.received ?? 0)
                      : 0;
                    const itemPct =
                      selectedCampaignItem && selectedCampaignItem.needed > 0
                        ? Math.min((selectedCampaignItem.received / selectedCampaignItem.needed) * 100, 100)
                        : 0;

                    return (
                      <div key={index} className="pledge-item-row" data-testid={`pledge-item-row-${index}`}>
                        <div className="pledge-item-row-controls">
                          {/* Item selector */}
                          <div className="pledge-item-row-select-wrapper">
                            <select
                              id={`pledge-item-${index}`}
                              className="pledge-dialog-select"
                              value={row.item}
                              onChange={(e) => handleItemChange(index, e.target.value)}
                              disabled={pledgeLoading}
                              aria-label={`Select item for row ${index + 1}`}
                            >
                              <option value="">Choose an item…</option>
                              {(campaign.items ?? []).map((item) => {
                                const itemRemaining = item.needed - (item.received ?? 0);
                                const isFull = itemRemaining <= 0;
                                const isChosenElsewhere = pledgeItems.some(
                                  (other, oIdx) => oIdx !== index && other.item === item.name,
                                );
                                const isDisabled = isFull || isChosenElsewhere;
                                let optLabel = item.name;
                                if (isFull) {
                                  optLabel += ' (fulfilled)';
                                } else if (isChosenElsewhere) {
                                  optLabel += ' (already selected)';
                                } else {
                                  optLabel += ` (${itemRemaining} still needed)`;
                                }

                                return (
                                  <option key={item.name} value={item.name} disabled={isDisabled}>
                                    {optLabel}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div className="pledge-item-row-qty-wrapper">
                            <input
                              id={`pledge-quantity-${index}`}
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              disabled={pledgeLoading || !row.item}
                              className="pledge-dialog-input"
                              aria-label={`Quantity for row ${index + 1}`}
                            />
                          </div>

                          {/* Remove row button */}
                          <button
                            type="button"
                            className="pledge-item-row-remove"
                            onClick={() => handleRemoveRow(index)}
                            disabled={pledgeLoading || pledgeItems.length <= 1}
                            title={pledgeItems.length <= 1 ? 'At least one item required' : 'Remove item'}
                            aria-label={`Remove row ${index + 1}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>

                        {/* Item progress info */}
                        {row.item && selectedCampaignItem && (
                          <div className="pledge-dialog-item-info">
                            <div className="pledge-dialog-item-progress">
                              <span className="pledge-dialog-item-progress-text">
                                <strong>{selectedCampaignItem.received ?? 0}</strong> of <strong>{selectedCampaignItem.needed}</strong> received
                              </span>
                              <div className="pledge-dialog-item-progress-track">
                                <div
                                  className="pledge-dialog-item-progress-fill"
                                  style={{ width: `${itemPct}%` }}
                                />
                              </div>
                            </div>
                            {remaining > 0 ? (
                              <span className="pledge-dialog-item-remaining">{remaining} needed</span>
                            ) : (
                              <span className="pledge-dialog-item-full">Fulfilled</span>
                            )}
                          </div>
                        )}

                        {/* Row validation error */}
                        {rowError && (
                          <div className="pledge-item-row-error" role="alert">
                            <AlertCircle className="size-3 flex-shrink-0" aria-hidden="true" />
                            <span>{rowError}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add another item button */}
                <button
                  type="button"
                  className="pledge-add-row-btn"
                  onClick={handleAddRow}
                  disabled={pledgeLoading || !canAddMoreItems}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>
                    {canAddMoreItems
                      ? 'Add another item'
                      : 'All available items selected'}
                  </span>
                </button>
              </div>

              {/* Address */}
              <div className="pledge-dialog-field">
                <label className="pledge-dialog-label" htmlFor="pledge-address">
                  Pickup address
                </label>
                <Input
                  id="pledge-address"
                  type="text"
                  placeholder="Your address for collection"
                  value={pledgeAddress}
                  onChange={(e) => {
                    setPledgeAddress(e.target.value);
                    setPledgeError('');
                  }}
                  disabled={pledgeLoading}
                />
              </div>

              {/* Collection date */}
              <div className="pledge-dialog-field">
                <label className="pledge-dialog-label" htmlFor="pledge-date">
                  Preferred collection date
                </label>
                <Input
                  id="pledge-date"
                  type="date"
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  value={pledgeDate}
                  onChange={(e) => {
                    setPledgeDate(e.target.value);
                    setPledgeError('');
                  }}
                  disabled={pledgeLoading}
                />
              </div>

              {/* General error banner */}
              {pledgeError && (
                <p className="pledge-dialog-error" role="alert">
                  <AlertCircle className="size-3" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} aria-hidden="true" />
                  {pledgeError}
                </p>
              )}

              {/* Loading status */}
              {pledgeLoading && (
                <p className="pledge-dialog-status">Submitting pledge…</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPledgeOpen(false)}
                disabled={pledgeLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePledgeSubmit}
                loading={pledgeLoading}
                disabled={isPledgeSubmitDisabled}
                className="pledge-dialog-submit-btn"
              >
                <Package className="size-4" data-icon="inline-start" aria-hidden="true" />
                Pledge {totalPledgeQuantity > 0 ? `${totalPledgeQuantity} items` : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}

// ── Type-specific sub-components ──────────────────────────────

function FundraisingSection({ campaign, progress, config }) {
  return (
    <div className="detail-type-section">
      <h2 className="detail-section-heading">Fundraising Progress</h2>
      <div className="detail-progress-track detail-progress-track--large" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`detail-progress-fill ${config.progressClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="detail-type-stats">
        <span>
          <strong>{formatCurrency(campaign.amountRaised ?? 0)}</strong> raised
          of {formatCurrency(campaign.amountNeeded ?? 0)}
        </span>
      </div>
    </div>
  );
}

function ParticipationSection({ campaign, progress, config }) {
  return (
    <div className="detail-type-section">
      <h2 className="detail-section-heading">Participation Progress</h2>
      <div className="detail-progress-track detail-progress-track--large" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`detail-progress-fill ${config.progressClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="detail-type-stats">
        <span>
          <strong>{campaign.participantCount ?? 0}</strong> of{' '}
          {campaign.participantGoal ?? 0} participants
        </span>
      </div>
    </div>
  );
}

function GoodsDonationSection({ campaign, progress, config }) {
  const items = campaign.items ?? [];
  return (
    <div className="detail-type-section">
      <h2 className="detail-section-heading">Goods Collection Progress</h2>
      <div className="detail-progress-track detail-progress-track--large" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`detail-progress-fill ${config.progressClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="detail-type-stats">
        <span>
          <strong>{Math.round(progress)}%</strong> of needed items collected
        </span>
      </div>

      {/* Items table */}
      {items.length > 0 && (
        <div className="detail-items-table-wrapper">
          <table className="detail-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Received</th>
                <th>Needed</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const itemProgress = item.needed > 0
                  ? Math.min((item.received / item.needed) * 100, 100)
                  : 0;
                return (
                  <tr key={i}>
                    <td className="detail-item-name">{item.name}</td>
                    <td>{item.received ?? 0}</td>
                    <td>{item.needed}</td>
                    <td>
                      <div className="detail-item-progress-track">
                        <div
                          className={`detail-progress-fill ${config.progressClass}`}
                          style={{ width: `${itemProgress}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CampaignDetailPage;
