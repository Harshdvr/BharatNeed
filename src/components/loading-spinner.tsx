
import BharatNeedLogo from './bharat-need-logo';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  showText?: boolean;
}

export default function LoadingSpinner({ className, showText = true }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <BharatNeedLogo className="h-16 w-auto animate-pulse" />
      {showText && <p className="text-muted-foreground animate-pulse">Loading...</p>}
    </div>
  );
}
