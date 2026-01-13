// PendingLinksList.tsx
import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@repo/ui";
import type { PaymentType, PendingLinkItem } from "@repo/types";
import { ArrowUpCircle, Landmark, Loader, Repeat } from "lucide-react";
import { PaymentRequestModal } from "./PaymentRequestModal";
import api from "../lib/axios";
import { toast } from "sonner"
import { useAuthStore } from "../stores/useAuthStore";

export const PendingLinksList = () => {
    const { user } = useAuthStore();
    const fetchUser = useAuthStore((state) => state.fetchUser);
    const [links, setLinks] = useState<PendingLinkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRequesting, setIsRequesting] = useState<number | null>(null);
    const [activeLinkId, setActiveLinkId] = useState<string | null>(null)
    const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentType | null>(null);

    const load = useCallback(async () => {
        try {
            if (!user?.id) return
            setLoading(true);
            const res = await api.get(`/notifications/pending-links/${user?.id}`);
            if (res.data.success) setLinks(res.data.pendingLinks as PendingLinkItem[]);
        } finally {
            setLoading(false);
        }
    }, [user?.id])

    useEffect(() => {
        load();
    }, [load]);

    const handleGenerate = async (link: PendingLinkItem, index: number) => {
        try {
            setIsRequesting(index)
            if (link.linkType === "REENTRY") {
                const res = await api.post("/pending-links/reentry", { pendingLinkId: link.id });

                if (res.data.success) {
                    toast.success(
                        <div className="text-primary">
                            {res.data.message}
                        </div>
                    )
                    fetchUser()
                    load()
                }
                return;
            }

            const res = await api.post("/payments/generate-payment", { linkId: link.id });

            if (res.data.success) {
                toast.success(
                    <div className="text-primary">
                        {res.data.message}
                    </div>
                )
                setActiveLinkId(link.id)
                setPaymentDetails(res.data.data);
                setActivePaymentId(res.data.data.id);
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
            setIsRequesting(null)
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/40 rounded-full animate-spin animation-delay-150"></div>
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-4">
                    Loading pending links...
                </p>
                <div className="flex gap-1 mt-3">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce animation-delay-400"></div>
                </div>
            </div>
        );
    }

    if (!links.length) {
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
                    No pending links at the moment. You'll see new links here as they arrive.
                </p>
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-muted-foreground">
                        Watching for pending links
                    </span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {links.map((l, index) => (
                    <Card key={l.id} className="border rounded-xl">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        {l.linkType === "UPGRADE" && (
                                            <>
                                                <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                                                Upgrade to Level {l.targetLevel}
                                            </>
                                        )}
                                        {l.linkType === "SPONSOR_PAYMENT" && (
                                            <>
                                                <Landmark className="h-4 w-4 text-emerald-500" />
                                                Sponsor payment
                                            </>
                                        )}
                                        {l.linkType === "REENTRY" && (
                                            <>
                                                <Repeat className="h-4 w-4 text-purple-500" />
                                                Re-entry Account
                                            </>
                                        )}
                                    </CardTitle>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-mono text-blue-500">
                                            Account:{" "}
                                            <span className="text-foreground">
                                                {l.positionId}
                                            </span>
                                        </span>
                                        {!l.isCompleted && (
                                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px]">
                                                Pending
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {l.amount && (
                                    <div className="text-sm font-semibold text-primary whitespace-nowrap">
                                        <span className="font-mono">Amount </span>
                                        ₹{l.amount}
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0 pb-3">
                            <Button
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => handleGenerate(l, index)}
                                disabled={isRequesting === index}
                            >
                                {isRequesting === index ? <Loader /> : l.linkType === "REENTRY" ? "Re-entry account" : "Generate payment link"}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {activePaymentId && paymentDetails && activeLinkId && (
                <PaymentRequestModal
                    open={!!activePaymentId}
                    onClose={() => {
                        setActiveLinkId(null)
                        setActivePaymentId(null);
                        setPaymentDetails(null);
                    }}
                    onSubmitted={() => load()}
                    linkId={activeLinkId}
                    payment={paymentDetails}
                />
            )}
        </>

    );
};
