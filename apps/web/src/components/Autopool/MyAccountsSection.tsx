import { useState } from 'react'
import {
  Card, CardContent,
  Badge, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@repo/ui'
import {
  Layers, CheckCircle2, Clock, Lock, Users, GitBranch,
  RotateCcw, CreditCard, ArrowUpCircle, Link2, IndianRupee,
  Phone, TrendingUp, TrendingDown, Minus, ChevronDown,
} from 'lucide-react'
import {
  AUTOPOOL_LEVEL_FEES,
  AUTOPOOL_LEVEL_CONFIGS,
  type AutopoolAccount,
  type PaymentModalData,
} from '../../lib/autopoolApi'

const IDX = (level: number) => (level - 1) % 7

const GRADIENTS = [
  'from-blue-500/10 to-cyan-500/10',
  'from-violet-500/10 to-purple-500/10',
  'from-pink-500/10 to-rose-500/10',
  'from-orange-500/10 to-amber-500/10',
  'from-green-500/10 to-emerald-500/10',
  'from-teal-500/10 to-cyan-500/10',
  'from-indigo-500/10 to-blue-500/10',
]

const BORDERS = [
  'border-blue-500/30', 'border-violet-500/30', 'border-pink-500/30',
  'border-orange-500/30', 'border-green-500/30', 'border-teal-500/30',
  'border-indigo-500/30',
]

const ICON_BG = [
  'bg-blue-500/20 text-blue-600', 'bg-violet-500/20 text-violet-600',
  'bg-pink-500/20 text-pink-600', 'bg-orange-500/20 text-orange-600',
  'bg-green-500/20 text-green-600', 'bg-teal-500/20 text-teal-600',
  'bg-indigo-500/20 text-indigo-600',
]

interface Props {
  accounts: AutopoolAccount[]
  onPaymentModalOpen: (data: PaymentModalData) => void
  onGoToLinks: () => void
}

export const MyAccountsSection = ({ accounts, onPaymentModalOpen, onGoToLinks }: Props) => {
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  // Track open cards by id — default all closed on mobile, all open on desktop handled via CSS
  const [openCards, setOpenCards] = useState<Set<string>>(new Set())

  const toggleCard = (id: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (accounts.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-16 text-center">
          <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Layers className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Autopool Accounts</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Use your entry link from the Links tab to join the autopool matrix.
          </p>
        </CardContent>
      </Card>
    )
  }

  const filtered = accounts.filter((a) => {
    if (levelFilter !== 'ALL' && a.level !== parseInt(levelFilter)) return false
    if (typeFilter !== 'ALL' && a.accountType !== typeFilter) return false
    if (statusFilter === 'ACTIVE' && !a.isActive) return false
    if (statusFilter === 'PENDING' && a.isActive) return false
    return true
  })

  const handleCompletePayment = (account: AutopoolAccount) => {
    if (!account.parent) return
    onPaymentModalOpen({
      senderAccountId: account.id,
      receiverAccountId: account.parent.id,
      paymentType: account.upgradedFromAccountId ? 'UPGRADE' : 'ENTRY',
      amount: AUTOPOOL_LEVEL_FEES[account.level],
      level: account.level,
      receiverName: account.parent.user.name,
      receiverMobile: account.parent.user.mobile,
      receiverBankDetails: account.parent.user.bankDetails,
    })
  }

  return (
    <div className="space-y-4">
      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7].map((l) => (
              <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="ORIGINAL">Original</SelectItem>
            <SelectItem value="REENTRY">Re-entry</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>

        {(levelFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <Button
            variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground"
            onClick={() => {
              setLevelFilter('ALL')
              setTypeFilter('ALL')
              setStatusFilter('ALL')
            }}
          >
            Clear filters
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {accounts.length} accounts
        </span>
      </div>

      {filtered.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No accounts match your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* ── Account Cards — single column list, collapsible ───── */}
      <div className="flex flex-col gap-3">
        {filtered.map((account) => {
          const i = IDX(account.level)
          const config = AUTOPOOL_LEVEL_CONFIGS[account.level]
          const isOpen = openCards.has(account.id)

          // Earnings
          const totalReceived = account.receivedPayments.reduce((s, p) => s + p.amount, 0)
          const totalSent = account.sentPayments
            .filter((p) => p.status === 'APPROVED')
            .reduce((s, p) => s + p.amount, 0)
          const netEarnings = totalReceived - totalSent

          // Account state
          const hasActiveSentPayment = account.sentPayments.some(
            (p) => p.status === 'PENDING' || p.status === 'UNDER_REVIEW'
          )
          const needsPayment = !account.isActive && !hasActiveSentPayment
          const awaitingApproval = !account.isActive && hasActiveSentPayment
          const upgradeReady = account.isUpgradeLocked

          // Upgrade progress
          const upgradeAt = config.upgradeAtPayment
          const upgradeProgress = upgradeAt
            ? Math.min(account.paymentsReceived, upgradeAt)
            : null

          // Re-entry slots
          const reentryLink = account.pendingLinks.find((l) => l.linkType === 'REENTRY')
          const reentriesRemaining = reentryLink
            ? (reentryLink.reentryCount ?? 0) - (reentryLink.reentriesIssued ?? 0)
            : 0

          return (
            <Card
              key={account.id}
              className={`border-2 ${BORDERS[i]} shadow-md overflow-hidden transition-shadow duration-200`}
            >
              {/* ── Always-visible header — tap to expand ─────── */}
              <button
                onClick={() => toggleCard(account.id)}
                className={`w-full text-left bg-gradient-to-r ${GRADIENTS[i]} px-4 py-3.5 flex items-center gap-3`}
              >
                {/* Level icon */}
                <div className={`p-2 rounded-xl flex-shrink-0 ${ICON_BG[i]}`}>
                  <Layers className="w-4 h-4" />
                </div>

                {/* Level + type */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold">Level {account.level}</span>
                    {account.accountType === 'REENTRY' && (
                      <Badge className="bg-purple-500/20 text-purple-700 border-0 text-[10px] px-1.5 py-0">
                        Re-entry
                      </Badge>
                    )}
                    {upgradeReady && (
                      <Badge className="bg-orange-500/20 text-orange-700 border-0 text-[10px] px-1.5 py-0">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />Upgrading
                      </Badge>
                    )}
                  </div>

                  {/* Quick stats row — always visible */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-semibold ${
                      netEarnings > 0 ? 'text-emerald-600'
                      : netEarnings < 0 ? 'text-orange-600'
                      : 'text-muted-foreground'
                    }`}>
                      {totalReceived === 0 && totalSent === 0
                        ? 'No earnings yet'
                        : `Net ${netEarnings >= 0 ? '+' : ''}₹${netEarnings.toLocaleString()}`
                      }
                    </span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {account._count.children} member{account._count.children !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Status + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {account.isActive ? (
                    <Badge className="bg-green-500/20 text-green-700 border-0 text-[10px] px-1.5">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Active
                    </Badge>
                  ) : awaitingApproval ? (
                    <Badge className="bg-amber-500/20 text-amber-700 border-0 text-[10px] px-1.5">
                      <Clock className="w-2.5 h-2.5 mr-0.5" />Waiting
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-700 border-0 text-[10px] px-1.5">
                      <Clock className="w-2.5 h-2.5 mr-0.5" />Pay Now
                    </Badge>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* ── Collapsible body — grid-rows trick for smooth animation ── */}
              <div className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}>
                <div className="overflow-hidden">
                  <CardContent className="py-4 px-4 space-y-3 border-t">

                    {/* Earnings breakdown */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/15">
                        <div className="flex items-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <p className="text-[10px] font-medium text-muted-foreground">Received</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-600">
                          {totalReceived > 0 ? `₹${totalReceived.toLocaleString()}` : '—'}
                        </p>
                      </div>

                      <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/15">
                        <div className="flex items-center gap-1 mb-1">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <p className="text-[10px] font-medium text-muted-foreground">Paid Out</p>
                        </div>
                        <p className="text-sm font-bold text-red-600">
                          {totalSent > 0 ? `₹${totalSent.toLocaleString()}` : '—'}
                        </p>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${
                        netEarnings > 0
                          ? 'bg-violet-500/10 border-violet-500/15'
                          : netEarnings < 0
                            ? 'bg-orange-500/10 border-orange-500/15'
                            : 'bg-muted/50 border-border'
                      }`}>
                        <div className="flex items-center gap-1 mb-1">
                          {netEarnings > 0
                            ? <IndianRupee className="w-3 h-3 text-violet-500" />
                            : netEarnings < 0
                              ? <IndianRupee className="w-3 h-3 text-orange-500" />
                              : <Minus className="w-3 h-3 text-muted-foreground" />
                          }
                          <p className="text-[10px] font-medium text-muted-foreground">Net</p>
                        </div>
                        <p className={`text-sm font-bold ${
                          netEarnings > 0 ? 'text-violet-600'
                          : netEarnings < 0 ? 'text-orange-600'
                          : 'text-muted-foreground'
                        }`}>
                          {totalReceived === 0 && totalSent === 0
                            ? '—'
                            : `${netEarnings >= 0 ? '+' : ''}₹${netEarnings.toLocaleString()}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <p className="text-xs font-medium text-muted-foreground">Members</p>
                      </div>
                      <p className="text-lg font-bold">{account._count.children}</p>
                    </div>

                    {/* Upgrade progress */}
                    {account.isActive && upgradeAt && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            Upgrade Progress
                          </p>
                          <p className="text-xs font-semibold">
                            {upgradeReady ? 'Ready — check Links' : `${upgradeProgress} / ${upgradeAt}`}
                          </p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              upgradeReady ? 'bg-orange-500' : 'bg-violet-500'
                            }`}
                            style={{ width: `${((upgradeProgress ?? 0) / upgradeAt) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upgrade nudge */}
                    {upgradeReady && (
                      <button
                        onClick={onGoToLinks}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/15 rounded-lg border border-orange-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <p className="text-xs font-medium text-orange-700">
                            Upgrade link ready in Links tab
                          </p>
                        </div>
                        <span className="text-xs text-orange-500">→</span>
                      </button>
                    )}

                    {/* Re-entry available */}
                    {reentriesRemaining > 0 && (
                      <div className="flex items-center justify-between gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <p className="text-xs text-purple-700 font-medium">
                            {reentriesRemaining} re-entr{reentriesRemaining === 1 ? 'y' : 'ies'} available
                          </p>
                        </div>
                        <button
                          onClick={onGoToLinks}
                          className="text-xs text-purple-600 hover:underline font-medium"
                        >
                          Use →
                        </button>
                      </div>
                    )}

                    {/* Re-entries used */}
                    {account.reentriesCreated > 0 && reentriesRemaining === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg">
                        <RotateCcw className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          {account.reentriesCreated} re-entr{account.reentriesCreated === 1 ? 'y' : 'ies'} created
                        </p>
                      </div>
                    )}

                    {/* Upline */}
                    {account.isActive && account.parent && (
                      <div className="px-3 py-2.5 bg-muted/40 rounded-lg space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Upline</p>
                        <p className="text-sm font-semibold">{account.parent.user.name}</p>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <a
                            href={`tel:${account.parent.user.mobile}`}
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                          >
                            {account.parent.user.mobile}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Resume payment */}
                    {needsPayment && account.parent && (
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => handleCompletePayment(account)}
                      >
                        <CreditCard className="w-4 h-4" />
                        Complete Payment · ₹{AUTOPOOL_LEVEL_FEES[account.level].toLocaleString()}
                      </Button>
                    )}

                    {/* Tree position */}
                    <div className="pt-1 border-t">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground font-mono">
                          Tree position #{account.treePosition}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}