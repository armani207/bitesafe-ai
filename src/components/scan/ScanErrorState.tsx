import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ScanErrorStateProps {
  message: string;
  onRetry: () => void;
  onReset?: () => void;
}

export function ScanErrorState({ message, onRetry, onReset }: ScanErrorStateProps) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Analysis failed</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{message}</p>
      <div className="flex gap-3">
        <Button onClick={onRetry} size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        {onReset && (
          <Button onClick={onReset} variant="outline" size="lg">
            Choose different image
          </Button>
        )}
      </div>
    </div>
  );
}
