import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, ArrowLeft, UserPlus } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      await supabase.auth.signInWithPassword({ email, password });
      setMessage('Account created successfully. Opening your dashboard...');
      setTimeout(() => {
        navigate('/');
      }, 500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-8 rounded-[28px] border-0 shadow-2xl shadow-brand-100/20">
        <div className="text-center space-y-2">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center text-xs text-slate-400 hover:text-brand-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Back to Login
          </button>
          <img src="/healthgen-logo.png" alt="HealthGen logo" className="w-16 h-16 rounded-3xl object-cover mx-auto shadow-lg" />
          <h1 className="text-3xl font-black text-slate-900 pt-2">Create HealthGen Account</h1>
          <p className="text-slate-500 text-sm">Create your account with email and password.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-3 text-sm text-slate-600">
          <UserPlus className="w-5 h-5 mt-0.5 text-brand-600" />
          <p>OTP verification has been removed. Onboarding will still ask for all user details step by step.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input 
            label="Password" 
            type="password" 
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input 
            label="Confirm Password" 
            type="password" 
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {message && <p className="text-xs text-emerald-600 text-center">{message}</p>}
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <Button type="submit" className="w-full py-3" isLoading={loading}>
            Create Account
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
