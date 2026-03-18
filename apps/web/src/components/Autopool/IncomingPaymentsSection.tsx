import { useState } from 'react'
import {
    Card, CardContent, CardHeader, CardTitle,
    Badge, Button, ConfirmModal,
} from '@repo/ui'
import { InboxIcon, Eye, CheckCircle2, AlertCircle, ExternalLink, Wallet, User, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { autopoolApi, type AutopoolIncomingPayment } from '../../lib/autopoolApi'

const TYPE_BADGE: Record<string, string> = {
    ENTRY: 'border-violet-500 text-violet-700',
    UPGRADE: 'border-blue-500 text-blue-700',
}

const STATUS_BADGE: Record<string, string> = {
    PENDING: 'bg-yellow-500 hover:bg-yellow-600',
    APPROVED: 'bg-green-500 hover:bg-green-600',
    UNDER_REVIEW: 'bg-amber-500 hover:bg-amber-600',
    REJECTED: 'bg-red-500 hover:bg-red-600',
}

interface Props {
    payments: AutopoolIncomingPayment[]
    onRefresh: () => void
}

export const IncomingPaymentsSection = ({ payments, onRefresh }: Props) => {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<AutopoolIncomingPayment | null>(null)
    const [confirmAction, setConfirmAction] = useState<'approve' | 'review'>('approve')

    const openConfirm = (payment: AutopoolIncomingPayment, action: 'approve' | 'review') => {
        setSelectedPayment(payment)
        setConfirmAction(action)
        setConfirmOpen(true)
    }

    const handleConfirm = async () => {
        if (!selectedPayment) return
        setLoadingId(selectedPayment.id)
        try {
            if (confirmAction === 'approve') {
                await autopoolApi.approvePayment(selectedPayment.id)
                toast.success(<div className="text-green-600">Payment approved successfully!</div>)
            } else {
                await autopoolApi.markUnderReview(selectedPayment.id)
                toast.success(<div className="text-amber-600">Payment flagged for admin review.</div>)
            }
            onRefresh()
        } catch (error: any) {
            toast.error(
                <div className="text-red-500">{error.response?.data?.error || error.message}</div>
            )
        } finally {
            setLoadingId(null)
            setSelectedPayment(null)
            setConfirmOpen(false)
        }
    }

    const getImageUrl = (screenshotUrl: string) => {
        return `${import.meta.env.VITE_BASE_URL}${screenshotUrl}`
    }

    if (payments.length === 0) {
        return (
            <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                    <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <InboxIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Incoming Payments</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Payments that need your approval will appear here.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {payments.map((payment) => {
                    const sender = payment.senderAccount
                    return (
                        <Card key={payment.id} className="border-0 shadow-md overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b py-3 px-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0 mt-0.5">
                                            <InboxIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <CardTitle className="text-sm">
                                                ₹{payment.amount.toLocaleString()}
                                            </CardTitle>
                                            <div className="flex items-center gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE[payment.paymentType]}`}
                                                >
                                                    {payment.paymentType}
                                                </Badge>
                                                <Badge className={`text-[10px] px-1.5 py-0 text-white ${STATUS_BADGE[payment.status]}`}>
                                                    {payment.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : payment.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                        L{sender.level} · {sender.accountType}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="py-3 px-4 space-y-3">
                                {/* ── Sender hierarchy ─────────────────────── */}
                                <div className="p-3 bg-muted/40 rounded-lg space-y-2">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                        From
                                    </p>

                                    {/* User row */}
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg flex-shrink-0">
                                            <User className="w-3 h-3 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold leading-tight">
                                                {sender.position.user.name}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                    {sender.position.user.id}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Phone className="w-2.5 h-2.5" />
                                                    <a
                                                        href={`tel:${sender.position.user.mobile}`}
                                                        className="hover:underline hover:text-foreground transition-colors"
                                                    >
                                                        {sender.position.user.mobile}
                                                    </a>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Position row */}
                                    <div className="flex items-center gap-2 pl-1">
                                        <div className="w-px h-4 bg-border ml-2 flex-shrink-0" />
                                        <div className="flex items-center gap-1.5">
                                            <Wallet className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            <span className="text-[10px] text-muted-foreground">Account Id</span>
                                            <span className="font-mono text-[10px] font-semibold text-foreground">
                                                {sender.positionId.toUpperCase()}
                                            </span>
                                            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                                                sender.accountType === 'REENTRY'
                                                    ? 'bg-purple-500/15 text-purple-700'
                                                    : 'bg-blue-500/15 text-blue-700'
                                            }`}>
                                                {sender.accountType === 'REENTRY' ? 'Re-entry' : 'Original'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Screenshot + actions */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div>
                                        {payment.screenshotUrl ? (
                                            <a
                                                href={getImageUrl(payment.screenshotUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Screenshot
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">
                                                No screenshot uploaded
                                            </span>
                                        )}
                                    </div>

                                    {payment.status === 'PENDING' && (
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={loadingId === payment.id}
                                                onClick={() => openConfirm(payment, 'review')}
                                                className="flex-1 sm:flex-none gap-1.5 border-amber-500 text-amber-600 hover:bg-amber-50"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                Review
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={loadingId === payment.id}
                                                onClick={() => openConfirm(payment, 'approve')}
                                                className="flex-1 sm:flex-none gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Approve
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <ConfirmModal
                open={confirmOpen}
                title={confirmAction === 'approve' ? 'Approve this payment?' : 'Flag for admin review?'}
                description={
                    selectedPayment
                        ? confirmAction === 'approve'
                            ? `Approve ₹${selectedPayment.amount} payment from ${selectedPayment.senderAccount.position.user.name}? This will activate their Level ${selectedPayment.senderAccount.level} account.`
                            : `Flag ₹${selectedPayment.amount} payment from ${selectedPayment.senderAccount.position.user.name} as suspicious? Admin will review and resolve it.`
                        : ''
                }
                onCancel={() => {
                    setSelectedPayment(null)
                    setConfirmOpen(false)
                }}
                onConfirm={handleConfirm}
            />
        </>
    )
}