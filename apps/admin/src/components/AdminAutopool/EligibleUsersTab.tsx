import { useState, useCallback, useEffect } from 'react'
import {
    Card,
    Badge, Button,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    ConfirmModal,
} from '@repo/ui'
import { Users, Zap, RefreshCw, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { autopoolAdminApi, type EligibleUser } from '../../lib/autopoolAdminApi'

export const EligibleUsersTab = () => {
    const [users, setUsers] = useState<EligibleUser[]>([])
    const [loading, setLoading] = useState(true)
    const [generatingId, setGeneratingId] = useState<string | null>(null)
    const [confirmUser, setConfirmUser] = useState<EligibleUser | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await autopoolAdminApi.getEligibleUsers(1, 200)
            setUsers(res.data.data)
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleGenerate = async () => {
        if (!confirmUser) return
        setGeneratingId(confirmUser.id)
        try {
            await autopoolAdminApi.generateEntryLink(confirmUser.id)
            toast.success(
                <div className="text-green-600">
                    Entry link generated for {confirmUser.name}!
                </div>
            )
            setUsers((prev) => prev.filter((u) => u.id !== confirmUser.id))
        } catch (error: any) {
            toast.error(<div className="text-red-500">{error.response?.data?.error || error.message}</div>)
        } finally {
            setGeneratingId(null)
            setConfirmUser(null)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <>
            {/* Header info */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-500/10 rounded-xl">
                        <Users className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold">Eligible Users</h2>
                        <p className="text-xs text-muted-foreground">
                            {users.length} user{users.length !== 1 ? 's' : ''} with 2+ referrals and no entry link yet
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={load} className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card className="border-0 shadow-xl">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Mobile</TableHead>
                                <TableHead className="text-center">Direct Referrals</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16">
                                        <div className="p-4 bg-green-500/10 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                                        </div>
                                        <p className="font-semibold text-sm">All caught up!</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            No eligible users without an entry link.
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : users.map((u) => (
                                <TableRow key={u.id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <p className="font-semibold text-sm">{u.name}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{u.id}</p>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                                    <TableCell className="text-sm">{u.mobile}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-green-500/20 text-green-700 border-0">
                                            {u._count.directReferrals} referrals
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            disabled={generatingId === u.id}
                                            onClick={() => setConfirmUser(u)}
                                            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                                        >
                                            <Zap className="w-3.5 h-3.5" />
                                            {generatingId === u.id ? 'Generating...' : 'Generate Link'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden divide-y">
                    {users.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold">All caught up!</p>
                            <p className="text-xs text-muted-foreground mt-1">No eligible users without an entry link.</p>
                        </div>
                    ) : users.map((u) => (
                        <div key={u.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-semibold text-sm">{u.name}</p>
                                    <p className="font-semibold text-sm">{u.id}</p>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                    <p className="text-xs text-muted-foreground">{u.mobile}</p>
                                </div>
                                <Badge className="bg-green-500/20 text-green-700 border-0 flex-shrink-0">
                                    {u._count.directReferrals} refs
                                </Badge>
                            </div>
                            <Button
                                size="sm"
                                className="w-full gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                                disabled={generatingId === u.id}
                                onClick={() => setConfirmUser(u)}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                {generatingId === u.id ? 'Generating...' : 'Generate Entry Link'}
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>

            <ConfirmModal
                open={!!confirmUser}
                title="Generate autopool entry link?"
                description={
                    confirmUser
                        ? `This will create an entry link for ${confirmUser.name} (${confirmUser._count.directReferrals} referrals). They'll be able to join Level 1 autopool.`
                        : ''
                }
                onCancel={() => setConfirmUser(null)}
                onConfirm={handleGenerate}
            />
        </>
    )
}
