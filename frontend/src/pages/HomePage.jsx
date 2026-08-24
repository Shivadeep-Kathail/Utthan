import Hero from '@/components/home/Hero';
import StatsBar from '@/components/home/StatsBar';
import CampaignTypes from '@/components/home/CampaignTypes';
import FeaturedCampaigns from '@/components/home/FeaturedCampaigns';

/**
 * Landing page — hero, social-proof stats, campaign-type showcase,
 * and featured campaigns from the live backend.
 */
function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <CampaignTypes />
      <FeaturedCampaigns />
    </>
  );
}

export default HomePage;
