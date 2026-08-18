/**
 * Social-proof stats row near the hero.
 * All numbers are placeholder — will be wired to a real endpoint later.
 */

// TODO: wire to real stats endpoint once built
const STATS = [
  { value: '1,200+', label: 'Campaigns Funded' },
  { value: '8,500+', label: 'Volunteers' },
  { value: '₹25L+', label: 'Raised' },
  { value: '50+', label: 'Cities Reached' },
];

function StatsBar() {
  return (
    <section id="stats-bar" className="stats-bar" aria-label="Platform statistics">
      <div className="stats-bar-inner">
        {STATS.map((stat) => (
          <div key={stat.label} className="stat-item">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsBar;
