// components/Payments.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ConfirmModal,
} from '@repo/ui';
import {
  Wallet,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ImageIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { AdminPaymentSchema } from '@repo/types';
import { toast } from 'sonner';
import api from '../lib/axios';
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL!;

export const Payments = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [payments, setPayments] = useState<AdminPaymentSchema[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentSchema | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('review');
  const [paymentId, setPaymentId] = useState<AdminPaymentSchema | null>(null);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(null);
  const itemsPerPage = 5;

  const loadPaymentsDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/getAllPaymentsDetails');
      console.log(res.data.payments);
      setPayments(res.data.payments || []);
    } catch (error: any) {
      console.error('Payments Error:', error);
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(
          <div className="text-red-500">{error.message || 'Failed to load payments data'}</div>
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentsDetails();
  }, [loadPaymentsDetails]);

  // Filter and sort payments - MOST RECENT FIRST
  const filteredPayments = payments
    .filter((payment) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        payment.id.toLowerCase().includes(searchLower) ||
        payment.senderName.toLowerCase().includes(searchLower) ||
        payment.receiverName.toLowerCase().includes(searchLower) ||
        payment.senderUserId.toLowerCase().includes(searchLower) ||
        payment.receiverUserId.toLowerCase().includes(searchLower);

      const matchesType = filterType === 'ALL' || payment.paymentType === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingPayments = filteredPayments.filter((p) => p.status === 'PENDING');
  const approvedPayments = filteredPayments.filter((p) => p.status === 'APPROVED');
  const rejectedPayments = filteredPayments.filter((p) => p.status === 'REJECTED');
  const underReviewPayments = filteredPayments.filter((p) => p.status === 'UNDER_REVIEW');

  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'review':
        return underReviewPayments;
      case 'pending':
        return pendingPayments;
      case 'approved':
        return approvedPayments;
      case 'rejected':
        return rejectedPayments;
      default:
        return filteredPayments;
    }
  };

  const currentTabData = getCurrentTabData();
  const totalPages = Math.ceil(currentTabData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = currentTabData.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetails = (payment: AdminPaymentSchema) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const openConfirm = (payment: AdminPaymentSchema, action: "APPROVED" | "REJECTED") => {
    setPaymentId(payment);
    setActionType(action);
  };

  const handleConfirm = async () => {
    if (!paymentId || !actionType) return;

    const endpoint =
      paymentId.paymentType === 'ACTIVATION'
        ? `/confirmActivationPayment/${paymentId.id}`
        : `/confirm-upgradeAndSponsor-pay/${paymentId.id}`;

    try {
      const res = await api.post(endpoint, { action: actionType });
      if (res.data.success) {
        toast.success(<div className="text-primary">{res.data.message}</div>);
        await loadPaymentsDetails();
      }
    } catch (error: any) {
      if (error.response?.data) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(<div className="text-red-500">{error.message}</div>);
      }
    } finally {
      setPaymentId(null);
      setActionType(null);
      setIsModalOpen(false);
    }
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
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'APPROVED':
        return 'bg-green-500 text-white';
      case 'REJECTED':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'UNDER_REVIEW':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getPaymentPaidColor = (paid: boolean) => {
    return paid ? 'bg-green-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white';
  }

  const stats = {
    totalUnderReview: underReviewPayments.length,
    underReviewAmount: underReviewPayments.reduce((sum, p) => sum + p.amount, 0),
    totalPending: pendingPayments.length,
    pendingAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
    totalApproved: approvedPayments.length,
    approvedAmount: approvedPayments.reduce((sum, p) => sum + p.amount, 0),
    totalRejected: rejectedPayments.length,
    rejectedAmount: rejectedPayments.reduce((sum, p) => sum + p.amount, 0),
    totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
  };

  // Loading State
  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Review and manage all payment transactions
          </p>
        </div>
        <Button
          onClick={() => {
            loadPaymentsDetails();
            toast.success(<div className="text-primary">Data refreshed</div>);
          }}
          variant="outline"
          className="gap-2 w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Under Review */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-amber-500/10 rounded-lg sm:rounded-xl">
                <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Verification Needed</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalUnderReview}</p>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              ₹{stats.underReviewAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg sm:rounded-xl">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalPending}</p>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
              ₹{stats.pendingAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Approved</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalApproved}</p>
            <p className="text-xs text-green-600 mt-1 sm:mt-2">
              ₹{stats.approvedAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl">
                <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalRejected}</p>
            <p className="text-xs text-red-500 mt-1 sm:mt-2">
              ₹{stats.rejectedAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className="border-0 shadow-md col-span-2 md:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">
              ₹{stats.totalAmount >= 1000 ? `${(stats.totalAmount / 1000).toFixed(1)}k` : stats.totalAmount}
            </p>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2">{filteredPayments.length} txns</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10 sm:h-11"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(value) => {
                setFilterType(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48 h-10 sm:h-11">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="ACTIVATION">Activation</SelectItem>
                <SelectItem value="UPGRADE">Upgrade</SelectItem>
                <SelectItem value="SPONSOR_PAYMENT">Sponsor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-0 shadow-xl">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setCurrentPage(1);
          }}
        >
          <div className="border-b">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Transactions
              </CardTitle>
            </div>
            {/* FIXED TABS - Better mobile layout */}
            <TabsList className="bg-transparent h-auto p-0 px-2 sm:px-6 w-full justify-start overflow-x-auto">
              <TabsTrigger
                value="review"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Verify
                <Badge className="ml-1 sm:ml-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] sm:text-xs px-1.5 py-0">
                  {underReviewPayments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Pending
                <Badge className="ml-1 sm:ml-2 bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] sm:text-xs px-1.5 py-0">
                  {pendingPayments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Approved
                <Badge className="ml-1 sm:ml-2 bg-green-500 text-white text-[10px] sm:text-xs px-1.5 py-0">
                  {approvedPayments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
              >
                Rejected
                <Badge className="ml-1 sm:ml-2 bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-xs px-1.5 py-0">
                  {rejectedPayments.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="m-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Payment ID</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">No payments found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-semibold text-sm">{payment.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{payment.senderName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{payment.senderUserId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{payment.receiverName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {payment.receiverUserId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getPaymentTypeColor(payment.paymentType)}`}
                            >
                              {payment.paymentType === 'SPONSOR_PAYMENT'
                                ? 'SPONSOR'
                                : payment.paymentType === 'UPGRADE'
                                  ? `UPGRADE L${payment.upgradeToLevel}`
                                  : payment.paymentType}
                            </Badge>

                            {payment.status === "PENDING" && <Badge
                              variant="outline"
                              className={`text-xs ${getPaymentPaidColor(payment.paid)}`}
                            >
                              {payment.paid ? 'PAID' : 'UN-PAID'}
                            </Badge>}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-bold text-emerald-600">
                          ₹{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                            {payment.status === 'UNDER_REVIEW' ? 'REVIEW' : payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleViewDetails(payment)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {paginatedPayments.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No payments found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {paginatedPayments.map((payment) => (
                    <div key={payment.id} className="p-4">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono font-bold text-sm truncate">{payment.id}</p>
                          <Badge className={`${getStatusColor(payment.status)} mt-1 text-xs`}>
                            {payment.status === 'UNDER_REVIEW' ? 'REVIEW' : payment.status}
                          </Badge>
                        </div>
                        <p className="text-lg font-bold text-emerald-600 flex-shrink-0">
                          ₹{payment.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2">
                          <ArrowUpRight className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{payment.senderName}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {payment.senderUserId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <ArrowDownLeft className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{payment.receiverName}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {payment.receiverUserId}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPaymentTypeColor(payment.paymentType)}`}
                          >
                            {payment.paymentType === 'SPONSOR_PAYMENT'
                              ? 'SPONSOR'
                              : payment.paymentType === 'UPGRADE'
                                ? `UPGRADE L${payment.upgradeToLevel}`
                                : payment.paymentType}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPaymentPaidColor(payment.paid)}`}
                          >
                            {payment.paid ? 'PAID' : 'UN-PAID'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(payment)}
                          className="gap-1 text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {startIndex + 1}-{Math.min(startIndex + itemsPerPage, currentTabData.length)} of{' '}
                    {currentTabData.length}
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
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
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
          </TabsContent>
        </Tabs>
      </Card>

      {selectedPayment && (
        <>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-4 sm:p-6 border-b">
                <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span className="truncate">Payment Details</span>
                </DialogTitle>
              </DialogHeader>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Payment Info */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-muted/30 p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <CardTitle className="text-base sm:text-lg font-mono break-all">
                        Payment Id: {selectedPayment.id}
                      </CardTitle>
                      <Badge className={`${getStatusColor(selectedPayment.status)} flex-shrink-0`}>
                        {selectedPayment.status === 'UNDER_REVIEW' ? 'UNDER REVIEW' : selectedPayment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Amount */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 gap-3">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                          ₹{selectedPayment.amount.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs sm:text-sm flex-shrink-0 ${getPaymentTypeColor(
                          selectedPayment.paymentType
                        )}`}
                      >
                        {selectedPayment.paymentType}
                      </Badge>
                    </div>

                    {/* Sender & Receiver */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                          From
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="font-semibold break-words">{selectedPayment.senderName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="font-mono font-semibold">{selectedPayment.senderUserId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Account ID</p>
                            <p className="font-mono text-xs break-all">
                              {selectedPayment.senderPositionId}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <ArrowDownLeft className="w-4 h-4 flex-shrink-0" />
                          To
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="font-semibold break-words">{selectedPayment.receiverName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="font-mono font-semibold">{selectedPayment.receiverUserId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Account ID</p>
                            <p className="font-mono text-xs break-all">
                              {selectedPayment.receiverPositionId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 bg-muted/50 rounded-lg">
                      {selectedPayment.upgradeToLevel && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Upgrade Level</p>
                          <Badge className="bg-purple-500 text-white text-xs">
                            Level {selectedPayment.upgradeToLevel}
                          </Badge>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <p className="text-xs sm:text-sm font-semibold">
                          {new Date(selectedPayment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
                        <Badge
                          className={`text-xs ${selectedPayment.confirmed ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                            }`}
                        >
                          {selectedPayment.confirmed ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Screenshot */}
                {selectedPayment.screenshotUrl ? (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-muted/30 p-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Screenshot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <img
                        src={`${VITE_BASE_URL}${selectedPayment.screenshotUrl}`}
                        alt="Payment"
                        className="w-full max-w-md mx-auto rounded-lg border shadow-lg"
                      />
                    </CardContent>
                  </Card>
                ) :
                    selectedPayment.paid === false && (
                      <div className="rounded-lg border border-amber-200 dark:border-amber-900/30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm sm:text-base mb-1">
                              Payment is yet to be made by {selectedPayment.senderName}
                            </p>
                            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                              No screenshot uploaded yet. Contact the user to complete payment.
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
                              UN-PAID
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                }

                {/* Actions - FIXED: Works for both PENDING and UNDER_REVIEW */}
                {(selectedPayment.status === 'PENDING' || selectedPayment.status === 'UNDER_REVIEW') && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => openConfirm(selectedPayment, 'APPROVED')}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => openConfirm(selectedPayment, 'REJECTED')}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <ConfirmModal
            open={!!paymentId}
            title={actionType === 'APPROVED' ? 'Approve this payment?' : 'Reject this payment?'}
            description={
              paymentId
                ? `Payment of ₹${selectedPayment.amount} from ${selectedPayment.senderName}`
                : ''
            }
            onCancel={() => {
              setPaymentId(null);
              setActionType(null);
            }}
            onConfirm={handleConfirm}
            confirmVariant={actionType === 'APPROVED' ? 'default' : 'destructive'}
          />
        </>
      )}
    </div>
  );
};
