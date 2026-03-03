import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, User, Lock, Mail, KeyRound, MoveRight, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SignUp() {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [firmType, setFirmType] = useState('');
  const [firmName, setFirmName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { requestOtp, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!username.trim()) {
      toast({ title: "Validation Error", description: "Please enter a username", variant: "destructive" });
      setIsLoading(false); return;
    }

    if (!email || !email.includes('@')) {
      toast({ title: "Validation Error", description: "Please enter a valid email address", variant: "destructive" });
      setIsLoading(false); return;
    }

    if (password.length < 4) {
      toast({ title: "Validation Error", description: "Password must be at least 4 characters", variant: "destructive" });
      setIsLoading(false); return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Validation Error", description: "Passwords do not match", variant: "destructive" });
      setIsLoading(false); return;
    }

    try {
      const success = await requestOtp(email);
      if (success) {
        setStep(2);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp.length !== 6) {
      toast({ title: "Validation Error", description: "OTP must be exactly 6 digits", variant: "destructive" });
      setIsLoading(false); return;
    }

    try {
      const success = await signUp(username, email, password, otp, firmType, firmName);

      if (success) {
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-primary-foreground">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mb-8">
            <Leaf className="w-12 h-12" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 text-center">
            Join CarbonTrack
          </h1>
          <p className="text-lg text-primary-foreground/80 text-center max-w-md">
            Create your account and start tracking your carbon footprint for a sustainable future
          </p>
        </div>
      </div>

      {/* Right Panel - SignUp Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Leaf className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">CarbonTrack</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {step === 1 ? 'Create Account' : 'Check Your Email'}
            </h2>
            <p className="text-muted-foreground">
              {step === 1 ? 'Join us in tracking and reducing carbon emissions' : `We sent a 6-digit OTP code to ${email}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Firm Type */}
              <div className="space-y-2">
                <Label htmlFor="firmType">Organization Type *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <select
                    id="firmType"
                    value={firmType}
                    onChange={(e) => setFirmType(e.target.value)}
                    required
                    className="w-full h-12 pl-10 pr-4 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="">Select your organization type</option>
                    <option value="household">🏠 Household</option>
                    <option value="school">🏫 School / College</option>
                    <option value="industry">🏭 Industry / Factory</option>
                    <option value="shop">🏪 Shop / Retail</option>
                    <option value="office">🏢 Office / Corporate</option>
                    <option value="ngo">🌿 NGO / Non-profit</option>
                    <option value="other">🔹 Other</option>
                  </select>
                </div>
              </div>

              {/* Firm Name */}
              <div className="space-y-2">
                <Label htmlFor="firmName">Organization Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="firmName"
                    type="text"
                    placeholder="e.g. St. Mary's School, Anjarakandi"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MoveRight className="mr-2 h-4 w-4" />}
                {isLoading ? 'Verifying...' : 'Continue to Verification'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code *</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-10 h-12 text-center tracking-widest font-bold text-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Verify & Create Account'}
                </Button>

                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  Back to Registration
                </Button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
