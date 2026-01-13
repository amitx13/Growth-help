import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export const TermsModal = ({ open, onClose }: TermsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Terms & Conditions</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          <ul className="space-y-3 text-base leading-relaxed mt-4">
            <li>✓ Growth Help is a community-driven platform and does not collect or hold money from any user.</li>
            <li>✓ This platform operates as a voluntary, non-refundable, gift-based crowdfunding system.</li>
            <li>✓ Members support each other by sending contributions (gifts) directly through secure peer-to-peer transactions.</li>
            <li>✓ Growth Help is not an MLM, network marketing structure, or ponzi scheme.</li>
            <li>✓ Account registration is completed using an e-pin costing ₹50.</li>
          </ul>
        </DialogDescription>

        <DialogFooter>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
