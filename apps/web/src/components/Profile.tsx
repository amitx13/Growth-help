import { useCallback, useEffect, useState } from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Button,
    Input,
    Label,
} from '@repo/ui';
import {
    Edit2,
    X,
    Eye,
    EyeOff,
    Save,
    User,
    Mail,
    Phone,
    Lock,
    Landmark,
    CreditCard,
    AlertCircle,
    Loader2,
    Smartphone,
    QrCode as QrCodeIcon,
} from 'lucide-react';
import { type UserProfileType } from '@repo/types';
import { toast } from "sonner";
import api from '../lib/axios';
import { useAuthStore } from '../stores/useAuthStore';
import { AlertAndUpdateForBankDetails } from './AlertBankDetails';

interface PersonalFormData {
    id: string;
    name: string;
    email: string;
    password: string;
    mobile: string;
}

interface BankingFormData {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    gPay: string;
}

interface FieldProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    isEditing: boolean;
    field: string;
    formData: any;
    handleInputChange: (field: string, value: string) => void;
    type?: string;
    placeholder?: string;
    showPassword?: boolean;
    onPasswordToggle?: () => void;
    maxLength?: number;
}

function ProfileField({
    icon,
    label,
    value,
    isEditing,
    field,
    handleInputChange,
    type = 'text',
    placeholder = '',
    showPassword = false,
    onPasswordToggle,
    maxLength,
}: FieldProps) {
    return (
        <div className="group">
            <Label className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                {icon}
                {label}
            </Label>
            {isEditing ? (
                <div className="flex gap-2">
                    <Input
                        type={type === 'password' && !showPassword ? 'password' : 'text'}
                        value={value || ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="h-12 bg-background border-2 border-border/50 focus:border-primary/50 rounded-lg transition-all"
                        placeholder={placeholder}
                        maxLength={maxLength}
                    />
                    {type === 'password' && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onPasswordToggle}
                            className="px-3 hover:bg-muted"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex items-center p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all hover:shadow-md group-hover:bg-muted/70">
                    <p className={`${type === 'password' ? 'font-mono' : ''} text-foreground font-medium flex-1`}>
                        {type === 'password' && !showPassword
                            ? '•'.repeat(value?.length || 0)
                            : value || 'Not set'}
                    </p>

                    {type === 'password' && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onPasswordToggle}
                            className="px-3 hover:bg-muted"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

export function UserProfile() {
    const { user } = useAuthStore();
    const [userDetails, setUserDetails] = useState<UserProfileType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isEditingBanking, setIsEditingBanking] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [isSavingBanking, setIsSavingBanking] = useState(false);

    const [personalFormData, setPersonalFormData] = useState<PersonalFormData | null>(null);
    const [bankingFormData, setBankingFormData] = useState<BankingFormData | null>(null);

    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
    const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

    const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // For first-time bank setup via modal
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [upiId, setUpiId] = useState("");
    const [gPay, setGPay] = useState("");

    const fetchUserDetails = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const data = await api.get(`/getUserProfileData/${user.id}`);
            const userData = data.data.user;

            setUserDetails(userData);

            setPersonalFormData({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                password: userData.password,
                mobile: userData.mobile,
            });

            if (userData.bankDetail) {
                setBankingFormData({
                    bankName: userData.bankDetail.bankName || '',
                    accountNumber: userData.bankDetail.accountNumber || '',
                    ifscCode: userData.bankDetail.ifscCode || '',
                    upiId: userData.bankDetail.upiId || '',
                    gPay: userData.bankDetail.gPay || '',
                });

                if (userData.bankDetail.qrCode) {
                    setQrCodePreview(`${import.meta.env.VITE_BASE_URL}${userData.bankDetail.qrCode}`);
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
        fetchUserDetails();
    }, [fetchUserDetails]);

    const handleSavePersonal = async () => {
        if (!personalFormData) return;

        setIsSavingPersonal(true);
        try {
            const resData = await api.put('/update-user-personal', personalFormData, {
                withCredentials: true,
            });

            if (resData.data.success) {
                toast.success(<div className="text-green-600">{resData.data.message}</div>);
                await fetchUserDetails();
                setIsEditingPersonal(false);
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(<div className="text-red-500">{error.response.data.error}</div>);
            } else {
                toast.error(<div className="text-red-500">{error.message}</div>);
            }
        } finally {
            setIsSavingPersonal(false);
        }
    };

    const handleSaveBanking = async () => {
        if (!bankingFormData) return;

        setIsSavingBanking(true);
        try {
            const formData = new FormData();
            formData.append('bankName', bankingFormData.bankName);
            formData.append('accountNumber', bankingFormData.accountNumber);
            formData.append('ifscCode', bankingFormData.ifscCode);
            formData.append('upiId', bankingFormData.upiId || '');
            formData.append('gPay', bankingFormData.gPay || '');

            if (qrCodeFile) {
                formData.append('qrCode', qrCodeFile);
            }

            const resData = await api.post('/update-user-banking', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (resData.data.success) {
                toast.success(<div className="text-green-600">Banking details updated successfully!</div>);
                await fetchUserDetails();
                setIsEditingBanking(false);
                setQrCodeFile(null);
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(<div className="text-red-500">{error.response.data.error}</div>);
            } else {
                toast.error(<div className="text-red-500">{error.message}</div>);
            }
        } finally {
            setIsSavingBanking(false);
        }
    };

    const handlePersonalInputChange = (field: string, value: string) => {
        setPersonalFormData((prev) => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    const handleBankingInputChange = (field: string, value: string) => {
        setBankingFormData((prev) => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    const handleCancelPersonal = () => {
        if (!userDetails) return;
        setPersonalFormData({
            id: userDetails.id,
            name: userDetails.name,
            email: userDetails.email,
            password: userDetails.password,
            mobile: userDetails.mobile,
        });
        setIsEditingPersonal(false);
    };

    const handleCancelBanking = () => {
        if (!userDetails) return;

        if (userDetails.bankDetail) {
            setBankingFormData({
                bankName: userDetails.bankDetail.bankName || '',
                accountNumber: userDetails.bankDetail.accountNumber || '',
                ifscCode: userDetails.bankDetail.ifscCode || '',
                upiId: userDetails.bankDetail.upiId || '',
                gPay: userDetails.bankDetail.gPay || '',
            });

            if (userDetails.bankDetail.qrCode) {
                setQrCodePreview(`${import.meta.env.VITE_BASE_URL}${userDetails.bankDetail.qrCode}`);
            } else {
                setQrCodePreview(null);
            }
        } else {
            setBankingFormData({
                bankName: '',
                accountNumber: '',
                ifscCode: '',
                upiId: '',
                gPay: '',
            });
            setQrCodePreview(null);
        }

        setQrCodeFile(null);
        setIsEditingBanking(false);
    };

    const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setQrCodeFile(null);
            setQrCodePreview(null);
            return;
        }

        if (!file.type.startsWith("image/")) {
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

    const handleBankDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bankName || !accountNumber || !ifscCode) {
            toast.error(<div className="text-red-500">Please fill all required fields</div>);
            return;
        }

        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append("bankName", bankName);
            formData.append("accountNumber", accountNumber);
            formData.append("ifscCode", ifscCode);
            formData.append("upiId", upiId);
            formData.append("gPay", gPay);
            if (qrCodeFile) {
                formData.append("qrCode", qrCodeFile);
            }

            const res = await api.post("/update-user-banking", formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.success) {
                await fetchUserDetails();
                toast.success(<div className="text-green-600">Bank details updated successfully!</div>);
                setIsBankModalOpen(false);
                setBankName("");
                setAccountNumber("");
                setIfscCode("");
                setUpiId("");
                setGPay("");
                setQrCodeFile(null);
                setQrCodePreview(null);
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(<div className="text-red-500">{error.response.data.error}</div>);
            } else {
                toast.error(<div className="text-red-500">{error.message}</div>);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-transparent border-r-primary/40 rounded-full animate-spin animation-reverse"></div>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground mb-2">
                            Loading Your Profile
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Please wait a moment...
                        </p>
                    </div>
                </div>

                <style>{`
                .animation-reverse {
                    animation-direction: reverse;
                    animation-duration: 1s;
                }
            `}</style>
            </div>
        );
    }

    if (!userDetails || !personalFormData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
                    <div>
                        <h3 className="text-base font-semibold text-foreground mb-2">
                            Unable to Load Profile
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Please refresh the page or try again later.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-8 mb-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl border border-purple-500/30 shadow-lg">
                            <User className="w-8 h-8 text-purple-600/80" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                                Profile Settings
                            </h1>
                            <p className="text-muted-foreground mt-2">Manage your account details and preferences</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-4">
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                            <p className="text-xs font-semibold text-purple-600/80 uppercase tracking-wider mb-1">Member since</p>
                            <p className="text-lg font-bold text-foreground flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                {new Date(userDetails.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {!bankingFormData && (
                        <AlertAndUpdateForBankDetails
                            isSubmitting={isSubmitting}
                            bankName={bankName}
                            accountNumber={accountNumber}
                            ifscCode={ifscCode}
                            upiId={upiId}
                            gPay={gPay}
                            qrCodePreview={qrCodePreview}
                            isBankModalOpen={isBankModalOpen}
                            setBankName={setBankName}
                            setAccountNumber={setAccountNumber}
                            setIfscCode={setIfscCode}
                            setUpiId={setUpiId}
                            setGPay={setGPay}
                            setQrCodeFile={setQrCodeFile}
                            setIsBankModalOpen={setIsBankModalOpen}
                            setQrCodePreview={setQrCodePreview}
                            handleQrCodeChange={handleQrCodeChange}
                            handleBankDetailsSubmit={handleBankDetailsSubmit}
                        />
                    )}
                </div>

                {isEditingPersonal && (
                    <div className="mb-8 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <p className="font-medium text-amber-700 dark:text-amber-300">You're editing personal details. Don't forget to save!</p>
                        </div>
                    </div>
                )}

                {isEditingBanking && (
                    <div className="mb-8 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="font-medium text-emerald-700/80">You're editing banking details. Don't forget to save!</p>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="personal" className="w-full">
                    <div className="overflow-x-auto">
                        {bankingFormData && (
                            <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 mb-8">
                                <TabsTrigger value="personal" className="rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-md gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="hidden sm:inline">Personal</span>
                                </TabsTrigger>
                                <TabsTrigger value="banking" className="rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-md gap-2">
                                    <Landmark className="w-4 h-4" />
                                    <span className="hidden sm:inline">Banking</span>
                                </TabsTrigger>
                            </TabsList>
                        )}
                    </div>

                    <TabsContent value="personal" className="m-0">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-500/10 rounded-lg">
                                            <User className="w-6 h-6 text-blue-600" />
                                        </div>
                                        Personal Information
                                    </h2>
                                    <p className="text-muted-foreground mt-2">Update your basic profile information</p>
                                </div>
                                {!isEditingPersonal && (
                                    <Button
                                        onClick={() => setIsEditingPersonal(true)}
                                        className="gap-2 h-11 px-6 rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileField
                                    icon={<CreditCard className="w-4 h-4" />}
                                    label="User ID"
                                    value={userDetails.id}
                                    isEditing={false}
                                    field="id"
                                    formData={personalFormData}
                                    handleInputChange={handlePersonalInputChange}
                                />
                                <ProfileField
                                    icon={<User className="w-4 h-4" />}
                                    label="Full Name"
                                    value={personalFormData.name}
                                    isEditing={isEditingPersonal}
                                    field="name"
                                    formData={personalFormData}
                                    handleInputChange={handlePersonalInputChange}
                                    placeholder="John Doe"
                                />
                                <ProfileField
                                    icon={<Mail className="w-4 h-4" />}
                                    label="Email Address"
                                    value={personalFormData.email}
                                    isEditing={isEditingPersonal}
                                    field="email"
                                    formData={personalFormData}
                                    handleInputChange={handlePersonalInputChange}
                                    type="email"
                                    placeholder="john@example.com"
                                />
                                <ProfileField
                                    icon={<Phone className="w-4 h-4" />}
                                    label="Mobile Number"
                                    value={personalFormData.mobile}
                                    isEditing={isEditingPersonal}
                                    field="mobile"
                                    formData={personalFormData}
                                    handleInputChange={handlePersonalInputChange}
                                    placeholder="+91 98765 43210"
                                />
                                <div className="md:col-span-2">
                                    <ProfileField
                                        icon={<Lock className="w-4 h-4" />}
                                        label="Password"
                                        value={personalFormData.password}
                                        isEditing={isEditingPersonal}
                                        field="password"
                                        formData={personalFormData}
                                        handleInputChange={handlePersonalInputChange}
                                        type="password"
                                        placeholder="Enter password"
                                        showPassword={showPassword}
                                        onPasswordToggle={() => setShowPassword(!showPassword)}
                                    />
                                </div>
                            </div>

                            {isEditingPersonal && (
                                <div className="flex gap-4 justify-end pt-4 border-t">
                                    <Button
                                        onClick={handleCancelPersonal}
                                        variant="outline"
                                        size="lg"
                                        className="gap-2 px-8 h-12 rounded-lg"
                                        disabled={isSavingPersonal}
                                    >
                                        <X className="w-5 h-5" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSavePersonal}
                                        size="lg"
                                        className="gap-2 px-8 h-12 rounded-lg"
                                        disabled={isSavingPersonal}
                                    >
                                        {isSavingPersonal ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Save Personal Details
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {bankingFormData && (
                        <TabsContent value="banking" className="m-0">
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                                                <Landmark className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            Banking Details
                                        </h2>
                                        <p className="text-muted-foreground mt-2">Secure your banking information</p>
                                    </div>
                                    {!isEditingBanking && (
                                        <Button
                                            onClick={() => setIsEditingBanking(true)}
                                            className="gap-2 h-11 px-6 rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Banking
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <ProfileField
                                        icon={<Landmark className="w-4 h-4" />}
                                        label="Bank Name"
                                        value={bankingFormData.bankName}
                                        isEditing={isEditingBanking}
                                        field="bankName"
                                        formData={bankingFormData}
                                        handleInputChange={handleBankingInputChange}
                                        placeholder="ICICI Bank"
                                    />
                                    <ProfileField
                                        icon={<CreditCard className="w-4 h-4" />}
                                        label="Account Number"
                                        value={bankingFormData.accountNumber}
                                        isEditing={isEditingBanking}
                                        field="accountNumber"
                                        formData={bankingFormData}
                                        handleInputChange={handleBankingInputChange}
                                        placeholder="1234567890"
                                    />
                                    <ProfileField
                                        icon={<CreditCard className="w-4 h-4" />}
                                        label="IFSC Code"
                                        value={bankingFormData.ifscCode}
                                        isEditing={isEditingBanking}
                                        field="ifscCode"
                                        formData={bankingFormData}
                                        handleInputChange={handleBankingInputChange}
                                        placeholder="ICIC0001234"
                                    />
                                    <ProfileField
                                        icon={<Smartphone className="w-4 h-4" />}
                                        label="UPI ID"
                                        value={bankingFormData.upiId}
                                        isEditing={isEditingBanking}
                                        field="upiId"
                                        formData={bankingFormData}
                                        handleInputChange={handleBankingInputChange}
                                        placeholder="yourname@upi"
                                    />
                                    <ProfileField
                                        icon={<Phone className="w-4 h-4" />}
                                        label="GPay/PhonePe Number"
                                        value={bankingFormData.gPay}
                                        isEditing={isEditingBanking}
                                        field="gPay"
                                        formData={bankingFormData}
                                        handleInputChange={handleBankingInputChange}
                                        placeholder="910****445"
                                    />

                                    <div className="group">
                                        <Label className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                                            <QrCodeIcon className="w-4 h-4" />
                                            Payment QR Code
                                        </Label>
                                        {isEditingBanking ? (
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleQrCodeChange}
                                                        className="h-12 cursor-pointer"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Upload your payment QR code image (Max 5MB)
                                                </p>
                                                {qrCodePreview && (
                                                    <div className="relative mt-3 rounded-lg border p-3 bg-muted/20">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-xs font-medium text-muted-foreground">Preview</p>
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
                                                        <img
                                                            src={qrCodePreview}
                                                            alt="QR Code Preview"
                                                            className="max-h-48 w-full rounded-md object-contain bg-background"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all hover:shadow-md group-hover:bg-muted/70">
                                                {qrCodePreview ? (
                                                    <img
                                                        src={qrCodePreview}
                                                        alt="Payment QR Code"
                                                        className="max-h-48 w-full rounded-md object-contain"
                                                    />
                                                ) : (
                                                    <p className="font-medium text-center py-4 text-sm text-muted-foreground">
                                                        No QR code uploaded
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditingBanking && (
                                    <div className="flex gap-4 justify-end pt-4 border-t">
                                        <Button
                                            onClick={handleCancelBanking}
                                            variant="outline"
                                            size="lg"
                                            className="gap-2 px-8 h-12 rounded-lg"
                                            disabled={isSavingBanking}
                                        >
                                            <X className="w-5 h-5" />
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveBanking} // ✅ FIXED HERE
                                            size="lg"
                                            className="gap-2 px-8 h-12 rounded-lg"
                                            disabled={isSavingBanking}
                                        >
                                            {isSavingBanking ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Save Banking Details
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
}

export default UserProfile;