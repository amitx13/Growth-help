import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent, Skeleton, Button } from '@repo/ui'
import { LayoutGrid, Link2, InboxIcon, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  autopoolApi,
  type AutopoolPendingLink,
  type AutopoolAccount,
  type AutopoolIncomingPayment,
  type PaymentModalData,
} from '../../lib/autopoolApi'
import { PendingLinksSection } from './PendingLinksSection'
import { MyAccountsSection } from './MyAccountsSection'
import { IncomingPaymentsSection } from './IncomingPaymentsSection'
import { PaymentSubmitModal } from './PaymentSubmitModal'

export const AutopoolPage = () => {
  const [activeTab, setActiveTab] = useState('links')
  const [links, setLinks] = useState<AutopoolPendingLink[]>([])
  const [accounts, setAccounts] = useState<AutopoolAccount[]>([])
  const [incomingPayments, setIncomingPayments] = useState<AutopoolIncomingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [paymentModalData, setPaymentModalData] = useState<PaymentModalData | null>(null)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [linksRes, accountsRes, paymentsRes] = await Promise.all([
        autopoolApi.getPendingLinks(),
        autopoolApi.getMyAccounts(),
        autopoolApi.getIncomingPayments(),
      ])
      setLinks(linksRes.data.data)
      setAccounts(accountsRes.data.data)
      setIncomingPayments(paymentsRes.data.data)
    } catch (error: any) {
      toast.error(
        <div className="text-red-500">{error.response?.data?.error || error.message}</div>
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-2xl border border-violet-500/30 shadow-md">
              <LayoutGrid className="w-8 h-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500">
                Autopool
              </h1>
              <p className="text-muted-foreground mt-1">Your automated earning matrix</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="links" className="gap-1.5">
              <Link2 className="w-4 h-4" />
              Links
              {links.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-violet-600 text-white rounded-full leading-none">
                  {links.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-1.5">
              <LayoutGrid className="w-4 h-4" />
              My Accounts
            </TabsTrigger>
            <TabsTrigger value="incoming" className="gap-1.5">
              <InboxIcon className="w-4 h-4" />
              Incoming
              {incomingPayments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full leading-none">
                  {incomingPayments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links">
            <PendingLinksSection
              links={links}
              accounts={accounts}
              onPaymentModalOpen={setPaymentModalData}
            />
          </TabsContent>

          <TabsContent value="accounts">
            <MyAccountsSection
              accounts={accounts}
              onPaymentModalOpen={setPaymentModalData}
              onGoToLinks={() => setActiveTab('links')}
            />
          </TabsContent>

          <TabsContent value="incoming">
            <IncomingPaymentsSection
              payments={incomingPayments}
              onRefresh={() => fetchAll(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Payment Submit Modal */}
        <PaymentSubmitModal
          open={!!paymentModalData}
          data={paymentModalData}
          onClose={() => {
            fetchAll()
            setPaymentModalData(null)
          }}
          onSuccess={() => {
            setPaymentModalData(null)
            fetchAll(true)
          }}
        />
      </div>
    </div>
  )
}
