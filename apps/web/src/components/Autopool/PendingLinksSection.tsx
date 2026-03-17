import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from '@repo/ui'
import { Zap, ArrowUpCircle, RotateCcw, CheckCircle2, Clock, ChevronRight, AlertTriangle, Phone } from 'lucide-react'
import { toast } from 'sonner'
import {
    autopoolApi,
    AUTOPOOL_LEVEL_FEES,
    type AutopoolPendingLink,
    type AutopoolAccount,
    type PaymentModalData,
} from '../../lib/autopoolApi'

const LEVEL_COLORS: Record<number, string> = {
    1: 'from-blue-500/10 to-cyan-500/10',
    2: 'from-violet-500/10 to-purple-500/10',
    3: 'from-pink-500/10 to-rose-500/10',
    4: 'from-orange-500/10 to-amber-500/10',
    5: 'from-green-500/10 to-emerald-500/10',
    6: 'from-teal-500/10 to-cyan-500/10',
    7: 'from-indigo-500/10 to-blue-500/10',
}

const getLevelColor = (level: number) => LEVEL_COLORS[level] ?? LEVEL_COLORS[1]

interface Props {
    links: AutopoolPendingLink[]
    accounts: AutopoolAccount[]
    onPaymentModalOpen: (data: PaymentModalData) => void
}

export const PendingLinksSection = ({ links, accounts, onPaymentModalOpen }: Props) => {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    // ── ENTRY link state detection ────────────────────────────────────────────
    // An inactive L1 ORIGINAL account can be in two states:
    //   1. sentPayments.length > 0 → payment submitted, genuinely awaiting approval
    //   2. sentPayments.length === 0 → user clicked join but never paid → needs resume
    const inactiveL1Original = accounts.find(
        (a) => a.level === 1 && a.accountType === 'ORIGINAL' && !a.isActive
    )
    const hasPendingL1Payment = !!(inactiveL1Original && inactiveL1Original.sentPayments.length > 0)
    const needsL1PaymentResume = !!(inactiveL1Original && inactiveL1Original.sentPayments.length === 0)

    // Resume entry payment using parent bank details already in the accounts response
    const handleResumeEntryPayment = () => {
        if (!inactiveL1Original?.parent) return
        onPaymentModalOpen({
            senderAccountId: inactiveL1Original.id,
            receiverAccountId: inactiveL1Original.parent.id,
            amount: AUTOPOOL_LEVEL_FEES[1],
            level: 1,
            paymentType: 'ENTRY',
            receiverName: inactiveL1Original.parent.user.name,
            receiverMobile: inactiveL1Original.parent.user.mobile,
            receiverBankDetails: inactiveL1Original.parent.user.bankDetails,
        })
    }

    const handleEntryLink = async (link: AutopoolPendingLink) => {
        setLoadingId(link.id)
        try {
            const res = await autopoolApi.joinAutopool(link.id)
            const d = res.data.data
            onPaymentModalOpen({
                senderAccountId: d.newAccountId,
                receiverAccountId: d.receiverAccountId,
                amount: d.amount,
                level: 1,
                paymentType: 'ENTRY',
                receiverName: d.receiverName,
                receiverMobile: d.receiverMobile,
                receiverBankDetails: d.receiverBankDetails,
            })
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setLoadingId(null)
        }
    }

    const handleUpgradeLink = async (link: AutopoolPendingLink) => {
        setLoadingId(link.id)
        try {
            const res = await autopoolApi.actOnUpgradeLink(link.id)
            const d = res.data.data
            onPaymentModalOpen({
                senderAccountId: d.newAccountId,
                receiverAccountId: d.receiverAccountId,
                amount: d.amount,
                level: d.targetLevel,
                paymentType: 'UPGRADE',
                receiverName: d.receiverName,
                receiverMobile: d.receiverMobile,
                receiverBankDetails: d.receiverBankDetails,
            })
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setLoadingId(null)
        }
    }

    const handleReentryLink = async (link: AutopoolPendingLink) => {
        setLoadingId(link.id)
        try {
            const res = await autopoolApi.actOnReentryLink(link.id)
            const d = res.data.data
            onPaymentModalOpen({
                senderAccountId: d.newAccountId,
                receiverAccountId: d.receiverAccountId,
                amount: d.amount,
                level: 1,
                paymentType: 'ENTRY',
                receiverName: d.receiverName,
                receiverMobile: d.receiverMobile,
                receiverBankDetails: d.receiverBankDetails,
            })
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setLoadingId(null)
        }
    }

    if (links.length === 0) {
        return (
            <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                    <div className="p-4 bg-violet-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-violet-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Pending Links</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        You'll receive links here when you're eligible to join autopool, upgrade to the next level, or re-enter.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {links.map((link) => {
                const isLoading = loadingId === link.id

                // ── ENTRY ──────────────────────────────────────────────────────────────
                if (link.linkType === 'ENTRY') {
                    return (
                        <Card key={link.id} className="border-2 border-violet-500/30 shadow-md overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b py-4 px-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-violet-500/20 rounded-xl">
                                        <Zap className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">Autopool Entry — Level 1</CardTitle>
                                        <CardDescription>You're eligible to join the autopool matrix</CardDescription>
                                    </div>
                                    <Badge className="bg-violet-500/20 text-violet-700 border-0 text-sm">
                                        ₹{link.amount ?? 200}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-4 pb-5 px-5">
                                {/* State 1: Payment submitted, genuinely waiting */}
                                {hasPendingL1Payment && (
                                    <div className="flex flex-col gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-200">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-800">
                                                    Awaiting Payment Approval
                                                </p>
                                                <p className="text-xs text-amber-600 mt-0.5">
                                                    Your payment screenshot is pending receiver confirmation.
                                                </p>
                                            </div>
                                        </div>

                                        {inactiveL1Original?.parent && (
                                            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-amber-100 rounded-lg border border-amber-200">
                                                <div>
                                                    <p className="text-xs text-amber-600 font-medium">Receiver</p>
                                                    <p className="text-sm font-semibold text-amber-900">
                                                        {inactiveL1Original.parent.user.name}
                                                    </p>
                                                </div>

                                                <a
                                                    href={`tel:${inactiveL1Original.parent.user.mobile}`}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {inactiveL1Original.parent.user.mobile}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* State 2: Account exists but payment was never submitted */}
                                {needsL1PaymentResume && (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-orange-700">
                                                Your Level 1 account is created but payment hasn't been submitted yet. Complete the payment to activate it.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                                            onClick={handleResumeEntryPayment}
                                        >
                                            Complete Payment
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* State 3: Fresh join — no account yet */}
                                {!hasPendingL1Payment && !needsL1PaymentResume && (
                                    <Button
                                        className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                                        disabled={isLoading}
                                        onClick={() => handleEntryLink(link)}
                                    >
                                        {isLoading ? 'Finding your slot...' : 'Join Autopool'}
                                        {!isLoading && <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )
                }

                // ── UPGRADE ────────────────────────────────────────────────────────────
                if (link.linkType === 'UPGRADE') {
                    const targetLevel = link.targetLevel ?? 2
                    return (
                        <Card key={link.id} className={`border-2 border-blue-500/30 shadow-md overflow-hidden`}>
                            <CardHeader className={`bg-gradient-to-r ${getLevelColor(targetLevel)} border-b py-4 px-5`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-xl">
                                        <ArrowUpCircle className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">Upgrade to Level {targetLevel}</CardTitle>
                                        <CardDescription>
                                            {link.account
                                                ? `From your Level ${link.account.level} ${link.account.accountType.toLowerCase()} account`
                                                : 'Advance to the next level'}
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-blue-500/20 text-blue-700 border-0 text-sm">
                                        ₹{link.amount?.toLocaleString() ?? AUTOPOOL_LEVEL_FEES[targetLevel].toLocaleString()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pb-5 px-5">
                                <Button
                                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={isLoading}
                                    onClick={() => handleUpgradeLink(link)}
                                >
                                    {isLoading ? 'Finding your slot...' : `Upgrade to Level ${targetLevel}`}
                                    {!isLoading && <ChevronRight className="w-4 h-4" />}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                }

                // ── REENTRY ────────────────────────────────────────────────────────────
                if (link.linkType === 'REENTRY') {
                    const remaining = (link.reentryCount ?? 0) - (link.reentriesIssued ?? 0)
                    return (
                        <Card key={link.id} className="border-2 border-purple-500/30 shadow-md overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b py-4 px-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-xl">
                                        <RotateCcw className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">Re-entry Available</CardTitle>
                                        <CardDescription>
                                            {link.account
                                                ? `Level ${link.account.level} account · ${remaining} re-entr${remaining === 1 ? 'y' : 'ies'} remaining`
                                                : `${remaining} re-entr${remaining === 1 ? 'y' : 'ies'} remaining`}
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-purple-500/20 text-purple-700 border-0 text-sm">
                                        ₹200
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pb-5 px-5">
                                <Button
                                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={isLoading}
                                    onClick={() => handleReentryLink(link)}
                                >
                                    {isLoading ? 'Finding your slot...' : 'Use Re-entry'}
                                    {!isLoading && <ChevronRight className="w-4 h-4" />}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                }

                return null
            })}
        </div>
    )
}