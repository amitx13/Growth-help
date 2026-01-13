import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Label } from "@repo/ui";
import {
    Phone,
    Hash,
    Check,
    AlertTriangle,
    CreditCard,
    Building2,
    FileText,
    Smartphone,
    QrCode,
    Upload,
    X,
} from "lucide-react";

interface AlertForBankDetails {
    isSubmitting: boolean
    isBankModalOpen: boolean,
    setIsBankModalOpen: (v: boolean) => void,
    handleBankDetailsSubmit: (e: React.FormEvent) => Promise<void>,
    bankName: string,
    accountNumber: string,
    ifscCode: string,
    upiId: string
    gPay: string,
    qrCodePreview: string | null,
    setBankName: (v: string) => void,
    setAccountNumber: (v: string) => void,
    setIfscCode: (v: string) => void,
    setUpiId: (v: string) => void,
    setGPay: (v: string) => void,
    setQrCodeFile: (v: File | null) => void,
    setQrCodePreview:(v : string | null) => void,
    handleQrCodeChange: (v: React.ChangeEvent<HTMLInputElement>) => void
}

export const AlertAndUpdateForBankDetails = ({
    isSubmitting,
    bankName,
    accountNumber,
    ifscCode,
    upiId,
    gPay,
    qrCodePreview,
    isBankModalOpen,
    setBankName,
    setAccountNumber,
    setIfscCode,
    setUpiId,
    setGPay,
    setQrCodeFile,
    setIsBankModalOpen,
    setQrCodePreview,
    handleQrCodeChange,
    handleBankDetailsSubmit,
}: AlertForBankDetails) => {
    return (
        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Bank Details Required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                    Please update your bank details to receive payments and grow earnings.
                </p>
                <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            size="sm"
                            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <CreditCard className="h-3.5 w-3.5" />
                            Add Bank Details
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <CreditCard className="h-5 w-5 sm:w-6 sm:h-6 text-primary" />
                                </div>
                                Update Bank Details
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleBankDetailsSubmit} className="space-y-5 pt-4">
                            {/* Bank Name */}
                            <div className="space-y-2">
                                <Label htmlFor="bankName" className="flex items-center gap-2 text-sm font-medium">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Bank Name *
                                </Label>
                                <Input
                                    id="bankName"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="Enter your bank name"
                                    className="h-11"
                                    required
                                />
                            </div>

                            {/* Account Number */}
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber" className="flex items-center gap-2 text-sm font-medium">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Account Number *
                                </Label>
                                <Input
                                    id="accountNumber"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    placeholder="Enter your account number"
                                    className="h-11 font-mono"
                                    required
                                />
                            </div>

                            {/* IFSC Code */}
                            <div className="space-y-2">
                                <Label htmlFor="ifscCode" className="flex items-center gap-2 text-sm font-medium">
                                    <Hash className="h-4 w-4 text-primary" />
                                    IFSC Code *
                                </Label>
                                <Input
                                    id="ifscCode"
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                    placeholder="Enter IFSC code"
                                    className="h-11 font-mono uppercase"
                                    required
                                />
                            </div>

                            {/* UPI ID */}
                            <div className="space-y-2">
                                <Label htmlFor="upiId" className="flex items-center gap-2 text-sm font-medium">
                                    <Smartphone className="h-4 w-4 text-primary" />
                                    UPI ID
                                </Label>
                                <Input
                                    id="upiId"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="yourname@upi"
                                    className="h-11 font-mono"
                                />
                            </div>

                            {/* GPay Number */}
                            <div className="space-y-2">
                                <Label htmlFor="gPay" className="flex items-center gap-2 text-sm font-medium">
                                    <Phone className="h-4 w-4 text-primary" />
                                    GPay/PhonePe Number
                                </Label>
                                <Input
                                    id="gPay"
                                    value={gPay}
                                    onChange={(e) => setGPay(e.target.value)}
                                    placeholder="Enter GPay/PhonePe number"
                                    className="h-11"
                                />
                            </div>

                            {/* QR Code Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="qrCode" className="flex items-center gap-2 text-sm font-medium">
                                    <QrCode className="h-4 w-4 text-primary" />
                                    Payment QR Code
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="qrCode"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleQrCodeChange}
                                        className="cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Upload your payment QR code image (Max 5MB)
                                </p>

                                {qrCodePreview && (
                                    <div className="relative mt-3 rounded-lg border p-3 bg-muted/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-medium text-muted-foreground">Preview</p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                    setQrCodeFile(null);
                                                    setQrCodePreview(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <img
                                            src={qrCodePreview}
                                            alt="QR Code Preview"
                                            className="max-h-48 w-full rounded-md object-contain bg-background"
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsBankModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="gap-2">
                                    {isSubmitting ? (
                                        <>
                                            <Upload className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Save Details
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}