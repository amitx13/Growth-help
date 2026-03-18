import { useState } from 'react'
import {
    Card, CardContent, CardHeader, CardTitle, Badge, Button,
} from '@repo/ui'
import {
    ArrowUpCircle, RotateCcw, Zap, Clock,
    CreditCard, Phone, Wallet, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    autopoolApi,
    AUTOPOOL_LEVEL_FEES,
    type AutopoolPendingLink,
    type AutopoolAccount,
    type PaymentModalData,
} from '../../lib/autopoolApi'

interface Props {
    links: AutopoolPendingLink[]
    accounts: AutopoolAccount[]
    onPaymentModalOpen: (data: PaymentModalData) => void
}

// Shared position label chip
const PositionChip = ({ positionId }: { positionId: string }) => (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
        <Wallet className="w-2.5 h-2.5" />
        #{positionId.toUpperCase()}
    </span>
)

export const PendingLinksSection = ({ links, accounts, onPaymentModalOpen }: Props) => {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    // Inactive accounts already placed in tree (need payment action)
    const inactiveAccounts = accounts.filter(a => !a.isActive && !!a.parentAccountId)

    const entryLinks = links.filter(l => l.linkType === 'ENTRY')
    const upgradeLinks = links.filter(l => l.linkType === 'UPGRADE')
    const reentryLinks = links.filter(l => l.linkType === 'REENTRY')

    const hasAnything = inactiveAccounts.length > 0 || links.length > 0

    if (!hasAnything) {
        return (
            <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                    <div className="p-4 bg-green-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        No pending links or actions. Your accounts are all up to date.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const handleActOnLink = async (link: AutopoolPendingLink) => {
        setLoadingId(link.id)
        try {
            let result: any
            if (link.linkType === 'ENTRY') {
                result = (await autopoolApi.joinAutopool(link.id)).data.data
            } else if (link.linkType === 'UPGRADE') {
                result = (await autopoolApi.actOnUpgradeLink(link.id)).data.data
            } else {
                result = (await autopoolApi.actOnReentryLink(link.id)).data.data
            }

            onPaymentModalOpen({
                senderAccountId: result.newAccountId,
                receiverAccountId: result.receiverAccountId,
                amount: result.amount,
                level: link.linkType === 'UPGRADE' ? (link.targetLevel ?? 1) : 1,
                paymentType: link.linkType === 'UPGRADE' ? 'UPGRADE' : 'ENTRY',
                receiverName: result.receiverName,
                receiverMobile: result.receiverMobile,
                receiverBankDetails: result.receiverBankDetails,
            })
        } catch (error: any) {
            toast.error(
                <div className="text-red-500">{error.response?.data?.message || error.message}</div>
            )
        } finally {
            setLoadingId(null)
        }
    }

    const handleResumePayment = (account: AutopoolAccount) => {
        if (!account.parent) return
        onPaymentModalOpen({
            senderAccountId: account.id,
            receiverAccountId: account.parent.id,
            paymentType: account.upgradedFromAccountId ? 'UPGRADE' : 'ENTRY',
            amount: AUTOPOOL_LEVEL_FEES[account.level],
            level: account.level,
            receiverName: account.parent.position.user.name,
            receiverMobile: account.parent.position.user.mobile,
            receiverBankDetails: account.parent.position.user.bankDetails,
        })
    }
    
    return (
        <div className="space-y-5">

            {/* ── Pending Payments ───────────────────────────────── */}
            {inactiveAccounts.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-500" />
                        Pending Payments
                        <Badge className="bg-amber-500 text-white text-[10px] px-1.5">{inactiveAccounts.length}</Badge>
                    </h3>

                    {inactiveAccounts.map((account) => {
                        const isAwaiting = account.sentPayments.some(
                            p => p.status === 'PENDING' || p.status === 'UNDER_REVIEW'
                        )

                        return (
                            <Card key={account.id} className={`border-0 shadow-md overflow-hidden ${!isAwaiting ? 'ring-1 ring-amber-400/40' : ''}`}>
                                <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <PositionChip positionId={account.positionId} />
                                                <span className="text-xs text-muted-foreground">→</span>
                                                <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5">L{account.level}</Badge>
                                                <Badge className={`border-0 text-[10px] px-1.5 ${account.accountType === 'REENTRY' ? 'bg-purple-500/15 text-purple-700' : 'bg-blue-500/15 text-blue-700'
                                                    }`}>
                                                    {account.accountType === 'REENTRY' ? 'Re-entry' : 'Original'}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-sm">
                                                {isAwaiting ? 'Awaiting receiver approval' : `Pay ₹${AUTOPOOL_LEVEL_FEES[account.level].toLocaleString()} to activate`}
                                            </CardTitle>
                                        </div>
                                        {isAwaiting ? (
                                            <Badge className="bg-amber-500/20 text-amber-700 border-0 flex-shrink-0">
                                                <Clock className="w-3 h-3 mr-1" />Waiting
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-red-500/20 text-red-700 border-0 flex-shrink-0">
                                                Action Needed
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                {!isAwaiting && account.parent && (
                                    <CardContent className="py-3 px-4 space-y-3">
                                        <div className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Pay to</p>
                                                <p className="text-sm font-semibold">{account.parent.position.user.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                                    <a href={`tel:${account.parent.position.user.mobile}`}
                                                        className="text-xs text-muted-foreground hover:underline">
                                                        {account.parent.position.user.mobile}
                                                    </a>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-amber-600">
                                                ₹{AUTOPOOL_LEVEL_FEES[account.level].toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                                            onClick={() => handleResumePayment(account)}
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Complete Payment
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}
                </section>
            )}

            {/* ── Entry Links ────────────────────────────────────── */}
            {entryLinks.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4 text-violet-500" />
                        Join Autopool
                        <Badge className="bg-violet-500 text-white text-[10px] px-1.5">{entryLinks.length}</Badge>
                    </h3>

                    {entryLinks.map((link) => (
                        <Card key={link.id} className="border-0 shadow-md overflow-hidden ring-1 ring-violet-400/30">
                            <CardContent className="py-3 px-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {link.positionId && <PositionChip positionId={link.positionId} />}
                                            <Badge className="bg-violet-500/15 text-violet-700 border-0 text-[10px] px-1.5">Level 1 Entry</Badge>
                                        </div>
                                        <p className="text-sm font-medium">Join autopool matrix</p>
                                        <p className="text-xs text-muted-foreground">
                                            Entry fee · <span className="font-semibold text-foreground">₹{link.amount?.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={loadingId === link.id}
                                        onClick={() => handleActOnLink(link)}
                                        className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white flex-shrink-0"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        {loadingId === link.id ? 'Placing...' : 'Join Now'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            )}

            {/* ── Upgrade Links ──────────────────────────────────── */}
            {upgradeLinks.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                        Upgrades Available
                        <Badge className="bg-blue-500 text-white text-[10px] px-1.5">{upgradeLinks.length}</Badge>
                    </h3>

                    {upgradeLinks.map((link) => (
                        <Card key={link.id} className="border-0 shadow-md overflow-hidden ring-1 ring-blue-400/30">
                            <CardContent className="py-3 px-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {link.account?.positionId && <PositionChip positionId={link.account.positionId} />}
                                            <span className="text-xs text-muted-foreground">→</span>
                                            <Badge className="bg-blue-500/15 text-blue-700 border-0 text-[10px] px-1.5">
                                                L{(link.targetLevel ?? 0) - 1} → L{link.targetLevel}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-medium">Upgrade to Level {link.targetLevel}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Upgrade fee · <span className="font-semibold text-foreground">₹{link.amount?.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={loadingId === link.id}
                                        onClick={() => handleActOnLink(link)}
                                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                                    >
                                        <ArrowUpCircle className="w-3.5 h-3.5" />
                                        {loadingId === link.id ? 'Placing...' : 'Upgrade'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            )}

            {/* ── Re-entry Links ─────────────────────────────────── */}
            {reentryLinks.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-purple-500" />
                        Re-entries Available
                        <Badge className="bg-purple-500 text-white text-[10px] px-1.5">{reentryLinks.length}</Badge>
                    </h3>

                    {reentryLinks.map((link) => {
                        const remaining = (link.reentryCount ?? 0) - (link.reentriesIssued ?? 0)
                        return (
                            <Card key={link.id} className="border-0 shadow-md overflow-hidden ring-1 ring-purple-400/30">
                                <CardContent className="py-3 px-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {link.account?.positionId && <PositionChip positionId={link.account.positionId} />}
                                                <span className="text-xs text-muted-foreground">→</span>
                                                <Badge className="bg-purple-500/15 text-purple-700 border-0 text-[10px] px-1.5">
                                                    L{link.account?.level} Re-entry
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium">Re-enter Level 1 matrix</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs text-muted-foreground">
                                                    Entry fee · <span className="font-semibold text-foreground">₹200</span>
                                                </p>
                                                <span className="text-xs text-purple-600 font-medium">
                                                    {remaining} of {link.reentryCount} remaining
                                                </span>
                                            </div>
                                            {/* Progress dots */}
                                            <div className="flex gap-1">
                                                {Array.from({ length: link.reentryCount ?? 0 }).map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-2 h-2 rounded-full ${idx < (link.reentriesIssued ?? 0)
                                                                ? 'bg-purple-300'
                                                                : 'bg-purple-600'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={loadingId === link.id || remaining === 0}
                                            onClick={() => handleActOnLink(link)}
                                            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            {loadingId === link.id ? 'Placing...' : 'Re-enter'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </section>
            )}
        </div>
    )
}
