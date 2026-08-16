import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, KeyRound, AlertCircle, TrendingUp } from 'lucide-react';

export function AuthPage() {
  const { loginWithPassword, loginWithPin, registerUser } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'pin'>('password');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    let res;
    if (loginMethod === 'password') {
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }
      res = loginWithPassword(email, password);
    } else {
      if (pin.length !== 4 || isNaN(Number(pin))) {
        setErrorMsg('Please enter a valid 4-digit PIN.');
        return;
      }
      res = loginWithPin(email, pin);
    }

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to request login.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName || !regEmail || !regPassword || !regPin) {
      setErrorMsg('Please fill in all requested registration fields.');
      return;
    }

    if (regPin.length !== 4 || isNaN(Number(regPin))) {
      setErrorMsg('PIN must be exactly 4 numeric digits.');
      return;
    }

    const res = registerUser(regName, regEmail, regPassword, regPin);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to register account.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl relative z-10 min-h-[580px]">
        {/* Left Col: Brand introduction visual */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-emerald-950/80 to-zinc-900 border-r border-zinc-800 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp size={18} className="text-zinc-950" />
            </div>
            <span className="text-lg font-extrabold tracking-wider text-emerald-400 font-mono">STOCKIES</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Invest with <span className="text-emerald-400">confidence</span>, track with ease.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Consolidate your Indian mutual fund SIPs, transactions, and live stock markets portfolio in one high-performance dashboard.
            </p>
          </div>

          <div className="text-xs text-zinc-500">
            Powered by Stockies Advanced Multiperiod Engine
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-center p-8 sm:p-12">
          {/* Mobile logo display */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded bg-emerald-500 flex items-center justify-center">
              <TrendingUp size={16} className="text-zinc-950" />
            </div>
            <span className="text-sm font-extrabold tracking-wider text-emerald-400 font-mono">STOCKIES</span>
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-zinc-800 mb-6">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`pb-3 text-sm font-bold transition-all relative px-2 ${
                tab === 'login' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
              {tab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded" />
              )}
            </button>
            <button
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
              }}
              className={`pb-3 text-sm font-bold transition-all relative px-2 ml-6 ${
                tab === 'register' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Register
              {tab === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded" />
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 mb-5 rounded-2xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Login Method Sub-Tabs */}
              <div className="flex p-1 rounded-xl bg-zinc-950/80 border border-zinc-850">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    loginMethod === 'password' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('pin');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    loginMethod === 'pin' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  4-Digit PIN Login
                </button>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-zinc-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Password or PIN Field */}
              {loginMethod === 'password' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-zinc-500" size={16} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">4-Digit PIN</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 text-zinc-500" size={16} />
                    <input
                      type="text"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      inputMode="numeric"
                      required
                      placeholder="0000"
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || (/^\d+$/.test(val) && val.length <= 4)) {
                          setPin(val);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl text-sm text-zinc-100 outline-none transition-all tracking-[0.25em] font-bold placeholder:text-zinc-650"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">Enter the 4-digit numeric code configured on registration.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-zinc-500" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-zinc-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-zinc-500" size={16} />
                  <input
                    type="password"
                    required
                    placeholder="Create security password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* numeric PIN */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">4-Digit PIN passcode</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 text-zinc-500" size={16} />
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    inputMode="numeric"
                    required
                    placeholder="0000"
                    value={regPin}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (/^\d+$/.test(val) && val.length <= 4)) {
                        setRegPin(val);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950 focus:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl text-sm text-zinc-100 outline-none transition-all tracking-[0.25em] font-extrabold placeholder:text-zinc-650"
                  />
                </div>
                <span className="text-[9px] text-zinc-500 leading-none">For lightning-fast logins of your financial records.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
