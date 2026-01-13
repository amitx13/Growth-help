import type { Position, User } from "@repo/types";
import {
  User as UserIcon,
  Mail,
  Phone,
  Hash,
  UserCheck,
  Users,
  Copy,
  Check,
  ChevronDown,
  Link as LinkIcon,
  ExternalLink,
  CopyIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui";
import { PayForActivation } from "./PayForLevel";
import { toast } from "sonner";
import api from "../lib/axios";
import { useAuthStore } from "../stores/useAuthStore";
import { ActivationPending } from "./ActivationPending";
import { AlertAndUpdateForBankDetails } from "./AlertBankDetails";
import { useNavigate } from "react-router-dom";

export const UserDetails = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [copiedReferralIndex, setCopiedReferralIndex] = useState<number | null>(null);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<number[]>([0]);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Bank form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [gPay, setGPay] = useState("");
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const handleCopyReferralCode = async (positionId: string, index: number) => {
    try {
      await navigator.clipboard.writeText(positionId);
    } catch (err) {
      const textField = document.createElement("textarea");
      textField.value = positionId;
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

    setCopiedReferralIndex(index);
    toast.success(
      <div className="text-green-600">
        Referral code copied: {positionId}
      </div>
    );
    setTimeout(() => setCopiedReferralIndex(null), 2000);
  };

  const handleCopyReferralLink = async (positionId: string, index: number) => {
    const referralLink = `${window.location.origin}/signup?ref=${positionId}`;

    try {
      await navigator.clipboard.writeText(referralLink);
    } catch (err) {
      const textField = document.createElement("textarea");
      textField.value = referralLink;
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

    setCopiedLinkIndex(index);
    toast.success(
      <div className="text-green-600">Referral link copied!</div>
    );
    setTimeout(() => setCopiedLinkIndex(null), 2000);
  };

  const togglePosition = (index: number) => {
    setExpandedPositions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
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
        await fetchUser();
        toast.success(<div className="text-green-600">Bank details updated successfully!</div>);
        setIsBankModalOpen(false);
        // Reset form
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProof = async (
    file: File,
    positionId: string,
    sponsorId: string,
    amount: string
  ) => {
    if (!user) {
      return toast.error(<div className="text-red-500">User Not Found</div>);
    }
    const formData = new FormData();
    formData.append("image", file);
    formData.append("senderPositionId", positionId);
    formData.append("receiverPositionId", sponsorId);
    formData.append("upgradeToLevel", "1");
    formData.append("paymentToLevel", "1");
    formData.append("amount", amount);
    formData.append("paymentType", "ACTIVATION");
    try {
      const res = await api.post("/payments/upload-payment", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success) {
        await fetchUser();
        return toast.success(
          <div className="text-green-500">Payment Proof Submitted Successfully</div>
        );
      }
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
  };

  if (!user) {
    return (
      <div className="w-full">
        <Card className="border rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg md:text-xl">
                No User Found. Please logout...
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const positions = user.positions || [];
  const hasPositions = positions.length > 0;

  return (
    <div className="w-full space-y-4">
      {/* Main User Card */}
      <Card className="border rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/50 border-b py-6 px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl md:text-2xl font-bold text-foreground truncate">
                {user.name}
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <UserCheck className="h-3 w-3" />
                  {positions.length} Account{positions.length !== 1 ? "s" : ""}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-6 px-6 space-y-4">
          {/* Bank Details Warning */}
          {!user.isBankDetials && (
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

          <div className="flex items-start sm:items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <Hash className="h-5 w-5 flex-shrink-0 text-violet-500 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-violet-500">User ID</p>
              <p className="text-sm font-mono text-foreground break-all">{user.id}</p>
            </div>
          </div>

          <div className="flex items-start sm:items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-500">Email</p>
              <p className="text-sm text-foreground break-all">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start sm:items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="h-5 w-5 flex-shrink-0 text-primary mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">Mobile</p>
              <p className="text-sm text-foreground">{user.mobile}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasPositions ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground px-1">
            Your Accounts ({positions.length})
          </h3>
          {positions.map((position: Position, index) => (
            <Card
              key={index}
              className="border rounded-xl shadow-sm overflow-hidden"
            >
              <Collapsible
                onOpenChange={() => togglePosition(index)}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className={`bg-gradient-to-r ${position.isActive ? "from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15" : "from-destructive/5 to-destructive/10 hover:from-destructive/10 hover:to-destructive/15"} border-b py-4 px-6 transition-colors`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${position.isActive ? "bg-primary/10" : "bg-destructive/20"} flex items-center justify-center`}>
                          <Hash className={`h-5 w-5 ${position.isActive ? "text-green-600" : "text-red-500"}`} />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-base font-semibold">
                            Account #{index + 1}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${position.isActive
                                ? "bg-primary/10 text-green-600"
                                : "bg-destructive/20 text-red-500"
                                }`}
                            >
                              {position.isActive ? "Active" : "Inactive"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 ml-2">
                              {position.positionType}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${expandedPositions.includes(index) ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent className="CollapsibleContent">
                  <CardContent className="py-3 px-3 space-y-4">
                    {position.isActive ? (
                      <>
                        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-primary/20 rounded-lg">
                              <LinkIcon className="h-4 w-4 text-primary" />
                            </div>
                            <p className="text-sm font-semibold text-primary">
                              Referral Link
                            </p>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <p className="text-xs font-mono text-muted-foreground truncate">
                                {`${window.location.origin}/signup?ref=${position.positionId}`}
                              </p>
                            </div>

                            {/* Buttons Row */}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyReferralLink(position.positionId, index);
                                }}
                                className={`gap-2 transition-all bg-green-500 hover:bg-green-600 text-white`}
                                size="lg"
                              >
                                {copiedLinkIndex === index ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                  </>
                                ) : (
                                  <>
                                    <CopyIcon className="h-4 w-4" />
                                  </>
                                )}
                              </Button>

                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `${window.location.origin}/add_new_user?ref=${position.positionId}`,
                                  );
                                }}
                                variant="outline"
                                className="flex-1 gap-2"
                                size="lg"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="hidden sm:inline">Add New User</span>
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border-2 border-violet-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-violet-500/20 rounded-lg">
                              <Hash className="h-4 w-4 text-violet-600" />
                            </div>
                            <p className="text-sm font-semibold text-violet-700">
                              Your Referral Code
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 p-3 bg-background rounded-lg border border-border">
                              <p className="text-lg font-mono font-bold text-foreground text-center sm:text-left">
                                {position.positionId}
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyReferralCode(position.positionId, index);
                              }}
                              className={`flex-shrink-0 gap-2 transition-all bg-violet-600 hover:bg-violet-700 text-white`}
                            >
                              {copiedReferralIndex === index ? (
                                <>
                                  <Check className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Active Position Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Current Level
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                Level {position.currentLevel}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Direct Referrals
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                {position.directReferralCount}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Sponsor Details for Active Position */}
                        {position.sponsorId && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-primary" />
                              Sponsor Details
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">Name:</span>
                                <span className="text-sm font-semibold text-foreground">
                                  {position.sponsorName}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">ID:</span>
                                <span className="text-sm font-mono text-foreground">
                                  {position.sponsorId}
                                </span>
                              </div>

                              {position.sponsorMobile && (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">Mobile:</span>
                                  <a
                                    href={`tel:+91${position.sponsorMobile}`}
                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                    +91-{position.sponsorMobile}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {position.activationPayment === "PENDING" ? (
                          <ActivationPending position={position} />
                        ) : (
                          <PayForActivation
                            position={position}
                            activationAmount="500"
                            onSubmitProof={handleSubmitProof}
                          />
                        )}
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border rounded-xl shadow-sm">
          <CardContent className="py-8 px-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No positions found. Contact support if this seems incorrect.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};