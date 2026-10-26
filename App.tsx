import React, { useState, useEffect, useRef } from 'react';
import { 
  AppScreen, Transaction, ChatMessage, SavingsGoal, User, 
  EmailNotification, BankAccount, FeedItem 
} from './types';
import { 
  CURRENT_USER, MOCK_TRANSACTIONS, CONTACTS, MOCK_FEED, 
  MOCK_SAVINGS, INITIAL_NOTIFICATIONS, MOCK_BANKS 
} from './constants';
import { Button, Input, BottomNav, TransactionItem, Header, Card, FeedItemCard } from './components/Components';
import { analyzeSpending } from './services/geminiService';
import { 
  Send, QrCode, CreditCard, ArrowRight, Wallet, Sparkles, Plus, PiggyBank, 
  Landmark, UserPlus, Search, Smartphone, AtSign, Download, Info, CheckCircle2, 
  Users, Heart, Share2, Copy, Check, X, ExternalLink, MessageCircle,
  Fingerprint, ScanFace, ShieldCheck, Lock, Unlock, KeyRound, AlertCircle, 
  RefreshCw, Bell, Mail, Eye, EyeOff, LogOut, Settings, Award, 
  CheckCircle, ArrowDownLeft, ArrowUpRight, HelpCircle, FileText, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Sound Synthesizer Utility (Web Audio API) ---
const playSound = (type: 'cash' | 'pop' | 'success' | 'lock') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'cash') {
      // Crisp 2-tone cash register chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
      osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.36);
      osc2.stop(ctx.currentTime + 0.36);
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.46);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'lock') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(240, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
};

// --- Confetti Effect Component ---
const ConfettiBurst: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  const colors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 45 }).map((_, i) => {
        const left = `${Math.random() * 100}%`;
        const animDelay = `${Math.random() * 0.4}s`;
        const animDuration = `${1 + Math.random() * 1.2}s`;
        const size = `${6 + Math.random() * 8}px`;
        const bg = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div
            key={i}
            className="absolute rounded-full animate-bounce"
            style={{
              left,
              top: '-10px',
              width: size,
              height: size,
              backgroundColor: bg,
              animationDuration: animDuration,
              animationDelay: animDelay,
              transform: `translateY(${window.innerHeight * 0.75}px) rotate(${Math.random() * 360}deg)`,
              transition: 'transform 1.4s ease-out, opacity 1.4s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};

// --- Toast Alert Component ---
const ToastBanner: React.FC<{ message: string | null; onClose: () => void; type?: 'success' | 'info' }> = ({ message, onClose, type = 'success' }) => {
  if (!message) return null;
  return (
    <div className="fixed top-4 inset-x-4 z-50 flex justify-center animate-in fade-in slide-in-from-top-3 duration-200">
      <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-semibold max-w-sm w-full ${
        type === 'success' 
          ? 'bg-neutral-900 text-white border-neutral-700' 
          : 'bg-white text-gray-900 border-gray-200'
      }`}>
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Check size={14} />
        </div>
        <span className="flex-1 leading-tight">{message}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// --- Auth Screen with Email, Password & Instant Demo ---
// --- Auth Screen with Email, Password & 5-Digit Security PIN ---
const AuthScreen: React.FC<{ 
  onRegister: (user: User) => void;
  onLogin: (user: User) => void;
  registeredUsers: User[];
  onTriggerEmailToast: (msg: string) => void;
}> = ({ onRegister, onLogin, registeredUsers, onTriggerEmailToast }) => {
  const [authStep, setAuthStep] = useState<'credentials' | 'pin'>('credentials');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  // 5-digit PIN state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const isRegisterValid = name.length > 2 && email.includes('@') && password.length >= 6 && phone.length >= 10;
  const isLoginValid = email.length > 3 && password.length >= 4;

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!isRegisterValid) {
        setError('Please complete all required fields.');
        return;
      }

      const finalHandle = handle.startsWith('@') ? handle : `@${handle || name.toLowerCase().replace(/\s/g, '')}`;
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password,
        handle: finalHandle,
        phone,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000000&color=fff`,
        isVerified: true,
        joinedDate: 'Oct 2026',
        balance: 1000.00,
        pin: '12345'
      };

      setPendingUser(newUser);
      setPin('');
      setPinError('');
      setPinSuccess(false);
      playSound('pop');
      setAuthStep('pin');
    } else {
      // Find matching user or fallback to demo
      const found = registeredUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (found) {
        setPendingUser(found);
        setPin('');
        setPinError('');
        setPinSuccess(false);
        playSound('pop');
        setAuthStep('pin');
      } else if (email.toLowerCase().includes('thabo') || email.includes('@')) {
        const fallbackUser: User = {
          ...CURRENT_USER,
          email: email || CURRENT_USER.email,
          pin: CURRENT_USER.pin || '12345'
        };
        setPendingUser(fallbackUser);
        setPin('');
        setPinError('');
        setPinSuccess(false);
        playSound('pop');
        setAuthStep('pin');
      } else {
        setError('No account found with this email. Try demo login below.');
      }
    }
  };

  const handleDemoSignIn = (user: User) => {
    setPendingUser(user);
    setPin('');
    setPinError('');
    setPinSuccess(false);
    playSound('pop');
    setAuthStep('pin');
  };

  const handleKeyTap = (digit: string) => {
    if (pin.length < 5 && !pinSuccess) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setPinError('');
      playSound('pop');

      if (nextPin.length === 5) {
        verifyFiveDigitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (!pinSuccess) {
      setPin(prev => prev.slice(0, -1));
      setPinError('');
    }
  };

  const verifyFiveDigitPin = (enteredPin: string) => {
    if (!pendingUser) return;

    if (isSignUp) {
      // Registration: Sets this 5-digit PIN
      setPinSuccess(true);
      playSound('success');
      setTimeout(() => {
        onTriggerEmailToast(`📧 Welcome email & verification link sent to ${pendingUser.email}!`);
        onRegister({
          ...pendingUser,
          pin: enteredPin
        });
      }, 500);
    } else {
      // Login: Verify against user's 5-digit PIN (default '12345')
      const expectedPin = pendingUser.pin || '12345';
      if (enteredPin === expectedPin || enteredPin === '12345') {
        setPinSuccess(true);
        playSound('success');
        setTimeout(() => {
          onTriggerEmailToast(`📬 Authenticated as ${pendingUser.name}`);
          onLogin(pendingUser);
        }, 500);
      } else {
        playSound('lock');
        setPinError('Incorrect 5-digit PIN. (Demo PIN: 12345)');
        setTimeout(() => {
          setPin('');
        }, 500);
      }
    }
  };

  // --- 5-Digit PIN Step ---
  if (authStep === 'pin' && pendingUser) {
    return (
      <div className="min-h-screen bg-white p-6 sm:p-8 flex flex-col justify-between max-w-md mx-auto animate-in fade-in duration-200">
        <div className="mt-4 text-center">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => { setAuthStep('credentials'); setPin(''); }}
              className="p-2 -ml-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              ← Back
            </button>
            <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200">
              5-Digit Security PIN
            </span>
          </div>

          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-black/10 shadow-xs mx-auto mb-3">
            <img src={pendingUser.avatar} alt={pendingUser.name} className="w-full h-full object-cover" />
          </div>

          <h2 className="text-2xl font-black text-gray-950 tracking-tight">
            {isSignUp ? 'Set 5-Digit PIN' : 'Enter 5-Digit PIN'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-[280px] mx-auto">
            {isSignUp 
              ? `Choose 5 numbers to secure your new wallet, ${pendingUser.name.split(' ')[0]}.` 
              : `Welcome back ${pendingUser.name.split(' ')[0]}! Enter your 5 numbers to login.`}
          </p>

          {/* 5 PIN Dots */}
          <div className="flex justify-center items-center gap-4 my-7">
            {[0, 1, 2, 3, 4].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    pinSuccess
                      ? 'bg-emerald-500 scale-125 shadow-sm shadow-emerald-500/30'
                      : pinError
                      ? 'bg-red-400 scale-95 border-2 border-red-500'
                      : isFilled
                      ? 'bg-black scale-110'
                      : 'border-2 border-gray-300 bg-gray-50'
                  }`}
                />
              );
            })}
          </div>

          {/* PIN Error or Status */}
          <div className="min-h-[24px]">
            {pinError && (
              <p className="text-xs text-red-500 font-semibold animate-pulse">{pinError}</p>
            )}
            {pinSuccess && (
              <p className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                <Check size={14} /> 5-Digit PIN Verified! Logging in...
              </p>
            )}
            {!pinError && !pinSuccess && (
              <p className="text-[11px] text-gray-400">
                {isSignUp ? 'Enter 5 numbers of your choice' : 'Demo PIN: 12345'}
              </p>
            )}
          </div>

          {/* Numeric Keypad (3 columns) */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mt-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, i) => {
              if (key === '') return <div key={i}></div>;
              if (key === 'back') {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={handleBackspace}
                    disabled={pinSuccess}
                    className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 flex items-center justify-center text-gray-600 font-semibold transition-all text-sm"
                  >
                    ⌫
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleKeyTap(key)}
                  disabled={pinSuccess}
                  className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-200 active:scale-95 flex items-center justify-center text-xl font-extrabold text-gray-900 transition-all shadow-2xs"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        {/* Helper Links */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-center space-y-2">
          {!isSignUp && (
            <button
              type="button"
              onClick={() => {
                setPin('12345');
                verifyFiveDigitPin('12345');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline block mx-auto"
            >
              Quick Auto-Fill Demo PIN (12345)
            </button>
          )}

          <button
            type="button"
            onClick={() => { setAuthStep('credentials'); setPin(''); }}
            className="text-xs font-semibold text-gray-400 hover:text-black block mx-auto"
          >
            Switch Account / Sign in with different email
          </button>
        </div>
      </div>
    );
  }

  // --- Credentials Step ---
  return (
    <div className="min-h-screen bg-white p-6 sm:p-8 flex flex-col justify-between max-w-md mx-auto">
      <div className="mt-6">
        {/* Logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-extrabold text-2xl tracking-tighter">Z</span>
          </div>
          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">
            🇿🇦 South Africa
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 mb-1">
          {isSignUp ? 'Create your ZarPay Account' : 'Welcome back to ZarPay'}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {isSignUp 
            ? 'Sign up with email and set your 5-digit PIN to start sending cash.' 
            : 'Enter your credentials and 5-digit security PIN to access your wallet.'}
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isSignUp ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isSignUp ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
            }`}
          >
            Register New Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-gray-800 ml-1 mb-1 block">Full Legal Name</label>
              <input
                type="text"
                required
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400"
                placeholder="e.g. Sipho Sithole"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-800 ml-1 mb-1 block">Email Address</label>
            <div className="flex items-center bg-gray-50 rounded-xl px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-black">
              <Mail size={16} className="text-gray-400 mr-2.5" />
              <input
                type="email"
                required
                className="bg-transparent border-none w-full py-3.5 text-sm focus:outline-none placeholder-gray-400"
                placeholder="you@domain.co.za"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 ml-1 mb-1 block">Password</label>
            <div className="flex items-center bg-gray-50 rounded-xl px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-black">
              <KeyRound size={16} className="text-gray-400 mr-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="bg-transparent border-none w-full py-3.5 text-sm focus:outline-none placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-black p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-800 ml-1 mb-1 block">Cashtag / Handle</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-black">
                  <AtSign size={16} className="text-gray-400 mr-2.5" />
                  <input
                    type="text"
                    className="bg-transparent border-none w-full py-3.5 text-sm focus:outline-none placeholder-gray-400"
                    placeholder="sipho_sa"
                    value={handle}
                    onChange={e => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 ml-1 mb-1 block">Mobile Number (SMS verification)</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-black">
                  <Smartphone size={16} className="text-gray-400 mr-2.5" />
                  <input
                    type="tel"
                    required
                    className="bg-transparent border-none w-full py-3.5 text-sm focus:outline-none placeholder-gray-400"
                    placeholder="072 123 4567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <Button 
            type="submit" 
            size="lg" 
            fullWidth 
            className="mt-3 py-3.5"
            disabled={isSignUp ? !isRegisterValid : !isLoginValid}
          >
            {isSignUp ? 'Continue to Set 5-Digit PIN →' : 'Continue to Enter PIN →'}
          </Button>
        </form>
      </div>

      {/* Showcase Demo Accounts Picker */}
      <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-400">
          Demo Accounts (PIN: 12345)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSignIn(CURRENT_USER)}
            className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl text-left transition-all active:scale-98 flex items-center gap-2.5"
          >
            <img src={CURRENT_USER.avatar} alt="Thabo" className="w-8 h-8 rounded-full object-cover shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold text-gray-900 truncate">Thabo Mbeki</p>
              <p className="text-[10px] text-gray-500 font-mono truncate">PIN: 12345</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSignIn(CONTACTS[0])}
            className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl text-left transition-all active:scale-98 flex items-center gap-2.5"
          >
            <img src={CONTACTS[0].avatar} alt="Nomsa" className="w-8 h-8 rounded-full object-cover shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold text-gray-900 truncate">Nomsa Dlamini</p>
              <p className="text-[10px] text-gray-500 font-mono truncate">PIN: 12345</p>
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400">
          Protected by 5-Digit PIN & SARB Sandbox Security.
        </p>
      </div>
    </div>
  );
};

// --- Email Notifications Drawer Modal ---
const NotificationDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  notifications: EmailNotification[];
  onMarkAllRead: () => void;
  onSelectNotification: (item: EmailNotification) => void;
}> = ({ isOpen, onClose, notifications, onMarkAllRead, onSelectNotification }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base">Email Notifications</h3>
              <p className="text-xs text-gray-400">Official POP receipts & security alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onMarkAllRead}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Mark Read
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-black rounded-full">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto py-3 space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No new email notifications.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onSelectNotification(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notif.read 
                    ? 'bg-gray-50/70 border-gray-100 hover:bg-gray-100' 
                    : 'bg-indigo-50/40 border-indigo-100 shadow-2xs hover:bg-indigo-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-900 line-clamp-1">{notif.subject}</span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{notif.preview}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-mono text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                    To: {notif.to}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Email Detail Reader Modal ---
const EmailDetailModal: React.FC<{
  notification: EmailNotification | null;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  if (!notification) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              ZarPay Automated Dispatch
            </span>
            <h3 className="font-bold text-base text-gray-950 mt-1">{notification.subject}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sent to {notification.to} • {notification.timestamp}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
          {notification.body}
        </div>

        <div className="pt-2 text-center">
          <Button variant="secondary" fullWidth onClick={onClose} size="sm">
            Close Message
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Transaction Receipt / Proof of Payment Modal ---
const TransactionReceiptModal: React.FC<{
  transaction: Transaction | null;
  onClose: () => void;
  onAskAI: (tx: Transaction) => void;
  onShareReceipt: (tx: Transaction) => void;
}> = ({ transaction, onClose, onAskAI, onShareReceipt }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
              Z
            </div>
            <div>
              <h3 className="font-bold text-sm">Official Proof of Payment</h3>
              <p className="text-[10px] text-gray-400">Ref: {transaction.reference || 'ZP-9948201'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="text-center py-2 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Settled via Instant EFT
          </span>
          <h2 className="text-3xl font-extrabold text-gray-950 mt-2 tracking-tight">
            {transaction.type === 'sent' ? '-' : '+'}R {transaction.amount.toFixed(2)}
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">{transaction.note}</p>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-400">Recipient / Sender</span>
            <span className="font-bold text-gray-900">{transaction.counterparty.name} ({transaction.counterparty.handle})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-400">Category</span>
            <span className="font-semibold text-gray-700">{transaction.category}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-400">Date & Time</span>
            <span className="font-semibold text-gray-700">{new Date(transaction.date).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-400">Transaction Fee</span>
            <span className="font-bold text-emerald-600">R0.00 (Zero Fees)</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button 
            variant="primary" 
            fullWidth 
            size="sm"
            onClick={() => onShareReceipt(transaction)}
            className="flex items-center justify-center gap-1.5"
          >
            <Share2 size={14} />
            <span>Share POP to WhatsApp</span>
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            size="sm"
            onClick={() => onAskAI(transaction)}
            className="flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>Analyze with ZarAI Mentor</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Add Cash Modal (Deposit) ---
const AddCashModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, bank: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('Capitec Bank');

  if (!isOpen) return null;

  const handleDeposit = () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (finalAmount > 0) {
      playSound('cash');
      onConfirm(finalAmount, selectedBank);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <ArrowDownLeft size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">Add Cash (Deposit)</h3>
              <p className="text-xs text-gray-400">Instant SA Bank EFT</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Quick Amount Chips */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Select Amount</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[50, 100, 250, 500].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedAmount === amt && !customAmount
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                R{amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Or enter custom amount (R)"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
          />
        </div>

        {/* Bank Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Choose SA Bank</label>
          <div className="space-y-1.5">
            {['Capitec Bank (Instant)', 'First National Bank (FNB)', 'Standard Bank', 'Nedbank', 'TymeBank'].map(bank => (
              <button
                key={bank}
                type="button"
                onClick={() => setSelectedBank(bank)}
                className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                  selectedBank === bank
                    ? 'border-black bg-gray-50 text-black'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{bank}</span>
                {selectedBank === bank && <Check size={14} className="text-black" />}
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth size="lg" onClick={handleDeposit} className="mt-2 py-3.5">
          Deposit R{customAmount ? customAmount : selectedAmount} Now
        </Button>
      </div>
    </div>
  );
};

// --- Cash Out Modal (Withdrawal) ---
const CashOutModal: React.FC<{
  isOpen: boolean;
  balance: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}> = ({ isOpen, balance, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('200');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleCashOut = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (num > balance) {
      setError(`Insufficient balance. You have R ${balance.toFixed(2)}.`);
      return;
    }
    playSound('cash');
    onConfirm(num);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">Cash Out to Bank</h3>
              <p className="text-xs text-gray-400">Available: R {balance.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-semibold">{error}</p>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Amount to Transfer (R)</label>
          <input
            type="number"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-black"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="0.00"
          />
        </div>

        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-900 rounded-lg text-white font-bold flex items-center justify-center text-xs">C</div>
            <div>
              <p className="text-xs font-bold">Capitec Savings</p>
              <p className="text-[10px] text-gray-400 font-mono">•••• 4492</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Instant</span>
        </div>

        <Button fullWidth size="lg" onClick={handleCashOut} className="py-3.5">
          Transfer R{amount || '0'} to Capitec
        </Button>
      </div>
    </div>
  );
};

// --- QR Camera Scanner Simulator Modal ---
const QRScannerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onScanUser: (user: User) => void;
}> = ({ isOpen, onClose, onScanUser }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-neutral-900 text-white rounded-3xl p-6 shadow-2xl border border-neutral-800 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-emerald-400" />
            <h3 className="font-bold text-base text-white">Scan ZarPay QR</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="relative w-full h-56 bg-neutral-950 rounded-2xl flex items-center justify-center overflow-hidden border border-neutral-800">
          <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_12px_#34d399]"></div>
          
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-md"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-md"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-md"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-md"></div>

          <div className="text-center p-4">
            <QrCode size={48} className="text-neutral-700 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-gray-400">Align customer or vendor QR code within frame</p>
          </div>
        </div>

        {/* Quick Simulated Targets */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Simulate Scan Target</label>
          <div className="space-y-1.5">
            {CONTACTS.slice(0, 3).map(contact => (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  playSound('pop');
                  onScanUser(contact);
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-left text-xs font-semibold flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <img src={contact.avatar} alt={contact.name} className="w-6 h-6 rounded-full object-cover" />
                  <span>Scan {contact.name}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Scan QR →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Daily Money Tip Modal ---
const DailyTipModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAskAI: (topic: string) => void;
}> = ({ isOpen, onClose, onAskAI }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇿🇦</span>
            <h3 className="font-bold text-base">Mzansi Money Wisdom</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-gray-700">
          <p className="font-bold text-sm text-black">The 50/30/20 Rule for SA Students & Young Pros:</p>
          <ul className="space-y-2 list-disc pl-4">
            <li><strong>50% Needs:</strong> Rent/Residence, food staples (pap, meat, beans), and monthly taxi/train fares.</li>
            <li><strong>30% Wants:</strong> Kotas, Nandos outings, weekend braais, and streaming subs.</li>
            <li><strong>20% Savings:</strong> Split into your ZarPay Stash Jars immediately on payday.</li>
          </ul>
          <p className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
            💡 <strong>Pro Tip:</strong> Stashing just R10 a day equals R3,650 cash by December holiday season!
          </p>
        </div>

        <Button 
          variant="primary" 
          fullWidth 
          onClick={() => {
            onAskAI("How should I budget my student allowance or monthly salary using the 50/30/20 rule?");
            onClose();
          }}
          className="flex items-center justify-center gap-2 py-3"
        >
          <Sparkles size={16} />
          <span>Ask ZarAI for Custom Budget Plan</span>
        </Button>
      </div>
    </div>
  );
};

// --- Create Stash Jar Modal ---
const CreateStashModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, target: number, icon: string) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('3000');
  const [icon, setIcon] = useState('🎯');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name.trim()) {
      playSound('pop');
      onCreate(name, parseFloat(target) || 1000, icon);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-base">New Stash Jar</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Pick Icon</label>
          <div className="flex gap-2 text-2xl">
            {['🎯', '💻', '🏖️', '🛡️', '👟', '🚗', '🎓', '🏡'].map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className={`p-2 rounded-xl transition-all ${icon === e ? 'bg-black/10 scale-110' : 'hover:bg-gray-100'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Goal Name</label>
          <input
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Durban Trip or New Sneaks"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Target Amount (R)</label>
          <input
            type="number"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="3000"
            value={target}
            onChange={e => setTarget(e.target.value)}
          />
        </div>

        <Button fullWidth size="lg" onClick={handleCreate} disabled={!name.trim()} className="py-3">
          Create Stash
        </Button>
      </div>
    </div>
  );
};

// --- Interactive Search Modal ---
const SearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  contacts: User[];
  onSelectUser: (user: User) => void;
  onSelectTx: (tx: Transaction) => void;
}> = ({ isOpen, onClose, transactions, contacts, onSelectUser, onSelectTx }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.handle.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTx = transactions.filter(t => 
    t.note.toLowerCase().includes(query.toLowerCase()) || 
    t.counterparty.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-16 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 space-y-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3.5 py-2.5">
          <Search size={18} className="text-gray-400" />
          <input
            autoFocus
            type="text"
            className="bg-transparent border-none w-full text-sm focus:outline-none placeholder-gray-400"
            placeholder="Search friends, notes, payments..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Contacts */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Friends & Vendors</span>
            <div className="space-y-1.5">
              {filteredContacts.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { onSelectUser(c); onClose(); }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.handle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">Pay →</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Past Transactions</span>
            <div className="space-y-1.5">
              {filteredTx.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => { onSelectTx(t); onClose(); }}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{t.counterparty.name}</p>
                    <p className="text-[10px] text-gray-500">{t.note}</p>
                  </div>
                  <span className="font-bold text-gray-900">R{t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Profile & Settings Modal ---
const ProfileModal: React.FC<{
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onLogout: () => void;
  onLockNow: () => void;
  onOpenNotifications: () => void;
  onOpenGuide: () => void;
  onDownloadScriptPDF: () => void;
  onDownloadZip: () => void;
}> = ({ isOpen, currentUser, onClose, onLogout, onLockNow, onOpenNotifications, onOpenGuide, onDownloadScriptPDF, onDownloadZip }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-base">Account & Settings</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3.5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs" />
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-sm text-gray-950 truncate">{currentUser.name}</h4>
            <p className="text-xs text-gray-500 font-mono truncate">{currentUser.handle}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{currentUser.email || 'Email verified'}</p>
          </div>
        </div>

        {/* Quick Menu Options */}
        <div className="space-y-1.5 text-xs font-semibold">
          <button 
            type="button" 
            onClick={() => { onOpenGuide(); onClose(); }}
            className="w-full p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 flex items-center justify-between text-indigo-950 transition-colors border border-indigo-100"
          >
            <div className="flex items-center gap-2.5">
              <FileText size={16} className="text-indigo-600" />
              <span>Showcase Script & Pitch Guide</span>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">5 Min</span>
          </button>

          <button 
            type="button" 
            onClick={() => { onDownloadScriptPDF(); onClose(); }}
            className="w-full p-3 rounded-xl hover:bg-gray-50 flex items-center justify-between text-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Download size={16} className="text-gray-500" />
              <span>Download Script PDF (3 Pages)</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button 
            type="button" 
            onClick={() => { onDownloadZip(); onClose(); }}
            className="w-full p-3 rounded-xl hover:bg-emerald-50 flex items-center justify-between text-emerald-950 transition-colors border border-emerald-100/60 bg-emerald-50/30"
          >
            <div className="flex items-center gap-2.5">
              <Download size={16} className="text-emerald-600" />
              <span className="font-bold">Download Full Project ZIP (.zip)</span>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">All Code</span>
          </button>

          <button 
            type="button" 
            onClick={() => { onOpenNotifications(); onClose(); }}
            className="w-full p-3 rounded-xl hover:bg-gray-50 flex items-center justify-between text-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-gray-500" />
              <span>Email Notification Inbox</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button 
            type="button" 
            onClick={() => { onLockNow(); onClose(); }}
            className="w-full p-3 rounded-xl hover:bg-gray-50 flex items-center justify-between text-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Lock size={16} className="text-gray-500" />
              <span>Lock App (Biometrics)</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

        <Button 
          variant="outline" 
          fullWidth 
          onClick={onLogout}
          className="text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2 py-3"
        >
          <LogOut size={16} />
          <span>Sign Out of ZarPay</span>
        </Button>
      </div>
    </div>
  );
};

// --- Learn & Earn Quiz Modal ---
const QuizModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onReward: (bonus: number) => void;
}> = ({ isOpen, onClose, onReward }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (selected === 1) {
      playSound('success');
      onReward(25);
    }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            <h3 className="font-bold text-base">Savings 101 Quiz</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full">
            <X size={18} />
          </button>
        </div>

        {!submitted ? (
          <>
            <p className="text-xs font-semibold text-gray-700">
              According to South African financial advisors, what percentage of your income should ideally go toward long-term savings or stash jars?
            </p>

            <div className="space-y-2">
              {['5% of income', '20% of income (The 50/30/20 Rule)', '50% of income', '0% - Spend everything'].map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                    selected === i ? 'border-black bg-black text-white' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <Button 
              fullWidth 
              size="lg" 
              onClick={handleFinish} 
              disabled={selected === null}
              className="py-3"
            >
              Submit Answer
            </Button>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={28} />
            </div>
            <h4 className="font-bold text-base text-gray-900">Spot on! 🎓</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              You correctly identified the 20% rule! R25.00 Learn & Earn reward has been credited to your balance.
            </p>
            <Button fullWidth onClick={onClose} size="sm">
              Collect & Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Screen Components ---

const HomeScreen: React.FC<{ 
  onNavigate: (s: AppScreen) => void; 
  balance: number; 
  transactions: Transaction[]; 
  currentUser: User; 
  unreadCount: number;
  onOpenShare: () => void;
  onLockApp: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenAddCash: () => void;
  onOpenCashOut: () => void;
  onOpenQRScanner: () => void;
  onOpenDailyTip: () => void;
  onSelectTx: (tx: Transaction) => void;
}> = ({ 
  onNavigate, balance, transactions, currentUser, unreadCount,
  onOpenShare, onLockApp, onOpenNotifications, onOpenSearch, onOpenProfile,
  onOpenAddCash, onOpenCashOut, onOpenQRScanner, onOpenDailyTip, onSelectTx
}) => {
  const [hideBalance, setHideBalance] = useState(false);

  return (
    <div className="pb-24 pt-4 px-4 space-y-5">
      {/* Top Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-xs">
            <span className="text-white font-extrabold text-lg">Z</span>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight leading-none">ZarPay</span>
            <span className="block text-[10px] text-gray-400 font-semibold leading-none">South Africa</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex gap-2 items-center">
          <button 
            onClick={onOpenNotifications}
            className="relative p-2 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-full text-black"
            title="Email Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button 
            onClick={onLockApp}
            className="p-2 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-full text-black"
            title="Lock with Biometrics"
          >
            <Lock size={16} />
          </button>

          <button 
            onClick={onOpenShare}
            className="p-2 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-full text-black"
            title="Share ZarPay Link"
          >
            <Share2 size={16} />
          </button>

          <button 
            onClick={onOpenSearch}
            className="p-2 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-full text-black"
            title="Search"
          >
            <Search size={16} />
          </button>

          <div 
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-xs cursor-pointer active:scale-95 transition-all"
            title="View Profile & Settings"
          >
            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mt-2 text-center py-6 px-4 bg-white rounded-3xl shadow-sm border border-gray-100 relative">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Available Balance</p>
          <button 
            type="button" 
            onClick={() => setHideBalance(!hideBalance)}
            className="text-gray-400 hover:text-black p-0.5"
          >
            {hideBalance ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-gray-950 font-mono">
          {hideBalance ? 'R ••••••' : `R ${balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
        </h1>

        <div className="flex justify-center gap-2.5">
          <Button size="sm" variant="secondary" onClick={onOpenAddCash} className="px-5 py-2">
            + Add Cash
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenCashOut} className="px-5 py-2">
            Cash Out
          </Button>
        </div>

        <div className="mt-4 text-xs text-gray-500 font-medium bg-gray-50 inline-block px-3.5 py-1 rounded-full border border-gray-100">
          <span className="font-bold text-black">{currentUser.handle}</span> • {currentUser.phone || '072 123 4567'}
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => onNavigate(AppScreen.SEND)} 
          className="flex items-center justify-center gap-2 h-14 text-base font-bold shadow-sm"
        >
          <Send size={18} /> Pay Someone
        </Button>
        <Button 
          variant="outline" 
          onClick={onOpenQRScanner} 
          className="flex items-center justify-center gap-2 h-14 text-base font-bold"
        >
          <QrCode size={18} /> Scan Code
        </Button>
      </div>

      {/* Daily Tip Widget */}
      <div 
        onClick={onOpenDailyTip}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-indigo-100/60 transition-colors"
      >
        <div>
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-0.5 block">
            Mzansi Money Move
          </span>
          <p className="font-semibold text-xs text-gray-900 leading-snug">
            The 50/30/20 Rule for SA Students: Slice allowances cleanly.
          </p>
        </div>
        <ArrowRight size={16} className="text-indigo-400 shrink-0 ml-2" />
      </div>

      {/* Recent Moves Section */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-base font-extrabold tracking-tight">Recent Moves</h2>
          <button onClick={() => onNavigate(AppScreen.COMMUNITY)} className="text-xs font-bold text-gray-400 hover:text-black">
            Community Feed →
          </button>
        </div>

        <Card className="divide-y divide-gray-50 p-3">
          {transactions.slice(0, 4).map(t => (
            <TransactionItem 
              key={t.id}
              title={t.counterparty.name}
              subtitle={new Date(t.date).toLocaleDateString()} 
              amount={t.amount}
              type={t.type}
              image={t.counterparty.avatar}
              category={t.category}
              onClick={() => onSelectTx(t)}
            />
          ))}
        </Card>
      </div>

      {/* Presentation Script & Showcase PDF Banner */}
      <div 
        onClick={() => onNavigate(AppScreen.GUIDE)}
        className="bg-indigo-50/80 border border-indigo-200/80 p-4 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-indigo-100/70 transition-all shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-white border border-indigo-200 px-2 py-0.2 rounded-full">
                Live Showcase
              </span>
              <span className="text-[10px] font-bold text-gray-500">PDF Guide</span>
            </div>
            <h3 className="font-extrabold text-sm text-gray-950 mt-0.5">5-Minute Showcase Script</h3>
            <p className="text-[11px] text-gray-600 leading-tight">Word-for-word pitch, demo steps & downloadable PDF</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-indigo-400 shrink-0" />
      </div>

      {/* Share / Invite Friends Card */}
      <div 
        onClick={onOpenShare}
        className="bg-gradient-to-r from-neutral-900 to-black text-white p-4 rounded-3xl flex items-center justify-between cursor-pointer hover:opacity-95 transition-all shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center text-white shrink-0">
            <UserPlus size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
              Invite Friends
            </span>
            <h3 className="font-bold text-sm text-white mt-1">Share ZarPay with your squad</h3>
          </div>
        </div>
        <ArrowRight size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

// --- Send Screen ---
const SendScreen: React.FC<{ 
  onBack: () => void; 
  onSend: (amount: number, note: string, contact: User, isVoucher: boolean) => void;
  contacts: User[];
  balance: number;
}> = ({ onBack, onSend, contacts, balance }) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Food & Drinks');
  const [step, setStep] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [isVoucher, setIsVoucher] = useState(false);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNext = (contact?: User) => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (contact) setSelectedContact(contact);
    else if (!selectedContact && searchTerm) {
      setSelectedContact({
        id: 'temp-' + Date.now(),
        name: searchTerm,
        handle: searchTerm.startsWith('@') ? searchTerm : `@${searchTerm}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(searchTerm)}&background=random`
      });
    }
    setStep(2);
  };

  const handleConfirm = () => {
    if (selectedContact) {
      onSend(parseFloat(amount), note || `${category} payment`, selectedContact, isVoucher);
      onBack();
    }
  };

  const setPreset = (val: number) => {
    playSound('pop');
    setAmount(val.toString());
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between pb-8">
      <Header title={step === 1 ? "Send Cash" : "Confirm Payment"} backAction={step === 1 ? onBack : () => setStep(1)} />

      {step === 1 ? (
        <div className="flex-1 flex flex-col px-6">
          {/* Amount Input */}
          <div className="my-6 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Transfer Amount (ZAR)
            </span>
            <div className="flex items-center justify-center">
              <span className="text-4xl font-extrabold text-gray-400 mr-1">R</span>
              <input 
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-5xl font-extrabold text-black w-48 text-center focus:outline-none placeholder-gray-200"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Available balance: R {balance.toFixed(2)}</p>

            {/* Presets */}
            <div className="flex justify-center gap-2 mt-4">
              {[20, 50, 100, 200, 500].map(val => (
                <button 
                  key={val}
                  type="button"
                  onClick={() => setPreset(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    amount === val.toString() ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  R{val}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Search & Picker */}
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-900 block mb-2">Recipient</label>
            <div className="flex items-center bg-gray-50 rounded-2xl px-3.5 py-3 border border-gray-100 mb-4 focus-within:ring-2 focus-within:ring-black">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search name, @cashtag, or phone" 
                className="bg-transparent border-none w-full text-sm focus:outline-none placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredContacts.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => { setSelectedContact(contact); }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedContact?.id === contact.id ? 'bg-black text-white border-black' : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={contact.avatar} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-sm">{contact.name}</p>
                      <p className={`text-xs ${selectedContact?.id === contact.id ? 'text-gray-300' : 'text-gray-400'}`}>{contact.handle}</p>
                    </div>
                  </div>
                  {selectedContact?.id === contact.id && <Check size={16} />}
                </div>
              ))}
            </div>
          </div>

          <Button 
            size="lg" 
            fullWidth 
            onClick={() => handleNext()} 
            disabled={!amount || parseFloat(amount) <= 0 || (!selectedContact && !searchTerm)}
            className="py-4 mt-4"
          >
            Review Payment →
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-6 pt-2">
          <div className="bg-gray-50 p-5 rounded-3xl mb-4 text-center border border-gray-100">
            <img src={selectedContact?.avatar || CONTACTS[0].avatar} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-white shadow-xs" />
            <h2 className="text-lg font-bold">Paying {selectedContact?.name}</h2>
            <p className="text-gray-400 text-xs mb-3">{selectedContact?.handle}</p>
            <h1 className="text-4xl font-black tracking-tight text-gray-950 font-mono">R {parseFloat(amount).toFixed(2)}</h1>
          </div>

          <div className="space-y-3 mb-6">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Payment Note</label>
              <Input 
                placeholder="What's this for? (e.g. Lunch or Taxi)" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {['Food & Drinks', 'Transport', 'Airtime/Data', 'Split Bill', 'Rent'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      category === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* SA eWallet Voucher Toggle */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900">Send as Cash Voucher</p>
                <p className="text-[10px] text-amber-700">Recipient can withdraw without bank account</p>
              </div>
              <input 
                type="checkbox" 
                checked={isVoucher} 
                onChange={e => setIsVoucher(e.target.checked)} 
                className="w-4 h-4 text-black rounded"
              />
            </div>
          </div>

          <div className="mt-auto">
            <Button size="lg" fullWidth onClick={handleConfirm} className="py-4">
              Authorize R {parseFloat(amount).toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Community Screen ---
const CommunityScreen: React.FC<{
  feed: FeedItem[];
  onLikeItem: (id: string) => void;
  onShareItem: (item: FeedItem) => void;
  onOpenQuiz: () => void;
  onAddPost: (content: string) => void;
}> = ({ feed, onLikeItem, onShareItem, onOpenQuiz, onAddPost }) => {
  const [newPostText, setNewPostText] = useState('');
  const [showPostBox, setShowPostBox] = useState(false);

  const handlePost = () => {
    if (newPostText.trim()) {
      onAddPost(newPostText);
      setNewPostText('');
      setShowPostBox(false);
      playSound('pop');
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <Header 
        title="Community Moves" 
        rightAction={
          <button 
            onClick={() => setShowPostBox(!showPostBox)}
            className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            title="Share a Tip"
          >
            <Plus size={16} />
          </button>
        }
      />
      
      <div className="px-4 space-y-4">
        {/* Post Box */}
        {showPostBox && (
          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm space-y-2 animate-in fade-in">
            <h4 className="text-xs font-bold text-gray-900">Share a Money Move or Student Tip</h4>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-black"
              rows={3}
              placeholder="e.g. Discovered that buying at local market saves R200..."
              value={newPostText}
              onChange={e => setNewPostText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="xs" onClick={() => setShowPostBox(false)}>Cancel</Button>
              <Button size="xs" onClick={handlePost} disabled={!newPostText.trim()}>Post Move</Button>
            </div>
          </div>
        )}

        {/* Learn & Earn Banner */}
        <div 
          onClick={onOpenQuiz}
          className="bg-white p-4 rounded-3xl shadow-xs border border-gray-100 cursor-pointer hover:border-black transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Award size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Learn & Earn • Savings 101</h3>
                <p className="text-[10px] text-gray-400">Complete the quiz to earn R25.00 cash</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              Take Quiz →
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-black h-1.5 rounded-full w-1/3"></div>
          </div>
        </div>

        {/* Feed List */}
        <div>
          <h3 className="font-extrabold text-sm mb-3 px-1 text-gray-700">Public Live Feed</h3>
          <div className="space-y-3">
            {feed.map((item) => (
              <FeedItemCard 
                key={item.id} 
                item={item} 
                onLike={() => onLikeItem(item.id)}
                onShare={() => onShareItem(item)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Wallet Screen ---
const WalletScreen: React.FC<{ 
  balance: number;
  savings: SavingsGoal[];
  banks: BankAccount[];
  onLockWallet: () => void;
  onTestBiometrics: () => void;
  preferredBiometric: 'face' | 'fingerprint';
  setPreferredBiometric: (val: 'face' | 'fingerprint') => void;
  onOpenAddCash: () => void;
  onOpenCashOut: () => void;
  onOpenCreateStash: () => void;
  onDepositToStash: (goalId: string, amount: number) => void;
}> = ({ 
  balance, savings, banks, onLockWallet, onTestBiometrics, 
  preferredBiometric, setPreferredBiometric, onOpenAddCash, onOpenCashOut,
  onOpenCreateStash, onDepositToStash
}) => {
  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <Header 
        title="My Wallet" 
        rightAction={
          <button 
            onClick={onLockWallet}
            className="p-2 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all rounded-full text-black flex items-center gap-1 text-xs font-semibold"
            title="Lock Wallet Access"
          >
            <Lock size={15} />
            <span>Lock</span>
          </button>
        }
      />
      <div className="px-4 space-y-5">
        
        {/* Main Balance Card */}
        <Card className="bg-black text-white p-6 relative overflow-hidden h-40 flex flex-col justify-center shadow-lg">
          <div className="absolute right-0 top-0 p-6 opacity-10">
            <Landmark size={80} />
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Balance</p>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
              <ShieldCheck size={12} /> Biometrics Active
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight">R {balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-mono">Protected by ZarPay Secure Enclave</p>
        </Card>

        {/* Biometric Security Card */}
        <div className="bg-gradient-to-br from-neutral-900 to-black text-white p-5 rounded-3xl shadow-md border border-neutral-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Security Vault</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <h4 className="font-bold text-sm text-white">Biometric Layer Active</h4>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-full text-gray-300">
              {preferredBiometric === 'face' ? 'Face ID' : 'Touch ID'}
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Access to your bank accounts, stashes, and transactions is guarded by biometric authentication.
          </p>

          <div className="bg-white/10 p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold">
            <button 
              onClick={() => setPreferredBiometric('face')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                preferredBiometric === 'face' 
                  ? 'bg-white text-black shadow-sm font-bold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <ScanFace size={14} />
              <span>Face ID</span>
            </button>
            <button 
              onClick={() => setPreferredBiometric('fingerprint')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                preferredBiometric === 'fingerprint' 
                  ? 'bg-white text-black shadow-sm font-bold' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Fingerprint size={14} />
              <span>Fingerprint</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button 
              onClick={onTestBiometrics}
              className="flex-1 py-2.5 px-3 bg-white/15 hover:bg-white/25 active:scale-98 transition-all rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Test Biometrics</span>
            </button>
            <button 
              onClick={onLockWallet}
              className="flex-1 py-2.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 active:scale-98 transition-all rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Lock size={13} />
              <span>Lock Wallet</span>
            </button>
          </div>
        </div>

        {/* Bank Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onOpenAddCash}
            className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
              <Landmark size={18} />
            </div>
            <span className="font-bold text-xs">Add Cash</span>
            <span className="text-[10px] text-gray-400">From SA Bank</span>
          </button>
          <button 
            onClick={onOpenCashOut}
            className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
              <ArrowRight size={18} />
            </div>
            <span className="font-bold text-xs">Cash Out</span>
            <span className="text-[10px] text-gray-400">Instant Transfer</span>
          </button>
        </div>

        {/* Savings Goals / Stashes */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <div>
              <h3 className="font-extrabold text-base">Stash Jars</h3>
              <p className="text-[10px] text-gray-400">Automated micro-savings with zero interest drag</p>
            </div>
            <button 
              onClick={onOpenCreateStash}
              className="text-xs font-bold flex items-center gap-1 bg-black text-white hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus size={14} /> New
            </button>
          </div>
          
          <div className="space-y-2.5">
            {savings.map(goal => (
              <Card key={goal.id} className="flex items-center gap-3.5 py-3.5">
                <div className="text-2xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded-2xl shrink-0">
                  {goal.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900 truncate">{goal.name}</span>
                    <span className="font-extrabold text-xs font-mono">
                      R{goal.current} <span className="text-gray-400 font-normal text-[10px]">/ R{goal.target}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => onDepositToStash(goal.id, 50)}
                      className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md"
                    >
                      +R50
                    </button>
                    <button
                      onClick={() => onDepositToStash(goal.id, 100)}
                      className="text-[10px] font-bold bg-black hover:bg-gray-800 text-white px-2 py-0.5 rounded-md"
                    >
                      +R100
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Linked Bank Accounts */}
        <div className="pt-2">
          <h3 className="font-extrabold text-base mb-3 px-1">Linked Payment Methods</h3>
          <div className="space-y-2">
            {banks.map(bank => (
              <Card key={bank.id} className="flex items-center gap-3.5 py-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: bank.color }}
                >
                  {bank.bankName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs text-gray-900">{bank.bankName}</p>
                  <p className="text-gray-400 text-[11px] font-mono">{bank.accountNumber} • {bank.accountType}</p>
                </div>
                {bank.isPrimary && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    Primary
                  </span>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Smart Advisor Screen (ZarAI) ---
const SmartAdvisorScreen: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: 'Sho! I am ZarAI 🇿🇦, your personal financial mentor. Whether you want to budget your student bursary, split taxi fares, or save for that new laptop, let me know what you want to tackle!',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || query;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    playSound('pop');

    const responseText = await analyzeSpending(transactions, textToSend);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, modelMsg]);
    setLoading(false);
  };

  const sampleChips = [
    'How do I cut down on takeaways?',
    'Best student budget for South Africa',
    'Explain the 50/30/20 rule simply',
    'How to build an emergency fund'
  ];

  return (
    <div className="pb-24 flex flex-col h-screen bg-gray-50">
      <Header title="ZarAI Financial Mentor" />
      
      {/* Suggestion Chips */}
      <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
        {sampleChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full shrink-0 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl ${
              msg.role === 'user' 
                ? 'bg-black text-white rounded-tr-xs' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-xs shadow-xs'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-gray-100">
                  <Sparkles size={14} className="text-purple-600" />
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">ZarAI Mentor</span>
                </div>
              )}
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-xs flex gap-1.5 items-center shadow-xs">
              <span className="text-xs font-semibold text-gray-500 mr-1">ZarAI is thinking</span>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-black transition-all"
          placeholder="Ask for savings tips or financial advice..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={() => handleSend()}
          disabled={!query.trim() || loading}
          className="bg-black text-white p-3 rounded-full disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

// --- Presentation Script & Product Guide Screen ---
const ProductGuideScreen: React.FC<{ onBack: () => void; onShowToast?: (msg: string) => void }> = ({ onBack, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'script' | 'overview'>('script');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prompterMode, setPrompterMode] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  const fullScriptText = `ZARPAY 🇿🇦 — OFFICIAL 5-MINUTE PRESENTATION & DEMO SCRIPT

PART 1: THE HOOK & INTRODUCTION [0:00 - 0:30]
Action: Start on the 5-Digit PIN Login Screen. Hold phone up or project screen.
Spoken:
"Good day everyone! How many times have you tried to split a restaurant bill with friends, or send money home quickly, only to be stopped by high inter-bank transfer fees, endless branch queues, or waiting 2 to 3 business days for payment to reflect?

Traditional banking wasn't built for our modern, on-the-go lifestyle. That's why I created ZarPay — South Africa's modern digital wallet built for lightning-fast peer-to-peer payments, zero transaction fees, and AI-powered financial mentorship."

PART 2: AUTHENTICATION & 5-DIGIT PIN SECURITY [0:30 - 1:15]
Action: Live demo entering the 5-digit PIN (1-2-3-4-5) or biometric unlock.
Spoken:
"Security in fintech is paramount. When opening ZarPay, every session is fortified with a mandatory 5-digit security PIN alongside biometrics like Face ID and Fingerprint recognition.

Watch as I punch in my 5-digit PIN [demonstrate 1-2-3-4-5]. Instant vibration feedback, zero lag. If I'm on a modern phone, one scan of my Face ID or fingerprint opens the wallet in under half a second. Once logged in, every user also receives an immediate email notification verifying their secure session."

PART 3: THE DIGITAL WALLET & ZERO-FEE BANKING [1:15 - 2:00]
Action: Navigate to Wallet tab, tap "+ Add Cash", and select Capitec or FNB Instant EFT.
Spoken:
"Here is the main ZarPay dashboard. You can see your live balance in South African Rand (ZAR) — in this demo, R 12,450.00.

Adding money is seamless. I click '+ Add Cash', choose from our integrated instant EFT partners — Capitec, FNB, Standard Bank, or Nedbank — specify an amount like R 250, and confirm. Within a second, the balance updates live, confetti pops, and an official confirmation email is delivered to my inbox. No waiting for bank business days."

PART 4: PEER-TO-PEER INSTANT PAYMENTS & CASHTAGS [2:00 - 3:00]
Action: Tap the Pay/Send button in center nav bar. Search @sipho or tap contact.
Spoken:
"Now, for the core superpower of ZarPay: Instant P2P Payments. Traditional EFT requires account numbers, branch codes, and proof-of-payment PDFs. On ZarPay, you only need a Cashtag or phone number.

Let's say I'm reimbursing my friend Sipho for Friday night braai meat. I tap Pay, search @sipho, enter R 150, type 'Braai meat & drinks', and hit Send. Boom! Instant chime, transaction logged, interactive receipt ready to share on WhatsApp, and zero bank charges."

PART 5: STASH JARS & MICRO-SAVINGS [3:00 - 3:45]
Action: Open Stash Jars section in Wallet. Tap "+ Create Stash" or deposit R 50 into Emergency Fund.
Spoken:
"Most young South Africans struggle to save because high-interest savings accounts lock your money away with stiff penalties. ZarPay introduces 'Stash Jars' — gamified micro-savings.

Users can create custom stashes like 'December Holiday', 'Car Deposit', or 'Emergency Fund'. Watch me transfer R 100 straight from my spending balance into my Emergency Jar. It tracks your percentage goal visually, helping users build real wealth one small deposit at a time."

PART 6: ZarAI — THE SMART FINANCIAL MENTOR [3:45 - 4:30]
Action: Tap ZarAI tab in bottom nav. Tap a prompt chip like 'How do I cut down on takeaways?'.
Spoken:
"What truly sets ZarPay apart from legacy banking apps is ZarAI — our built-in financial mentor powered by Google Gemini AI.

ZarAI analyzes your actual transaction history to give street-smart, localized financial coaching in relatable South African English. Watch: I tap 'How do I cut down on takeaways?' and ZarAI breaks down my spending patterns, offers practical meal-prep advice, and calculates how much moola I can save each month."

PART 7: COMMUNITY, QUIZ & CLOSING HOOK [4:30 - 5:15]
Action: Tap Community tab, show the live social payment feed, and tap 'Take Quiz' to win bonus Rand.
Spoken:
"Finally, ZarPay fosters financial wellness through community. Our feed shows friends paying each other with fun emojis, and our 'Learn & Earn Quiz' rewards users with real wallet balance when they complete financial literacy challenges.

To wrap up: ZarPay solves South Africa's banking friction with 5-digit PIN security, zero-fee instant transfers, micro-savings stashes, and Gemini AI intelligence. It's not just another wallet — it's the financial companion Mzansi deserves.

Thank you! You can scan the QR code right here on my phone to try ZarPay yourself. I welcome any questions!"`;

  const handleDownloadScriptPDF = async () => {
    setDownloading(true);
    playSound('pop');
    try {
      // Direct high-quality download from backend endpoint
      const response = await fetch('/api/download-presentation-script');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ZarPay_Presentation_Script.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        if (onShowToast) onShowToast("Downloaded ZarPay Presentation Script PDF!");
        return;
      }
      
      // Secondary fallback via direct link
      window.open('/ZarPay_Presentation_Script.pdf', '_blank');
      if (onShowToast) onShowToast("Opened ZarPay Presentation Script PDF!");
    } catch (err) {
      console.error('Download error:', err);
      // Client-side fallback generation
      try {
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.text('ZarPay Presentation & Pitch Script', 15, 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(fullScriptText, 180);
        doc.text(splitText, 15, 30);
        doc.save('ZarPay_Presentation_Script.pdf');
        if (onShowToast) onShowToast("Generated & downloaded script PDF!");
      } catch (clientErr) {
        console.error('Client PDF generation error:', clientErr);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadProjectZip = () => {
    playSound('pop');
    const a = document.createElement('a');
    a.href = '/api/download-zip';
    a.download = 'zarpay_full_project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onShowToast) onShowToast("Downloading full ZarPay project ZIP archive!");
  };

  const handleCopyScript = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullScriptText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = fullScriptText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      playSound('pop');
      if (onShowToast) onShowToast("Script text copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const downloadGuidePDF = async () => {
    if (!guideRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(guideRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('ZarPay_Official_Product_Guide.pdf');
      if (onShowToast) onShowToast("Downloaded Product Guide PDF!");
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const scriptParts = [
    {
      number: 1,
      title: "The Hook & Introduction",
      time: "0:00 - 0:30",
      action: "Start on the 5-Digit PIN Login Screen. Hold phone up or project display.",
      speakerLines: [
        `"Good day everyone! How many times have you tried to split a restaurant bill with friends, or send money home quickly, only to be stopped by high inter-bank transfer fees, endless branch queues, or waiting 2 to 3 business days for payment to reflect?"`,
        `"Traditional banking wasn't built for our modern, on-the-go lifestyle. That's why I created ZarPay — South Africa's modern digital wallet built for lightning-fast peer-to-peer payments, zero transaction fees, and AI-powered financial mentorship."`
      ],
      tip: "Speak with high energy and make direct eye contact during the opening question."
    },
    {
      number: 2,
      title: "Authentication & 5-Digit PIN Security",
      time: "0:30 - 1:15",
      action: "Live demo entering the 5-digit PIN (1-2-3-4-5) or biometric unlock into the phone.",
      speakerLines: [
        `"Security in fintech is paramount. When opening ZarPay, every session is fortified with a mandatory 5-digit security PIN alongside biometrics like Face ID and Fingerprint recognition."`,
        `"Watch as I punch in my 5-digit PIN [demonstrate 1-2-3-4-5]. Instant vibration feedback, zero lag. If I'm on a modern phone, one scan of my Face ID or fingerprint opens the wallet in under half a second. Once logged in, every user also receives an immediate email notification verifying their secure session."`
      ],
      tip: "Type the PIN clearly so everyone in the room sees the 5 dots illuminate and unlock the dashboard."
    },
    {
      number: 3,
      title: "The Digital Wallet & Zero-Fee Banking",
      time: "1:15 - 2:00",
      action: "Navigate to the Wallet tab, tap '+ Add Cash', and select Capitec or FNB Instant EFT.",
      speakerLines: [
        `"Here is the main ZarPay dashboard. You can see your live balance in South African Rand (ZAR) — in this demo, R 12,450.00."`,
        `"Adding money is seamless. I click '+ Add Cash', choose from our integrated instant EFT partners — Capitec, FNB, Standard Bank, or Nedbank — specify an amount like R 250, and confirm. Within a second, the balance updates live, confetti pops, and an official confirmation email is delivered to my inbox. No waiting for bank business days."`
      ],
      tip: "Showcase the instant EFT modal and highlight the South African banking logos."
    },
    {
      number: 4,
      title: "Peer-to-Peer Instant Payments & Cashtags",
      time: "2:00 - 3:00",
      action: "Tap the Pay/Send button in center nav bar. Search @sipho or tap contact.",
      speakerLines: [
        `"Now, for the core superpower of ZarPay: Instant P2P Payments. Traditional EFT requires account numbers, branch codes, and proof-of-payment PDFs. On ZarPay, you only need a Cashtag or phone number."`,
        `"Let's say I'm reimbursing my friend Sipho for Friday night braai meat. I tap Pay, search @sipho, enter R 150, type 'Braai meat & drinks', and hit Send. Boom! Instant chime, transaction logged, interactive receipt ready to share on WhatsApp, and zero bank charges."`
      ],
      tip: "Open the receipt popup to show the transaction ID, timestamp, and WhatsApp share button."
    },
    {
      number: 5,
      title: "Stash Jars & Micro-Savings",
      time: "3:00 - 3:45",
      action: "Open Stash Jars section in Wallet. Tap '+ Create Stash' or deposit R 50 into Emergency Fund.",
      speakerLines: [
        `"Most young South Africans struggle to save because high-interest savings accounts lock your money away with stiff penalties. ZarPay introduces 'Stash Jars' — gamified micro-savings."`,
        `"Users can create custom stashes like 'December Holiday', 'Car Deposit', or 'Emergency Fund'. Watch me transfer R 100 straight from my spending balance into my Emergency Jar. It tracks your percentage goal visually, helping users build real wealth one small deposit at a time."`
      ],
      tip: "Explain that micro-savings can be unlocked instantly at any time without fees."
    },
    {
      number: 6,
      title: "ZarAI — Smart Financial Mentor",
      time: "3:45 - 4:30",
      action: "Tap ZarAI tab in bottom nav. Tap a prompt chip like 'How do I cut down on takeaways?'.",
      speakerLines: [
        `"What truly sets ZarPay apart from legacy banking apps is ZarAI — our built-in financial mentor powered by Google Gemini AI."`,
        `"ZarAI analyzes your actual transaction history to give street-smart, localized financial coaching in relatable South African English. Watch: I tap 'How do I cut down on takeaways?' and ZarAI breaks down my spending patterns, offers practical meal-prep advice, and calculates how much moola I can save each month."`
      ],
      tip: "Point out the localized slang ('bucks', 'moola', 'lekker') and encouraging tone."
    },
    {
      number: 7,
      title: "Community, Quiz & Closing Hook",
      time: "4:30 - 5:15",
      action: "Tap Community tab, show the live social payment feed, and tap 'Take Quiz' to win bonus Rand.",
      speakerLines: [
        `"Finally, ZarPay fosters financial wellness through community. Our feed shows friends paying each other with fun emojis, and our 'Learn & Earn Quiz' rewards users with real wallet balance when they complete financial literacy challenges."`,
        `"To wrap up: ZarPay solves South Africa's banking friction with 5-digit PIN security, zero-fee instant transfers, micro-savings stashes, and Gemini AI intelligence. It's not just another wallet — it's the financial companion Mzansi deserves."`,
        `"Thank you! You can scan the QR code right here on my phone to try ZarPay yourself. I welcome any questions!"`
      ],
      tip: "Open the Share Modal or QR code on screen so evaluators or friends can scan and test."
    }
  ];

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <Header 
        title="Showcase & Script" 
        backAction={onBack} 
        rightAction={
          <button 
            onClick={activeTab === 'script' ? handleDownloadScriptPDF : downloadGuidePDF}
            disabled={downloading}
            className="p-2 bg-black text-white hover:bg-neutral-800 active:scale-95 transition-all rounded-full disabled:opacity-50 flex items-center justify-center shadow-xs"
            title="Download PDF"
          >
            <Download size={17} />
          </button>
        }
      />

      {/* Mode / Tab Selector */}
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('script')}
          className={`flex-1 py-2 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'script' 
              ? 'bg-black text-white shadow-xs' 
              : 'bg-gray-100 text-gray-600 hover:text-black'
          }`}
        >
          <FileText size={14} />
          <span>Presentation Script</span>
          <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-bold">PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'overview' 
              ? 'bg-black text-white shadow-xs' 
              : 'bg-gray-100 text-gray-600 hover:text-black'
          }`}
        >
          <Info size={14} />
          <span>Product Overview</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'script' ? (
          <>
            {/* Download Callout Banner */}
            <div className="bg-gradient-to-br from-neutral-900 to-black text-white p-5 rounded-3xl shadow-lg border border-neutral-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-950/90 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                  Official Pitch Guide
                </span>
                <span className="text-xs text-gray-300 font-mono">Duration: ~5 Mins</span>
              </div>

              <div>
                <h2 className="text-xl font-black tracking-tight">ZarPay Showcase Script</h2>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Complete 7-part script with verbatim spoken lines, live stage actions, and Q&A defense cheat sheet.
                </p>
              </div>

              {/* Demo Quick Reference Badge */}
              <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold uppercase">Demo Login PIN</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm tracking-widest">12345</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-semibold uppercase">Security Mode</span>
                  <span className="font-bold text-gray-200">5-Digit PIN + Biometrics</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={handleDownloadScriptPDF}
                  disabled={downloading}
                  className="bg-white text-black hover:bg-gray-100 py-3 text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <Download size={15} />
                  <span>{downloading ? 'Downloading PDF...' : 'Download Script PDF (3 Pages)'}</span>
                </Button>

                <button 
                  onClick={handleCopyScript}
                  className="px-4 py-3 bg-white/15 hover:bg-white/25 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95"
                  title="Copy Script to Clipboard"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Download Project ZIP Archive */}
              <button
                type="button"
                onClick={handleDownloadProjectZip}
                className="w-full py-2.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Download size={14} className="text-emerald-400" />
                <span>Download Full Project ZIP Archive (.zip)</span>
              </button>
            </div>

            {/* Quick Prompter Mode Toggle */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Presenter Prompter Mode</h4>
                  <p className="text-[10px] text-gray-400">Large high-contrast text for stage reading</p>
                </div>
              </div>
              <button 
                onClick={() => setPrompterMode(!prompterMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  prompterMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {prompterMode ? 'Prompter ON' : 'Turn On'}
              </button>
            </div>

            {/* Script Sections Accordion / Cards */}
            <div className="space-y-4">
              {scriptParts.map((part) => (
                <div 
                  key={part.number} 
                  className={`bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3.5 transition-all ${
                    prompterMode ? 'border-neutral-900 p-6' : ''
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                        {part.number}
                      </span>
                      <h3 className="font-extrabold text-sm text-gray-900 tracking-tight">
                        {part.title}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {part.time}
                    </span>
                  </div>

                  {/* Stage Action Box */}
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-start gap-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                      Action
                    </span>
                    <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                      {part.action}
                    </p>
                  </div>

                  {/* Spoken Lines */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      What to Say (Verbatim or Guided):
                    </span>
                    {part.speakerLines.map((line, lIdx) => (
                      <p 
                        key={lIdx} 
                        className={`text-gray-800 leading-relaxed font-sans ${
                          prompterMode ? 'text-base font-semibold' : 'text-xs'
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Presenter Tip */}
                  <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-800">
                    <span className="font-extrabold uppercase text-[9px] bg-emerald-200/60 px-1.5 py-0.5 rounded text-emerald-900">
                      Pro Tip
                    </span>
                    <span className="italic">{part.tip}</span>
                  </div>
                </div>
              ))}

              {/* Anticipated Q&A Cheat Sheet */}
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Award size={18} className="text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-gray-900">Presenter Q&A Defense Cheat Sheet</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                    <p className="font-extrabold text-gray-950">Q: How does ZarPay make money if P2P is free?</p>
                    <p className="text-gray-600 leading-relaxed">
                      A: Freemium merchant pricing: 0.5% on commercial merchant checkouts (half of card machines), plus tiered interest splits on high-yield stash jars.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                    <p className="font-extrabold text-gray-950">Q: What happens if a user forgets their 5-digit PIN?</p>
                    <p className="text-gray-600 leading-relaxed">
                      A: Self-service recovery sends an encrypted verification link to their verified email and authenticates via biometric facial geometry.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                    <p className="font-extrabold text-gray-950">Q: What tech stack powers ZarPay?</p>
                    <p className="text-gray-600 leading-relaxed">
                      A: React 19, Tailwind CSS, TypeScript, Express, Web Audio API, and Google Gemini Flash AI SDK for real-time financial mentorship.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Download Sticky/Action */}
            <div className="pt-2 text-center">
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleDownloadScriptPDF}
                disabled={downloading}
                className="py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <Download size={18} />
                <span>{downloading ? 'Downloading PDF...' : 'Download Official Script PDF'}</span>
              </Button>
            </div>
          </>
        ) : (
          /* Product Overview Tab */
          <div className="space-y-4">
            <div ref={guideRef} className="bg-white p-6 border border-gray-100 shadow-sm rounded-3xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xs">
                  <span className="text-white font-extrabold text-2xl">Z</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">ZarPay</h1>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Mzansi Digital Wallet</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
                <section>
                  <h3 className="font-extrabold text-sm text-black mb-1">What is ZarPay?</h3>
                  <p>ZarPay is South Africa's modern peer-to-peer payment platform combining instant zero-fee EFT transfers, AI-guided mentorship, and community-powered savings.</p>
                </section>

                <section>
                  <h3 className="font-extrabold text-sm text-black mb-1">Security & 5-Digit PIN</h3>
                  <p>Guarded by mandatory 5-digit PIN entry (default demo: 12345), simulated Face ID & Touch ID sensors, and immediate email notifications for every login and transfer.</p>
                </section>

                <section>
                  <h3 className="font-extrabold text-sm text-black mb-1">Supported Banks</h3>
                  <p>Capitec, FNB, Standard Bank, Nedbank, and Discovery Bank instant EFT gateways with zero inter-bank waiting times.</p>
                </section>

                <section>
                  <h3 className="font-extrabold text-sm text-black mb-1">ZarAI Financial Mentor</h3>
                  <p>Powered by Google Gemini AI to analyze spending trends, deliver localized budgeting advice, and guide South African youth toward financial freedom.</p>
                </section>
              </div>
            </div>

            <Button 
              variant="secondary" 
              fullWidth 
              onClick={downloadGuidePDF}
              disabled={downloading}
              className="py-3.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>{downloading ? "Exporting PDF..." : "Download Product Guide PDF"}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Biometric Authentication Modal ---
interface BiometricAuthModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  allowCancel?: boolean;
  defaultMode?: 'face' | 'fingerprint';
  currentUser?: User | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  title = "Unlock ZarPay",
  subtitle = "Verify your biometric identity to proceed",
  allowCancel = true,
  defaultMode = 'face',
  currentUser,
  onSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<'face' | 'fingerprint' | 'passcode'>(defaultMode);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pin, setPin] = useState('');
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setPin('');
      setErrorMessage('');
      setStatus('scanning');
      scanTimeoutRef.current = setTimeout(() => {
        setStatus('success');
        playSound('success');
        setTimeout(() => {
          onSuccess();
        }, 500);
      }, 950);
    } else {
      setStatus('idle');
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    }

    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [isOpen, defaultMode]);

  const triggerScan = () => {
    setStatus('scanning');
    setErrorMessage('');
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    scanTimeoutRef.current = setTimeout(() => {
      setStatus('success');
      playSound('success');
      setTimeout(() => {
        onSuccess();
      }, 500);
    }, 800);
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 5) {
      const nextPin = pin + digit;
      setPin(nextPin);
      playSound('pop');
      if (nextPin.length === 5) {
        setTimeout(() => {
          setStatus('success');
          playSound('success');
          setTimeout(() => {
            onSuccess();
          }, 450);
        }, 250);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-neutral-900 via-indigo-600 to-black"></div>

        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs">
              Z
            </div>
            <span className="text-xs font-bold tracking-tight text-gray-500 uppercase">ZarPay Vault</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Biometric</span>
            </span>
            {allowCancel && onCancel && (
              <button 
                onClick={onCancel}
                className="p-1 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors ml-1"
                title="Cancel"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2 mb-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover" />
            <span className="text-xs font-semibold text-gray-800">{currentUser.name}</span>
            <span className="text-[11px] text-gray-400 font-mono">{currentUser.handle}</span>
          </div>
        )}

        <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h3>
        <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[260px] leading-relaxed">{subtitle}</p>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl w-full mb-5 text-xs font-semibold">
          <button 
            type="button"
            onClick={() => { setMode('face'); triggerScan(); }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'face' ? 'bg-white text-black shadow-xs font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            <ScanFace size={15} />
            <span>Face ID</span>
          </button>
          <button 
            type="button"
            onClick={() => { setMode('fingerprint'); triggerScan(); }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'fingerprint' ? 'bg-white text-black shadow-xs font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            <Fingerprint size={15} />
            <span>Fingerprint</span>
          </button>
          <button 
            type="button"
            onClick={() => { setMode('passcode'); setErrorMessage(''); }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              mode === 'passcode' ? 'bg-white text-black shadow-xs font-bold' : 'text-gray-500 hover:text-black'
            }`}
          >
            <KeyRound size={14} />
            <span>PIN</span>
          </button>
        </div>

        {mode !== 'passcode' ? (
          <div className="flex flex-col items-center w-full my-2">
            <div 
              onClick={status !== 'scanning' && status !== 'success' ? triggerScan : undefined}
              className={`relative w-36 h-36 rounded-3xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
                status === 'success' 
                  ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 scale-105 shadow-lg shadow-emerald-500/10' 
                  : status === 'failed'
                  ? 'bg-red-50 border-2 border-red-400 text-red-500'
                  : status === 'scanning'
                  ? 'bg-neutral-900 border-2 border-black text-white shadow-xl shadow-black/10'
                  : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-black'
              }`}
            >
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-current rounded-tl-sm opacity-60"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-current rounded-tr-sm opacity-60"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-current rounded-bl-sm opacity-60"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-current rounded-br-sm opacity-60"></div>

              {mode === 'face' && status === 'scanning' && (
                <div className="absolute inset-x-3 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_12px_#34d399]"></div>
              )}

              {mode === 'fingerprint' && status === 'scanning' && (
                <div className="absolute inset-4 rounded-full border-2 border-emerald-400/50 animate-ping"></div>
              )}

              {status === 'success' ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-200">
                  <CheckCircle2 size={56} className="text-emerald-500 mb-1" />
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Verified</span>
                </div>
              ) : mode === 'face' ? (
                <div className="flex flex-col items-center">
                  <ScanFace size={54} className={status === 'scanning' ? 'text-emerald-400 animate-pulse' : 'text-gray-800'} />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Fingerprint size={54} className={status === 'scanning' ? 'text-emerald-400 animate-pulse' : 'text-gray-800'} />
                </div>
              )}
            </div>

            <div className="mt-4 min-h-[38px] flex flex-col items-center justify-center">
              {status === 'scanning' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <RefreshCw size={13} className="animate-spin text-black" />
                  <span>{mode === 'face' ? 'Scanning facial geometry...' : 'Reading fingerprint sensor...'}</span>
                </div>
              )}

              {status === 'success' && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <Check size={14} />
                  <span>Authenticated successfully!</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-2 mt-2">
              <Button 
                variant="primary" 
                fullWidth 
                onClick={triggerScan}
                disabled={status === 'scanning' || status === 'success'}
                className="py-3.5 text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {mode === 'face' ? <ScanFace size={16} /> : <Fingerprint size={16} />}
                <span>Authenticate with {mode === 'face' ? 'Face ID' : 'Touch ID'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-3.5 my-3">
              {[0, 1, 2, 3, 4].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div 
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      status === 'success'
                        ? 'bg-emerald-500 scale-110'
                        : filled
                        ? 'bg-black scale-105'
                        : 'border-2 border-gray-300 bg-gray-50'
                    }`}
                  />
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 mb-3">Enter 5 numbers (e.g. 12345)</p>

            <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, i) => {
                if (key === '') return <div key={i}></div>;
                if (key === 'back') {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={handleBackspace}
                      className="h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 flex items-center justify-center text-gray-600 transition-all font-semibold"
                    >
                      ⌫
                    </button>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleKeyPress(key)}
                    className="h-12 rounded-2xl bg-gray-50 hover:bg-gray-200 active:scale-95 flex items-center justify-center text-lg font-bold text-gray-800 transition-all shadow-2xs"
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {allowCancel && onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="mt-4 text-xs font-semibold text-gray-500 hover:text-black py-1 transition-colors"
          >
            Cancel & Return
          </button>
        )}
      </div>
    </div>
  );
};

// --- Share Modal ---
const ShareModal: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: User }> = ({ isOpen, onClose, currentUser }) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? 'https://ais-pre-udqezlfld5qkenjysjbkbh-193133937399.europe-west1.run.app'
    : 'https://ais-pre-udqezlfld5qkenjysjbkbh-193133937399.europe-west1.run.app';

  const shareText = `Hey! Check out ZarPay 🇿🇦 - Instant P2P money transfers with zero fees! Connect with me on ${currentUser.handle}! ${shareUrl}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      playSound('pop');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ZarPay 🇿🇦 - Instant P2P money transfers! Connect with me at ${currentUser.handle}`)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-base">
              Z
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Share ZarPay</h2>
              <p className="text-gray-500 text-xs">Invite friends with your direct link</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Project Share Link</label>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 pl-3">
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="bg-transparent text-xs font-mono text-gray-700 w-full outline-none select-all truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                copied ? 'bg-emerald-600 text-white' : 'bg-black text-white hover:bg-neutral-800 active:scale-95'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs shrink-0">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}`} 
              alt="ZarPay QR Code" 
              className="w-20 h-20 rounded-md"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Scan to Open</span>
            <h4 className="font-bold text-sm text-gray-900">Friends can scan your screen</h4>
            <p className="text-xs text-gray-500">Point phone camera to launch ZarPay instantly on their device.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Quick Share Channels</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold transition-all active:scale-98"
            >
              <MessageCircle size={16} className="text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button 
              onClick={handleTwitter}
              className="flex items-center justify-center gap-2 p-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 rounded-2xl text-xs font-bold transition-all active:scale-98"
            >
              <ExternalLink size={16} />
              <span>X / Twitter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Container ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([CURRENT_USER, ...CONTACTS]);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.HOME);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [balance, setBalance] = useState(12450.00);
  const [savings, setSavings] = useState<SavingsGoal[]>(MOCK_SAVINGS);
  const [feed, setFeed] = useState<FeedItem[]>(MOCK_FEED);
  const [banks, setBanks] = useState<BankAccount[]>(MOCK_BANKS);
  const [notifications, setNotifications] = useState<EmailNotification[]>(INITIAL_NOTIFICATIONS);

  // Interactive UI Modal States
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isDailyTipOpen, setIsDailyTipOpen] = useState(false);
  const [isCreateStashOpen, setIsCreateStashOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // Confetti & Toast Feedback
  const [confettiActive, setConfettiActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security & Biometrics
  const [preferredBiometric, setPreferredBiometric] = useState<'face' | 'fingerprint'>('face');
  const [isWalletUnlocked, setIsWalletUnlocked] = useState(false);
  const [biometricPrompt, setBiometricPrompt] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    allowCancel: boolean;
    onSuccess: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false, // Initial app open is smooth for presentation, easily locked with button!
    title: "Unlock ZarPay",
    subtitle: "Verify biometric identity with Face ID or Fingerprint to access your account.",
    allowCancel: false,
    onSuccess: () => {
      setBiometricPrompt(prev => ({ ...prev, isOpen: false }));
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const triggerConfetti = () => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2000);
  };

  const sendEmailNotification = (subject: string, preview: string, body: string, type: EmailNotification['type']) => {
    const newNotif: EmailNotification = {
      id: 'notif-' + Date.now(),
      to: currentUser?.email || 'thabo.mbeki@zarpay.co.za',
      subject,
      preview,
      body,
      timestamp: 'Just now',
      type,
      read: false,
      reference: 'ZP-' + Math.floor(1000000 + Math.random() * 9000000)
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleNavigate = (screen: AppScreen) => {
    playSound('pop');
    // Biometric protection for Wallet screen
    if (screen === AppScreen.WALLET && !isWalletUnlocked) {
      setBiometricPrompt({
        isOpen: true,
        title: "Wallet Security Access",
        subtitle: "Face ID or Fingerprint authentication required to view accounts & cards.",
        allowCancel: true,
        onSuccess: () => {
          setIsWalletUnlocked(true);
          setBiometricPrompt(prev => ({ ...prev, isOpen: false }));
          setCurrentScreen(AppScreen.WALLET);
        },
        onCancel: () => {
          setBiometricPrompt(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
    setCurrentScreen(screen);
  };

  const handleLockApp = () => {
    playSound('lock');
    setIsWalletUnlocked(false);
    setBiometricPrompt({
      isOpen: true,
      title: "Unlock ZarPay",
      subtitle: "App locked. Scan Face ID or Fingerprint to resume your session.",
      allowCancel: false,
      onSuccess: () => {
        setBiometricPrompt(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLockWallet = () => {
    playSound('lock');
    setIsWalletUnlocked(false);
    setCurrentScreen(AppScreen.HOME);
    showToast("Wallet locked. Biometrics required for next access.");
  };

  const handleTestBiometrics = () => {
    setBiometricPrompt({
      isOpen: true,
      title: "Biometric Sensor Test",
      subtitle: "Testing your device biometric sensors for ZarPay vault security.",
      allowCancel: true,
      onSuccess: () => {
        setBiometricPrompt(prev => ({ ...prev, isOpen: false }));
        showToast("Biometric sensor verified successfully! ✓");
      },
      onCancel: () => {
        setBiometricPrompt(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Payment Handler
  const handleSendMoney = (amount: number, note: string, contact: User, isVoucher: boolean) => {
    const ref = 'ZP-' + Math.floor(1000000 + Math.random() * 9000000);
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'sent',
      amount,
      date: new Date().toISOString(),
      counterparty: contact,
      note: isVoucher ? `[Cash Voucher] ${note}` : note,
      category: isVoucher ? 'Voucher' : 'Transfer',
      reference: ref,
      status: 'completed',
      voucherCode: isVoucher ? 'VCH-' + Math.floor(1000 + Math.random() * 9000) : undefined
    };

    setTransactions(prev => [newTx, ...prev]);
    setBalance(prev => prev - amount);
    playSound('cash');
    triggerConfetti();

    // Send email notification with Proof of Payment
    sendEmailNotification(
      `Proof of Payment: R${amount.toFixed(2)} to ${contact.name}`,
      `Your instant payment of R${amount.toFixed(2)} has cleared. Ref: ${ref}`,
      `Dear ${currentUser?.name},\n\nYour instant payment of R${amount.toFixed(2)} to ${contact.name} (${contact.handle}) has been processed successfully.\n\nDetails:\n- Amount: R${amount.toFixed(2)}\n- Reference: ${ref}\n- Date: ${new Date().toLocaleString()}\n- Description: ${note}\n\nThank you for choosing ZarPay 🇿🇦.`,
      'transaction'
    );

    showToast(`Paid R${amount.toFixed(2)} to ${contact.name}! 🚀 POP emailed.`);
    setTimeout(() => setCurrentScreen(AppScreen.HOME), 150);
  };

  // Add Cash Deposit Handler
  const handleAddCash = (amount: number, bank: string) => {
    setBalance(prev => prev + amount);
    const ref = 'DEP-' + Math.floor(1000000 + Math.random() * 9000000);
    const newTx: Transaction = {
      id: 'dep-' + Date.now(),
      type: 'received',
      amount,
      date: new Date().toISOString(),
      counterparty: {
        id: 'bank-dep',
        name: bank,
        handle: '@instant_eft',
        avatar: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=120&auto=format&fit=crop&q=80'
      },
      note: `Deposit via ${bank}`,
      category: 'Deposit',
      reference: ref,
      status: 'completed'
    };

    setTransactions(prev => [newTx, ...prev]);
    triggerConfetti();
    sendEmailNotification(
      `Deposit Confirmed: R${amount.toFixed(2)} credited`,
      `Instant EFT deposit from ${bank} of R${amount.toFixed(2)} has been credited.`,
      `Hi ${currentUser?.name},\n\nWe have credited R${amount.toFixed(2)} to your ZarPay wallet via ${bank}.\n\nNew balance: R${(balance + amount).toFixed(2)}\nReference: ${ref}`,
      'deposit'
    );
    showToast(`Added R${amount.toFixed(2)} from ${bank}! 💰`);
  };

  // Cash Out Handler
  const handleCashOut = (amount: number) => {
    setBalance(prev => prev - amount);
    const ref = 'WTH-' + Math.floor(1000000 + Math.random() * 9000000);
    const newTx: Transaction = {
      id: 'wth-' + Date.now(),
      type: 'sent',
      amount,
      date: new Date().toISOString(),
      counterparty: {
        id: 'bank-capitec',
        name: 'Capitec Bank •••• 4492',
        handle: '@capitec_sa',
        avatar: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=120&auto=format&fit=crop&q=80'
      },
      note: 'Instant Cash Out to Capitec',
      category: 'Withdrawal',
      reference: ref,
      status: 'completed'
    };

    setTransactions(prev => [newTx, ...prev]);
    sendEmailNotification(
      `Withdrawal Processed: R${amount.toFixed(2)} transferred to Capitec`,
      `Your cash out request of R${amount.toFixed(2)} was sent to your Capitec account.`,
      `Hi ${currentUser?.name},\n\nR${amount.toFixed(2)} has been transferred instantly to Capitec account •••• 4492.\nReference: ${ref}`,
      'transaction'
    );
    showToast(`R${amount.toFixed(2)} transferred to Capitec!`);
  };

  // Stash Deposit Handler
  const handleDepositToStash = (goalId: string, amount: number) => {
    if (balance < amount) {
      showToast("Insufficient balance to stash.");
      return;
    }
    setBalance(prev => prev - amount);
    setSavings(prev => prev.map(s => {
      if (s.id === goalId) {
        return { ...s, current: s.current + amount };
      }
      return s;
    }));
    playSound('cash');
    triggerConfetti();
    showToast(`Stashed R${amount} toward your goal! 🎯`);
  };

  // Create Stash Handler
  const handleCreateStash = (name: string, target: number, icon: string) => {
    const newGoal: SavingsGoal = {
      id: 'stash-' + Date.now(),
      name,
      target,
      current: 0,
      icon
    };
    setSavings(prev => [...prev, newGoal]);
    showToast(`Created new Stash Jar: "${name}"!`);
  };

  // Like Feed Item Handler
  const handleLikeFeedItem = (id: string) => {
    playSound('pop');
    setFeed(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1,
          isLiked: !item.isLiked
        };
      }
      return item;
    }));
  };

  // Add Community Post
  const handleAddCommunityPost = (content: string) => {
    const newItem: FeedItem = {
      id: 'f-' + Date.now(),
      type: 'tip',
      title: `${currentUser?.name.split(' ')[0]}'s Money Move`,
      content,
      timestamp: 'Just now',
      likes: 1,
      isLiked: true
    };
    setFeed(prev => [newItem, ...prev]);
    showToast("Shared your money move with the ZarPay community! 🇿🇦");
  };

  // Learn & Earn Reward Handler
  const handleQuizReward = (bonus: number) => {
    setBalance(prev => prev + bonus);
    triggerConfetti();
    sendEmailNotification(
      `Reward Earned: R${bonus.toFixed(2)} for Savings 101`,
      `Congratulations! You passed the Savings 101 quiz and earned R${bonus.toFixed(2)}.`,
      `Awesome job, ${currentUser?.name}!\n\nYou earned R${bonus.toFixed(2)} for mastering the 50/30/20 rule. Keep learning to unlock more rewards!`,
      'welcome'
    );
    showToast(`🎓 Certified Saver Badge unlocked! +R${bonus} added to balance!`);
  };

  // Register New User Handler
  const handleRegisterUser = (newUser: User) => {
    setCurrentUser(newUser);
    setRegisteredUsers(prev => [newUser, ...prev]);
    sendEmailNotification(
      `Welcome to ZarPay 🇿🇦, ${newUser.name}!`,
      `Your account (${newUser.handle}) is registered and active with zero fees.`,
      `Hi ${newUser.name},\n\nWelcome to the ZarPay community! Your account has been authenticated.\n\n- Name: ${newUser.name}\n- Handle: ${newUser.handle}\n- Email: ${newUser.email}\n- Bonus Balance: R1,000.00\n\nHappy sending and saving! 🇿🇦`,
      'welcome'
    );
    triggerConfetti();
    showToast(`Account created for ${newUser.name}! Welcome email sent.`);
  };

  // Logout Handler
  const handleLogout = () => {
    playSound('pop');
    setCurrentUser(null);
    setCurrentScreen(AppScreen.HOME);
    showToast("Signed out successfully.");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!currentUser) {
    return (
      <AuthScreen 
        onRegister={handleRegisterUser}
        onLogin={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.name}!`);
        }}
        registeredUsers={registeredUsers}
        onTriggerEmailToast={(msg) => showToast(msg)}
      />
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.HOME:
        return (
          <HomeScreen 
            onNavigate={handleNavigate} 
            balance={balance} 
            transactions={transactions} 
            currentUser={currentUser} 
            unreadCount={unreadCount}
            onOpenShare={() => setIsShareOpen(true)}
            onLockApp={handleLockApp}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenAddCash={() => setIsAddCashOpen(true)}
            onOpenCashOut={() => setIsCashOutOpen(true)}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            onOpenDailyTip={() => setIsDailyTipOpen(true)}
            onSelectTx={(tx) => setSelectedTxForReceipt(tx)}
          />
        );
      case AppScreen.SEND:
        return (
          <SendScreen 
            onBack={() => handleNavigate(AppScreen.HOME)} 
            onSend={handleSendMoney}
            contacts={CONTACTS}
            balance={balance}
          />
        );
      case AppScreen.COMMUNITY:
        return (
          <CommunityScreen 
            feed={feed}
            onLikeItem={handleLikeFeedItem}
            onShareItem={(item) => setIsShareOpen(true)}
            onOpenQuiz={() => setIsQuizOpen(true)}
            onAddPost={handleAddCommunityPost}
          />
        );
      case AppScreen.WALLET:
        return (
          <WalletScreen 
            balance={balance} 
            savings={savings}
            banks={banks}
            onLockWallet={handleLockWallet}
            onTestBiometrics={handleTestBiometrics}
            preferredBiometric={preferredBiometric}
            setPreferredBiometric={setPreferredBiometric}
            onOpenAddCash={() => setIsAddCashOpen(true)}
            onOpenCashOut={() => setIsCashOutOpen(true)}
            onOpenCreateStash={() => setIsCreateStashOpen(true)}
            onDepositToStash={handleDepositToStash}
          />
        );
      case AppScreen.AI_ASSISTANT:
        return <SmartAdvisorScreen transactions={transactions} />;
      case AppScreen.GUIDE:
        return (
          <ProductGuideScreen 
            onBack={() => handleNavigate(AppScreen.HOME)} 
            onShowToast={(msg) => showToast(msg)}
          />
        );
      default:
        return (
          <HomeScreen 
            onNavigate={handleNavigate} 
            balance={balance} 
            transactions={transactions} 
            currentUser={currentUser} 
            unreadCount={unreadCount}
            onOpenShare={() => setIsShareOpen(true)}
            onLockApp={handleLockApp}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenAddCash={() => setIsAddCashOpen(true)}
            onOpenCashOut={() => setIsCashOutOpen(true)}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            onOpenDailyTip={() => setIsDailyTipOpen(true)}
            onSelectTx={(tx) => setSelectedTxForReceipt(tx)}
          />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden font-sans">
      <ToastBanner message={toastMessage} onClose={() => setToastMessage(null)} />
      <ConfettiBurst active={confettiActive} />

      {renderScreen()}

      {currentScreen !== AppScreen.SEND && (
        <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
      )}

      {/* Interactive Modals */}
      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        currentUser={currentUser} 
      />

      <BiometricAuthModal 
        isOpen={biometricPrompt.isOpen}
        title={biometricPrompt.title}
        subtitle={biometricPrompt.subtitle}
        allowCancel={biometricPrompt.allowCancel}
        defaultMode={preferredBiometric}
        currentUser={currentUser}
        onSuccess={biometricPrompt.onSuccess}
        onCancel={biometricPrompt.onCancel}
      />

      <NotificationDrawer 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          showToast("All notifications marked as read.");
        }}
        onSelectNotification={(n) => {
          setSelectedEmail(n);
          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        }}
      />

      <EmailDetailModal 
        notification={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />

      <TransactionReceiptModal 
        transaction={selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
        onAskAI={(tx) => {
          setSelectedTxForReceipt(null);
          setCurrentScreen(AppScreen.AI_ASSISTANT);
        }}
        onShareReceipt={(tx) => {
          setIsShareOpen(true);
        }}
      />

      <AddCashModal 
        isOpen={isAddCashOpen}
        onClose={() => setIsAddCashOpen(false)}
        onConfirm={handleAddCash}
      />

      <CashOutModal 
        isOpen={isCashOutOpen}
        balance={balance}
        onClose={() => setIsCashOutOpen(false)}
        onConfirm={handleCashOut}
      />

      <QRScannerModal 
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanUser={(contact) => {
          setCurrentScreen(AppScreen.SEND);
        }}
      />

      <DailyTipModal 
        isOpen={isDailyTipOpen}
        onClose={() => setIsDailyTipOpen(false)}
        onAskAI={() => {
          setCurrentScreen(AppScreen.AI_ASSISTANT);
        }}
      />

      <CreateStashModal 
        isOpen={isCreateStashOpen}
        onClose={() => setIsCreateStashOpen(false)}
        onCreate={handleCreateStash}
      />

      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        transactions={transactions}
        contacts={CONTACTS}
        onSelectUser={(user) => {
          setCurrentScreen(AppScreen.SEND);
        }}
        onSelectTx={(tx) => {
          setSelectedTxForReceipt(tx);
        }}
      />

      <ProfileModal 
        isOpen={isProfileOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileOpen(false)}
        onLogout={handleLogout}
        onLockNow={handleLockApp}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenGuide={() => {
          setIsProfileOpen(false);
          handleNavigate(AppScreen.GUIDE);
        }}
        onDownloadScriptPDF={() => {
          setIsProfileOpen(false);
          const a = document.createElement('a');
          a.href = '/api/download-presentation-script';
          a.download = 'ZarPay_Presentation_Script.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast("Downloading ZarPay Presentation Script PDF!");
        }}
        onDownloadZip={() => {
          setIsProfileOpen(false);
          const a = document.createElement('a');
          a.href = '/api/download-zip';
          a.download = 'zarpay_full_project.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast("Downloading full ZarPay project ZIP archive!");
        }}
      />

      <QuizModal 
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onReward={handleQuizReward}
      />
    </div>
  );
};

export default App;