import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
};

/**
 * Animated SVG spinner with size variants.
 * Uses currentColor by default, so it inherits text color from parent context.
 */
function Spinner({ size = 'md', className, ...props }) {
  return (
    <svg
      className={cn('animate-spin', sizeMap[size] ?? sizeMap.md, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { Spinner };
