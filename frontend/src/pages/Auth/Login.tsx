import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LockKeyhole } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isConfigMissing = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your_');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {isConfigMissing && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-medium">
            ⚠️ <strong>Configuration Missing:</strong> Please update <code>frontend/.env.local</code> with your Supabase keys and restart the server.
          </div>
        )}
        <Card className="p-8 space-y-8 rounded-[28px] border-0 shadow-2xl shadow-brand-100/20">
          <div className="text-center space-y-2">
            <img src="/healthgen-logo.png" alt="HealthGen logo" className="w-16 h-16 rounded-3xl object-cover mx-auto shadow-lg" />
            <h1 className="text-3xl font-black text-slate-900 pt-2">HealthGen</h1>
            <p className="text-brand-700 font-semibold text-sm">Sign in to continue</p>
            <p className="text-slate-500 text-sm">Use your email and password to continue.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-3 text-sm text-slate-600">
            <LockKeyhole className="w-5 h-5 mt-0.5 text-brand-600" />
            <p>OTP verification has been removed for a faster demo flow.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <Button type="submit" className="w-full py-3" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Need an account? <button onClick={() => navigate('/signup')} className="text-brand-600 font-bold hover:underline">Create one</button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
