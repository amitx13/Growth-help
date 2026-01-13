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
  Label,
} from '@repo/ui';
import {
  Users as UsersIcon,
  Search,
  Eye,
  CheckCircle,
  CreditCard,
  User,
  Mail,
  Phone,
  Hash,
  UserCheck,
  Activity,
  DollarSign,
  TrendingUp,
  Building,
  Key,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  QrCodeIcon,
  Banknote,
  Smartphone,
  Edit,
  Save,
  X,
  ExternalLink,
} from 'lucide-react';
import type { UserInAdmin } from '@repo/types';
import { toast } from 'sonner';
import api from '../lib/axios';

export const Users = () => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserInAdmin[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInAdmin | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [positionId, setPositionID] = useState<string | null>(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [editedUserData, setEditedUserData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [editedBankData, setEditedBankData] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    gPay: '',
  });
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);


  const itemsPerPage = 7;
  const USER_APP_URL = import.meta.env.VITE_USER_APP_URL!;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/allUserDetails');
      setUsers(res.data.users || []);
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
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (selectedUser) {
      setEditedUserData({
        name: selectedUser.name,
        email: selectedUser.email,
        mobile: selectedUser.mobile,
        password: selectedUser.password,
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser?.bankDetails) {
      setEditedBankData({
        bankName: selectedUser.bankDetails.bankName || '',
        accountNumber: selectedUser.bankDetails.accountNumber || '',
        ifscCode: selectedUser.bankDetails.ifscCode || '',
        upiId: selectedUser.bankDetails.upiId || '',
        gPay: selectedUser.bankDetails.gPay || '',
      });

      // Set QR preview if exists
      if (selectedUser.bankDetails.qrCode) {
        setQrCodePreview(`${import.meta.env.VITE_BASE_URL}${selectedUser.bankDetails.qrCode}`);
      } else {
        setQrCodePreview(null);
      }
    }
  }, [selectedUser]);

  const filteredUsers = users
    .filter((user) => {
      const searchLower = search.toLowerCase();
      return (
        user.id.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.mobile.includes(search)
      );
    })
    .sort((a, b) => {
      // Sort by createdAt date: newest first (descending order)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });


  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetails = (user: UserInAdmin) => {
    setSelectedUser(user);
    setSelectedPositionId(user.positions[0]?.id || '');
    setIsModalOpen(true);
  };

  const getLevelColor = (level: number) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    return colors[(level - 1) % colors.length];
  };

  const selectedPosition = selectedUser?.positions.find((p) => p.id === selectedPositionId);

  const openConfirm = (positionId: string) => {
    setPositionID(positionId);
  };

  const handleConfirm = async () => {
    try {
      const res = await api.post('/activate-user-account', { positionId });
      if (res.data.success) {
        toast.success(
          <div className="text-primary">
            {res.data.message}
          </div>
        )
        await loadUsers()
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
      setIsModalOpen(false);
      setPositionID(null);
    }
  };

  const handleSavePersonalDetails = async () => {
    if (!selectedUser) return;

    // Validation
    if (!editedUserData.name.trim()) {
      toast.error(<div className="text-red-500">Name is required</div>);
      return;
    }
    if (!editedUserData.email.trim() || !/\S+@\S+\.\S+/.test(editedUserData.email)) {
      toast.error(<div className="text-red-500">Valid email is required</div>);
      return;
    }
    if (!editedUserData.mobile.trim() || !/^\d{10}$/.test(editedUserData.mobile)) {
      toast.error(<div className="text-red-500">Valid 10-digit mobile number is required</div>);
      return;
    }
    if (!editedUserData.password.trim() || editedUserData.password.length < 6) {
      toast.error(<div className="text-red-500">Password must be at least 6 characters</div>);
      return;
    }

    try {
      setIsSavingPersonal(true);

      const res = await api.put(`/updateUserDetailsViaAdmin`, {
        id: selectedUser.id,
        name: editedUserData.name,
        email: editedUserData.email,
        mobile: editedUserData.mobile,
        password: editedUserData.password,
      });

      if (res.data.success) {
        toast.success(<div className="text-primary">Personal details updated successfully!</div>);

        await loadUsers();
        setIsEditingPersonal(false);
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(<div className="text-red-500">{error.message || 'Failed to update details'}</div>);
      }
    } finally {
      setIsSavingPersonal(false);
      setSelectedUser(null)
    }
  };

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setQrCodeFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(<div className="text-red-500">Please upload an image file</div>);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(<div className="text-red-500">File size must be less than 5MB</div>);
      return;
    }

    setQrCodeFile(file);
    const url = URL.createObjectURL(file);
    setQrCodePreview(url);
  };

  // Handler for saving bank details
  const handleSaveBankDetails = async () => {
    if (!selectedUser) return;

    // Validation
    if (!editedBankData.bankName.trim()) {
      toast.error(<div className="text-red-500">Bank name is required</div>);
      return;
    }
    if (!editedBankData.accountNumber.trim()) {
      toast.error(<div className="text-red-500">Account number is required</div>);
      return;
    }
    if (!editedBankData.ifscCode.trim()) {
      toast.error(<div className="text-red-500">IFSC code is required</div>);
      return;
    }

    try {
      setIsSavingBank(true);

      const formData = new FormData();
      formData.append('bankName', editedBankData.bankName);
      formData.append('accountNumber', editedBankData.accountNumber);
      formData.append('ifscCode', editedBankData.ifscCode);
      formData.append('upiId', editedBankData.upiId || '');
      formData.append('gPay', editedBankData.gPay || '');

      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      const res = await api.put(
        `/updateUserBankDetailsViaAdmin/${selectedUser.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data.success) {
        toast.success(<div className="text-primary">Bank details updated successfully!</div>);

        await loadUsers();
        setIsEditingBank(false);
        setQrCodeFile(null);
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(<div className="text-red-500">{error.message || 'Failed to update bank details'}</div>);
      }
    } finally {
      setIsSavingBank(false);
      setSelectedUser(null)
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg text-muted-foreground">No users found</p>
          <Button onClick={loadUsers} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage all users and their accounts
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Badge className="bg-primary/20 text-primary border-0 px-4 py-2 justify-center">
            <UsersIcon className="w-4 h-4 mr-2" />
            {users.length} Total Users
          </Badge>
          <Button onClick={() => {
            loadUsers()
            toast.success(<div className="text-primary">Data refreshed</div>);
          }} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, mobile, or user ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-10 sm:h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead className="text-center">Accounts</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-semibold text-sm">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.mobile}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 text-xs">
                          {user.totalPositions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-xs ${user.activePositions > 0
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                            }`}
                        >
                          {user.activePositions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(user)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {paginatedUsers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="divide-y">
                {paginatedUsers.map((user) => (
                  <div key={user.id} className="p-4">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono font-bold text-sm">{user.id}</p>
                        <p className="font-semibold text-base mt-1">{user.name}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 text-xs">
                          {user.totalPositions}
                        </Badge>
                        <Badge
                          className={`text-xs ${user.activePositions > 0
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                            }`}
                        >
                          {user.activePositions}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p className="truncate">{user.email}</p>
                      <p>{user.mobile}</p>
                      <p className="text-xs">
                        Joined:{' '}
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(user)}
                        className="flex-1 gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
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
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{' '}
                  {filteredUsers.length} users
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
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-4 sm:p-6 border-b pr-12 sm:pr-14">
                <div className="flex flex-col gap-3 w-full">
                  {/* Top row - User info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl font-bold truncate">
                      {selectedUser.name}
                    </DialogTitle>
                  </div>

                  {/* Bottom row - Login button */}
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const loginParams = new URLSearchParams({
                        userId: selectedUser.id,
                        password: selectedUser.password,
                      });
                      window.open(
                        `${USER_APP_URL}/login?${loginParams.toString()}`,
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }}
                    variant="default"
                    size="sm"
                    className="gap-2 w-full sm:w-auto sm:self-start"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Login as {selectedUser.name}</span>
                  </Button>
                </div>
              </DialogHeader>

              <Tabs defaultValue="personal" className="w-full">
                <div className="border-b px-4 sm:px-6">
                  <TabsList className="bg-transparent h-auto p-0 w-full justify-start">
                    <TabsTrigger
                      value="personal"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-6 py-3 text-xs sm:text-sm"
                    >
                      Personal
                    </TabsTrigger>
                    <TabsTrigger
                      value="Bank"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-6 py-3 text-xs sm:text-sm"
                    >
                      Bank Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="accounts"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-6 py-3 text-xs sm:text-sm"
                    >
                      Accounts
                    </TabsTrigger>
                    <TabsTrigger
                      value="actions"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-6 py-3 text-xs sm:text-sm"
                    >
                      Actions
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Personal Info Tab */}
                <TabsContent value="personal" className="m-0 p-4 sm:p-6 space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>

                        {!isEditingPersonal ? (
                          <Button
                            size="sm"
                            onClick={() => setIsEditingPersonal(true)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSavePersonalDetails}
                              disabled={isSavingPersonal}
                              className="gap-2"
                            >
                              <Save className="w-4 h-4" />
                              <span className="hidden sm:inline">{isSavingPersonal ? 'Saving...' : 'Save'}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsEditingPersonal(false);
                                // Reset to original values
                                setEditedUserData({
                                  name: selectedUser.name,
                                  email: selectedUser.email,
                                  mobile: selectedUser.mobile,
                                  password: selectedUser.password,
                                });
                              }}
                              disabled={isSavingPersonal}
                              className="gap-2"
                            >
                              <X className="w-4 h-4" />
                              <span className="hidden sm:inline">Cancel</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* User ID - Non-editable */}
                        <div className="flex items-start gap-3">
                          <Hash className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-violet-500 mb-1">User ID</p>
                            <p className="text-sm font-mono font-semibold break-all">
                              {selectedUser.id}
                            </p>
                          </div>
                        </div>

                        {/* Full Name - Editable */}
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <Label className="text-xs font-medium text-blue-500 mb-2 block">
                              Full Name
                            </Label>
                            {isEditingPersonal ? (
                              <Input
                                value={editedUserData.name}
                                onChange={(e) =>
                                  setEditedUserData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                className="h-9 text-sm"
                                placeholder="Enter full name"
                              />
                            ) : (
                              <p className="text-sm font-semibold break-words">{selectedUser.name}</p>
                            )}
                          </div>
                        </div>

                        {/* Email - Editable */}
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <Label className="text-xs font-medium text-red-500 mb-2 block">
                              Email
                            </Label>
                            {isEditingPersonal ? (
                              <Input
                                type="email"
                                value={editedUserData.email}
                                onChange={(e) =>
                                  setEditedUserData((prev) => ({ ...prev, email: e.target.value }))
                                }
                                className="h-9 text-sm"
                                placeholder="Enter email"
                              />
                            ) : (
                              <p className="text-sm break-all">{selectedUser.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Mobile - Editable */}
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <Label className="text-xs font-medium text-green-500 mb-2 block">
                              Mobile
                            </Label>
                            {isEditingPersonal ? (
                              <Input
                                type="tel"
                                value={editedUserData.mobile}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                  setEditedUserData((prev) => ({ ...prev, mobile: value }));
                                }}
                                className="h-9 text-sm"
                                placeholder="Enter 10-digit mobile"
                                maxLength={10}
                              />
                            ) : (
                              <p className="text-sm">{selectedUser.mobile}</p>
                            )}
                          </div>
                        </div>

                        {/* Password - Editable */}
                        <div className="flex items-start gap-3">
                          <Key className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <Label className="text-xs font-medium text-orange-500 mb-2 block">
                              Password
                            </Label>
                            {isEditingPersonal ? (
                              <Input
                                type="text"
                                value={editedUserData.password}
                                onChange={(e) =>
                                  setEditedUserData((prev) => ({ ...prev, password: e.target.value }))
                                }
                                className="h-9 text-sm font-mono"
                                placeholder="Enter new password"
                              />
                            ) : (
                              <p className="text-sm font-mono text-muted-foreground break-all">
                                {selectedUser.password}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Joined Date - Non-editable */}
                        <div className="flex items-start gap-3">
                          <UserCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-emerald-500 mb-1">Joined Date</p>
                            <p className="text-sm">
                              {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Bank Tab */}
                {selectedUser.bankDetails === null ? (
                  <TabsContent value="Bank" className="m-0 p-4 sm:p-6 space-y-4">
                    <Card className="border-0 shadow-md">
                      <CardHeader className="bg-muted/30 p-4">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          Bank Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
                          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                              Bank Details Not Available
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              User has not added their bank details yet.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ) : (
                  <TabsContent value="Bank" className="m-0 p-4 sm:p-6 space-y-4">
                    <Card className="border-0 shadow-md">
                      <CardHeader className="bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Bank Details
                          </CardTitle>

                          {selectedUser?.bankDetails && (
                            <>
                              {!isEditingBank ? (
                                <Button
                                  size="sm"
                                  onClick={() => setIsEditingBank(true)}
                                  className="gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveBankDetails}
                                    disabled={isSavingBank}
                                    className="gap-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    <span className="hidden sm:inline">{isSavingBank ? 'Saving...' : 'Save'}</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setIsEditingBank(false);
                                      setQrCodeFile(null);
                                      // Reset to original values
                                      setEditedBankData({
                                        bankName: selectedUser.bankDetails?.bankName || '',
                                        accountNumber: selectedUser.bankDetails?.accountNumber || '',
                                        ifscCode: selectedUser.bankDetails?.ifscCode || '',
                                        upiId: selectedUser.bankDetails?.upiId || '',
                                        gPay: selectedUser.bankDetails?.gPay || '',
                                      });
                                      // Reset QR preview
                                      if (selectedUser.bankDetails?.qrCode) {
                                        setQrCodePreview(`${import.meta.env.VITE_BASE_URL}${selectedUser.bankDetails.qrCode}`);
                                      } else {
                                        setQrCodePreview(null);
                                      }
                                    }}
                                    disabled={isSavingBank}
                                    className="gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline">Cancel</span>
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6">
                        {selectedUser?.bankDetails ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {/* Bank Name */}
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <Banknote className="w-4 h-4" />
                                  Bank Name *
                                </Label>
                                {isEditingBank ? (
                                  <Input
                                    value={editedBankData.bankName}
                                    onChange={(e) =>
                                      setEditedBankData((prev) => ({ ...prev, bankName: e.target.value }))
                                    }
                                    className="h-10"
                                    placeholder="Enter bank name"
                                  />
                                ) : (
                                  <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50">
                                    <p className="text-sm font-semibold text-foreground">
                                      {selectedUser.bankDetails.bankName || 'Not provided'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Account Number */}
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <CreditCard className="w-4 h-4" />
                                  Account Number *
                                </Label>
                                {isEditingBank ? (
                                  <Input
                                    value={editedBankData.accountNumber}
                                    onChange={(e) =>
                                      setEditedBankData((prev) => ({ ...prev, accountNumber: e.target.value }))
                                    }
                                    className="h-10 font-mono"
                                    placeholder="Enter account number"
                                  />
                                ) : (
                                  <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50">
                                    <p className="text-sm font-mono font-semibold text-foreground">
                                      {selectedUser.bankDetails.accountNumber || 'Not provided'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* IFSC Code */}
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <Building className="w-4 h-4" />
                                  IFSC Code *
                                </Label>
                                {isEditingBank ? (
                                  <Input
                                    value={editedBankData.ifscCode}
                                    onChange={(e) =>
                                      setEditedBankData((prev) => ({
                                        ...prev,
                                        ifscCode: e.target.value.toUpperCase(),
                                      }))
                                    }
                                    className="h-10 font-mono uppercase"
                                    placeholder="Enter IFSC code"
                                    maxLength={11}
                                  />
                                ) : (
                                  <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50">
                                    <p className="text-sm font-mono font-semibold text-foreground uppercase">
                                      {selectedUser.bankDetails.ifscCode || 'Not provided'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* UPI ID */}
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <Smartphone className="w-4 h-4" />
                                  UPI ID (Optional)
                                </Label>
                                {isEditingBank ? (
                                  <Input
                                    value={editedBankData.upiId}
                                    onChange={(e) =>
                                      setEditedBankData((prev) => ({ ...prev, upiId: e.target.value }))
                                    }
                                    className="h-10"
                                    placeholder="Enter UPI ID"
                                  />
                                ) : (
                                  <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50">
                                    <p className="text-sm font-semibold text-foreground">
                                      {selectedUser.bankDetails.upiId || 'Not provided'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* GPay Number */}
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <Phone className="w-4 h-4" />
                                  GPay/PhonePe Number (Optional)
                                </Label>
                                {isEditingBank ? (
                                  <Input
                                    value={editedBankData.gPay}
                                    onChange={(e) =>
                                      setEditedBankData((prev) => ({ ...prev, gPay: e.target.value }))
                                    }
                                    className="h-10"
                                    placeholder="Enter GPay/PhonePe number"
                                  />
                                ) : (
                                  <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50">
                                    <p className="text-sm font-semibold text-foreground">
                                      {selectedUser.bankDetails.gPay || 'Not provided'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* QR Code - Full Width */}
                              <div className="sm:col-span-2 space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <QrCodeIcon className="w-4 h-4" />
                                  Payment QR Code (Optional)
                                </Label>

                                {isEditingBank ? (
                                  <div className="space-y-3">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleQrCodeChange}
                                      className="h-10 cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Upload payment QR code image (Max 5MB)
                                    </p>

                                    {qrCodePreview && (
                                      <div className="relative mt-3 rounded-lg border p-4 bg-muted/20">
                                        <div className="flex items-center justify-between mb-3">
                                          <p className="text-xs font-medium text-muted-foreground">Preview</p>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => {
                                              setQrCodeFile(null);
                                              setQrCodePreview(
                                                selectedUser.bankDetails?.qrCode
                                                  ? `${import.meta.env.VITE_BASE_URL}${selectedUser.bankDetails.qrCode}`
                                                  : null
                                              );
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <div className="flex justify-center">
                                          <img
                                            src={qrCodePreview}
                                            alt="QR Code Preview"
                                            className="max-h-64 w-auto rounded-md object-contain bg-background"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-4 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                                    {selectedUser.bankDetails.qrCode ? (
                                      <div className="flex justify-center">
                                        <img
                                          src={`${import.meta.env.VITE_BASE_URL}${selectedUser.bankDetails.qrCode}`}
                                          alt="Payment QR Code"
                                          className="max-h-64 w-auto rounded-md object-contain bg-background"
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <QrCodeIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-30" />
                                        <p className="font-medium text-sm text-muted-foreground">
                                          No QR code uploaded
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Edit mode info */}
                            {isEditingBank && (
                              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                  <strong>Note:</strong> Updated bank details will be used for all future payment transactions for this user.
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground mb-4">No bank details found</p>
                            <p className="text-xs text-muted-foreground">
                              User has not added their bank details yet
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Positions Tab */}
                <TabsContent value="accounts" className="m-0 p-4 sm:p-6 space-y-6">
                  {/* Position Selector */}
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Building className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <p className="font-semibold text-sm sm:text-base">Select Account</p>
                        </div>
                        <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                          <SelectTrigger className="w-full sm:flex-1 h-11">
                            <SelectValue placeholder="Choose a position" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedUser.positions.map((position, index) => (
                              <SelectItem key={position.id} value={position.id}>
                                <div className="flex items-center gap-2 py-1">
                                  <span className="font-mono font-semibold">#{index + 1}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="font-mono text-sm">{position.id}</span>
                                  <Badge
                                    className={`text-xs ${position.positionType === 'ORIGINAL'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-purple-500 text-white'
                                      }`}
                                  >
                                    {position.positionType}
                                  </Badge>
                                  <Badge
                                    className={`text-xs ${position.isActive
                                      ? 'bg-green-500 text-white'
                                      : 'bg-red-500 text-white'
                                      }`}
                                  >
                                    {position.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selected Position Details */}
                  {selectedPosition && (
                    <Card className="border-0 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <CardTitle className="text-base sm:text-lg font-mono break-all">
                            {selectedPosition.id}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${getLevelColor(selectedPosition.currentLevel)} text-white text-xs`}>
                              Level {selectedPosition.currentLevel}
                            </Badge>
                            <Badge
                              className={`text-xs ${selectedPosition.positionType === 'ORIGINAL'
                                ? 'bg-blue-500 text-white'
                                : 'bg-purple-500 text-white'
                                }`}
                            >
                              {selectedPosition.positionType}
                            </Badge>
                            <Badge
                              className={`text-xs ${selectedPosition.isActive
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                                }`}
                            >
                              {selectedPosition.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-6">
                        {/* Position Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <UsersIcon className="w-4 h-4 text-blue-600" />
                              <p className="text-xs font-medium text-muted-foreground">Direct Referrals</p>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold">{selectedPosition.directReferralCount}</p>
                          </div>

                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              <p className="text-xs font-medium text-muted-foreground">Total Earned</p>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                              ₹
                              {selectedPosition.userLevels
                                .reduce((sum, lvl) => sum + lvl.amountEarned, 0)
                                .toLocaleString()}
                            </p>
                          </div>

                          <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="w-4 h-4 text-purple-600" />
                              <p className="text-xs font-medium text-muted-foreground">Total Payments</p>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold">
                              {selectedPosition.userLevels.reduce((sum, lvl) => sum + lvl.paymentsReceived, 0)}
                            </p>
                          </div>
                        </div>

                        {/* Sponsor Details */}
                        {selectedPosition.sponsor && (
                          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                              <UserCheck className="w-4 h-4" />
                              Sponsor Details
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Name</p>
                                <p className="font-semibold">{selectedPosition.sponsor.name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Mobile</p>
                                <p className="font-semibold">{selectedPosition.sponsor.mobile}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">User ID</p>
                                <p className="font-mono font-semibold">{selectedPosition.sponsor.userId}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Account ID</p>
                                <p className="font-mono font-semibold break-all">
                                  {selectedPosition.sponsor.positionId}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Sponsor Level</p>
                                <Badge
                                  className={`${getLevelColor(selectedPosition.sponsor.currentLevel)} text-white text-xs`}
                                >
                                  Level {selectedPosition.sponsor.currentLevel}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Level-wise Earnings */}
                        <div>
                          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Level-wise Earnings
                          </p>
                          <div className="space-y-2">
                            {selectedPosition.userLevels.map((level) => (
                              <div
                                key={level.levelNumber}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-2"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge className={`${getLevelColor(level.levelNumber)} text-white text-xs`}>
                                    Level {level.levelNumber}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {level.paymentsReceived} payments received
                                  </span>
                                </div>
                                <p className="text-lg font-bold text-emerald-600">
                                  ₹{level.amountEarned.toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Activate Button */}
                        {!selectedPosition.isActive && (
                          <Button
                            onClick={() => openConfirm(selectedPosition.id)}
                            className="w-full gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Activate This Account
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Actions Tab */}
                <TabsContent value="actions" className="m-0 p-4 sm:p-6 space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-muted/30 p-4">
                      <CardTitle className="text-base sm:text-lg">Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      {/* Activate Inactive Positions */}
                      {selectedUser.positions.filter((p) => !p.isActive).length > 0 ? (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm font-semibold mb-3">Activate Accounts</p>
                          <div className="space-y-2">
                            {selectedUser.positions
                              .filter((p) => !p.isActive)
                              .map((position) => (
                                <div
                                  key={position.id}
                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-background rounded-lg gap-2"
                                >
                                  <span className="font-mono text-sm break-all">{position.id}</span>
                                  <Button
                                    size="sm"
                                    onClick={() => openConfirm(position.id)}
                                    className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Activate
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 sm:p-8">
                          {/* Success Icon */}
                          <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                              </div>
                            </div>

                            {/* Title */}
                            <div>
                              <h3 className="text-xl font-bold text-foreground mb-2">
                                All Accounts Active! 🎉
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Great news! All {selectedUser.positions.length === 1 ? 'account is' : 'accounts are'} currently active and running smoothly.
                              </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
                              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <p className="text-xs font-medium text-green-700">Active</p>
                                </div>
                                <p className="text-2xl font-bold text-green-600 text-center">
                                  {selectedUser.activePositions}
                                </p>
                              </div>

                              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                  <Activity className="w-4 h-4 text-blue-600" />
                                  <p className="text-xs font-medium text-blue-700">Total</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-600 text-center">
                                  {selectedUser.totalPositions}
                                </p>
                              </div>
                            </div>

                            {/* Info Note */}
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg border max-w-md">
                              <p className="text-xs text-muted-foreground">
                                💡 Inactive positions will appear here when they need activation
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <ConfirmModal
            open={!!positionId}
            title={"Approve this account?"}
            description={
              positionId
                ? `Activate account of ${selectedUser.name} Account ID : ${positionId}`
                : ""
            }
            onCancel={() => {
              setPositionID(null);
            }}
            onConfirm={handleConfirm}
            confirmVariant="default"
          />
        </>
      )}
    </div>
  );
};