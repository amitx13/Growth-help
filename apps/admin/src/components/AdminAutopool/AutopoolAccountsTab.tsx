import { useState, useCallback, useEffect } from 'react'
import {
    Card, CardContent,
    Badge, Button,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@repo/ui'
import {
    Layers, CheckCircle2, Clock, Lock, RotateCcw,
    ChevronLeft, ChevronRight, RefreshCw,
    Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { autopoolAdminApi, type AdminAutopoolAccount } from '../../lib/autopoolAdminApi'

const ITEMS_PER_PAGE = 15

export const AutopoolAccountsTab = () => {
    const [accounts, setAccounts] = useState<AdminAutopoolAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [levelFilter, setLevelFilter] = useState('ALL')
    const [currentPage, setCurrentPage] = useState(1)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await autopoolAdminApi.getAccounts(undefined, 1, 500)
            setAccounts(res.data.data)
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const filtered = accounts.filter((a) =>
        levelFilter === 'ALL' ? true : a.level === parseInt(levelFilter)
    )

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE)

    const stats = {
        total: accounts.length,
        active: accounts.filter((a) => a.isActive).length,
        locked: accounts.filter((a) => a.isUpgradeLocked).length,
        pending: accounts.filter((a) => !a.isActive).length,
    }

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Accounts', value: stats.total, color: 'text-primary', bg: 'bg-primary/10', icon: <Layers className="w-5 h-5 text-primary" /> },
                    { label: 'Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-500/10', icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-500/10', icon: <Clock className="w-5 h-5 text-amber-600" /> },
                    { label: 'Upgrade Locked', value: stats.locked, color: 'text-orange-600', bg: 'bg-orange-500/10', icon: <Lock className="w-5 h-5 text-orange-600" /> },
                ].map((s) => (
                    <Card key={s.label} className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className={`p-2 ${s.bg} rounded-lg w-fit mb-3`}>{s.icon}</div>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
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

            {/* Desktop Table */}
            <Card className="border-0 shadow-xl">
                <div className="hidden lg:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Accounts</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Tree Pos</TableHead>
                                <TableHead className="text-center">Payments In</TableHead>
                                <TableHead className="text-center">Children</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                                        <p className="text-sm text-muted-foreground">No accounts found</p>
                                    </TableCell>
                                </TableRow>
                            ) : paginated.map((a) => (
                                <TableRow key={a.id} className="hover:bg-muted/30">
                                    <TableCell>
                                        {/* Position ID — primary identifier */}
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-xs font-semibold text-foreground">
                                                {a.positionId.toUpperCase()}
                                            </p>
                                            <Badge className={`text-xs border-0 ${a.position.positionType === 'REENTRY'
                                                ? 'bg-purple-500/15 text-purple-700'
                                                : 'bg-sky-500/15 text-sky-700'
                                                }`}>
                                                {a.position.positionType}
                                            </Badge>
                                        </div>
                                        {/* Autopool account slot ID — smaller */}
                                        <p className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                                            acct: {a.id.slice(-6)}
                                        </p>
                                        {/* Owner as secondary info */}
                                        <p className="text-xs font-medium text-muted-foreground mt-1">{a.position.user.name}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">{a.position.user.mobile}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-primary/10 text-primary border-0 text-xs">L{a.level}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`text-xs text-white ${a.accountType === 'REENTRY' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                            {a.accountType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">#{a.treePosition}</TableCell>
                                    <TableCell className="text-center font-bold">{a.paymentsReceived}</TableCell>
                                    <TableCell className="text-center font-bold">{a._count.children}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {a.isActive ? (
                                                <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                                            ) : (
                                                <Badge className="bg-amber-500 text-white text-xs">Pending</Badge>
                                            )}
                                            {a.isUpgradeLocked && (
                                                <Badge className="bg-orange-500 text-white text-xs">
                                                    <Lock className="w-2.5 h-2.5 mr-1" />Locked
                                                </Badge>
                                            )}
                                            {a.accountType === 'REENTRY' && (
                                                <Badge className="bg-purple-500/20 text-purple-700 border-0 text-xs">
                                                    <RotateCcw className="w-2.5 h-2.5 mr-1" />Re-entry
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden divide-y">
                    {paginated.map((a) => (
                        <div key={a.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-xs font-semibold">
                                            {a.positionId.toUpperCase()}
                                        </p>
                                        <Badge className={`text-xs border-0 ${a.position.positionType === 'REENTRY'
                                                ? 'bg-purple-500/15 text-purple-700'
                                                : 'bg-sky-500/15 text-sky-700'
                                            }`}>
                                            {a.position.positionType}
                                        </Badge>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{a.position.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{a.position.user.mobile}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge className="bg-primary/10 text-primary border-0 text-xs">L{a.level}</Badge>
                                    {a.isActive
                                        ? <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                                        : <Badge className="bg-amber-500 text-white text-xs">Pending</Badge>
                                    }
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Payments: <strong className="text-foreground">{a.paymentsReceived}</strong></span>
                                <span>Children: <strong className="text-foreground">{a._count.children}</strong></span>
                                <span>Tree: <strong className="text-foreground">#{a.treePosition}</strong></span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                            {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
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
            </Card>
        </>
    )
}
