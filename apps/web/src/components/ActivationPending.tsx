// ActivationPending.tsx
import { Phone, User2, Clock, AlertCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@repo/ui";
import type { Position } from "@repo/types";

interface ActivationPendingProps {
  position: Position;
}

export const ActivationPending: React.FC<ActivationPendingProps> = ({
  position,
}) => {
  return (
    <div className="w-full">
      <Card className="border-2 border-yellow-500/30 rounded-2xl shadow-sm overflow-hidden bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader className="pb-4 bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-500/30">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-yellow-900 dark:text-yellow-100">
            <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
            Activation Payment Under Review
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Status Message */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-500/30">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Your payment proof has been submitted and is pending verification.
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                This usually takes 24-48 hours. You'll be notified once approved.
              </p>
            </div>
          </div>

          {/* Sponsor Contact Info */}
          {position.sponsorId && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User2 className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="font-medium text-sm">
                  Need help? Contact your sponsor
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Name:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {position.sponsorName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">ID:</span>
                  <span className="text-sm font-mono text-foreground">
                    {position.sponsorId}
                  </span>
                </div>

                {position.sponsorMobile && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Mobile:</span>
                    <a
                      href={`tel:+91${position.sponsorMobile}`}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      +91-{position.sponsorMobile}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <span className="font-medium">Tip:</span> Call your sponsor to verify they received your payment and speed up the approval process.
                </p>
              </div>
            </div>
          )}

          {/* Position Info */}
          <div className="p-3 bg-muted/50 rounded-lg border text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account ID:</span>
              <span className="font-mono text-foreground font-medium">{position.positionId}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
