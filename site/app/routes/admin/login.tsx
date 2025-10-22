import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '~/lib/auth';
import { Container } from '~/components/ui/container';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Login - WGU Extension" },
    { name: "robots", content: "noindex, nofollow" }
  ];
}

export default function AdminLogin() {
  const { login, user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Redirect if already logged in as admin
  React.useEffect(() => {
    if (user && isAdmin && !loading) {
      navigate('/admin');
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    try {
      await login(formData.email, formData.password);
      // The useEffect above will handle navigation after successful login
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      
      // Show toast notification in development
      if (import.meta.env.DEV) {
        toast.error('Login Failed', {
          description: errorMessage,
          action: {
            label: 'Retry',
            onClick: () => {
              setError('');
              const emailInput = document.getElementById('email') as HTMLInputElement;
              emailInput?.focus();
            }
          }
        });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Container size="sm">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Admin Login</h1>
              <p className="text-muted-foreground mt-2">
                Access the WGU Extension admin panel
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loginLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loginLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loginLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-md bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginLoading || !formData.email || !formData.password}
              >
                {loginLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                disabled={loginLoading}
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}