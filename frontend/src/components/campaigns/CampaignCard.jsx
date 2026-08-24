import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

/**
 * Type configuration — label text and CSS modifier for the type badge.
 * Keys match the backend's `type` enum exactly.
 */
const TYPE_CONFIG = {
  fundraising: {
    label: 'Fundraising',
    badgeClass: 'campaign-card-badge--fundraising',
    progressClass: 'campaign-card-progress-fill--fundraising',
  },
  participation: {
    label: 'Participation',
    badgeClass: 'campaign-card-badge--participation',
    progressClass: 'campaign-card-progress-fill--participation',
  },
  'goods-donation': {
    label: 'Goods Donation',
    badgeClass: 'campaign-card-badge--goods',
    progressClass: 'campaign-card-progress-fill--goods-donation',
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

/** Format a number as Indian-locale currency (no decimals). */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Derive progress percentage and human-readable text
 * from the campaign's type-specific fields + virtual.
 */
function getProgressInfo(campaign) {
  switch (campaign.type) {
    case 'fundraising':
      return {
        progress: campaign.fundingProgress ?? 0,
        text: `${formatCurrency(campaign.amountRaised ?? 0)} of ${formatCurrency(campaign.amountNeeded ?? 0)}`,
      };
    case 'participation':
      return {
        progress: campaign.participationProgress ?? 0,
        text: `${campaign.participantCount ?? 0} of ${campaign.participantGoal ?? 0} participants`,
      };
    case 'goods-donation':
      return {
        progress: campaign.goodsProgress ?? 0,
        text: `${Math.round(campaign.goodsProgress ?? 0)}% collected`,
      };
    default:
      return { progress: 0, text: '' };
  }
}

/**
 * Reusable campaign card — used on both the /campaigns grid and
 * the homepage's Featured Campaigns section.
 *
 * Shows: cover image, type badge, category, title, progress bar,
 * and location address. Entire card is a link to the detail page.
 */
function CampaignCard({ campaign }) {
  const config = TYPE_CONFIG[campaign.type] ?? TYPE_CONFIG.fundraising;
  const { progress, text } = getProgressInfo(campaign);
  const clampedProgress = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;

  return (
    <article className="campaign-card">
      <Link
        to={`/campaigns/${campaign.slug}`}
        className="campaign-card-link"
        aria-label={`View campaign: ${campaign.title}`}
      >
        {/* ── Image ── */}
        <div className="campaign-card-img-wrapper">
          {campaign.coverImage && (
            <img
              src={campaign.coverImage}
              alt=""
              className="campaign-card-img"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span className={`campaign-card-type-badge ${config.badgeClass}`}>
            {config.label}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="campaign-card-body">
          <span className="campaign-card-category">
            {formatCategory(campaign.category)}
          </span>

          <h3 className="campaign-card-title">{campaign.title}</h3>

          {/* Progress */}
          <div className="campaign-card-progress">
            <div className="campaign-card-progress-track" role="progressbar" aria-valuenow={Math.round(clampedProgress)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`campaign-card-progress-fill ${config.progressClass}`}
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
            <span className="campaign-card-progress-text">{text}</span>
          </div>

          {/* Location */}
          {campaign.location?.address && (
            <div className="campaign-card-location">
              <MapPin className="campaign-card-location-icon" aria-hidden="true" />
              <span>{campaign.location.address}</span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

export { CampaignCard };
