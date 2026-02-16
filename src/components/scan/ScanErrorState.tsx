import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ImageMinus } from 'lucide-react';

interface ScanErrorStateProps {
  message: string;
  onRetry: () => void;
  onRetryWithSmaller?: () => void | Promise<void>;
  onReset?: () => void;
}

function getFriendlyMessage(raw: string): string {
  // Show specific API setup errors as-is (they already have clear instructions)
  if (/not enabled|PERMISSION_DENIED|Generative Language/i.test(raw)) return raw;
  if (/API access denied/i.test(raw)) return raw;
  if (/Invalid Google AI key/i.test(raw)) return raw;
  // Show rate limit details from Google
  if (/rate limit/i.test(raw)) return raw;
  if (/size|too large/i.test(raw)) return 'Image is too large. Try a smaller photo or screenshot.';
  if (/Failed to fetch|NetworkError|CORS|blocked/i.test(raw)) {
    return 'Network error — could not reach Google AI. Check your internet connection and try again.';
  }
  return raw;
}

export function ScanErrorState({ message, onRetry, onRetryWithSmaller, onReset }: ScanErrorStateProps) {
  const friendlyMessage = getFriendlyMessage(message);
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Analysis failed</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{friendlyMessage}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button onClick={onRetry} size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        {onRetryWithSmaller && (
          <Button onClick={onRetryWithSmaller} variant="secondary" size="lg">
            <ImageMinus className="mr-2 h-4 w-4" />
            Try smaller image
          </Button>
        )}
        {onReset && (
          <Button onClick={onReset} variant="outline" size="lg">
            Choose different image
          </Button>
        )}
      </div>
    </div>
  );
}
