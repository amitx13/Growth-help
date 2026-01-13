// components/Pins.tsx
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
  Label,
} from '@repo/ui';
import {
  Key,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ImageIcon,
  User,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import type { pinRequests, pinsModel } from '@repo/types';
import api from '../lib/axios';
import { useAdminAuthStore } from '../stores/useAdminAuthStore';
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL!;

export const Pins = () => {
  const { user } = useAdminAuthStore()
  const [pins, setPins] = useState<pinsModel[]>([]);
  const [pinRequests, setPinRequests] = useState<pinRequests[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<pinRequests | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferUserId, setTransferUserId] = useState<string>('');
  const [transferPinCount, setTransferPinCount] = useState<string>('');

  const [isMakingReq, setIsMakingReq] = useState<boolean>(false)

  const requestItemsPerPage = 3;

  const itemsPerPage = 4;

  const loadPinsDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/getAllPinDetails');
      setPins(res.data.pins || []);
      setPinRequests(res.data.pinRequests || []);
    } catch (error: any) {
      console.error('Pins Error:', error);
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(
          <div className="text-red-500">{error.message || 'Failed to load pins data'}</div>
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPinsDetails();
  }, [loadPinsDetails]);

  const filteredPins = pins
    .filter((pin) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        pin.pinCode.toLowerCase().includes(searchLower) ||
        pin.currentOwner.toLowerCase().includes(searchLower) ||
        pin.currentOwnerName.toLowerCase().includes(searchLower);

      if (activeTab === 'active') return pin.status && matchesSearch;
      if (activeTab === 'used') return !pin.status && matchesSearch;
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by status: active (true) first, then used (false)
      if (a.status === b.status) return 0;
      return a.status ? -1 : 1;
    });

  const totalPages = Math.ceil(filteredPins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPins = filteredPins.slice(startIndex, startIndex + itemsPerPage);

  const pendingRequests = pinRequests
    .filter((r) => r.status === 'PENDING')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const approvedRequests = pinRequests
    .filter((r) => r.status === 'APPROVED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const rejectedRequests = pinRequests
    .filter((r) => r.status === 'REJECTED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingTotalPages = Math.ceil(pendingRequests.length / requestItemsPerPage);
  const pendingStartIndex = (pendingPage - 1) * requestItemsPerPage;
  const paginatedPendingRequests = pendingRequests.slice(
    pendingStartIndex,
    pendingStartIndex + requestItemsPerPage
  );

  const approvedTotalPages = Math.ceil(approvedRequests.length / requestItemsPerPage);
  const approvedStartIndex = (approvedPage - 1) * requestItemsPerPage;
  const paginatedApprovedRequests = approvedRequests.slice(
    approvedStartIndex,
    approvedStartIndex + requestItemsPerPage
  );

  const rejectedTotalPages = Math.ceil(rejectedRequests.length / requestItemsPerPage);
  const rejectedStartIndex = (rejectedPage - 1) * requestItemsPerPage;
  const paginatedRejectedRequests = rejectedRequests.slice(
    rejectedStartIndex,
    rejectedStartIndex + requestItemsPerPage
  );

  const handleCopyPin = async (pinCode: string) => {
    try {
      await navigator.clipboard.writeText(pinCode);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = pinCode;
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

    setCopiedPin(pinCode)
    setTimeout(() => setCopiedPin(null), 2000)

    toast.success(<div className="text-green-600">{`${pinCode} Copied`}</div>);
  };

  const handleGeneratePins = async () => {
    if (!generateCount || parseInt(generateCount) < 1) {
      toast.warning(
        <div className='text-yellow-600'>
          Please enter valid pin count
        </div>
      );
      return;
    }
    try {
      setIsMakingReq(true)

      const res = await api.post('/generate-pin', { generateCount })
      await loadPinsDetails()
      toast.success(
        <div className='text-primary'>
          {res.data.message}
        </div>
      )

    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(
          <div className="text-red-500">
            {error.response.data.error}
          </div>
        );
      } else {
        toast.error(
          <div className="text-red-500">
            {error.message}
          </div>
        );
      }
    }
    finally {
      setIsMakingReq(false)
      setIsGenerateModalOpen(false);
      setGenerateCount('');
    }

  };

  const handleConfirm = async (Id: string, action: string) => {
    if (!Id || !action) {
      return
    }
    try {
      setIsMakingReq(true)
      const res = await api.post('/confirm-pin-transfer', {
        pinRequestId: Id,
        action
      })
      await loadPinsDetails()
      toast.success(
        <div className='text-primary'>
          {res.data.message}
        </div>
      )

    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(
          <div className="text-red-500">
            {error.response.data.error}
          </div>
        );
      } else {
        toast.error(
          <div className="text-red-500">
            {error.message}
          </div>
        );
      }
    }
    finally {
      setIsMakingReq(false)
      setIsRequestModalOpen(false)
    }

  };

  const handleDirectTransfer = async () => {
    if (!user) {
      return
    }
    if (!transferUserId.trim() || !transferPinCount || parseInt(transferPinCount) < 1) {
      toast.warning(<div className="text-yellow-600">Please enter valid user ID and pin count</div>);
      return;
    }

    try {
      setIsMakingReq(true)
      const res = await api.post('/transfer-pins-direct', {
        fromUserId: transferUserId,
        toUserId: user.id,
        count: parseInt(transferPinCount)
      });

      await loadPinsDetails();
      toast.success(<div className="text-primary">{res.data.message}</div>);
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(<div className="text-red-500">{error.message}</div>);
      }
    } finally {
      setIsMakingReq(false)
      setIsTransferModalOpen(false);
      setTransferUserId('');
      setTransferPinCount('');
    }
  };


  const stats = {
    toatlPinsOwnedByAdmin: pins.filter((p) => p.currentOwner === "GH0001").length,
    totalPins: pins.length,
    activePins: pins.filter((p) => p.status).length,
    activePinsOwnedByAdmin: pins.filter((p) => p.currentOwner === "GH0001" && p.status).length,
    usedPins: pins.filter((p) => !p.status).length,
    pendingRequests: pendingRequests.length,
  };

  if (loading && pins.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading pins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pin Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Generate and manage activation pins
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setIsGenerateModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Pins
          </Button>

          {/* ✅ NEW: Transfer Button */}
          <Button
            onClick={() => setIsTransferModalOpen(true)}
            variant="secondary"
            className="gap-2 bg-violet-500/10 text-violet-600"
          >
            <User className="w-4 h-4" />
            Transfer Pins
          </Button>

          <Button
            onClick={() => {
              loadPinsDetails();
              toast.success(<div className="text-primary">Data refreshed</div>);
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-violet-500/10 rounded-lg sm:rounded-xl">
                <Key className="w-4 h-4 sm:w-6 sm:h-6 text-violet-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Pins</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalPins}</p>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Admin Pins :
              <span className='text-violet-600 font-bold pl-1'>
                {stats.toatlPinsOwnedByAdmin}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Pins</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.activePins}</p>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Admin Active Pins :
              <span className='text-primary font-bold pl-1'>
                {stats.activePinsOwnedByAdmin}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl">
                <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Used Pins</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.usedPins}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg sm:rounded-xl">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Requests</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.pendingRequests}</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout - Pins & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pins Table */}
        <div className="lg:col-span-2">
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
                    <Key className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    All Pins
                  </CardTitle>
                </div>

                {/* Search */}
                <div className="px-4 sm:px-6 py-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pins..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 h-10 sm:h-11"
                    />
                  </div>
                </div>

                <TabsList className="bg-transparent h-auto p-0 px-4 sm:px-6 w-full justify-start">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm"
                  >
                    All Pins
                    <Badge className="ml-1 sm:ml-2 bg-primary text-white text-xs">{pins.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm"
                  >
                    Active
                    <Badge className="ml-1 sm:ml-2 bg-green-500 text-white text-xs">{stats.activePins}</Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="used"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm"
                  >
                    Used
                    <Badge className="ml-1 sm:ml-2 bg-red-500 text-white text-xs">{stats.usedPins}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="m-0">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Pin Code</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Used By</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">No pins found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPins.map((pin) => (
                          <TableRow key={pin.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono font-semibold text-sm">{pin.pinCode}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{pin.currentOwnerName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{pin.currentOwner}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {pin.usedBy ? (
                                <div>
                                  <p className="font-medium text-sm">{pin.usedByName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{pin.usedBy}</p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={`text-xs ${pin.status ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                  }`}
                              >
                                {pin.status ? 'Active' : 'Used'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(pin.createPin).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyPin(pin.pinCode)}
                                className="gap-1"
                              >
                                {copiedPin === pin.pinCode ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {paginatedPins.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No pins found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {paginatedPins.map((pin) => (
                        <div key={pin.id} className="p-4">
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono font-bold text-sm">{pin.pinCode}</p>
                              <Badge
                                className={`mt-1 text-xs ${pin.status ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                  }`}
                              >
                                {pin.status ? 'Active' : 'Used'}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyPin(pin.pinCode)}
                              className="gap-1 flex-shrink-0"
                            >
                              {copiedPin === pin.pinCode ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Owner</p>
                              <p className="font-medium">{pin.currentOwnerName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{pin.currentOwner}</p>
                            </div>
                            {pin.usedBy && (
                              <div>
                                <p className="text-xs text-muted-foreground">Used By</p>
                                <p className="font-medium">{pin.usedByName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{pin.usedBy}</p>
                              </div>
                            )}
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
                        {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPins.length)} of{' '}
                        {filteredPins.length}
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
        </div>

        {/* Pin Requests - With Tabs */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-xl">
            <Tabs defaultValue="pending" className="w-full">
              <div className="border-b bg-muted/30">
                <div className="px-4 sm:px-6 pt-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Pin Requests
                  </CardTitle>
                </div>
                <TabsList className="bg-transparent h-auto p-0 px-4 sm:px-6 w-full justify-start">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-xs"
                  >
                    Pending
                    <Badge className="ml-1 bg-yellow-500 text-white text-xs">{pendingRequests.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-xs"
                  >
                    Approved
                    <Badge className="ml-1 bg-green-500 text-white text-xs">{approvedRequests.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 py-2 text-xs"
                  >
                    Rejected
                    <Badge className="ml-1 bg-red-500 text-white text-xs">{rejectedRequests.length}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Pending Tab */}
              <TabsContent value="pending" className="m-0">
                <CardContent className="p-0">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No pending requests</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y">
                        {paginatedPendingRequests.map((request) => (
                          <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">{request.fromUserName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{request.fromUserId}</p>
                              </div>
                              <Badge className="bg-yellow-500 text-white text-xs flex-shrink-0">PENDING</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-3">
                              <span className="text-muted-foreground">Requesting:</span>
                              <span className="font-bold text-primary">{request.count} pins</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsRequestModalOpen(true);
                                }}
                                className="gap-1 text-xs h-8"
                              >
                                <Eye className="w-3 h-3" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pending Pagination */}
                      {pendingTotalPages > 1 && (
                        <div className="border-t p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-muted-foreground">
                              {pendingStartIndex + 1}-
                              {Math.min(pendingStartIndex + requestItemsPerPage, pendingRequests.length)} of{' '}
                              {pendingRequests.length}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                                disabled={pendingPage === 1}
                                className="h-7 w-7 p-0"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(3, pendingTotalPages) }, (_, i) => {
                                  let pageNum;
                                  if (pendingTotalPages <= 3) {
                                    pageNum = i + 1;
                                  } else if (pendingPage <= 2) {
                                    pageNum = i + 1;
                                  } else if (pendingPage >= pendingTotalPages - 1) {
                                    pageNum = pendingTotalPages - 2 + i;
                                  } else {
                                    pageNum = pendingPage - 1 + i;
                                  }
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={pendingPage === pageNum ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setPendingPage(pageNum)}
                                      className="h-7 w-7 p-0 text-xs"
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPendingPage((p) => Math.min(pendingTotalPages, p + 1))}
                                disabled={pendingPage === pendingTotalPages}
                                className="h-7 w-7 p-0"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </TabsContent>

              {/* Approved Tab */}
              <TabsContent value="approved" className="m-0">
                <CardContent className="p-0">
                  {approvedRequests.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No approved requests</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y">
                        {paginatedApprovedRequests.map((request) => (
                          <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">{request.fromUserName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{request.fromUserId}</p>
                              </div>
                              <Badge className="bg-green-500 text-white text-xs flex-shrink-0">APPROVED</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-3">
                              <span className="text-muted-foreground">Pins Generated:</span>
                              <span className="font-bold text-green-600">{request.count} pins</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsRequestModalOpen(true);
                                }}
                                className="gap-1 text-xs h-8"
                              >
                                <Eye className="w-3 h-3" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Approved Pagination */}
                      {approvedTotalPages > 1 && (
                        <div className="border-t p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-muted-foreground">
                              {approvedStartIndex + 1}-
                              {Math.min(approvedStartIndex + requestItemsPerPage, approvedRequests.length)} of{' '}
                              {approvedRequests.length}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setApprovedPage((p) => Math.max(1, p - 1))}
                                disabled={approvedPage === 1}
                                className="h-7 w-7 p-0"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(3, approvedTotalPages) }, (_, i) => {
                                  let pageNum;
                                  if (approvedTotalPages <= 3) {
                                    pageNum = i + 1;
                                  } else if (approvedPage <= 2) {
                                    pageNum = i + 1;
                                  } else if (approvedPage >= approvedTotalPages - 1) {
                                    pageNum = approvedTotalPages - 2 + i;
                                  } else {
                                    pageNum = approvedPage - 1 + i;
                                  }
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={approvedPage === pageNum ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setApprovedPage(pageNum)}
                                      className="h-7 w-7 p-0 text-xs"
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setApprovedPage((p) => Math.min(approvedTotalPages, p + 1))}
                                disabled={approvedPage === approvedTotalPages}
                                className="h-7 w-7 p-0"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </TabsContent>

              {/* Rejected Tab */}
              <TabsContent value="rejected" className="m-0">
                <CardContent className="p-0">
                  {rejectedRequests.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No rejected requests</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y">
                        {paginatedRejectedRequests.map((request) => (
                          <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">{request.fromUserName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{request.fromUserId}</p>
                              </div>
                              <Badge className="bg-red-500 text-white text-xs flex-shrink-0">REJECTED</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-3">
                              <span className="text-muted-foreground">Requested:</span>
                              <span className="font-bold text-muted-foreground">{request.count} pins</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsRequestModalOpen(true);
                                }}
                                className="gap-1 text-xs h-8"
                              >
                                <Eye className="w-3 h-3" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Rejected Pagination */}
                      {rejectedTotalPages > 1 && (
                        <div className="border-t p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-muted-foreground">
                              {rejectedStartIndex + 1}-
                              {Math.min(rejectedStartIndex + requestItemsPerPage, rejectedRequests.length)} of{' '}
                              {rejectedRequests.length}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectedPage((p) => Math.max(1, p - 1))}
                                disabled={rejectedPage === 1}
                                className="h-7 w-7 p-0"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(3, rejectedTotalPages) }, (_, i) => {
                                  let pageNum;
                                  if (rejectedTotalPages <= 3) {
                                    pageNum = i + 1;
                                  } else if (rejectedPage <= 2) {
                                    pageNum = i + 1;
                                  } else if (rejectedPage >= rejectedTotalPages - 1) {
                                    pageNum = rejectedTotalPages - 2 + i;
                                  } else {
                                    pageNum = rejectedPage - 1 + i;
                                  }
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={rejectedPage === pageNum ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setRejectedPage(pageNum)}
                                      className="h-7 w-7 p-0 text-xs"
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectedPage((p) => Math.min(rejectedTotalPages, p + 1))}
                                disabled={rejectedPage === rejectedTotalPages}
                                className="h-7 w-7 p-0"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </TabsContent>

            </Tabs>
          </Card>
        </div>
      </div>

      {/* Generate Pins Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              Generate Pins
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="count" className="text-sm font-medium">
                Number of Pins to Generate *
              </Label>
              <Input
                id="count"
                type="number"
                min="1"
                placeholder="Enter pin count"
                value={generateCount}
                onChange={(e) => setGenerateCount(e.target.value)}
                className="mt-2 h-11"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleGeneratePins} className="flex-1 gap-2" disabled={isMakingReq} >
                <Plus className="w-4 h-4" />
                Generate
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsGenerateModalOpen(false);
                  setGenerateCount('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Pin Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              Transfer Pins to User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="transferUserId" className="text-sm font-medium">
                User ID *
              </Label>
              <Input
                id="transferUserId"
                type="text"
                placeholder="Enter user ID (e.g., GH0123)"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="mt-2 h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The user ID to transfer pins to
              </p>
            </div>

            <div>
              <Label htmlFor="transferCount" className="text-sm font-medium">
                Number of Pins *
              </Label>
              <Input
                id="transferCount"
                type="number"
                min="1"
                placeholder="Enter number of pins"
                value={transferPinCount}
                onChange={(e) => setTransferPinCount(e.target.value)}
                className="mt-2 h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How many pins to transfer
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleDirectTransfer}
                className="flex-1 gap-2"
                disabled={isMakingReq}
              >
                <User className="w-4 h-4" />
                Transfer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferUserId('');
                  setTransferPinCount('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-4 sm:p-6 border-b">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <span className="truncate">Pin Request Details</span>
              </DialogTitle>
            </DialogHeader>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Request Info */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-muted/30 p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="text-base sm:text-lg font-mono break-all">
                      {selectedRequest.id}
                    </CardTitle>
                    <Badge
                      className={`flex-shrink-0 ${selectedRequest.status === 'APPROVED'
                        ? 'bg-green-500 text-white'
                        : selectedRequest.status === 'REJECTED'
                          ? 'bg-red-500 text-white'
                          : 'bg-yellow-500 text-white'
                        }`}
                    >
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {/* Pin Count */}
                  <div className="p-4 bg-violet-500/10 rounded-lg border border-violet-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Pins Requested</p>
                    <p className="text-3xl font-bold text-violet-600">{selectedRequest.count} Pins</p>
                  </div>

                  {/* From & To */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm font-semibold text-blue-700 mb-3">Requested By</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-semibold">{selectedRequest.fromUserName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">User ID</p>
                          <p className="font-mono font-semibold">{selectedRequest.fromUserId}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm font-semibold text-green-700 mb-3">Requested From</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-semibold">{selectedRequest.toUserName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">User ID</p>
                          <p className="font-mono font-semibold">{selectedRequest.toUserId}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Request Date</p>
                    <p className="text-sm font-semibold">
                      {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Screenshot */}
              {selectedRequest.screenshotUrl && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-muted/30 p-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Payment Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <img
                      src={`${VITE_BASE_URL}${selectedRequest.screenshotUrl}`}
                      alt="Payment Proof"
                      className="w-full max-w-md mx-auto rounded-lg border shadow-lg"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Actions - Only show for PENDING */}
              {selectedRequest.status === 'PENDING' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleConfirm(selectedRequest.id, "APPROVED")}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    disabled={isMakingReq}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve & Generate {selectedRequest.count} Pins
                  </Button>
                  <Button
                    onClick={() => handleConfirm(selectedRequest.id, "REJECTED")}
                    variant="destructive"
                    className="flex-1 gap-2"
                    disabled={isMakingReq}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Request
                  </Button>
                </div>
              )}

              {/* Show status message for approved/rejected */}
              {selectedRequest.status === 'APPROVED' && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <strong>
                      This request has been approved and {selectedRequest.count} pins have been transfered.
                    </strong>
                  </p>
                </div>
              )}

              {selectedRequest.status === 'REJECTED' && (
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <strong>This request has been rejected.</strong>
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};