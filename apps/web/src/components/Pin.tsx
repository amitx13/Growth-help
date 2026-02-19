
import { useCallback, useEffect, useState } from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Label,
    Badge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Skeleton,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Separator,
} from '@repo/ui';
import {
    AlertCircle, CheckCircle, Clock, FileUp, Image as ImageIcon, Maximize2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, Package, Copy, Check, ArrowBigRight, PinIcon, Shield, UserCircle, Send, X, Users, TrendingUp,
    AlertTriangle,
} from 'lucide-react';
import type { Pin, UserSchemaForPin, TransferRequest, PinRequest } from '@repo/types';
import { useAuthStore } from '../stores/useAuthStore';
import { toast } from "sonner"
import api from '../lib/axios';

// My pin - done
function MyPinsTab({ pins, fetchUserPins }: { pins: Pin[] | null, fetchUserPins: () => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [spinning, setSpinning] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleClick = () => {
        setSpinning(true);
        setTimeout(() => setSpinning(false), 1500);

        fetchUserPins();
    };

    const copyToClipboard = async (pinCode: string, pinId: string) => {
        try {
            await navigator.clipboard.writeText(pinCode);
        } catch (err) {
            const textField = document.createElement("textarea");
            textField.value = pinCode;
            textField.style.position = "fixed";
            textField.style.top = "0";
            textField.style.left = "0";
            textField.style.opacity = "0";

            document.body.appendChild(textField);
            textField.focus();
            textField.select();

            document.execCommand("copy");

            document.body.removeChild(textField);
        }
        setCopiedId(pinId);
        toast.success(
            <div className="text-green-600">
                Pin copied: {pinCode}
            </div>
        );
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!pins) {
        return <Skeleton className="h-screen w-full rounded-xl" />;
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(pins.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPins = pins.slice(startIndex, startIndex + itemsPerPage);

    const activePins = pins.filter((p) => p.status).length;
    const usedPins = pins.filter((p) => !p.status).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">Your Pins</h3>
                    <Button variant="outline" size="sm" onClick={handleClick} >
                        <RefreshCw
                            className="text-primary"
                            style={{
                                animation: spinning ? "spin 0.5s linear 2" : "none",
                            }}
                        />
                    </Button>

                    <style>
                        {`
                            @keyframes spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
                    <div>Total: <span className="font-semibold">{pins.length}</span></div>
                    <div>Active: <span className="font-semibold text-green-600">{activePins}</span></div>
                    <div>Used: <span className="font-semibold text-red-600">{usedPins}</span></div>
                </div>
            </div>

            <Card>
                {pins.length !== 0 ? (
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs sm:text-sm">Pin Code</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Current Owner</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Used By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPins.map((pin) => (
                                        <TableRow key={pin.id}>
                                            <TableCell className="font-mono text-xs sm:text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span>{pin.pinCode}</span>
                                                    {pin.status && <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(pin.pinCode, pin.id)}
                                                        className="h-8 w-8 p-0 hover:bg-primary/10"
                                                    >
                                                        {copiedId === pin.id ? (
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                        )}
                                                    </Button>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {pin.status ? (
                                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                                        <AlertCircle className="w-3 h-3 mr-1" /> Used
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">{pin.currentOwner}</TableCell>
                                            <TableCell className="text-xs sm:text-sm">{pin.usedBy || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            {/* Icon Badge */}
                            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl border border-orange-500/20 mb-6 shadow-sm">
                                <Package className="w-12 h-12 text-orange-600" />
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold mb-2">No Pins Available</h3>
                            <p className="text-muted-foreground max-w-md mb-8 text-sm">
                                You haven't received any activation pins yet. Request from your sponsor or purchase new ones from admin to activate accounts.
                            </p>

                            {/* CTA Button (optional) */}
                            <Button variant="default" size="lg" className="gap-2">
                                Request New Pins
                                <ArrowBigRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

// Request Pins Tab - done
function RequestPinsTab() {
    const { user } = useAuthStore();
    const [requestType, setRequestType] = useState<'admin' | 'user' | null>(null);
    const [requestUserId, setRequestUserId] = useState('');
    const [selectedUserDetails, setSelectedUserDetails] = useState<UserSchemaForPin | null>(null);
    const [pinCount, setPinCount] = useState<number>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const totalAmount = pinCount * 50;

    // ✅ Auto-fetch admin details when admin is selected
    const handleFetchAdminDetails = async () => {
        setLoading(true);
        try {
            const userDetails = await api.get(`/getAdminDetails`);
            setSelectedUserDetails(userDetails.data.user);
            toast.success(
                <div className="text-green-600">stockist details loaded</div>
            );
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(
                    <div className="text-red-500">{error.response.data.error}</div>
                );
            } else {
                toast.error(<div className="text-red-500">{error.message}</div>);
            }
            setSelectedUserDetails(null);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle request type change
    const handleRequestTypeChange = (value: 'admin' | 'user') => {
        setRequestType(value);
        setSelectedUserDetails(null);
        setRequestUserId('');
        setPinCount(1);
        setSelectedFile(null);
        setPreviewUrl(null);

        // Auto-fetch admin if admin selected
        if (value === 'admin') {
            handleFetchAdminDetails();
        }
    };

    const handleFetchUserDetails = async () => {
        if (!requestUserId.trim()) {
            toast.info(
                <div className="text-yellow-500">Please enter user ID</div>
            );
            return;
        }

        setLoading(true);
        try {
            const userDetails = await api.get(`/users/${requestUserId}`);
            setSelectedUserDetails(userDetails.data.user);
            toast.success(
                <div className="text-green-600">User details loaded</div>
            );
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(
                    <div className="text-red-500">{error.response.data.error}</div>
                );
            } else {
                toast.error(<div className="text-red-500">{error.message}</div>);
            }
            setSelectedUserDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
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

        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success(<div className="text-green-600">{`Copied! ${text}`}</div>);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            setPreviewUrl(null);
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

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const getImageUrl = (screenshotUrl: string) => {
        return `${import.meta.env.VITE_BASE_URL}${screenshotUrl}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserDetails || !user?.id) {
            toast.error(
                <div className="text-red-500">User Details not Found</div>
            );
            return;
        }
        if (!selectedFile) {
            toast.info(
                <div className="text-yellow-500">
                    Please select image before submitting
                </div>
            );
            return;
        }
        try {
            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("fromUserId", user?.id);
            formData.append("toUserId", selectedUserDetails.id);
            formData.append("count", pinCount.toString());

            const res = await api.post('/create-pin-request', formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.success) {
                toast.success(
                    <div className="text-primary">{res.data.message}</div>
                );
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(
                    <div className="text-red-500">{error.response.data.error}</div>
                );
            } else {
                toast.error(<div className="text-red-500">{error.message}</div>);
            }
        } finally {
            setRequestUserId('');
            setSelectedUserDetails(null);
            setPinCount(1);
            setSelectedFile(null);
            setPreviewUrl(null);
            setRequestType(null);
        }
    };

    console.log("selectedUserDetails.bankDetail", selectedUserDetails?.bankDetail)

    return (
        <>
            <div className="space-y-6">
                {/* Request Type Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-primary" />
                            Select Request Type
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            Choose whether to request pins from stockist or another user
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={requestType || ''}
                            onValueChange={handleRequestTypeChange}
                            disabled={!!selectedUserDetails}
                        >
                            <SelectTrigger className="w-full h-12">
                                <SelectValue placeholder="Select who to request pins from" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2 py-1">
                                        <div className="p-1.5 bg-purple-500/10 rounded">
                                            <Shield className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Request from stockist</p>
                                            <p className="text-xs text-muted-foreground">
                                                Official pin purchase
                                            </p>
                                        </div>
                                    </div>
                                </SelectItem>
                                <SelectItem value="user">
                                    <div className="flex items-center gap-2 py-1">
                                        <div className="p-1.5 bg-blue-500/10 rounded">
                                            <Users className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Request from User</p>
                                            <p className="text-xs text-muted-foreground">
                                                Request from another member
                                            </p>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Show user search ONLY if user type is selected */}
                {requestType === 'user' && !selectedUserDetails && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Find User</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="userId">User ID</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        id="userId"
                                        type="text"
                                        placeholder="Enter user ID (e.g., GH0001)"
                                        value={requestUserId}
                                        onChange={(e) => setRequestUserId(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleFetchUserDetails}
                                        disabled={loading || !requestUserId.trim()}
                                        className="whitespace-nowrap"
                                    >
                                        {loading ? 'Loading...' : 'Fetch'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Show selected user details */}
                {selectedUserDetails && (
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {requestType === 'admin' ? (
                                        <Badge className="bg-purple-500 text-white">
                                            <Shield className="w-3 h-3 mr-1" />
                                            stockist
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-blue-500 text-white">
                                            <Users className="w-3 h-3 mr-1" />
                                            User
                                        </Badge>
                                    )}
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        Selected Recipient
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedUserDetails(null);
                                        setRequestUserId('');
                                        setPinCount(1);
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                        setRequestType(null);
                                    }}
                                    className="gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Change
                                </Button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-medium text-muted-foreground">User ID:</span>
                                    <span className="font-mono font-semibold">
                                        {selectedUserDetails.id}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-medium text-muted-foreground">User Name:</span>
                                    <span className="font-semibold">{selectedUserDetails.name}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-medium text-muted-foreground">Mobile:</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono">{selectedUserDetails.mobile}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() =>
                                                handleCopy(selectedUserDetails.mobile, "mobile")
                                            }
                                        >
                                            {copiedField === "mobile" ? (
                                                <Check className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="my-3" />

                                {/* Bank Details Section */}
                                {selectedUserDetails.bankDetail ? (
                                    <>
                                        {selectedUserDetails.bankDetail.bankName && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium text-muted-foreground">
                                                    Bank Name:
                                                </span>
                                                <span className="font-mono text-sm">
                                                    {selectedUserDetails.bankDetail.bankName}
                                                </span>
                                            </div>
                                        )}
                                        {selectedUserDetails.bankDetail.accountNumber && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium text-muted-foreground">
                                                    Account No:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-sm">
                                                        {selectedUserDetails.bankDetail.accountNumber}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() =>
                                                            handleCopy(
                                                                selectedUserDetails.bankDetail!
                                                                    .accountNumber!,
                                                                "account"
                                                            )
                                                        }
                                                    >
                                                        {copiedField === "account" ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {selectedUserDetails.bankDetail.ifscCode && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium text-muted-foreground">
                                                    IFSC Code:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-sm">
                                                        {selectedUserDetails.bankDetail.ifscCode}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() =>
                                                            handleCopy(
                                                                selectedUserDetails.bankDetail!.ifscCode!,
                                                                "ifsc"
                                                            )
                                                        }
                                                    >
                                                        {copiedField === "ifsc" ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {selectedUserDetails.bankDetail.gPay && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium text-muted-foreground">
                                                    GPay/PhonePe Number:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-sm">
                                                        {selectedUserDetails.bankDetail.gPay}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() =>
                                                            handleCopy(
                                                                selectedUserDetails.bankDetail!.gPay!,
                                                                "gpay"
                                                            )
                                                        }
                                                    >
                                                        {copiedField === "gpay" ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {selectedUserDetails.bankDetail.upiId && (
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="font-medium text-muted-foreground">
                                                    UPI ID:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-sm break-all">
                                                        {selectedUserDetails.bankDetail.upiId}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                        onClick={() =>
                                                            handleCopy(
                                                                selectedUserDetails.bankDetail!.upiId!,
                                                                "upi"
                                                            )
                                                        }
                                                    >
                                                        {copiedField === "upi" ? (
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* QR Code */}
                                        {selectedUserDetails.bankDetail.qrCode && (
                                            <div className="rounded-lg border bg-muted/30 p-3 mt-3">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                        <ImageIcon className="h-3.5 w-3.5" />
                                                        Pay using QR Code:
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 gap-1 px-2 text-xs"
                                                        onClick={() =>
                                                            setPreviewImage(
                                                                getImageUrl(
                                                                    selectedUserDetails.bankDetail!.qrCode!
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <Maximize2 className="h-3 w-3" />
                                                        Expand
                                                    </Button>
                                                </div>
                                                <div
                                                    className="relative cursor-pointer overflow-hidden rounded-md border bg-background"
                                                    onClick={() =>
                                                        setPreviewImage(
                                                            getImageUrl(
                                                                selectedUserDetails.bankDetail!.qrCode!
                                                            )
                                                        )
                                                    }
                                                >
                                                    <img
                                                        src={getImageUrl(
                                                            selectedUserDetails.bankDetail.qrCode
                                                        )}
                                                        alt="Payment QR Code"
                                                        className="h-48 w-full object-contain hover:opacity-90 transition-opacity"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20 p-3 mt-2">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                                                    Bank Details Unavailable
                                                </p>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                                    This user hasn't updated their bank details yet.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {selectedUserDetails?.bankDetail && (
                    <Card>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="pinCount">Number of Pins</Label>
                                    <Input
                                        id="pinCount"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={pinCount}
                                        onChange={(e) => setPinCount(parseInt(e.target.value))}
                                        className="h-12 text-lg"
                                    />
                                    <div className="mt-3 bg-gradient-to-r from-primary/10 to-primary/5 p-5 rounded-xl border border-primary/20">
                                        <div className="text-sm text-muted-foreground mb-1">
                                            Amount to Pay
                                        </div>
                                        <div className="text-3xl font-bold text-primary">
                                            ₹{totalAmount.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            @ ₹50 per pin
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label>Payment Proof</Label>
                                    <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            id="screenshot"
                                            className="hidden"
                                        />
                                        <label htmlFor="screenshot" className="cursor-pointer block">
                                            <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="font-semibold">
                                                Click to upload payment screenshot
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG up to 5MB
                                            </p>
                                            {selectedFile && (
                                                <div className="mt-3 p-2 bg-green-500/10 rounded-lg inline-block">
                                                    <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        {selectedFile.name}
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    {previewUrl && (
                                        <div className="mt-3 rounded-lg border p-2 bg-muted/20">
                                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                Preview
                                            </p>
                                            <img
                                                src={previewUrl}
                                                alt="Payment screenshot preview"
                                                className="max-h-64 w-full rounded-md object-contain"
                                            />
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base"
                                    size="lg"
                                    disabled={!selectedFile || loading}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Pin Request
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* QR Code Preview Modal */}
            <Dialog
                open={!!previewImage}
                onOpenChange={(open) => !open && setPreviewImage(null)}
            >
                <DialogContent className="max-w-4xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle>Payment QR Code</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 pb-6 max-h-[80vh] overflow-auto">
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="Payment QR Code full view"
                                className="w-full rounded-lg border object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Transfer Pins Tab - done
function TransferPinsTab({ totalPins, onTransfer }: { totalPins: number, onTransfer: () => void }) {
    const { user } = useAuthStore()
    const [recipientUserId, setRecipientUserId] = useState('');
    const [transferCount, setTransferCount] = useState(1);
    const [userName, setUserName] = useState<string>('')

    useEffect(() => {
        if (recipientUserId.length === 0) return
        if (recipientUserId.length !== 7) {
            setUserName('No user found');
            return;
        }

        let cancelled = false;

        const fetchUserName = async (id: string) => {
            try {
                const res = await api.get(`/fetchUserName/${id}`);
                if (!cancelled) {
                    setUserName(res.data.name);
                }
            } catch (error: any) {
                if (!cancelled) {
                    setUserName('');
                    // optional: toast only once or silently fail
                }
            }
        };

        fetchUserName(recipientUserId);

        return () => {
            cancelled = true;
        };
    }, [recipientUserId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipientUserId.trim()) {
            toast.info(
                <div className='text-yellow-600'>
                    Please enter recipient user ID
                </div>
            )
            return;
        }
        if (!user?.id) {
            return
        }
        try {
            const res = await api.post('/transfer-pin', {
                owner: user.id,
                receiver: recipientUserId,
                count: transferCount
            })
            onTransfer()

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
            setRecipientUserId('');
            setTransferCount(1);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="recipientUserId">Recipient User ID</Label>
                            <Input
                                id="recipientUserId"
                                type="text"
                                placeholder="Enter recipient user ID"
                                value={recipientUserId}
                                onChange={(e) => setRecipientUserId(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Sending pins to
                                <span className='text-primary pl-1'>
                                    {userName}
                                </span>
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="transferCount">Number of Pins to Transfer</Label>
                            <Input
                                id="transferCount"
                                type="number"
                                min="1"
                                max="10"
                                value={transferCount}
                                onChange={(e) => {
                                    if (parseInt(e.target.value, 10) > totalPins) {
                                        toast.info(
                                            <div className='text-yellow-500'>
                                                Value can't be greater than available pins
                                            </div>
                                        )
                                        return
                                    }
                                    setTransferCount(parseInt(e.target.value))
                                }}
                                required
                            />
                            <p className="text-sm text-muted-foreground mt-2">Available:
                                <span className='text-primary pl-1 pr-1'>
                                    {totalPins ? totalPins : 0}
                                </span>
                                pins</p>
                        </div>

                        <Button type="submit" className="w-full">
                            Transfer pins
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// Incoming Requests Tab -done
function IncomingRequestsTab({ fetchUserPins }: { fetchUserPins: () => void }) {
    const { user } = useAuthStore()
    const [requests, setRequests] = useState<TransferRequest[] | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selected, setSelected] = useState<TransferRequest | null>(null);
    const [actionType, setActionType] = useState<"APPROVED" | "REJECTED" | null>(null);

    const fetchUserRequestForPins = useCallback(async () => {
        if (!user?.id) return

        try {
            const res = await api.get(`/getUserAllPendingPinRequest/${user.id}`)
            setRequests(res.data.user)

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
    }, [user?.id])

    useEffect(() => {
        fetchUserRequestForPins()
    }, [fetchUserRequestForPins])

    const openConfirm = (request: TransferRequest, action: "APPROVED" | "REJECTED") => {
        setSelected(request);
        setActionType(action);
    };

    const handleConfirm = async () => {
        if (!selected || !actionType) return;
        try {

            const res = await api.post('/confirm-pin-request', {
                pinRequestId: selected.id,
                action: actionType
            })

            fetchUserPins()
            fetchUserRequestForPins()
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
            setSelected(null);
            setActionType(null);
        }

    };

    const getImageUrl = (screenshotUrl: string) => {
        return `${import.meta.env.VITE_BASE_URL}${screenshotUrl}`;
    };

    if (!requests || requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-muted-foreground">No incoming pin requests</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {requests.map((request) => (
                    <Card key={request.id} className="border rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-semibold">
                                    {'Pin Transfer Request'}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <Badge variant="outline">
                                        {request.count} Pins
                                    </Badge>
                                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                        <Clock className="w-3 h-3 mr-1" /> {request.status}
                                    </Badge>
                                </div>
                            </div>
                            {request && (
                                <div className="text-right text-sm font-semibold text-green-600">
                                    ₹{request.count * 50}
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="space-y-3 pt-0 pb-3">
                            <div className="flex items-start gap-2 text-xs sm:text-sm">
                                <div className="flex-1 space-y-0.5 font-medium">
                                    <p className="font-medium text-foreground">
                                        From: {request.fromUser.name}
                                    </p>
                                    <p className="text-xs text-primary">
                                        User ID: {request.fromUser.id}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Screenshot Preview */}
                            {request.screenshotUrl && (
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            Payment Proof
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 gap-1 px-2 text-xs"
                                            onClick={() => setPreviewImage(request.screenshotUrl!)}
                                        >
                                            <Maximize2 className="h-3 w-3" />
                                            Expand
                                        </Button>
                                    </div>
                                    <div
                                        className="relative cursor-pointer overflow-hidden rounded-md border bg-background"
                                        onClick={() => setPreviewImage(request.screenshotUrl!)}
                                    >
                                        <img
                                            src={getImageUrl(request.screenshotUrl)}
                                            alt="Payment screenshot"
                                            className="h-48 w-full object-contain hover:opacity-90 transition-opacity"
                                        />
                                    </div>
                                </div>
                            )}

                            {!request.screenshotUrl && (
                                <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-3">
                                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                        ⚠️ No payment proof uploaded yet
                                    </p>
                                </div>
                            )}

                            {request.status === 'PENDING' && (
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        className="flex-1 gap-1"
                                        variant="default"
                                        onClick={() => openConfirm(request, "APPROVED")}
                                        disabled={!request.screenshotUrl}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 gap-1"
                                        variant="outline"
                                        onClick={() => openConfirm(request, "REJECTED")}
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Image Preview Modal */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle>Payment Screenshot</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 pb-6 max-h-[80vh] overflow-auto">
                        {previewImage && (
                            <img
                                src={getImageUrl(previewImage)}
                                alt="Payment screenshot full view"
                                className="rounded-lg border object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Modal */}
            <Dialog open={!!selected} onOpenChange={(open) => !open && (setSelected(null), setActionType(null))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "APPROVED"
                                ? "Approve this transfer?"
                                : "Reject this transfer?"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground text-center">
                            {selected
                                ? (actionType === "APPROVED" ? `Transfer ${selected.count} pins to ${selected.fromUser.name}` : `Reject ${selected.count} pins request from ${selected.fromUser.name}`)
                                : ""}
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => { setSelected(null); setActionType(null); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant={actionType === "APPROVED" ? "default" : "destructive"}
                        >
                            {actionType === "APPROVED" ? "Approve" : "Reject"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}


const TransferHistory = () => {
    const { user } = useAuthStore()
    const [totalRequest, setTotalRequests] = useState<PinRequest | null>(null)

    const fetchUserPins = useCallback(async () => {
        if (!user?.id) return
        try {
            const res = await api.get(`/getUserPinsReq/${user.id}`)
            setTotalRequests(res.data.request)
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
    }, [user?.id])

    useEffect(() => {
        fetchUserPins()
    }, [fetchUserPins])

    if (!totalRequest) {
        return (
            <div className="py-12 text-center">
                <div className="p-4 bg-red-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-muted-foreground">No pins sent or received yet</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sent Pins */}
            <Card className="border-0 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-red-600" />
                        Sent Pins
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Pins sent from this account
                    </p>
                </CardHeader>
                <CardContent>
                    {totalRequest.pinSent.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="p-4 bg-red-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-red-600" />
                            </div>
                            <p className="text-muted-foreground">No pins sent yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs">UserId</TableHead>
                                        <TableHead className="text-xs">User Name</TableHead>
                                        <TableHead className="text-xs">Pins Sent</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {totalRequest.pinSent.map((p, idx) => (
                                        <TableRow key={idx} className="border-b hover:bg-muted/30">
                                            <TableCell className="font-bold">
                                                {p.userId}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-nowrap">
                                                {p.userName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs text-nowrap`}
                                                >
                                                    {p.numOfPinsSent}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`text-xs ${p.status === 'APPROVED'
                                                        ? 'bg-green-500'
                                                        : p.status === 'PENDING'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                        } text-white`}
                                                >
                                                    {p.status}
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

            {/* Received Payments */}
            <Card className="border-0 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-green-600 rotate-180" />
                        Received Pins
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Pins received by this account
                    </p>
                </CardHeader>
                <CardContent>
                    {totalRequest.pinReceived.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="p-4 bg-green-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-green-600 rotate-180" />
                            </div>
                            <p className="text-muted-foreground">No pins received yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs">UserId</TableHead>
                                        <TableHead className="text-xs">User Name</TableHead>
                                        <TableHead className="text-xs">Pins Received</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {totalRequest.pinReceived.map((p, idx) => (
                                        <TableRow key={idx} className="border-b hover:bg-muted/30">
                                            <TableCell className="font-bold">
                                                {p.userId}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-nowrap">
                                                {p.userName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs text-nowrap`}
                                                >
                                                    {p.numOfPinsReceived}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`text-xs ${p.status === 'APPROVED'
                                                        ? 'bg-green-500'
                                                        : p.status === 'PENDING'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                        } text-white`}
                                                >
                                                    {p.status}
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
        </div>
    );
}

// Main Component
export function PinManagement() {
    const { user } = useAuthStore()
    const [totalPins, setTotalPins] = useState<number | null>(null)
    const [pins, setPins] = useState<Pin[] | null>(null)

    const fetchUserPins = useCallback(async () => {
        if (!user?.id) return
        try {
            const res = await api.get(`/getUserPins/${user.id}`)
            setPins(res.data.pins)

            const len = res.data.pins.flat().filter((p: Pin) => {
                return p.status
            }).length
            setTotalPins(len)
        } catch (error: any) {
            console.log(error)
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
    }, [user?.id])

    useEffect(() => {
        fetchUserPins()
    }, [fetchUserPins])

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 mb-8">
                    <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 shadow-md p-4">
                        <PinIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500 ">
                            Pin Management
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm">Manage your pins, request new ones, and handle transfers</p>
                    </div>
                </div>

                <Tabs defaultValue="pins" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-t-lg border-b h-auto">
                        <TabsTrigger value="pins" className="text-xs sm:text-sm text-foreground">My Pins</TabsTrigger>
                        <TabsTrigger value="request" className="text-xs sm:text-sm text-foreground"> Sent Requests</TabsTrigger>
                        {totalPins ? <TabsTrigger disabled={totalPins <= 0 ? true : false} value="transfer" className="text-xs sm:text-sm text-foreground">Transfer Pins</TabsTrigger> : <TabsTrigger disabled={true} value="transfer" className="text-xs sm:text-sm">Transfer Pins</TabsTrigger>}
                        <TabsTrigger value="incoming" className="text-xs sm:text-sm text-foreground">Pin Requests</TabsTrigger>
                        <TabsTrigger value="history" className="text-xs sm:text-sm text-foreground">Transfer history</TabsTrigger>
                    </TabsList>

                    <div className="bg-card rounded-b-lg shadow-md p-4 sm:p-6">
                        <TabsContent value="pins" className="m-0">
                            <MyPinsTab pins={pins} fetchUserPins={fetchUserPins} />
                        </TabsContent>

                        <TabsContent value="request" className="m-0">
                            <RequestPinsTab />
                        </TabsContent>

                        <TabsContent value="transfer" className="m-0">
                            {totalPins ? <TransferPinsTab totalPins={totalPins} onTransfer={() => fetchUserPins()} /> : (
                                <div className='text-sm text-muted-foreground'>
                                    No pins availabel for transfer
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="incoming" className="m-0">
                            <IncomingRequestsTab fetchUserPins={fetchUserPins} />
                        </TabsContent>
                        <TabsContent value="history" className="m-0">
                            <TransferHistory />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}