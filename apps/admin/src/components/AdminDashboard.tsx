import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@repo/ui';
import {
  Users,
  Activity,
  DollarSign,
  Clock,
  TrendingUp,
  Key,
  CheckCircle,
  XCircle,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Share2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardData } from '@repo/types';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';

const USER_APP_URL = import.meta.env.VITE_USER_APP_URL!;

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/getAdminDashboardData');
      setDashboardData(res.data.dashboardData);
    } catch (error: any) {
      console.error('Dashboard Error:', error);
      if (error.response?.data?.error) {
        toast.error(
          <div className='text-red-500'>
            {error.response.data.error}
          </div>
        );
      } else {
        toast.error(
          <div className='text-red-500'>
            {error.message || 'Failed to load dashboard data'}
          </div>
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    loadDashboard();
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'ACTIVATION':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'UPGRADE':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'SPONSOR_PAYMENT':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  // Loading state
  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state (no data)
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg text-muted-foreground">Failed to load dashboard data</p>
          <Button onClick={handleRefresh} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { stats, recentUsers, pendingPayments, pendingPinRequests, referalCode } = dashboardData;

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedLinkIndex(index);
    setTimeout(() => setCopiedLinkIndex(null), 2000);

    toast.success(<div className="text-green-600">Copied! {text.slice(0,15)}...</div>);
  };


  return (
    <div className="space-y-6 sm:space-y-8 pb-8 px-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Overview of your platform
          </p>
        </div>
        <Button onClick={() => {
          loadDashboard()
          toast.success(<div className="text-primary">Data refreshed</div>);
        }} variant="outline" className="gap-2 w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 via-primary/3 to-background">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Title & Icon */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Your Referral</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Share and grow your network</p>
              </div>
            </div>

            {/* Right: Referral Code & Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
              {/* Referral Code */}
              <div className="flex items-center gap-2 p-3 bg-background rounded-lg border shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Referral Code</p>
                  <p className="font-mono font-bold text-sm sm:text-base truncate">{referalCode}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(referalCode, 0)}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  {copiedLinkIndex === 0 ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Referral Link */}
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Referral Link</p>
                  <p className="font-mono text-xs sm:text-sm truncate text-primary">
                    {`${USER_APP_URL}/signup?ref=${referalCode}`}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `${USER_APP_URL}/signup?ref=${referalCode}`,
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                  variant="default"
                  className=""
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(`${USER_APP_URL}/signup?ref=${referalCode}`, 1)}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  {copiedLinkIndex === 1 ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg sm:rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-500/20 text-blue-700 border-0 text-xs">Total</Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalUsers}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>{recentUsers.length} joined recently</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Positions */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <Badge className="bg-green-500/20 text-green-700 border-0 text-xs">Active</Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Accounts</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.activePositions}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span className='text-primary'>Total Accounts {stats.totalPositions}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-700 border-0 text-xs">Revenue</Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              ₹{stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000)}k` : stats.totalRevenue}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>From approved payments</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg sm:rounded-xl">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <Badge className="bg-orange-500/20 text-orange-700 border-0 text-xs">Pending</Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pending Actions</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {stats.pendingPayments + stats.pendingPinRequests}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.pendingPayments} payments • {stats.pendingPinRequests} pin requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pin Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <Key className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Pins</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalPins}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Pins</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.activePins}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Used Pins</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.usedPins}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Recent Users ({stats.recentUsersCount})
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => navigate('/users')}>
                View All
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No recent users</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.mobile}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              user.status === 'active'
                                ? 'bg-green-500 text-white text-xs'
                                : 'bg-gray-500 text-white text-xs'
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Pending Payments ({stats.pendingPayments})
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => navigate('/payments')}>
                View All
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No pending payments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">From → To</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                              {payment.from}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                              → {payment.to}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-emerald-600">
                          ₹{payment.amount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPaymentTypeColor(payment.type)}`}
                          >
                            {payment.type === 'SPONSOR_PAYMENT' ? 'SPONSOR' : payment.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground text-right">
                          {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Pin Requests */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              Pending Pin Requests ({stats.pendingPinRequests})
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => navigate('/pin')}>
              View All
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingPinRequests.length === 0 ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No pending pin requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">From User</TableHead>
                    <TableHead className="text-xs">To User</TableHead>
                    <TableHead className="text-xs text-right">Pin Count</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="text-xs text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPinRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">{req.fromUser}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 text-xs">
                          {req.toUser}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {req.count} pins
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        ₹{req.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(req.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
