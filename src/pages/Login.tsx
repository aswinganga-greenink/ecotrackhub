import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, User, Lock, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole } from '@/types/carbon';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!username.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 4) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 4 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const success = login(username, password, role);
    
    if (success) {
      toast({
        title: "Welcome!",
        description: `Logged in as ${role}`,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

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
            EcoTrack
          </h1>
          <p className="text-lg text-primary-foreground/80 text-center max-w-md">
            AI-Powered Carbon Footprint Tracker for Sustainable Communities
          </p>
          
          <div className="mt-16 grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-3xl font-display font-bold">50+</p>
              <p className="text-sm text-primary-foreground/70">Panchayats</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold">10K+</p>
              <p className="text-sm text-primary-foreground/70">Trees Planted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Leaf className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">EcoTrack</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your carbon dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className="w-full h-12 px-4 flex items-center justify-between bg-background border border-input rounded-lg text-foreground hover:bg-secondary transition-colors"
                >
                  <span className="capitalize">{role}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isRoleOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10 animate-scale-in">
                    <button
                      type="button"
                      onClick={() => { setRole('user'); setIsRoleOpen(false); }}
                      className={`w-full px-4 py-3 text-left hover:bg-secondary transition-colors ${role === 'user' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRole('admin'); setIsRoleOpen(false); }}
                      className={`w-full px-4 py-3 text-left hover:bg-secondary transition-colors ${role === 'admin' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      Admin
                    </button>
                  </div>
                )}
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
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Government of India Initiative for Sustainable Development
          </p>
        </div>
      </div>
    </div>
  );
}
