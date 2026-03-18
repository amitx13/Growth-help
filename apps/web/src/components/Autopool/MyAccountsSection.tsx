import { useState } from 'react'
import {
  Card, CardContent, Badge, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@repo/ui'
import {
  Layers, CheckCircle2, Clock, Lock, Users, GitBranch,
  RotateCcw, CreditCard, ArrowUpCircle, Link2, IndianRupee,
  Phone, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Wallet,
} from 'lucide-react'
import {
  AUTOPOOL_LEVEL_FEES,
  AUTOPOOL_LEVEL_CONFIGS,
  type AutopoolAccount,
  type PaymentModalData,
} from '../../lib/autopoolApi'

const IDX = (level: number) => (level - 1) % 7

const LEVEL_COLORS = [
  'text-blue-600 bg-blue-500/15',
  'text-violet-600 bg-violet-500/15',
  'text-pink-600 bg-pink-500/15',
  'text-orange-600 bg-orange-500/15',
  'text-green-600 bg-green-500/15',
  'text-teal-600 bg-teal-500/15',
  'text-indigo-600 bg-indigo-500/15',
]

function getAccountState(account: AutopoolAccount) {
  const totalReceived = account.receivedPayments.reduce((s, p) => s + p.amount, 0)
  const totalSent = account.sentPayments.filter(p => p.status === 'APPROVED').reduce((s, p) => s + p.amount, 0)
  const netEarnings = totalReceived - totalSent
  const hasActiveSent = account.sentPayments.some(p => p.status === 'PENDING' || p.status === 'UNDER_REVIEW')
  const needsPayment = !account.isActive && !hasActiveSent && !!account.parentAccountId
  const awaitingApproval = !account.isActive && hasActiveSent
  const reentryLink = account.pendingLinks.find(l => l.linkType === 'REENTRY')
  const reentriesRemaining = reentryLink
    ? (reentryLink.reentryCount ?? 0) - (reentryLink.reentriesIssued ?? 0)
    : 0
  return { totalReceived, totalSent, netEarnings, needsPayment, awaitingApproval, reentriesRemaining }
}

interface Props {
  accounts: AutopoolAccount[]
  onPaymentModalOpen: (data: PaymentModalData) => void
  onGoToLinks: () => void
}

export const MyAccountsSection = ({ accounts, onPaymentModalOpen, onGoToLinks }: Props) => {
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [openPositions, setOpenPositions] = useState<Set<string>>(new Set())
  const [selectedAccount, setSelectedAccount] = useState<AutopoolAccount | null>(null)

  const togglePosition = (positionId: string) => {
    setOpenPositions(prev => {
      const next = new Set(prev)
      next.has(positionId) ? next.delete(positionId) : next.add(positionId)
      return next
    })
  }

  const filterAccount = (a: AutopoolAccount) => {
    if (levelFilter !== 'ALL' && a.level !== parseInt(levelFilter)) return false
    if (typeFilter !== 'ALL' && a.accountType !== typeFilter) return false
    if (statusFilter === 'ACTIVE' && !a.isActive) return false
    if (statusFilter === 'PENDING' && a.isActive) return false
    return true
  }

  // Group by positionId, sorted by first account creation
  const grouped = accounts.reduce((acc, account) => {
    if (!acc[account.positionId]) acc[account.positionId] = []
    acc[account.positionId].push(account)
    return acc
  }, {} as Record<string, AutopoolAccount[]>)

  const positionIds = Object.keys(grouped).sort((a, b) =>
    new Date(grouped[a][0].createdAt).getTime() - new Date(grouped[b][0].createdAt).getTime()
  )

  const visiblePositions = positionIds.filter(id => grouped[id].some(filterAccount))
  const totalFiltered = visiblePositions.reduce((s, id) => s + grouped[id].filter(filterAccount).length, 0)

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="All Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7].map(l => <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="ORIGINAL">Original</SelectItem>
            <SelectItem value="REENTRY">Re-entry</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>

        {(levelFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground"
            onClick={() => { setLevelFilter('ALL'); setTypeFilter('ALL'); setStatusFilter('ALL') }}>
            Clear filters
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {totalFiltered} account{totalFiltered !== 1 ? 's' : ''} · {visiblePositions.length} position{visiblePositions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {visiblePositions.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No accounts match your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Position cards */}
      <div className="flex flex-col gap-3">
        {visiblePositions.map((positionId) => {
          const posAccounts = grouped[positionId]
          const filteredAccounts = posAccounts.filter(filterAccount)
          const isOpen = openPositions.has(positionId)

          const totalNet = posAccounts.reduce((s, a) => s + getAccountState(a).netEarnings, 0)
          const activeCount = posAccounts.filter(a => a.isActive).length
          const pendingCount = posAccounts.filter(a => !a.isActive).length
          const positionType = posAccounts[0].position?.positionType ?? 'ORIGINAL'
          const hasUrgent = posAccounts.some(a => getAccountState(a).needsPayment)

          return (
            <Card key={positionId} className={`border-0 shadow-md overflow-hidden ${hasUrgent ? 'ring-1 ring-amber-400/50' : ''}`}>
              {/* Position header */}
              <button
                onClick={() => togglePosition(positionId)}
                className="w-full text-left px-4 py-3.5 bg-muted/40 hover:bg-muted/60 transition-colors flex items-center gap-3"
              >
                <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold text-foreground">
                      {positionId.toUpperCase()}
                    </span>
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 ${positionType === 'ORIGINAL' ? 'bg-blue-500/15 text-blue-700' : 'bg-purple-500/15 text-purple-700'
                      }`}>
                      {positionType === 'ORIGINAL' ? 'Original' : 'Re-entry'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {posAccounts.length} autopool acc{posAccounts.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs font-semibold ${totalNet > 0 ? 'text-emerald-600' : totalNet < 0 ? 'text-orange-600' : 'text-muted-foreground'
                      }`}>
                      {totalNet === 0 ? 'No earnings' : `Net ${totalNet >= 0 ? '+' : ''}₹${totalNet.toLocaleString()}`}
                    </span>
                    {activeCount > 0 && <span className="text-[10px] text-emerald-600">{activeCount} active</span>}
                    {pendingCount > 0 && <span className="text-[10px] text-amber-600">{pendingCount} pending</span>}
                  </div>
                </div>

                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Collapsible account rows */}
              <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="divide-y border-t">
                    {filteredAccounts
                      .sort((a, b) => a.level - b.level || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((account) => {
                        const { netEarnings, totalReceived, totalSent, needsPayment, awaitingApproval } = getAccountState(account)
                        const i = IDX(account.level)

                        return (
                          <button
                            key={account.id}
                            onClick={() => setSelectedAccount(account)}
                            className="w-full text-left px-4 py-3 hover:bg-muted/30 active:bg-muted/50 transition-colors flex items-center gap-3"
                          >
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${LEVEL_COLORS[i]}`}>
                              L{account.level}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">
                                  {account.accountType === 'REENTRY' ? 'Re-entry' : 'Original'}
                                </span>
                                {account.isUpgradeLocked && <Lock className="w-3 h-3 text-orange-500" />}
                              </div>
                              <span className={`text-xs font-medium ${netEarnings > 0 ? 'text-emerald-600'
                                  : netEarnings < 0 ? 'text-orange-600'
                                    : 'text-muted-foreground'
                                }`}>
                                {totalReceived === 0 && totalSent === 0
                                  ? 'No activity'
                                  : `${netEarnings >= 0 ? '+' : ''}₹${netEarnings.toLocaleString()}`
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {account.isActive ? (
                                <Badge className="bg-green-500/20 text-green-700 border-0 text-[10px] px-1.5">Active</Badge>
                              ) : awaitingApproval ? (
                                <Badge className="bg-amber-500/20 text-amber-700 border-0 text-[10px] px-1.5">Waiting</Badge>
                              ) : needsPayment ? (
                                <Badge className="bg-red-500/20 text-red-700 border-0 text-[10px] px-1.5">Pay Now</Badge>
                              ) : null}
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onPaymentModalOpen={(data) => { setSelectedAccount(null); onPaymentModalOpen(data) }}
          onGoToLinks={() => { setSelectedAccount(null); onGoToLinks() }}
        />
      )}
    </div>
  )
}

// ── Detail Modal ───────────────────────────────────────────────────────
interface ModalProps {
  account: AutopoolAccount
  onClose: () => void
  onPaymentModalOpen: (data: PaymentModalData) => void
  onGoToLinks: () => void
}

const AccountDetailModal = ({ account, onClose, onPaymentModalOpen, onGoToLinks }: ModalProps) => {
  const { totalReceived, totalSent, netEarnings, needsPayment, awaitingApproval, reentriesRemaining } = getAccountState(account)
  const config = AUTOPOOL_LEVEL_CONFIGS[account.level]
  const upgradeAt = config.upgradeAtPayment
  const upgradeReady = account.isUpgradeLocked
  const upgradeProgress = upgradeAt ? Math.min(account.paymentsReceived, upgradeAt) : null
  const i = IDX(account.level)

  const handleCompletePayment = () => {
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
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${LEVEL_COLORS[i]}`}>
              Level {account.level}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {account.accountType === 'REENTRY' ? 'Re-entry' : 'Original'} Account
            </span>
            {upgradeReady && (
              <Badge className="bg-orange-500/20 text-orange-700 border-0 text-xs ml-auto">
                <Lock className="w-3 h-3 mr-1" />Upgrading
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Status + tree position */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div className="flex items-center gap-2">
              {account.isActive ? (
                <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-700">Active</span></>
              ) : awaitingApproval ? (
                <><Clock className="w-4 h-4 text-amber-500" /><span className="text-sm font-medium text-amber-700">Awaiting Approval</span></>
              ) : (
                <><Clock className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-700">Payment Required</span></>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">#{account.treePosition}</span>
            </div>
          </div>

          {/* Earnings grid */}
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

            <div className={`p-2.5 rounded-lg border ${netEarnings > 0 ? 'bg-violet-500/10 border-violet-500/15'
                : netEarnings < 0 ? 'bg-orange-500/10 border-orange-500/15'
                  : 'bg-muted/50 border-border'
              }`}>
              <div className="flex items-center gap-1 mb-1">
                <IndianRupee className={`w-3 h-3 ${netEarnings > 0 ? 'text-violet-500' : netEarnings < 0 ? 'text-orange-500' : 'text-muted-foreground'
                  }`} />
                <p className="text-[10px] font-medium text-muted-foreground">Net</p>
              </div>
              <p className={`text-sm font-bold ${netEarnings > 0 ? 'text-violet-600' : netEarnings < 0 ? 'text-orange-600' : 'text-muted-foreground'
                }`}>
                {totalReceived === 0 && totalSent === 0 ? '—'
                  : `${netEarnings >= 0 ? '+' : ''}₹${netEarnings.toLocaleString()}`}
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
                  <ArrowUpCircle className="w-3.5 h-3.5" />Upgrade Progress
                </p>
                <p className="text-xs font-semibold">
                  {upgradeReady ? 'Ready — check Links' : `${upgradeProgress} / ${upgradeAt}`}
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${upgradeReady ? 'bg-orange-500' : 'bg-violet-500'}`}
                  style={{ width: `${((upgradeProgress ?? 0) / upgradeAt) * 100}%` }}
                />
              </div>
            </div>
          )}

          {upgradeReady && (
            <button
              onClick={onGoToLinks}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/15 rounded-lg border border-orange-500/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <p className="text-xs font-medium text-orange-700">Upgrade link ready in Links tab</p>
              </div>
              <span className="text-xs text-orange-500">→</span>
            </button>
          )}

          {/* Re-entry */}
          {reentriesRemaining > 0 && (
            <div className="flex items-center justify-between gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <p className="text-xs text-purple-700 font-medium">
                  {reentriesRemaining} re-entr{reentriesRemaining === 1 ? 'y' : 'ies'} available
                </p>
              </div>
              <button onClick={onGoToLinks} className="text-xs text-purple-600 hover:underline font-medium">
                Use →
              </button>
            </div>
          )}

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
              <p className="text-sm font-semibold">{account.parent.position.user.name}</p>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <a href={`tel:${account.parent.position.user.mobile}`}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                  {account.parent.position.user.mobile}
                </a>
              </div>
            </div>
          )}

          {/* Pay button */}
          {needsPayment && account.parent && (
            <Button
              size="sm"
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleCompletePayment}
            >
              <CreditCard className="w-4 h-4" />
              Complete Payment · ₹{AUTOPOOL_LEVEL_FEES[account.level].toLocaleString()}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}