import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await apiClient.forgotPassword(email);
      if (error) throw error;
      setSent(true);
      toast({ title: 'Check your email', description: 'If your email exists, we sent a reset link.' });
    } catch (err) {
      setSent(true);
      toast({ title: 'Request received', description: 'If your email exists, we sent a reset link.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          {sent ? (
            <>
              <CardHeader className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>We’ve sent a password reset link if the email exists in our system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground space-y-2">
                  <p>Didn’t get it?</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a couple of minutes and try again</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" className="w-1/2">
                    <Link to="/login"><ArrowLeft className="w-4 h-4 mr-2" />Back to Login</Link>
                  </Button>
                  <Button onClick={() => setSent(false)} className="w-1/2" variant="default">Resend</Button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Forgot Password</CardTitle>
                <CardDescription>Enter your email to receive a password reset link.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="you@example.com" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full btn-hero" disabled={loading}>
                    {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>) : 'Send Reset Link'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;


