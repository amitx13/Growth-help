import { useState, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Badge,
} from '@repo/ui'
import {
  Upload, CheckCircle2, Banknote, Smartphone, Building2, Hash, Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { autopoolApi, type PaymentModalData } from '../../lib/autopoolApi'

interface Props {
  open: boolean
  data: PaymentModalData | null
  onClose: () => void
  onSuccess: () => void
}

export const PaymentSubmitModal = ({ open, data, onClose, onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.error(<div className="text-red-500">Please upload an image file</div>)
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error(<div className="text-red-500">File size must be under 5MB</div>)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setSubmitting(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!file || !data) {
      toast.error(<div className="text-red-500">Please upload a payment screenshot</div>)
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('screenshot', file)
      formData.append('senderAccountId', data.senderAccountId)
      formData.append('receiverAccountId', data.receiverAccountId)
      formData.append('amount', String(data.amount))
      formData.append('level', String(data.level))
      formData.append('paymentType', data.paymentType)

      await autopoolApi.submitPayment(formData)
      toast.success(
        <div className="text-green-600">Payment proof submitted! Waiting for receiver approval.</div>
      )
      onSuccess()
      handleClose()
    } catch (error: any) {
      toast.error(
        <div className="text-red-500">{error.response?.data?.error || error.message}</div>
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!data) return null

  const bank = data.receiverBankDetails

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-violet-600" />
            Submit Payment
          </DialogTitle>
          <DialogDescription>
            Pay ₹{data.amount.toLocaleString()} to {data.receiverName} and upload your screenshot below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Amount Badge */}
          <div className="flex items-center justify-between p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Amount to Pay</p>
              <p className="text-3xl font-bold text-violet-700">₹{data.amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-violet-500/20 text-violet-700 border-0 mb-1">
                {data.paymentType}
              </Badge>
              <p className="text-xs text-muted-foreground">Level {data.level}</p>
            </div>
          </div>

          {/* Receiver Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Pay To — {data.receiverName}
            </h4>

            <div className="divide-y rounded-xl border overflow-hidden">
              {/* Phone number — always shown if available, helps with manual onboarding */}
              {data.receiverMobile && (
                <BankRow
                  icon={<Phone className="w-4 h-4 text-teal-500" />}
                  label="Phone"
                  value={data.receiverMobile}
                />
              )}
              {bank?.bankName && (
                <BankRow icon={<Building2 className="w-4 h-4 text-blue-500" />} label="Bank" value={bank.bankName} />
              )}
              {bank?.accountNumber && (
                <BankRow icon={<Hash className="w-4 h-4 text-violet-500" />} label="Account No." value={bank.accountNumber} />
              )}
              {bank?.ifscCode && (
                <BankRow icon={<Hash className="w-4 h-4 text-purple-500" />} label="IFSC" value={bank.ifscCode} />
              )}
              {bank?.upiId && (
                <BankRow icon={<Smartphone className="w-4 h-4 text-green-500" />} label="UPI ID" value={bank.upiId} />
              )}
              {bank?.gPay && (
                <BankRow icon={<Smartphone className="w-4 h-4 text-emerald-500" />} label="GPay" value={bank.gPay} />
              )}
              {!bank && !data.receiverMobile && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Contact the receiver for payment details.
                </div>
              )}
            </div>

            {/* QR Code */}
            {bank?.qrCodeUrl && (
              <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-xl border">
                <p className="text-xs font-medium text-muted-foreground">Scan QR Code</p>
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${bank.qrCodeUrl}`}
                  alt="Payment QR"
                  className="w-40 h-40 rounded-lg object-cover border"
                />
              </div>
            )}
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground" />
              Upload Payment Screenshot
            </h4>

            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                ${preview
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-border hover:border-violet-500/40 hover:bg-violet-500/5'
                }`}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg border object-contain"
                  />
                  <div className="flex items-center justify-center gap-1.5 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <p className="text-sm font-medium">{file?.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Click to upload screenshot</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            {!submitting && <CheckCircle2 className="w-4 h-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const BankRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-mono font-semibold text-foreground">{value}</span>
  </div>
)