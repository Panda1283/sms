import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/db';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, ShieldAlert, GraduationCap, ArrowRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface AuthScreensProps {
  // Callback when authenticated
}

type AuthMode = 'login' | 'register' | 'forgot-password';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@school.com', label: 'Administrator' },
  { role: 'Teacher', email: 'robert.carter@school.com', label: 'Faculty Lead' },
  { role: 'Student', email: 'alex.p@school.com', label: 'Student Portal' },
  { role: 'Parent', email: 'arthur.p@school.com', label: 'Parent Portal' },
];

export default function AuthScreens() {
  const { login, register, error: authError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form input states
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  // Interaction states
  const [submitting, setSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    setSuccessInfo(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (!fullname || !email || !password) {
          throw new Error('All registration fields are required.');
        }
        await register(fullname, email, password, role);
      } else if (mode === 'forgot-password') {
        if (!email) throw new Error('Email is required');
        
        // Call simulated endpoint
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to submit reset request.');
        
        setSuccessInfo(data.message || 'Check your email for recovery information.');
        setEmail('');
      }
    } catch (err: any) {
      setCustomError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setCustomError(null);
    setSuccessInfo(null);
    setEmail(demoEmail);
    setPassword('password123');
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Visual background details */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-950/40 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-block bg-indigo-600 text-white p-3 rounded-2xl font-black text-xl tracking-wider shadow-lg shadow-indigo-600/20 mb-4">
            SMS
          </div>
          <h1 className="font-extrabold text-2xl text-white tracking-tight leading-tight">Academia System</h1>
          <p className="text-slate-400 text-xs font-mono mt-1 uppercase tracking-wider">Institution Controller Portal</p>
        </div>

        {/* Global Error Notice */}
        {(customError || authError) && (
          <div className="mb-5 bg-rose-950/30 border border-rose-900/50 text-rose-200 px-4 py-3 rounded-xl flex gap-2.5 items-start text-xs leading-relaxed animate-fade-in">
            <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authentication Refused:</span> {customError || authError}
            </div>
          </div>
        )}

        {/* Success Notice */}
        {successInfo && (
          <div className="mb-5 bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 px-4 py-3 rounded-xl flex gap-2.5 items-start text-xs leading-relaxed animate-fade-in">
            <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Request Acknowledged:</span> {successInfo}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {/* REGISTER: Name input */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Your Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-200 text-xs focus:border-slate-700 focus:outline-none focus:bg-slate-900 transition-colors"
                    placeholder="Enter full name..."
                  />
                </div>
              </motion.div>
            )}

            {/* EMAIL INPUT FOR ALL */}
            <motion.div key="email-field">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Email Identity</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-200 text-xs focus:border-slate-700 focus:outline-none focus:bg-slate-900 transition-colors"
                  placeholder="name@school.com"
                />
              </div>
            </motion.div>

            {/* LOGIN & REGISTER: Password input */}
            {mode !== 'forgot-password' && (
              <motion.div
                key="password-field"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Password Key</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-semibold"
                    >
                      Forgot Key?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-200 text-xs focus:border-slate-700 focus:outline-none focus:bg-slate-900 transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </motion.div>
            )}

            {/* REGISTER: Role Selector */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Assigned System Role</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.STUDENT)}
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                      role === UserRole.STUDENT
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'border-slate-800 text-slate-400 bg-slate-900/30 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.PARENT)}
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                      role === UserRole.PARENT
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'border-slate-800 text-slate-400 bg-slate-900/30 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.TEACHER)}
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                      role === UserRole.TEACHER
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'border-slate-800 text-slate-400 bg-slate-900/30 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.ADMIN)}
                    className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                      role === UserRole.ADMIN
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'border-slate-800 text-slate-400 bg-slate-900/30 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            id="auth-submit-btn"
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 mt-2"
          >
            {submitting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Portal' : mode === 'register' ? 'Register Account' : 'Verify Recovery Email'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Auth Mode Toggle Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('register')} className="text-slate-300 hover:text-white hover:underline font-bold transition-colors">
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button onClick={() => setMode('login')} className="text-slate-300 hover:text-white hover:underline font-bold transition-colors">
                Sign In
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DEMO ACCOUNTS QUICK-FILL DRAWER */}
      {/* ========================================================= */}
      <div className="w-full max-w-md mt-6 bg-slate-950/20 border border-slate-800/60 rounded-2xl p-5 text-center relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-3">
          ⚡ DEMO PORTALS QUICK ACCESSIBILITY
        </h3>
        <p className="text-[11px] text-slate-500 mb-3.5 leading-relaxed">
          Click any card below to automatically log in and experience the respective dashboard role's full suite of features:
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {DEMO_ACCOUNTS.map((demo) => (
            <button
              key={demo.role}
              onClick={() => handleDemoFill(demo.email)}
              className="p-3 bg-slate-900/30 border border-slate-800/80 rounded-xl hover:border-slate-700 text-left transition-all hover:bg-slate-900/65 group"
            >
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-none">
                {demo.role} Portal
              </h4>
              <p className="text-[10px] text-slate-400 truncate mt-1 leading-none">{demo.email}</p>
              <p className="text-[9px] text-slate-500 font-mono mt-1 leading-none uppercase tracking-wider">{demo.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
