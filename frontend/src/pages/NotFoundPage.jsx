import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 404 — Page not found.
 */
function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/" className={cn(buttonVariants())}>
        Go home
      </Link>
    </section>
  );
}

export default NotFoundPage;
