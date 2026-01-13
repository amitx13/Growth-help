// IncomingPaymentsList.tsx
import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, ConfirmModal } from "@repo/ui";
import { Phone, User2, CheckCircle2, XCircle, Image as ImageIcon, Maximize2 } from "lucide-react";
import type { IncomingPayment } from "@repo/types";
import api from "../lib/axios";
import { toast } from "sonner"
import { useAuthStore } from "../stores/useAuthStore";

export const IncomingPaymentsList = () => {
    const { user } = useAuthStore();
    const fetchUser = useAuthStore((state) => state.fetchUser)
    const [items, setItems] = useState<IncomingPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<IncomingPayment | null>(null);
    const [actionType, setActionType] = useState<"APPROVED" | "UNDER_REVIEW" | "REJECTED" | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const res = await api.get(`/notifications/incoming-payments/${user.id}`);
            if (res.data.success) {
                setItems(res.data.incomingPayments as IncomingPayment[]);
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(
                    <div className="text-red-500">
                        {error.response.data.error}
                    </div>
                );
            } else {
                toast.error(
                    <div className="text-red-500">
                        {error.message}
                    </div>
                );
            }
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        load();
    }, [load]);

    const openConfirm = (item: IncomingPayment, action: "APPROVED" | "UNDER_REVIEW" | "REJECTED") => {
        setSelected(item);
        setActionType(action);
    };

    const handleConfirm = async () => {
        if (!selected || !actionType) return;

        const endpoint =
            selected.paymentType === "ACTIVATION"
                ? `/payments/activation/${selected.paymentId}`
                : `/payments/upgrade-or-sponsor/${selected.paymentId}`;

        try {
            const res = await api.post(endpoint, { action: actionType });
            if (res.data.success) {
                toast.success(
                    <div className="text-primary">
                        {res.data.message}
                    </div>
                )
                await load();
                await fetchUser()
            }
        } catch (error: any) {
            if (error.response.data) {
                toast.error(
                    <div className="text-red-500">
                        {error.response.data.error}
                    </div>
                )
            } else {
                toast.error(
                    <div className="text-red-500">
                        {error.message}
                    </div>
                )
            }

        } finally {
            setSelected(null);
            setActionType(null);
        }
    };

    const getImageUrl = (screenshotUrl: string) => {
        return `${import.meta.env.VITE_BASE_URL}${screenshotUrl}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/40 rounded-full animate-spin animation-delay-150"></div>
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-4">
                    Loading incoming payments...
                </p>
                <div className="flex gap-1 mt-3">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce animation-delay-400"></div>
                </div>
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-muted-foreground/40"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                        </svg>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-background">
                        <svg
                            className="w-3 h-3 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                    All Clear!
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                    No pending incoming payments at the moment. You'll see new payments here as they arrive.
                </p>
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-muted-foreground">
                        Watching for new payments
                    </span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3 ">
                {items.map((p) => {

                    return (
                        <Card key={p.paymentId} className="border rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-semibold">
                                        {p.paymentType === "ACTIVATION"
                                            ? "Activation payment"
                                            : p.paymentType === "UPGRADE"
                                                ? `Upgrade payment`
                                                : "Sponsor payment"}
                                    </CardTitle>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        {p.paymentType === "UPGRADE" && (
                                            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] text-blue-600 border border-blue-500/30">
                                                Level {p.upgradeToLevel}
                                            </span>
                                        )}

                                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px]">
                                            Pending
                                        </Badge>
                                    </div>

                                </div>
                                <div className="text-right text-sm font-semibold text-green-600">
                                    ₹{p.amount}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-0 pb-3">
                                <div className="flex items-start gap-2 text-xs sm:text-sm">
                                    <User2 className="mt-0.5 h-4 w-4 text-primary" />
                                    <div className="flex-1 space-y-0.5 font-medium">
                                        <p className="font-medium text-foreground">
                                            From: {p.senderUserName}
                                        </p>

                                        {/* Sender user ID */}
                                        <p className="text-xs text-primary">
                                            User ID: {p.senderUserId}
                                        </p>

                                        <p className="text-xs text-blue-500">
                                            From account:
                                            <span className="text-foreground pl-2">
                                                {p.senderAccountId}
                                            </span>
                                        </p>

                                        <p className="text-xs text-blue-500">
                                            To account:
                                            <span className="text-foreground pl-2">
                                                {p.receiverAccountId}
                                            </span>
                                        </p>

                                    </div>

                                    {p.senderUserMobile && (
                                        <span className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                                            <Phone className="h-3 w-3" />
                                            {p.senderUserMobile}
                                        </span>
                                    )}
                                </div>

                                {/* Payment Screenshot Preview */}
                                {p.screenshotUrl && (
                                    <div className="rounded-lg border bg-muted/30 p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <ImageIcon className="h-3.5 w-3.5" />
                                                Payment Proof
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 gap-1 px-2 text-xs"
                                                onClick={() => setPreviewImage(getImageUrl(p.screenshotUrl!))}
                                            >
                                                <Maximize2 className="h-3 w-3" />
                                                Expand
                                            </Button>
                                        </div>
                                        <div
                                            className="relative cursor-pointer overflow-hidden rounded-md border bg-background"
                                            onClick={() => setPreviewImage(getImageUrl(p.screenshotUrl!))}
                                        >
                                            <img
                                                src={getImageUrl(p.screenshotUrl)}
                                                alt="Payment screenshot"
                                                className="h-48 w-full object-contain hover:opacity-90 transition-opacity sm:overflow-scroll"
                                            />
                                        </div>
                                    </div>
                                )}

                                {!p.screenshotUrl && (
                                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-3">
                                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                            ⚠️ No payment proof uploaded yet
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        className="flex-1 gap-1"
                                        variant="default"
                                        onClick={() => openConfirm(p, "APPROVED")}
                                        disabled={!p.screenshotUrl}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve
                                    </Button>
                                    {p.paymentType === "ACTIVATION" ?
                                        <Button
                                            size="sm"
                                            className="flex-1 gap-1"
                                            variant="outline"
                                            onClick={() => openConfirm(p, "REJECTED")}
                                            disabled={!p.screenshotUrl}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Reject
                                        </Button>
                                        :
                                        <Button
                                            size="sm"
                                            className="flex-1 gap-1 text-amber-500 hover:text-amber-600"
                                            variant="ghost"
                                            onClick={() => openConfirm(p, "UNDER_REVIEW")}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Mark for Review
                                        </Button>}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Image Preview Modal */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle>Payment Screenshot</DialogTitle>
                    </DialogHeader>

                    {/* Scroll container */}
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

            <ConfirmModal
                open={!!selected}
                title={
                    actionType === "APPROVED"
                        ? "Approve this payment?"
                        : actionType === "REJECTED"
                            ? "Reject this payment?"
                            : "Mark for review by Admin?"
                }
                description={
                    selected
                        ? `Payment of ₹${selected.amount} from ${selected.senderUserName}`
                        : ""
                }
                onCancel={() => {
                    setSelected(null);
                    setActionType(null);
                }}
                onConfirm={handleConfirm}
                confirmVariant={actionType === "APPROVED" ? "default" : actionType === "REJECTED" ? "destructive" : "outline"}
            />
        </>
    );
};
