import { Leaf, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarbonStatusBadgeProps {
  isNeutral: boolean;
  className?: string;
}

export function CarbonStatusBadge({ isNeutral, className }: CarbonStatusBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm",
      isNeutral 
        ? "bg-success/10 text-success border border-success/20" 
        : "bg-warning/10 text-warning border border-warning/20",
      className
    )}>
      {isNeutral ? (
        <>
          <Leaf className="w-4 h-4" />
          <span>Carbon Neutral</span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4" />
          <span>Not Carbon Neutral</span>
        </>
      )}
    </div>
  );
}
