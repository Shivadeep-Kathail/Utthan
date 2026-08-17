import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Generic skeleton card: image placeholder block + text line placeholders.
 * Intentionally not shaped to any specific layout — use as a building block
 * for list loading states.
 */
function CardSkeleton({ className }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 space-y-4',
        className,
      )}
    >
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-md" />
      {/* Text line placeholders */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export { CardSkeleton };
