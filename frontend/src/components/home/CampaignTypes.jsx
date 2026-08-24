import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import volunteersImg from '@/assets/pexels-volunteers-team-6647026.jpg';
import foodBoxesImg from '@/assets/Volunteers-assemblying-food-boxes-12-22-24.webp';
import communityImg from '@/assets/pexels-community-helping-6646917.jpg';

/**
 * Asymmetric campaign-type showcase.
 *
 * Desktop: 2-column CSS grid — Fundraising spans full height on the left,
 * Participation and Goods Donation are stacked on the right.
 * Each panel uses a real photo background with a gradient scrim overlay
 * to guarantee text legibility.
 */

const CAMPAIGNS = [
  {
    id: 'fundraising',
    title: 'Fundraising',
    description:
      'Rally your community to raise money for causes that matter — from medical emergencies to education.',
    linkText: 'Explore fundraisers',
    to: '/campaigns?type=fundraising',
    image: communityImg,
    imageAlt: 'Community members joining hands in support',
    tintClass: 'campaign-panel--amber',
  },
  {
    id: 'participation',
    title: 'Participation',
    description:
    `Volunteer your time and skills where they're needed most.`,
    linkText: 'Find opportunities',
    to: '/campaigns?type=participation',
    image: volunteersImg,
    imageAlt: 'Volunteers with cleaning equipment smiling outdoors',
    tintClass: 'campaign-panel--burgundy',
  },
  {
    id: 'goods-donation',
    title: 'Goods Donation',
    description:
      'Donate supplies — food, clothing, books — directly to those in need.',
    linkText: 'Donate goods',
    to: '/campaigns?type=goods-donation',
    image: foodBoxesImg,
    imageAlt: 'Volunteers assembling food boxes at a community drive',
    tintClass: 'campaign-panel--sage',
  },
];

function CampaignTypes() {
  return (
    <section
      id="campaign-types"
      className="campaign-types-section"
      aria-labelledby="campaign-types-heading"
    >
      <div className="campaign-types-header">
        <span className="campaign-types-eyebrow">Ways to help</span>
        <h2 id="campaign-types-heading" className="campaign-types-title">
          Choose how you make an impact
        </h2>
      </div>

      <div className="campaign-types-grid">
        {CAMPAIGNS.map((campaign) => (
          <article
            key={campaign.id}
            className={`campaign-panel ${campaign.tintClass}`}
          >
            <img
              src={campaign.image}
              alt={campaign.imageAlt}
              className="campaign-panel-img"
              loading="lazy"
            />
            {/* Gradient scrim for text legibility over photos */}
            <div className="campaign-panel-scrim" aria-hidden="true" />

            <div className="campaign-panel-content">
              <h3 className="campaign-panel-title">{campaign.title}</h3>
              <p className="campaign-panel-desc">{campaign.description}</p>
              <Link to={campaign.to} className="campaign-panel-link">
                {campaign.linkText}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CampaignTypes;
