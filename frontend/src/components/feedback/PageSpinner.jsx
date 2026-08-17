import { Spinner } from '@/components/ui/spinner';

/**
 * Full-page centered spinner for route-level loading states.
 * Takes up remaining viewport height via min-h-[60vh].
 */
function PageSpinner({ message = 'Loading...' }) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3"
      role="status"
      aria-label={message}
    >
      <Spinner size="lg" className="text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export { PageSpinner };
