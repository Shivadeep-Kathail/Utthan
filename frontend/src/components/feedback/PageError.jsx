import { AlertCircle, WifiOff, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ERROR_CODES } from '@/utils/apiError';

const ICON_MAP = {
  [ERROR_CODES.NETWORK_ERROR]: WifiOff,
  [ERROR_CODES.SERVER_ERROR]: ServerCrash,
};

/**
 * Page-level error display with optional retry.
 * Accepts an ApiError instance or a plain string.
 */
function PageError({ error, onRetry }) {
  const message =
    typeof error === 'string'
      ? error
      : error?.message ?? 'Something went wrong.';

  const code = typeof error === 'object' ? error?.code : null;
  const isRetryable = typeof error === 'object' ? error?.isRetryable : false;
  const Icon = ICON_MAP[code] ?? AlertCircle;

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center"
      role="alert"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="size-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {(onRetry && isRetryable) && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export { PageError };
