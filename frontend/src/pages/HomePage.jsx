import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { Heart, Users, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Home page — placeholder for Phase 3 (hero, featured campaigns, CTAs).
 */
function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Uplift communities.{' '}
          <span className="text-primary">Fund change.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Utthan connects people who want to help with causes that need them —
          through fundraising, participation, and goods donations.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/campaigns" className={cn(buttonVariants({ size: 'lg' }))}>
          Discover campaigns
        </Link>
        <Link to="/create-campaign" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
          Start a campaign
        </Link>
      </div>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { icon: Heart, title: 'Fundraising', desc: 'Raise money for causes that matter.' },
          { icon: Users, title: 'Participation', desc: 'Volunteer your time and skills.' },
          { icon: Package, title: 'Goods Donation', desc: 'Donate supplies where they\'re needed.' },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-border bg-card p-6 text-center transition-shadow hover:shadow-md"
          >
            <item.icon className="mx-auto mb-3 size-8 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomePage;
