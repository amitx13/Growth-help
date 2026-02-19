// components/Settings.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import {
  TrendingUp,
  CreditCard,
  Edit,
  Save,
  X,
  Building,
  RefreshCw,
  AlertCircle,
  QrCode as QrCodeIcon,
  ZoomIn,
  Upload,
  User2Icon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminbankDetails, AdminProfileData, LevelConfig } from '@repo/types';
import api from '../lib/axios';

export const Settings = () => {
  const [levelConfigs, setLevelConfigs] = useState<LevelConfig[]>([]);
  const [bankDetails, setBankDetails] = useState<AdminbankDetails | null>(null);
  const [adminProfileData, setAdminProfileData] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [showQrPreview, setShowQrPreview] = useState(false);

  const loadAdminConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/getAdminConfigs');

      setLevelConfigs(res.data.levelConfigs || []);
      setBankDetails(res.data.bankDetails || null);
      setAdminProfileData(res.data.adminProfileData || null)

      // Set QR preview if exists
      if (res.data.bankDetails?.bankDetails?.qrCode) {
        setQrCodePreview(`${import.meta.env.VITE_BASE_URL}${res.data.bankDetails.bankDetails.qrCode}`);
      }
    } catch (error: any) {
      console.error('Settings Error:', error);
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(
          <div className="text-red-500">{error.message || 'Failed to load settings data'}</div>
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminConfigs();
  }, [loadAdminConfigs]);

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

  const handleSaveBank = async () => {
    if (!bankDetails?.bankDetails) {
      toast.error(<div className="text-red-500">Bank details are not available</div>);
      return;
    }

    const { bankName, accountNumber, ifscCode, upiId, gPay } = bankDetails.bankDetails;
    const { AccountHolderName } = bankDetails;

    // Validation
    if (!bankName || !accountNumber || !ifscCode || !AccountHolderName) {
      toast.error(<div className="text-red-500">Please fill all required fields</div>);
      return;
    }

    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append('bankName', bankName);
      formData.append('accountNumber', accountNumber);
      formData.append('ifscCode', ifscCode);
      formData.append('accountHolderName', AccountHolderName);
      formData.append('upiId', upiId || '');
      formData.append('gPay', gPay || '');

      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      const res = await api.post('/updateAdminBank', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success(<div className="text-primary">{res.data.message || 'Bank details updated successfully!'}</div>);
        await loadAdminConfigs();
        setIsEditingBank(false);
        setQrCodeFile(null);
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(<div className="text-red-500">{error.message}</div>);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!adminProfileData) {
      toast.error(<div className="text-red-500">Profile data not available</div>);
      return;
    }

    const { email, mobile, password } = adminProfileData;

    if (!email || !mobile || !password) {
      toast.error(<div className="text-red-500">All fields are required</div>);
      return;
    }

    try {
      setIsSaving(true);

      const res = await api.post(
        '/updateAdminProfile',
        {
          email,
          mobile,
          password,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(
          <div className="text-primary">
            {res.data.message || 'Profile updated successfully'}
          </div>
        );
        await loadAdminConfigs();
        setIsEditingProfile(false);
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(<div className="text-red-500">{error.response.data.error}</div>);
      } else {
        toast.error(<div className="text-red-500">{error.message}</div>);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getLevelColor = (level: number) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    return colors[(level - 1) % colors.length];
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage system configuration
          </p>
        </div>
      </div>

      <Tabs defaultValue="levels" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="levels" className="flex items-center justify-center gap-2 py-3">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Level Configuration</span>
            <span className="sm:hidden">Levels</span>
          </TabsTrigger>

          <TabsTrigger value="bank" className="flex items-center justify-center gap-2 py-3">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Bank Details</span>
            <span className="sm:hidden">Bank</span>
          </TabsTrigger>

          <TabsTrigger value="profile" className="flex items-center justify-center gap-2 py-3">
            <User2Icon className="w-4 h-4" />
            <span className="hidden sm:inline">Personal Details</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* Level Configuration Tab */}
        <TabsContent value="levels" className="space-y-6 mt-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Level Configurations ({levelConfigs.length})
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Level</TableHead>
                      <TableHead>Upgrade Amount</TableHead>
                      <TableHead>Sponsor Amount</TableHead>
                      <TableHead className="text-center">Capacity</TableHead>
                      <TableHead className="text-center">Reentry</TableHead>
                      <TableHead className="text-center">Upgrade At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelConfigs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">No level configurations found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      levelConfigs.map((config) => (
                        <TableRow key={config.id} className="hover:bg-muted/30">
                          <TableCell>
                            <Badge className={`${getLevelColor(config.level)} text-white`}>
                              Level {config.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">
                            ₹{config.upgradeAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">
                            ₹{config.sponsorAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {config.paymentCapacity}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {config.reentryCount}
                          </TableCell>
                          <TableCell className="text-center">
                            {config.upgradeAtPayment ? (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-700 text-xs">
                                {config.upgradeAtPayment}th payment
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {levelConfigs.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No level configurations found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {levelConfigs.map((config) => (
                      <div key={config.id} className="p-4">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <Badge className={`${getLevelColor(config.level)} text-white`}>
                            Level {config.level}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Upgrade Amount</p>
                            <p className="font-bold text-emerald-600">
                              ₹{config.upgradeAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Sponsor Amount</p>
                            <p className="font-bold text-blue-600">
                              ₹{config.sponsorAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Payment Capacity</p>
                            <p className="font-semibold">{config.paymentCapacity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Reentry Count</p>
                            <p className="font-semibold">{config.reentryCount}</p>
                          </div>
                          {config.upgradeAtPayment && (
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">Upgrade At</p>
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-700 mt-1 text-xs">
                                {config.upgradeAtPayment}th payment
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details Tab */}
        <TabsContent value="bank" className="space-y-6 mt-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Admin Bank Account Details
                </CardTitle>
                {bankDetails?.bankDetails && (
                  <>
                    {!isEditingBank ? (
                      <Button size="sm" onClick={() => setIsEditingBank(true)} className="gap-2 w-full sm:w-auto">
                        <Edit className="w-4 h-4" />
                        <span className="inline">Edit</span>
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          onClick={handleSaveBank}
                          className="gap-2 flex-1 sm:flex-initial"
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4" />
                          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingBank(false);
                            setQrCodeFile(null);
                            loadAdminConfigs();
                          }}
                          className="gap-2 flex-1 sm:flex-initial"
                          disabled={isSaving}
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
              {bankDetails?.bankDetails ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="accountHolderName" className="text-sm font-medium">
                        Account Holder Name *
                      </Label>
                      <Input
                        id="accountHolderName"
                        value={bankDetails.AccountHolderName || ''}
                        onChange={(e) =>
                          setBankDetails((prev) =>
                            prev ? { ...prev, AccountHolderName: e.target.value } : prev
                          )
                        }
                        disabled={!isEditingBank}
                        className="mt-2 h-11"
                        placeholder="Enter account holder name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bankName" className="text-sm font-medium">
                        Bank Name *
                      </Label>
                      <Input
                        id="bankName"
                        value={bankDetails.bankDetails.bankName || ''}
                        onChange={(e) =>
                          setBankDetails((prev) =>
                            prev?.bankDetails
                              ? {
                                ...prev,
                                bankDetails: { ...prev.bankDetails, bankName: e.target.value },
                              }
                              : prev
                          )
                        }
                        disabled={!isEditingBank}
                        className="mt-2 h-11"
                        placeholder="Enter bank name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountNumber" className="text-sm font-medium">
                        Account Number *
                      </Label>
                      <Input
                        id="accountNumber"
                        value={bankDetails.bankDetails.accountNumber || ''}
                        onChange={(e) =>
                          setBankDetails((prev) =>
                            prev?.bankDetails
                              ? {
                                ...prev,
                                bankDetails: { ...prev.bankDetails, accountNumber: e.target.value },
                              }
                              : prev
                          )
                        }
                        disabled={!isEditingBank}
                        className="mt-2 h-11"
                        placeholder="Enter account number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ifscCode" className="text-sm font-medium">
                        IFSC Code *
                      </Label>
                      <Input
                        id="ifscCode"
                        value={bankDetails.bankDetails.ifscCode || ''}
                        onChange={(e) =>
                          setBankDetails((prev) =>
                            prev?.bankDetails
                              ? {
                                ...prev,
                                bankDetails: {
                                  ...prev.bankDetails,
                                  ifscCode: e.target.value.toUpperCase(),
                                },
                              }
                              : prev
                          )
                        }
                        disabled={!isEditingBank}
                        className="mt-2 h-11 uppercase"
                        placeholder="Enter IFSC code"
                      />
                    </div>

                    <div>
                      <Label htmlFor="upiId" className="text-sm font-medium">
                        UPI ID
                      </Label>
                      <Input
                        id="upiId"
                        value={bankDetails.bankDetails.upiId || ''}
                        onChange={(e) =>
                          setBankDetails((prev) =>
                            prev?.bankDetails
                              ? {
                                ...prev,
                                bankDetails: { ...prev.bankDetails, upiId: e.target.value },
                              }
                              : prev
                          )
                        }
                        disabled={!isEditingBank}
                        className="mt-2 h-11"
                        placeholder="Enter UPI ID"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gPay" className="text-sm font-medium">
                        GPay Number
                      </Label>
                      <Input
                        id="gPay"
                        value={bankDetails.bankDetails.gPay || ''}
                        onChange={(e) =>
                          setBankDetails((prev) =>
                            prev?.bankDetails
                              ? {
                                ...prev,
                                bankDetails: { ...prev.bankDetails, gPay: e.target.value },
                              }
                              : prev
                          )
                        }
                        disabled={!isEditingBank}
                        className="mt-2 h-11"
                        placeholder="Enter GPay number"
                      />
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="mt-6">
                    <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <QrCodeIcon className="w-4 h-4" />
                      Payment QR Code
                    </Label>
                    {isEditingBank ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleQrCodeChange}
                            className="h-11 cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Upload your payment QR code image (Max 5MB)
                        </p>
                        {qrCodePreview && (
                          <div className="relative mt-3 rounded-lg border p-3 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-muted-foreground">Preview</p>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => setShowQrPreview(true)}
                                >
                                  <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setQrCodeFile(null);
                                    setQrCodePreview(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <img
                              src={qrCodePreview}
                              alt="QR Code Preview"
                              className="max-h-48 w-full rounded-md object-contain bg-background cursor-pointer"
                              onClick={() => setShowQrPreview(true)}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                        {qrCodePreview ? (
                          <div className="relative">
                            <img
                              src={qrCodePreview}
                              alt="Payment QR Code"
                              className="max-h-48 w-full rounded-md object-contain cursor-pointer"
                              onClick={() => setShowQrPreview(true)}
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 right-2 gap-2"
                              onClick={() => setShowQrPreview(true)}
                            >
                              <ZoomIn className="h-3 w-3" />
                              <span className="text-xs">View Full</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="font-medium text-sm text-muted-foreground">
                              No QR code uploaded
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditingBank && (
                    <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Note:</strong> This bank account will be shown to users for payment
                        transactions
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">No bank details found</p>
                  <p className="text-xs text-muted-foreground">
                    Bank details will appear here once configured by the system administrator
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <User2Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Admin Profile Details
                </CardTitle>

                {adminProfileData && (
                  <>
                    {!isEditingProfile ? (
                      <Button
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          className="gap-2 flex-1 sm:flex-initial"
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            loadAdminConfigs();
                          }}
                          className="gap-2 flex-1 sm:flex-initial"
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {adminProfileData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ID */}
                  <div>
                    <Label htmlFor="id" className="text-sm font-medium">
                      Admin ID *
                    </Label>
                    <Input
                      id="id"
                      value={adminProfileData.id || ''}
                      disabled={true}
                      className="mt-2 h-11"
                      placeholder="Enter admin ID"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      value={adminProfileData.email || ''}
                      onChange={(e) =>
                        setAdminProfileData((prev) =>
                          prev ? { ...prev, email: e.target.value } : prev
                        )
                      }
                      disabled={!isEditingProfile}
                      className="mt-2 h-11"
                      placeholder="Enter email"
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <Label htmlFor="mobile" className="text-sm font-medium">
                      Mobile *
                    </Label>
                    <Input
                      id="mobile"
                      value={adminProfileData.mobile || ''}
                      onChange={(e) =>
                        setAdminProfileData((prev) =>
                          prev ? { ...prev, mobile: e.target.value } : prev
                        )
                      }
                      disabled={!isEditingProfile}
                      className="mt-2 h-11"
                      placeholder="Enter mobile number"
                    />
                  </div>

                  {/* Password — ALWAYS VISIBLE */}
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="text"
                      value={adminProfileData.password || ''}
                      onChange={(e) =>
                        setAdminProfileData((prev) =>
                          prev ? { ...prev, password: e.target.value } : prev
                        )
                      }
                      disabled={!isEditingProfile}
                      className="mt-2 h-11"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No profile data found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Preview Dialog */}
      <Dialog open={showQrPreview} onOpenChange={setShowQrPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5" />
              Payment QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrCodePreview && (
              <img
                src={qrCodePreview}
                alt="Payment QR Code Full View"
                className="max-w-full max-h-[70vh] rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};