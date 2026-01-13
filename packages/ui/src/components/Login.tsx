import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { Eye, EyeOff, Sparkles } from "lucide-react";

interface Login1Props {
  loading: boolean;
  onLogin: (user: { userId: string; password: string }) => void;
  onNavigateToSignup?: () => void;
  heading?: string;
  buttonText?: string;
  googleText?: string;
  signupText?: string;
}

interface LoginUser {
  userId: string;
  password: string;
}

export const Login = ({
  loading,
  onLogin,
  onNavigateToSignup,
  heading = "Welcome back!",
  buttonText = "Login",
  signupText = "Need an account?",
}: Login1Props) => {
  const [user, setUser] = useState<LoginUser>({ userId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(user);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Text Elements */}
        <div className="absolute top-20 -left-32 text-[12rem] font-black text-primary/5 rotate-12 select-none">
          GROWTH
        </div>
        <div className="absolute bottom-20 -right-40 text-[10rem] font-black text-primary/5 -rotate-12 select-none">
          HELP
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-primary/3 -rotate-6 select-none">
          GH
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-10 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Floating Shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-primary/20 rounded-3xl rotate-45 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-2 border-emerald-500/20 rounded-full animate-float-delayed"></div>
        <div className="absolute top-3/4 left-1/3 w-40 h-40 border-2 border-blue-500/20 rounded-2xl -rotate-12 animate-float-slow"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12 relative z-10">
        {/* Login Container */}
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          {/* Logo/Brand */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl border border-primary/30 shadow-lg backdrop-blur-sm">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600">
                Growth Help
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Your success partner</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl px-8 py-10 shadow-2xl">
            {heading && (
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-card-foreground mb-2">
                  {heading}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your credentials to continue
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="userId" className="text-sm font-medium text-foreground">
                  User ID
                </label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="Enter your user ID"
                  className="h-12 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input focus:border-primary transition-all"
                  required
                  value={user.userId}
                  onChange={(e) => setUser({ ...user, userId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={user.password}
                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                    className="h-12 bg-secondary/50 text-foreground placeholder:text-muted-foreground border-input focus:border-primary transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={loading}
              >
                {loading ? <Spinner /> : buttonText}
              </Button>
            </form>

            {/* Divider */}
            {onNavigateToSignup &&
              (
                <div>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm">
                    <p className="text-muted-foreground">{signupText}</p>
                    <button
                      onClick={onNavigateToSignup}
                      className="font-semibold text-primary hover:underline transition-all"
                    >
                      Sign up now →
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(45deg); }
          50% { transform: translateY(-20px) rotate(45deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-15px) rotate(-12deg); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </section>
  );
};
