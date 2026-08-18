import Hero from '@/components/home/Hero';
import StatsBar from '@/components/home/StatsBar';
import CampaignTypes from '@/components/home/CampaignTypes';

/**
 * Landing page — hero, social-proof stats, and campaign-type showcase.
 */
function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <CampaignTypes />
    </>
  );
}

export default HomePage;
