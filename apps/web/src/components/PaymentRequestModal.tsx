import * as React from "react";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Separator,
  Card,
  CardContent,
} from "@repo/ui";
import {
  ImageUp,
  IndianRupee,
  User2,
  Banknote,
  Copy,
  Check,
  AlertTriangle,
  ImageIcon,
  Maximize2,
} from "lucide-react";
import type { PaymentType } from "@repo/types";
import { toast } from "sonner";
import api from "../lib/axios";

interface PaymentRequestModalProps {
  open: boolean;
  linkId?: string;
  payment: PaymentType;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
  open,
  linkId,
  payment,
  onClose,
  onSubmitted,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsSubmitting(false);
    setCopiedField(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setError("Please upload an image (screenshot) file.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(<div className="text-green-600">{`Copied! ${text}`}</div>);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload the transaction screenshot first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("paymentId", payment.id);
      if(linkId){
        formData.append("pendingLinkId", linkId);
      }
      formData.append("paymentType", payment.paymentType);

      const res = await api.post("/payments/upload-payment", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        if (onSubmitted) onSubmitted();
        resetState();
        onClose();
        toast.success(
          <div className="text-primary">
            Payment request submitted for verification.
          </div>
        );
      }
    } catch (error: any) {
      if (error.response?.data) {
        setError(error.response.data.error);
        toast.error(
          <div className="text-red-500">{error.response.data.error}</div>
        );
      } else if (error.message) {
        setError(error.message);
        toast.error(<div className="text-red-500">{error.message}</div>);
      } else {
        setError("Something went wrong while submitting. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const getImageUrl = (screenshotUrl: string) => {
    return `${import.meta.env.VITE_BASE_URL}${screenshotUrl}`;
  };

  const title =
    payment.paymentType === "UPGRADE"
      ? "Upgrade Payment"
      : payment.paymentType === "ACTIVATION"
      ? "Activation Payment"
      : "Sponsor Payment";

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <IndianRupee className="h-5 w-5 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription>
              Send the amount to the receiver below and upload the payment
              screenshot for verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Receiver Details Card */}
            <Card className="border bg-muted/40">
              <CardContent className="space-y-3 pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <User2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm">
                    Pay to:{" "}
                    <span className="font-semibold break-words">
                      {payment.receiverName}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Banknote className="h-4 w-4 flex-shrink-0 text-green-600" />
                  <span className="text-green-600 font-semibold">
                    Amount to pay: ₹{payment.amount}
                  </span>
                </div>

                <Separator />

                <div className="grid gap-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">Receiver ID:</span>
                    <span className="font-mono text-right break-all">
                      {payment.receiverId}
                    </span>
                  </div>

                  {payment.Mobile && (
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">Phone:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-right">+91-{payment.Mobile}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(payment.Mobile, "mobile")}
                        >
                          {copiedField === "mobile" ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Bank Details Section */}
                  {payment.receiverBankDetails ? (
                    <>
                      {payment.receiverBankDetails.bankName && (
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">Bank:</span>
                          <span className="text-right break-words">
                            {payment.receiverBankDetails.bankName}
                          </span>
                        </div>
                      )}
                      {payment.receiverBankDetails.accountNumber && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-medium">Account No:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-right break-all text-sm">
                              {payment.receiverBankDetails.accountNumber}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 flex-shrink-0"
                              onClick={() =>
                                handleCopy(
                                  payment.receiverBankDetails!.accountNumber!,
                                  "account"
                                )
                              }
                            >
                              {copiedField === "account" ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      {payment.receiverBankDetails.ifscCode && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-medium">IFSC Code:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-right">
                              {payment.receiverBankDetails.ifscCode}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 flex-shrink-0"
                              onClick={() =>
                                handleCopy(
                                  payment.receiverBankDetails!.ifscCode!,
                                  "ifsc"
                                )
                              }
                            >
                              {copiedField === "ifsc" ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      {payment.receiverBankDetails.gPay && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-medium">GPay/PhonePe Number:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-right">
                              {payment.receiverBankDetails.gPay}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 flex-shrink-0"
                              onClick={() =>
                                handleCopy(
                                  payment.receiverBankDetails!.gPay!,
                                  "gpay"
                                )
                              }
                            >
                              {copiedField === "gpay" ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      {payment.receiverBankDetails.upiId && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-medium">UPI ID:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-right break-all">
                              {payment.receiverBankDetails.upiId}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 flex-shrink-0"
                              onClick={() =>
                                handleCopy(
                                  payment.receiverBankDetails!.upiId!,
                                  "upi"
                                )
                              }
                            >
                              {copiedField === "upi" ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* QR Code */}
                      {payment.receiverBankDetails.qrCode && (
                        <div className="rounded-lg border bg-muted/30 p-3 mt-2">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Pay using QR Code:
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() =>
                                setPreviewImage(
                                  getImageUrl(
                                    payment.receiverBankDetails!.qrCode!
                                  )
                                )
                              }
                            >
                              <Maximize2 className="h-3 w-3" />
                              Expand
                            </Button>
                          </div>
                          <div
                            className="relative cursor-pointer overflow-hidden rounded-md border bg-background"
                            onClick={() =>
                              setPreviewImage(
                                getImageUrl(payment.receiverBankDetails!.qrCode!)
                              )
                            }
                          >
                            <img
                              src={getImageUrl(
                                payment.receiverBankDetails.qrCode
                              )}
                              alt="Payment QR Code"
                              className="h-48 w-full object-contain hover:opacity-90 transition-opacity"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20 p-3 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                            Bank Details Unavailable
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            The receiver hasn't updated their bank details yet.
                            Please contact them directly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upload Screenshot */}
            {payment.receiverBankDetails && <div className="space-y-2">
              <Label htmlFor="payment-proof" className="text-sm font-medium">
                Upload payment screenshot
              </Label>
              <Input
                id="payment-proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Accepted: images only. Max size 5MB.
              </p>

              {previewUrl && (
                <div className="mt-3 rounded-lg border p-2 bg-muted/20">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Preview
                  </p>
                  <img
                    src={previewUrl}
                    alt="Payment screenshot preview"
                    className="max-h-64 w-full rounded-md object-contain"
                  />
                </div>
              )}

              {error && (
                <p className="mt-2 text-xs sm:text-sm text-destructive font-medium">
                  {error}
                </p>
              )}
            </div>}
          </div>

          {payment.receiverBankDetails && <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto gap-2"
              disabled={!file || isSubmitting}
              onClick={handleSubmit}
            >
              <ImageUp className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit proof"}
            </Button>
          </DialogFooter>}
        </DialogContent>
      </Dialog>

      {/* QR Code Preview Modal */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Payment QR Code</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 max-h-[80vh] overflow-auto">
            {previewImage && (
              <img
                src={previewImage}
                alt="Payment QR Code full view"
                className="w-full rounded-lg border object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
