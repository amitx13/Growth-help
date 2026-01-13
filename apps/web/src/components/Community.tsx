import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Button,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    Skeleton,
} from '@repo/ui';
import {
    Users,
    RefreshCw,
    Search,
    Landmark,
    ChevronLeft,
    ChevronRight,
    UserCircle,
    Phone,
    Hash,
    TrendingUp,
    Activity,
    Shield,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { toast } from "sonner";
import api from '../lib/axios';
import type { UserPositionWithTeam } from '@repo/types';

// ✅ FIXED: Simple flat structure (no children)
interface TeamPositionUI {
    id: string;
    userName: string;
    userID: string;
    userMobile: string;
    depthLevel: number; // Level under YOU (1, 2, 3...)
    accountLevel: number; // Their actual account level
    directCount: number;
    totalDownline: number;
    earnings: number;
    status: 'Active' | 'Inactive';
}

export default function UserTeamPage() {
    const { user } = useAuthStore();

    const [allPositions, setAllPositions] = useState<UserPositionWithTeam[]>([]);
    const [selectedPositionId, setSelectedPositionId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchUserTeamDetails = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await api.get(`/getUserTeamData/${user.id}`);
            if (res.data.success) {
                const positions = res.data.data;
                setAllPositions(positions);
                if (positions.length > 0 && !selectedPositionId) {
                    setSelectedPositionId(positions[0].id);
                }
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
        fetchUserTeamDetails();
    }, [fetchUserTeamDetails]);

    const currentPosition = useMemo(() => {
        return allPositions.find(p => p.id === selectedPositionId);
    }, [allPositions, selectedPositionId]);

    // ✅ FIXED: Simple flat transformation (no tree building)
    const transformedTeamData = useMemo(() => {
        if (!currentPosition?.team) return [];

        const teamArray: TeamPositionUI[] = [];

        // Loop through team object: { '1': [...], '2': [...] }
        Object.entries(currentPosition.team).forEach(([depthLevel, members]) => {
            members.forEach((member: any) => {
                teamArray.push({
                    id: member.id,
                    userName: member.user?.name || `User ${member.userId.slice(0, 8)}`,
                    userID: member.userId,
                    userMobile: member.user?.mobile || 'N/A',
                    depthLevel: parseInt(depthLevel), // ✅ Level under YOU
                    accountLevel: member.currentLevel, // Their account level
                    directCount: member.directReferralCount,
                    totalDownline: 0, // Can calculate if needed
                    earnings: 0, // Can add from userLevels if needed
                    status: member.isActive ? 'Active' : 'Inactive',
                });
            });
        });

        // Sort by depth level, then by name
        return teamArray.sort((a, b) => {
            if (a.depthLevel !== b.depthLevel) {
                return a.depthLevel - b.depthLevel;
            }
            return a.userName.localeCompare(b.userName);
        });
    }, [currentPosition]);

    // Calculate stats
    const stats = useMemo(() => {
        if (!currentPosition?.team) {
            return { totalTeam: 0, activePositions: 0, teamEarnings: 0 };
        }

        const allMembers = Object.values(currentPosition.team).flat();
        return {
            totalTeam: allMembers.length,
            activePositions: allMembers.filter((m: any) => m.isActive).length,
            teamEarnings: currentPosition.userLevels.reduce((sum, ul) => sum + ul.amountEarned, 0),
        };
    }, [currentPosition]);

    const maxDepth = currentPosition?.currentLevel || 3;

    // ✅ FIXED: Simple filtering (no tree flattening)
    const filteredData = useMemo(() => {
        return transformedTeamData.filter((position) => {
            const matchesSearch =
                search === '' ||
                position.userName.toLowerCase().includes(search.toLowerCase()) ||
                position.userMobile.includes(search) ||
                position.userID.toLowerCase().includes(search.toLowerCase());

            const matchesLevel = levelFilter === 'all' || position.depthLevel === levelFilter;
            const matchesStatus = statusFilter === 'all' || position.status === statusFilter;

            return matchesSearch && matchesLevel && matchesStatus;
        });
    }, [transformedTeamData, search, levelFilter, statusFilter]);

    // ✅ NEW: Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ✅ Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, levelFilter, statusFilter]);

    const handleRefresh = useCallback(async () => {
        await fetchUserTeamDetails();
    }, [fetchUserTeamDetails]);

    const getLevelColor = (level: number) => {
        if (level === 1) return 'bg-green-500';
        if (level === 2) return 'bg-yellow-500';
        if (level === 3) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getStatusColor = (status: string) => {
        return status === 'Active' ? 'bg-green-500' : 'bg-red-500';
    };

    const StatsCard = ({ title, value, color }: { title: string; value: any; color: string }) => (
        <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${color}/10`}>
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-64" />
                        <div className="flex gap-4">
                            <Skeleton className="h-12 w-48" />
                            <Skeleton className="h-12 w-32" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-64" />
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
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
                        <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl border border-primary/30 shadow-md">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
                                My Team
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {currentPosition
                                    ? `Level ${currentPosition.currentLevel} • ${currentPosition.positionType}`
                                    : 'Loading...'}
                            </p>
                        </div>
                    </div>

                    {/* Position Selector + Refresh */}
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-8">
                        <div className="flex gap-3 flex-1 max-w-md">
                            <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                                <SelectTrigger className="w-full h-12">
                                    <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allPositions.map((position) => (
                                        <SelectItem key={position.id} value={position.id}>
                                            {position.positionType} - Level {position.currentLevel}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleRefresh}
                                variant="outline"
                                size="lg"
                                className="gap-2 h-12"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Showing downline up to Level {maxDepth} • {filteredData.length} accounts found
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                        <StatsCard title="Total Team" value={stats.totalTeam} color="from-blue-500" />
                        <StatsCard title="Active Accounts" value={stats.activePositions} color="from-green-500" />
                        <Card className="border-0 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Landmark className="w-5 h-5 text-emerald-600" />
                                    <p className="font-semibold">Total Earnings</p>
                                </div>
                                <p className="text-3xl font-bold text-emerald-600">
                                    ₹{stats.teamEarnings.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-md mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, mobile, or ID..."
                                    className="pl-10 h-12"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <Select
                                    value={levelFilter.toString()}
                                    onValueChange={(val) =>
                                        setLevelFilter(val === 'all' ? 'all' : Number(val))
                                    }
                                >
                                    <SelectTrigger className="h-12 w-40">
                                        <SelectValue placeholder="All Levels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        {Array.from({ length: maxDepth }, (_, i) => i + 1).map((level) => (
                                            <SelectItem key={level} value={level.toString()}>
                                                Level {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter as any}>
                                    <SelectTrigger className="h-12 w-36">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(search || levelFilter !== 'all' || statusFilter !== 'all') && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setLevelFilter('all');
                                            setStatusFilter('all');
                                        }}
                                        className="h-12"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Table */}
                <Card className="border-0 shadow-2xl">
                    <CardContent className="p-0">
                        {filteredData.length === 0 ? (
                            <div className="p-16 text-center">
                                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold mb-2">No team members found</h3>
                                <p className="text-muted-foreground mb-6">
                                    Try adjusting your filters or refresh the data
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button onClick={handleRefresh} className="gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh Data
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-b-2 border-border/50">
                                                <TableHead className="text-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="w-4 h-4" />
                                                        Account ID
                                                    </div>
                                                </TableHead>
                                                <TableHead>
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle className="w-4 h-4" />
                                                        Name
                                                    </div>
                                                </TableHead>
                                                <TableHead>
                                                    <div className="flex items-center gap-2 text-nowrap">
                                                        <Shield className="w-4 h-4" />
                                                        User ID
                                                    </div>
                                                </TableHead>
                                                <TableHead>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        Mobile
                                                    </div>
                                                </TableHead>
                                                <TableHead>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 rotate-90" />
                                                        Downline Level
                                                    </div>
                                                </TableHead>
                                                <TableHead>
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="w-4 h-4" />
                                                        Account Level
                                                    </div>
                                                </TableHead>
                                                <TableHead>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        Direct
                                                    </div>
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.map((position) => (
                                                <TableRow
                                                    key={position.id}
                                                    className="border-b border-border/20 hover:bg-muted/30 group"
                                                >
                                                    <TableCell className="font-mono font-medium text-nowrap">
                                                        {position.id}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">{position.userName}</TableCell>
                                                    <TableCell className="font-semibold">{position.userID}</TableCell>
                                                    <TableCell>{position.userMobile}</TableCell>
                                                    <TableCell>
                                                        <Badge className={`${getLevelColor(position.depthLevel)} text-white text-xs text-nowrap`}>
                                                            Level {position.depthLevel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            L{position.accountLevel}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{position.directCount}</TableCell>
                                                    <TableCell>
                                                        <Badge className={`${getStatusColor(position.status)} text-white text-xs`}>
                                                            {position.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* ✅ NEW: Pagination */}
                                {totalPages > 1 && (
                                    <div className="border-t p-4">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of{' '}
                                                {filteredData.length} members
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (totalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNum = totalPages - 4 + i;
                                                    } else {
                                                        pageNum = currentPage - 2 + i;
                                                    }
                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            variant={currentPage === pageNum ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(pageNum)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    );
                                                })}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
