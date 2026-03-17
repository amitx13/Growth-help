import { useState } from 'react'
import {
    Card, CardContent, CardHeader, CardTitle,
    Badge, Button, ConfirmModal,
} from '@repo/ui'
import { InboxIcon, Eye, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
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
                {payments.map((payment) => (
                    <Card
                        key={payment.id}
                        className="border-0 shadow-md overflow-hidden"
                    >
                        <CardHeader className="bg-muted/30 border-b py-4 px-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <InboxIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            ₹{payment.amount.toLocaleString()} from {payment.senderAccount.user.name}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Level {payment.senderAccount.level} · {payment.senderAccount.accountType}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${TYPE_BADGE[payment.paymentType]}`}
                                    >
                                        {payment.paymentType}
                                    </Badge>
                                    <Badge className={`text-xs text-white ${STATUS_BADGE[payment.status]}`}>
                                        {payment.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : payment.status}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="py-4 px-5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                {/* Screenshot link */}
                                <div className="flex items-center gap-2">
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
                                        <span className="text-sm text-muted-foreground italic">No screenshot uploaded</span>
                                    )}

                                </div>

                                {/* Action buttons — only for PENDING */}
                                {payment.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={loadingId === payment.id}
                                            onClick={() => openConfirm(payment, 'review')}
                                            className="gap-1.5 border-amber-500 text-amber-600 hover:bg-amber-50"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            Under Review
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={loadingId === payment.id}
                                            onClick={() => openConfirm(payment, 'approve')}
                                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Approve
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ConfirmModal
                open={confirmOpen}
                title={confirmAction === 'approve' ? 'Approve this payment?' : 'Flag for admin review?'}
                description={
                    selectedPayment
                        ? confirmAction === 'approve'
                            ? `Approve ₹${selectedPayment.amount} payment from ${selectedPayment.senderAccount.user.name}? This will activate their Level ${selectedPayment.senderAccount.level} account.`
                            : `Flag ₹${selectedPayment.amount} payment from ${selectedPayment.senderAccount.user.name} as suspicious? Admin will review and resolve it.`
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
