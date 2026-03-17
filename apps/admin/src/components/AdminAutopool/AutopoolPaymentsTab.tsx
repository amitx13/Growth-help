import { useState, useCallback, useEffect } from 'react'
import {
    Card, CardContent, CardHeader, CardTitle,
    Badge, Button,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Dialog, DialogContent, DialogHeader, DialogTitle,
    ConfirmModal,
    Tabs, TabsList, TabsTrigger, TabsContent,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@repo/ui'
import {
    Wallet, Eye, CheckCircle, XCircle, Clock,
    ChevronLeft, ChevronRight, AlertCircle,
    RefreshCw, ArrowUpRight, ArrowDownLeft, ImageIcon,
    Phone,
    User,
} from 'lucide-react'
import { toast } from 'sonner'
import { autopoolAdminApi, type AdminAutopoolPayment } from '../../lib/autopoolAdminApi'

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL!
const ITEMS_PER_PAGE = 10

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    APPROVED: 'bg-green-500 text-white',
    REJECTED: 'bg-red-500 hover:bg-red-600 text-white',
    UNDER_REVIEW: 'bg-amber-500 hover:bg-amber-600 text-white',
}
const TYPE_COLOR: Record<string, string> = {
    ENTRY: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
    UPGRADE: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
}

export const AutopoolPaymentsTab = () => {
    const [payments, setPayments] = useState<AdminAutopoolPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('review')
    const [levelFilter, setLevelFilter] = useState('ALL')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedPayment, setSelectedPayment] = useState<AdminAutopoolPayment | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmPayment, setConfirmPayment] = useState<AdminAutopoolPayment | null>(null)
    const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await autopoolAdminApi.getPayments(undefined, 1, 500)
            setPayments(res.data.data)
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const filtered = payments.filter((p) =>
        levelFilter === 'ALL' ? true : p.level === parseInt(levelFilter)
    )

    const byTab: Record<string, AdminAutopoolPayment[]> = {
        review: filtered.filter((p) => p.status === 'UNDER_REVIEW'),
        pending: filtered.filter((p) => p.status === 'PENDING'),
        approved: filtered.filter((p) => p.status === 'APPROVED'),
        rejected: filtered.filter((p) => p.status === 'REJECTED'),
    }

    const tabData = byTab[activeTab] ?? filtered
    const totalPages = Math.ceil(tabData.length / ITEMS_PER_PAGE)
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    const paginated = tabData.slice(startIdx, startIdx + ITEMS_PER_PAGE)

    const openConfirm = (payment: AdminAutopoolPayment, action: 'APPROVED' | 'REJECTED') => {
        setConfirmPayment(payment)
        setConfirmAction(action)
        setConfirmOpen(true)
    }

    const handleConfirm = async () => {
        if (!confirmPayment) return
        try {
            await autopoolAdminApi.resolvePayment(confirmPayment.id, confirmAction)
            toast.success(
                <div className="text-green-600">
                    Payment {confirmAction === 'APPROVED' ? 'approved' : 'rejected'} successfully!
                </div>
            )
            setDetailOpen(false)
            load()
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setConfirmPayment(null)
            setConfirmOpen(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Under Review', count: byTab.review.length, color: 'text-amber-600', bg: 'bg-amber-500/10', icon: <AlertCircle className="w-5 h-5 text-amber-600" /> },
                    { label: 'Pending', count: byTab.pending.length, color: 'text-yellow-600', bg: 'bg-yellow-500/10', icon: <Clock className="w-5 h-5 text-yellow-600" /> },
                    { label: 'Approved', count: byTab.approved.length, color: 'text-green-600', bg: 'bg-green-500/10', icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
                    { label: 'Rejected', count: byTab.rejected.length, color: 'text-red-600', bg: 'bg-red-500/10', icon: <XCircle className="w-5 h-5 text-red-600" /> },
                ].map((s) => (
                    <Card key={s.label} className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className={`p-2 ${s.bg} rounded-lg w-fit mb-3`}>{s.icon}</div>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters row */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setCurrentPage(1) }}>
                    <SelectTrigger className="w-40 h-10">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Levels</SelectItem>
                        {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                            <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={load} className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Table */}
            <Card className="border-0 shadow-xl">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1) }}>
                    <div className="border-b">
                        <div className="px-4 sm:px-6 pt-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-primary" />
                                Autopool Payments
                            </CardTitle>
                        </div>
                        <TabsList className="bg-transparent h-auto p-0 px-2 sm:px-6 w-full justify-start overflow-x-auto">
                            {[
                                { value: 'review', label: 'Verify', count: byTab.review.length, badge: 'bg-amber-500' },
                                { value: 'pending', label: 'Pending', count: byTab.pending.length, badge: 'bg-yellow-500' },
                                { value: 'approved', label: 'Approved', count: byTab.approved.length, badge: 'bg-green-500' },
                                { value: 'rejected', label: 'Rejected', count: byTab.rejected.length, badge: 'bg-red-500' },
                            ].map((t) => (
                                <TabsTrigger
                                    key={t.value}
                                    value={t.value}
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2.5 text-xs sm:text-sm whitespace-nowrap"
                                >
                                    {t.label}
                                    <Badge className={`ml-1.5 ${t.badge} text-white text-[10px] px-1.5 py-0`}>
                                        {t.count}
                                    </Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent value={activeTab} className="m-0">
                        {/* Desktop table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginated.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                                                <p className="text-sm text-muted-foreground">No payments found</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.map((p) => (
                                        <TableRow key={p.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <p className="font-medium text-sm">{p.senderAccount.user.name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">{p.senderAccount.user.id}</p>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">{p.senderAccount.user.mobile}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium text-sm">{p.receiverAccount.user.name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">{p.receiverAccount.user.id}</p>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">{p.receiverAccount.user.mobile}</p>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs ${TYPE_COLOR[p.paymentType]}`}>
                                                    {p.paymentType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-primary/10 text-primary border-0 text-xs">
                                                    L{p.level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">
                                                ₹{p.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`text-xs ${STATUS_COLOR[p.status]}`}>
                                                    {p.status === 'UNDER_REVIEW' ? 'REVIEW' : p.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" onClick={() => { setSelectedPayment(p); setDetailOpen(true) }}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile cards */}
                        <div className="lg:hidden divide-y">
                            {paginated.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-muted-foreground">No payments found</p>
                                </div>
                            ) : paginated.map((p) => (
                                <div key={p.id} className="p-4 space-y-3">
                                    {/* Status / Type / Amount row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={`text-xs ${TYPE_COLOR[p.paymentType]}`}>{p.paymentType}</Badge>
                                                <Badge className="bg-primary/10 text-primary border-0 text-xs">L{p.level}</Badge>
                                            </div>
                                            <Badge className={`text-xs ${STATUS_COLOR[p.status]}`}>
                                                {p.status === 'UNDER_REVIEW' ? 'REVIEW' : p.status}
                                            </Badge>
                                        </div>
                                        <p className="text-lg font-bold text-emerald-600">₹{p.amount.toLocaleString()}</p>
                                    </div>

                                    {/* From / To with id + mobile */}
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <ArrowUpRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">{p.senderAccount.user.name}</p>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-[10px] font-mono text-muted-foreground/70">{p.senderAccount.user.id}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">{p.senderAccount.user.mobile}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <ArrowDownLeft className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">{p.receiverAccount.user.name}</p>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-[10px] font-mono text-muted-foreground/70">{p.receiverAccount.user.id}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">{p.receiverAccount.user.mobile}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs"
                                        onClick={() => { setSelectedPayment(p); setDetailOpen(true) }}>
                                        <Eye className="w-3.5 h-3.5" />
                                        View Details
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground">
                                    {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, tabData.length)} of {tabData.length}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                        const pg = totalPages <= 3 ? i + 1
                                            : currentPage <= 2 ? i + 1
                                                : currentPage >= totalPages - 1 ? totalPages - 2 + i
                                                    : currentPage - 1 + i
                                        return (
                                            <Button key={pg} size="sm" className="h-8 w-8 p-0"
                                                variant={currentPage === pg ? 'default' : 'outline'}
                                                onClick={() => setCurrentPage(pg)}>{pg}</Button>
                                        )
                                    })}
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Detail Modal */}
            {selectedPayment && (
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                        <DialogHeader className="p-5 border-b">
                            <DialogTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-primary" />
                                Autopool Payment Details
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-5 space-y-5">
                            {/* Amount */}
                            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                                    <p className="text-3xl font-bold text-emerald-600">₹{selectedPayment.amount.toLocaleString()}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <Badge variant="outline" className={`text-xs ${TYPE_COLOR[selectedPayment.paymentType]}`}>
                                        {selectedPayment.paymentType}
                                    </Badge>
                                    <br />
                                    <Badge className={`text-xs ${STATUS_COLOR[selectedPayment.status]}`}>
                                        {selectedPayment.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : selectedPayment.status}
                                    </Badge>
                                </div>
                            </div>

                            {/* Sender / Receiver */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 space-y-2">
                                    <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                                        <ArrowUpRight className="w-4 h-4" /> From
                                    </p>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Name</p>
                                        <p className="font-semibold text-sm">{selectedPayment.senderAccount.user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">User ID</p>
                                        <p className="font-semibold text-sm">{selectedPayment.senderAccount.user.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account ID</p>
                                        <p className="font-mono text-xs break-all">{selectedPayment.senderAccountId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account Type</p>
                                        <Badge className="text-xs bg-primary/10 text-primary border-0">
                                            L{selectedPayment.senderAccount.level} · {selectedPayment.senderAccount.accountType}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 space-y-2">
                                    <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                                        <ArrowDownLeft className="w-4 h-4" /> To
                                    </p>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Name</p>
                                        <p className="font-semibold text-sm">{selectedPayment.receiverAccount.user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">User ID</p>
                                        <p className="font-semibold text-sm">{selectedPayment.receiverAccount.user.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account ID</p>
                                        <p className="font-mono text-xs break-all">{selectedPayment.receiverAccountId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account Type</p>
                                        <Badge className="text-xs bg-primary/10 text-primary border-0">
                                            L{selectedPayment.receiverAccount.level} · {selectedPayment.receiverAccount.accountType}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Screenshot */}
                            {selectedPayment.screenshotUrl ? (
                                <Card className="border-0 shadow-md">
                                    <CardHeader className="bg-muted/30 p-4">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-primary" />
                                            Payment Screenshot
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <img
                                            src={`${VITE_BASE_URL}${selectedPayment.screenshotUrl}`}
                                            alt="Payment screenshot"
                                            className="w-full max-w-sm mx-auto rounded-lg border shadow"
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm text-amber-700">No screenshot uploaded yet.</p>
                                </div>
                            )}

                            {/* Admin actions*/}
                            {(selectedPayment.status === 'UNDER_REVIEW' || selectedPayment.status === 'PENDING') && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                                            onClick={() => openConfirm(selectedPayment, 'APPROVED')}
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1 gap-2"
                                            onClick={() => openConfirm(selectedPayment, 'REJECTED')}
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <ConfirmModal
                open={confirmOpen}
                title={confirmAction === 'APPROVED' ? 'Approve this payment?' : 'Reject this payment?'}
                description={
                    confirmPayment
                        ? `₹${confirmPayment.amount} payment from ${confirmPayment.senderAccount.user.name} → ${confirmPayment.receiverAccount.user.name}`
                        : ''
                }
                onCancel={() => { setConfirmPayment(null); setConfirmOpen(false) }}
                onConfirm={handleConfirm}
                confirmVariant={confirmAction === 'APPROVED' ? 'default' : 'destructive'}
            />
        </>
    )
}
