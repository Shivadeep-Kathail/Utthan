import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import heroImg from '@/assets/community-helping-hands-stockcake.jpg';

/**
 * Asymmetric two-column hero.
 * Left: eyebrow + mixed-weight headline + subhead + differentiated CTAs.
 * Right: real photography in a shaped container.
 */
function Hero() {
  return (
    <section
      id="hero"
      className="hero-section"
      aria-labelledby="hero-heading"
    >
      {/* ── Text column ── */}
      <div className="hero-text">
        <span className="hero-eyebrow">Community-powered impact</span>

        <h1 id="hero-heading" className="hero-heading">
          Uplift communities.
          <br />
          <span className="hero-heading-accent">Fund real change.</span>
        </h1>

        <p className="hero-subhead">
          Utthan connects people who want to help with causes that need
          them&nbsp;— through fundraising, volunteering, and goods donations
          across India.
        </p>

        {/* CTAs — primary is large filled, secondary is a text-link with arrow */}
        <div className="hero-ctas">
          <Link
            to="/campaigns"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'hero-cta-primary',
            )}
          >
            Discover campaigns
          </Link>

          <Link to="/create-campaign" className="hero-cta-secondary">
            Start a campaign
            <ArrowRight className="hero-cta-arrow" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* ── Photo column ── */}
      <div className="hero-photo-wrapper">
        <img
          src={heroImg}
          alt="Community members reaching out their hands in support"
          className="hero-photo"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}

export default Hero;
