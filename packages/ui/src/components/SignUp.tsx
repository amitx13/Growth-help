import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  UserPlus,
  KeyRound,
  Sparkles,
  Check,
  CheckCircle2,
  XCircle
} from "lucide-react"
import type { InputUserForm } from "@repo/types"
import { TermsModal } from "./TermsModal"

interface SignupFormProps {
  subHeadingtext?: string;
  submitButtonText?: string;
  sponsorName: {
    name: string,
    status: boolean
  }
  onNavigateToLogin?: () => void;
  handleSignUp: (data: InputUserForm) => void;
  sponsorPositionId: string | null
  handleFetchSponsorName: (userId: string) => void
}

export const SignupForm = ({

  submitButtonText = "Sign Up",
  subHeadingtext = "Please sign up to continue!",
  sponsorName,
  onNavigateToLogin,
  handleSignUp,
  sponsorPositionId,
  handleFetchSponsorName

}: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [openTerms, setOpenTerms] = useState(false);
  const [formData, setFormData] = useState<InputUserForm>({
    name: "",
    email: "",
    password: "",
    mobile: "",
    sponsorPositionId: sponsorPositionId || "",
    activationPin: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "sponsorPositionId") {
      if (value.length >= 10 || value.length === 0) {
        handleFetchSponsorName(value)
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    handleSignUp(formData)
  }

  const isFormValid = formData.name &&
    formData.email &&
    formData.password &&
    formData.mobile &&
    formData.sponsorPositionId &&
    formData.activationPin

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-xl relative z-10">
        <Card className="border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl">
          <div className="p-8">
            {/* Header with Logo */}
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl border border-primary/30 shadow-lg backdrop-blur-sm">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600">
                  Growth Help
                </h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <User className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-bold text-foreground">Hello There!</h4>
                </div>
                <p className="text-sm text-muted-foreground">{subHeadingtext}</p>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="text-center mb-8 pb-6 border-b border-border/50" />

            {/* Form Content */}
            <div className="space-y-5 mb-8">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="h-11 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-11 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="h-11 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  placeholder="Enter your mobile number"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="h-11 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsorPositionId" className="text-foreground flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                  Referral Code
                </Label>
                <Input
                  id="sponsorPositionId"
                  name="sponsorPositionId"
                  placeholder="Enter referral code"
                  value={formData.sponsorPositionId}
                  onChange={handleInputChange}
                  className="h-11 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input"
                  required
                />
                {sponsorName.name && (
                  <div className="flex items-center gap-2">
                    {sponsorName.status ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-950/30 border border-green-300 dark:border-green-800 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          Referred by: <span className="font-semibold">{sponsorName.name}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-md">
                        <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-400 truncate">
                          {sponsorName.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="activationPin" className="text-foreground flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  Activation Pin
                </Label>
                <Input
                  id="activationPin"
                  name="activationPin"
                  placeholder="Enter activation pin"
                  value={formData.activationPin}
                  onChange={handleInputChange}
                  className="h-11 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg text-base font-semibold"
            >
              <Check className="w-5 h-5" />
              {submitButtonText}
            </Button>

            {/* Footer Links */}
            {onNavigateToLogin && <div className="pt-6 border-t border-border/50 mt-6 space-y-2">
              <div className="text-muted-foreground flex justify-center gap-1 text-sm">
                <span>Already have an account?</span>
                <button
                  onClick={onNavigateToLogin}
                  className="text-primary font-semibold hover:underline"
                >
                  Login here
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setOpenTerms(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms & Conditions
                </button>
              </div>
            </div>}

            {onNavigateToLogin && <TermsModal open={openTerms} onClose={() => setOpenTerms(false)} />}
          </div>
        </Card>
      </div>

      <style>{`
    .delay-500 {
      animation-delay: 0.5s;
    }
    .delay-1000 {
      animation-delay: 1s;
    }
  `}</style>
    </main>
  )
}
