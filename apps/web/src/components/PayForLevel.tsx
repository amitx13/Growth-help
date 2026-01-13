import * as React from "react";
import { useState } from "react";
import { ImageUp, IndianRupee, User2, Banknote, ImageIcon, Maximize2, Copy, Check } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    Button,
    Input,
    Label,
    Separator,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@repo/ui";
import { toast } from "sonner"
import type { Position } from "@repo/types";

interface PayForActivationProps {
    position: Position;
    activationAmount: string;
    onSubmitProof: (file: File, positionId: string, sponsorId: string, amount: string) => void;
}

export const PayForActivation: React.FC<PayForActivationProps> = ({
    position,
    activationAmount,
    onSubmitProof,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

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

    const handleSubmit = async () => {
        if (!file) {
            setError("Please upload the transaction screenshot first.");
            return;
        }

        if (!position.sponsorId || !position.sponsorPositionId) {
            setError("Sponsor details not found.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            onSubmitProof(file, position.positionId, position.sponsorPositionId, activationAmount);
        } catch (err) {
            setError("Something went wrong while submitting. Please try again.");
        } finally {
            setIsSubmitting(false);
            setPreviewUrl(null);
            setFile(null);
        }
    };

    const getImageUrl = (screenshotUrl: string) => {
        return `${import.meta.env.VITE_BASE_URL}${screenshotUrl}`;
    };

    const handleCopy = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // fallback for older browsers
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

    return (
        <div className="w-full">
            <Card className="border rounded-2xl shadow-sm overflow-hidden h-full">
                <CardHeader className="pb-4 bg-orange-50 dark:bg-orange-950/20 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <IndianRupee className="h-5 w-5 text-orange-600" />
                        Activate This Account
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 pt-3 pb-3 px-3">
                    {/* Position Info */}
                    <div className="space-y-2 rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Account ID: <span className="font-mono">{position.positionId}</span>
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            This account is currently inactive. Pay the activation fee to start earning.
                        </p>
                    </div>

                    {/* Sponsor details */}
                    {position.sponsorId ? (
                        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                            <div className="flex items-center gap-2">
                                <User2 className="h-4 w-4 text-primary flex-shrink-0" />
                                <p className="font-medium text-sm sm:text-base">
                                    Pay to Sponsor: <span className="font-semibold break-words">{position.sponsorName}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <Banknote className="h-4 w-4 flex-shrink-0 text-green-600" />
                                <span className="text-green-600 font-semibold">Amount to pay: ₹{activationAmount}</span>
                            </div>

                            <Separator />

                            <div className="grid gap-2 text-xs sm:text-sm">
                                <div className="flex justify-between gap-2">
                                    <span className="font-medium">Sponsor ID:</span>
                                    <span className="font-mono text-right break-all">{position.sponsorId}</span>
                                </div>
                                {position.sponsorMobile && (
                                    <div className="flex justify-between gap-2">
                                        <span className="font-medium">Phone:</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-right">+91-{position.sponsorMobile}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                onClick={() => position.sponsorMobile && handleCopy(position.sponsorMobile, "mobile")}
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

                                {position.sponsorBankDetails ? (
                                    <>
                                        {position.sponsorBankDetails.bankName && (
                                            <div className="flex justify-between gap-2">
                                                <span className="font-medium">Bank:</span>
                                                <span className="text-right break-words">{position.sponsorBankDetails.bankName}</span>
                                            </div>
                                        )}
                                        {position.sponsorBankDetails.accountNumber && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium">Account No:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-right break-all text-sm">
                                                        {position.sponsorBankDetails.accountNumber}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                        onClick={() => handleCopy(position.sponsorBankDetails!.accountNumber!, "account")}
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
                                        {position.sponsorBankDetails.ifscCode && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium">IFSC Code:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-right">{position.sponsorBankDetails.ifscCode}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                        onClick={() => handleCopy(position.sponsorBankDetails!.ifscCode!, "ifsc")}
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
                                        {position.sponsorBankDetails.gPay && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium">GPay/PhonePe Number:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-right">{position.sponsorBankDetails.gPay}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                        onClick={() => handleCopy(position.sponsorBankDetails!.gPay!, "gpay")}
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
                                        {position.sponsorBankDetails.upiId && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium">UPI ID:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-right break-all">{position.sponsorBankDetails.upiId}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                        onClick={() => handleCopy(position.sponsorBankDetails!.upiId!, "upi")}
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
                                        {position.sponsorBankDetails.qrCode && (
                                            <div className="rounded-lg border bg-muted/30 p-3">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                        <ImageIcon className="h-3.5 w-3.5" />
                                                        Pay using QR Code:
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 gap-1 px-2 text-xs"
                                                        onClick={() => setPreviewImage(getImageUrl(position.sponsorBankDetails!.qrCode!))}
                                                    >
                                                        <Maximize2 className="h-3 w-3" />
                                                        Expand
                                                    </Button>
                                                </div>
                                                <div
                                                    className="relative cursor-pointer overflow-hidden rounded-md border bg-background"
                                                    onClick={() => setPreviewImage(getImageUrl(position.sponsorBankDetails!.qrCode!))}
                                                >
                                                    <img
                                                        src={getImageUrl(position.sponsorBankDetails.qrCode)}
                                                        alt="Payment QR Code"
                                                        className="h-48 w-full object-contain hover:opacity-90 transition-opacity"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload screenshot */}
                                        <div className="space-y-2">
                                            <Label htmlFor="payment-proof" className="text-sm font-medium">
                                                Upload payment screenshot
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="payment-proof"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="cursor-pointer text-xs sm:text-sm"
                                                />
                                            </div>
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
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20 p-3">
                                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                            Sponsor bank details are not available.
                                            Please ask your sponsor to update their bank details to continue.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                No sponsor found for this position. Please contact support.
                            </p>
                        </div>
                    )}
                </CardContent>

                {position.sponsorBankDetails && <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 px-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                            setFile(null);
                            setPreviewUrl(null);
                            setError(null);
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        type="button"
                        className="w-full sm:w-auto gap-2"
                        disabled={!file || isSubmitting || !position.sponsorId || !position.sponsorBankDetails}
                        onClick={handleSubmit}
                    >
                        <ImageUp className="h-4 w-4" />
                        {isSubmitting ? "Submitting..." : !position.sponsorBankDetails ? "Sponsor BankDetials Unavailable" : "Submit for verification"}
                    </Button>
                </CardFooter>}
            </Card>

            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle>Payment QR Code</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 pb-6 max-h-[80vh] overflow-auto">
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="Payment screenshot full view"
                                className="rounded-lg border object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
