import { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Badge,
    Button,
    Skeleton,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ConfirmModal,
} from '@repo/ui';

import {
    Wallet as WalletIcon,
    TrendingUp,
    DollarSign,
    Activity,
    RefreshCw,
    Award,
    BarChart3,
    CheckCircle,
    XCircle,
    Layers,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { toast } from 'sonner';
import api from '../lib/axios';
import type { receivedpayments, UserAccountSummary } from '@repo/types';

export const Wallet = () => {
    const { user } = useAuthStore();
    const [accounts, setAccounts] = useState<UserAccountSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [selectedPayment, setSelectedPayment] = useState<receivedpayments | null>(null);

    const fetchUserEarningsReport = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await api.get(`/getUserEarningsReport/${user.id}`);
            setAccounts(res.data.accounts || []);
            if (res.data.accounts?.length > 0 && !selectedPosition) {
                setSelectedPosition(res.data.accounts[0].id);
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(<div className="text-red-500">{error.response.data.error}</div>);
            } else {
                toast.error(<div className="text-red-500">{error.message}</div>);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchUserEarningsReport();
    }, [fetchUserEarningsReport]);

    // Calculate total earnings across all positions
    const totalEarnings = useMemo(() => {
        return accounts.reduce((total, account) => {
            return total + account.userLevels.reduce((sum, level) => sum + level.amountEarned, 0);
        }, 0);
    }, [accounts]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalPositions = accounts.length;
        const activePositions = accounts.filter(acc => acc.isActive).length;
        const inactivePositions = totalPositions - activePositions;

        return { totalPositions, activePositions, inactivePositions };
    }, [accounts]);

    // Get selected position data
    const currentPosition = useMemo(() => {
        return accounts.find(acc => acc.id === selectedPosition) || accounts[0];
    }, [accounts, selectedPosition]);

    const getLevelColor = (level: number) => {
        const colors = [
            'from-green-500 to-emerald-500',
            'from-blue-500 to-cyan-500',
            'from-purple-500 to-pink-500',
            'from-orange-500 to-red-500',
            'from-yellow-500 to-amber-500',
        ];
        return colors[(level - 1) % colors.length];
    };

    const getPositionTypeColor = (type: string) => {
        return type === 'ORIGINAL' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600';
    };

    const handleConfirm = async () => {
        if (!selectedPayment) return;

        const endpoint = `/payments/upgrade-or-sponsor/${selectedPayment.id}`;

        try {
            const res = await api.post(endpoint, { action: "APPROVED" });
            if (res.data.success) {
                toast.success(
                    <div className="text-primary">
                        {res.data.message}
                    </div>
                )
                await fetchUserEarningsReport();
            }
        } catch (error: any) {
            if (error.response.data) {
                toast.error(
                    <div className="text-red-500">
                        {error.response.data.error}
                    </div>
                )
            } else {
                toast.error(
                    <div className="text-red-500">
                        {error.message}
                    </div>
                )
            }

        } finally {
            setSelectedPayment(null);
            setConfirmOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-40" />
                        <Skeleton className="h-40" />
                        <Skeleton className="h-40" />
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    // Empty State
    if (accounts.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-8">
                <div className="max-w-7xl mx-auto">
                    <Card className="border-0 shadow-2xl">
                        <CardContent className="pt-16 pb-20">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/20 mb-8 shadow-md">
                                    <WalletIcon className="w-20 h-20 text-primary" />
                                </div>
                                <h3 className="text-3xl font-bold mb-3">No Earnings Yet</h3>
                                <p className="text-muted-foreground max-w-md mb-8 text-lg">
                                    Start building your team and activate accounts to begin earning!
                                </p>
                                <Button size="lg" className="gap-2" onClick={fetchUserEarningsReport}>
                                    <RefreshCw className="w-5 h-5" />
                                    Refresh Wallet
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-4 mb-8">
                        <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 rounded-2xl border border-emerald-500/30 shadow-md">
                            <WalletIcon className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
                                My Wallet
                            </h1>
                            <p className="text-muted-foreground mt-2">Track your earnings and account performance</p>
                        </div>
                    </div>

                    {/* Total Earnings Hero Card */}
                    <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white/80">Total Earnings</p>
                                        <p className="text-xs text-white/60">All accounts Combined</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchUserEarningsReport}
                                    className="text-white hover:bg-white/20 gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                            <div className="mb-4">
                                <p className="text-5xl sm:text-6xl font-bold mb-2">
                                    ₹{totalEarnings.toLocaleString()}
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>From {accounts.length} accounts</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {/* Total Positions */}
                        <Card className="border-0 shadow-md hover:shadow-md transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Layers className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <Badge className="bg-blue-500/20 text-blue-700 border-0">Total</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Total Accounts</p>
                                <p className="text-3xl font-bold">{stats.totalPositions}</p>
                            </CardContent>
                        </Card>

                        {/* Active Positions */}
                        <Card className="border-0 shadow-md hover:shadow-md transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-500/10 rounded-xl">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <Badge className="bg-green-500/20 text-green-700 border-0">Active</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Active Accounts</p>
                                <p className="text-3xl font-bold">{stats.activePositions}</p>
                            </CardContent>
                        </Card>

                        {/* Inactive Positions */}
                        <Card className="border-0 shadow-md hover:shadow-md transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-red-500/10 rounded-xl">
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <Badge className="bg-red-500/20 text-red-700 border-0">Inactive</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Inactive Accounts</p>
                                <p className="text-3xl font-bold">{stats.inactivePositions}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Position Selector Dropdown (Better for many positions) */}
                <div className="mb-8">
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Activity className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="font-semibold text-lg">Select Account</p>
                                </div>
                                <Select value={selectedPosition || ''} onValueChange={setSelectedPosition}>
                                    <SelectTrigger className="w-full sm:w-96 h-12">
                                        <SelectValue placeholder="Choose a position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                <div className="flex items-center gap-2 py-1 text-nowrap">
                                                    <span className="font-mono font-semibold">{account.id}</span>
                                                    <span className="text-muted-foreground">Level {account.currentLevel}</span>
                                                    <Badge className={`${getPositionTypeColor(account.positionType)} text-white text-xs`}>
                                                        {account.positionType}
                                                    </Badge>
                                                    <Badge className={account.isActive ? 'bg-green-500 text-white text-xs' : 'bg-red-500 hover:bg-red-600 text-white text-xs'}>
                                                        {account.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Position Details */}
                {currentPosition && (
                    <div className="space-y-6">
                        {/* Position Header */}
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <CardTitle className="text-2xl mb-2 text-nowrap">Account : {currentPosition.id}</CardTitle>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge className={`${getLevelColor(currentPosition.currentLevel)} text-white`}>
                                                    Current Level: {currentPosition.currentLevel}
                                                </Badge>
                                                <Badge className={`${getPositionTypeColor(currentPosition.positionType)} text-white`}>
                                                    {currentPosition.positionType}
                                                </Badge>
                                                <Badge className={currentPosition.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                                                    {currentPosition.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm text-muted-foreground mb-1">Account Earnings</p>
                                        <p className="text-3xl font-bold text-emerald-600">
                                            ₹{currentPosition.userLevels.reduce((sum, lvl) => sum + lvl.amountEarned, 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Level Earnings Breakdown */}
                        <Card className="border-0 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    Earnings in each Level
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {currentPosition.userLevels.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                            <DollarSign className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground">No earnings recorded yet for this position</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {currentPosition.userLevels
                                            .sort((a, b) => a.levelNumber - b.levelNumber)
                                            .map((level) => (
                                                <div
                                                    key={level.levelNumber}
                                                    className="p-6 rounded-xl border-2 border-border/50 hover:border-primary/30 transition-all hover:shadow-md bg-gradient-to-r from-background to-muted/20"
                                                >
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-xl bg-gradient-to-br ${getLevelColor(level.levelNumber)} shadow-md`}>
                                                                <Award className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg mb-1">Level {level.levelNumber}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Earnings from downline at level {level.levelNumber}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-left sm:text-right">
                                                            <p className="text-2xl font-bold text-emerald-600">
                                                                ₹{level.amountEarned.toLocaleString()}
                                                            </p>
                                                            {level.amountEarned > 0 && (
                                                                <Badge className="mt-2 bg-emerald-500/20 text-emerald-700 border-0">
                                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                                    Earning
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment History Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sent Payments */}
                            <Card className="border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-red-600" />
                                        Sent Payments
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Payments sent from this account
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {currentPosition.sentPayments.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <div className="p-4 bg-red-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                                <TrendingUp className="w-8 h-8 text-red-600" />
                                            </div>
                                            <p className="text-muted-foreground">No sent payments yet</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="text-xs">Amount</TableHead>
                                                        <TableHead className="text-xs">Type</TableHead>
                                                        <TableHead className="text-xs">Receiver Account</TableHead>
                                                        <TableHead className="text-xs">Receiver Name</TableHead>
                                                        <TableHead className="text-xs">Receiver Mobile</TableHead>
                                                        <TableHead className="text-xs">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {currentPosition.sentPayments.map((payment, idx) => (
                                                        <TableRow key={idx} className="border-b hover:bg-muted/30">
                                                            <TableCell className="font-bold text-red-600">
                                                                ₹{payment.amount.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-xs text-nowrap ${payment.paymentType === 'ACTIVATION'
                                                                        ? 'border-blue-500 text-blue-700'
                                                                        : payment.paymentType === 'UPGRADE'
                                                                            ? 'border-purple-500 text-purple-700'
                                                                            : 'border-orange-500 text-orange-700'
                                                                        }`}
                                                                >
                                                                    {payment.paymentType === "UPGRADE" ? `${payment.paymentType} to ${payment.upgradeToLevel}` : payment.paymentType}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-nowrap">
                                                                {payment.receiverPosition.id}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-nowrap">
                                                                {payment.receiverPosition.user.name}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-nowrap">
                                                                {payment.receiverPosition.user.mobile}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={`text-xs ${payment.status === 'APPROVED'
                                                                        ? 'bg-green-500'
                                                                        : payment.status === 'PENDING'
                                                                            ? 'bg-yellow-500 hover:bg-yellow-600'
                                                                            : payment.status === "REJECTED" ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                                                                        } text-nowrap`}
                                                                >
                                                                    {payment.status === "UNDER_REVIEW" ? "UNDER REVIEW" : payment.status}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Total Sent */}
                                    {currentPosition.sentPayments.length > 0 && (
                                        <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                                                <p className="text-xl font-bold text-red-600">
                                                    - ₹{currentPosition.sentPayments.reduce((sum, p) => sum + (p.status === "APPROVED" ? p.amount : 0), 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Received Payments */}
                            <Card className="border-0 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600 rotate-180" />
                                        Received Payments
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Payments received by this account
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {currentPosition.receivedPayments.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <div className="p-4 bg-green-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                                <TrendingUp className="w-8 h-8 text-green-600 rotate-180" />
                                            </div>
                                            <p className="text-muted-foreground">No received payments yet</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="text-xs">Amount</TableHead>
                                                        <TableHead className="text-xs">Type</TableHead>
                                                        <TableHead className="text-xs">Sender Account</TableHead>
                                                        <TableHead className="text-xs">Sender Name</TableHead>
                                                        <TableHead className="text-xs">Sender Mobile</TableHead>
                                                        <TableHead className="text-xs">Status</TableHead>
                                                        <TableHead className="text-xs">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {currentPosition.receivedPayments.map((payment, idx) => (
                                                        <TableRow key={idx} className="border-b hover:bg-muted/30">
                                                            <TableCell className="font-bold text-green-600">
                                                                ₹{payment.amount.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-xs text-nowrap ${payment.paymentType === 'ACTIVATION'
                                                                        ? 'border-blue-500 text-blue-700'
                                                                        : payment.paymentType === 'UPGRADE'
                                                                            ? 'border-purple-500 text-purple-700'
                                                                            : 'border-orange-500 text-orange-700'
                                                                        }`}
                                                                >
                                                                    {payment.paymentType === "UPGRADE" ? `${payment.paymentType} to ${payment.upgradeToLevel}` : payment.paymentType}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-nowrap">
                                                                {payment.senderPosition.id}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-nowrap">
                                                                {payment.senderPosition.user.name}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-nowrap">
                                                                {payment.senderPosition.user.mobile}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={`text-xs ${payment.status === 'APPROVED'
                                                                        ? 'bg-green-500'
                                                                        : payment.status === 'PENDING'
                                                                            ? 'bg-yellow-500'
                                                                            : payment.status === "REJECTED" ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                                                                        } text-nowrap`}
                                                                >
                                                                    {payment.status === "UNDER_REVIEW" ? "UNDER REVIEW" : payment.status}
                                                                </Badge>
                                                            </TableCell>
                                                            {payment.status === "UNDER_REVIEW" && <TableCell className=" text-xs">
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedPayment(payment);
                                                                        setConfirmOpen(true);
                                                                    }}
                                                                >
                                                                    {"Approve"}
                                                                </Button>
                                                            </TableCell>}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Total Received */}
                                    {currentPosition.receivedPayments.length > 0 && (
                                        <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                                                <p className="text-xl font-bold text-green-600">
                                                    + ₹{currentPosition.receivedPayments.reduce((sum, p) => sum + (p.status === "APPROVED" ? p.amount : 0), 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <ConfirmModal
                                open={confirmOpen}
                                title={
                                    "Approve this payment?"
                                }
                                description={
                                    selectedPayment
                                        ? `Payment of ₹${selectedPayment.amount} from ${selectedPayment.senderPosition.user.name} (${selectedPayment.senderPosition.id})`
                                        : ""
                                }
                                onCancel={() => {
                                    setSelectedPayment(null);
                                    setConfirmOpen(false);
                                }}
                                onConfirm={handleConfirm}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;
