import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Inline error message for forms, sections, or field-level feedback.
 * Accepts an ApiError, a string, or null/undefined (renders nothing).
 */
function InlineError({ error, className }) {
  if (!error) return null;

  const message =
    typeof error === 'string'
      ? error
      : error?.message ?? 'Something went wrong.';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-sm text-destructive',
        className,
      )}
      role="alert"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export { InlineError };
