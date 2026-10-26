import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, Home, Users, Sparkles, User, Heart, Share2, Lightbulb } from 'lucide-react';
import { FeedItem } from '../types';

// --- Buttons ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 border border-transparent",
    secondary: "bg-gray-100 text-black hover:bg-gray-200 border border-transparent",
    ghost: "bg-transparent text-black hover:bg-gray-50 border border-transparent",
    outline: "bg-transparent text-black border border-gray-300 hover:bg-gray-50"
  };

  const sizes = {
    xs: "px-3 py-1 text-xs",
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg font-semibold"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Inputs ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input 
        className={`bg-gray-100 border-none rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-black transition-all placeholder-gray-400 ${className}`}
        {...props}
      />
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
};

// --- Cards ---

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}>
    {children}
  </div>
);

// --- Navigation ---

interface NavProps {
  currentScreen: string;
  onNavigate: (screen: any) => void;
}

export const BottomNav: React.FC<NavProps> = ({ currentScreen, onNavigate }) => {
  const items = [
    { id: 'HOME', icon: Home, label: 'Home' },
    { id: 'COMMUNITY', icon: Users, label: 'Community' }, // Replaced Activity with Community
    { id: 'AI_ASSISTANT', icon: Sparkles, label: 'Mentor' },
    { id: 'WALLET', icon: Wallet, label: 'Wallet' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 h-20 flex justify-between items-center z-50">
      {items.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${isActive ? 'text-black' : 'text-gray-400'}`}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        )
      })}
    </div>
  );
};

// --- Transaction Item ---

export const TransactionItem: React.FC<{ 
  title: string; 
  subtitle: string; 
  amount: number; 
  type: 'sent' | 'received';
  image?: string;
  category?: string;
  onClick?: () => void;
}> = ({ title, subtitle, amount, type, image, category, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 transition-all ${
      onClick ? 'cursor-pointer hover:bg-gray-50/80 active:scale-98 px-2 -mx-2 rounded-xl' : ''
    }`}
  >
    <div className="flex items-center gap-3.5">
      {image ? (
        <img src={image} alt={title} className="w-11 h-11 rounded-full object-cover bg-gray-200 border border-gray-100 shadow-2xs" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={18} className="text-gray-500" />
        </div>
      )}
      <div>
        <p className="font-semibold text-sm text-black leading-snug">{title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-500">{subtitle}</span>
          {category && (
            <>
              <span className="text-gray-300 text-xs">•</span>
              <span className="text-[11px] text-gray-500 font-medium">{category}</span>
            </>
          )}
        </div>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-bold text-sm tracking-tight ${type === 'received' ? 'text-emerald-600' : 'text-neutral-900'}`}>
        {type === 'received' ? '+' : '-'}R{amount.toFixed(2)}
      </p>
      <span className="text-[10px] text-gray-400">Instant EFT</span>
    </div>
  </div>
);

// --- Feed Item (Community) ---

export const FeedItemCard: React.FC<{ 
  item: FeedItem; 
  onLike?: () => void;
  onShare?: () => void;
}> = ({ item, onLike, onShare }) => {
  if (item.type === 'tip') {
    return (
      <Card className="bg-black text-white border-none mb-4 shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gray-800 rounded-2xl shrink-0">
            <Lightbulb size={20} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">{item.title}</p>
            <p className="font-medium text-sm leading-relaxed mb-3 text-gray-100">{item.content}</p>
            <div className="flex gap-4 text-gray-400 text-xs font-semibold">
              <button 
                type="button"
                onClick={onLike}
                className={`flex items-center gap-1.5 transition-colors ${item.isLiked ? 'text-red-400 font-bold' : 'hover:text-white'}`}
              >
                <Heart size={14} className={item.isLiked ? 'fill-red-400 text-red-400' : ''} /> 
                <span>{item.likes}</span>
              </button>
              <button 
                type="button"
                onClick={onShare}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Share2 size={14} /> 
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (item.type === 'spotlight') {
    return (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 mb-4 shadow-xs">
            <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white rounded-2xl shadow-2xs text-black shrink-0">
                <Sparkles size={20} className="text-amber-500" />
            </div>
            <div className="flex-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{item.title}</p>
                <p className="font-medium text-gray-900 text-sm leading-relaxed mb-2.5">{item.content}</p>
                <div className="flex gap-4 text-gray-500 text-xs font-semibold">
                <button 
                  type="button"
                  onClick={onLike}
                  className={`flex items-center gap-1.5 transition-colors ${item.isLiked ? 'text-red-500 font-bold' : 'hover:text-black'}`}
                >
                  <Heart size={14} className={item.isLiked ? 'fill-red-500 text-red-500' : ''} /> 
                  <span>{item.likes}</span>
                </button>
                <button 
                  type="button"
                  onClick={onShare}
                  className="flex items-center gap-1.5 hover:text-black transition-colors"
                >
                  <Share2 size={14} /> 
                  <span>Share</span>
                </button>
                </div>
            </div>
            </div>
        </Card>
    )
  }

  // Transaction
  return (
    <Card className="mb-3.5 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-900">{item.user?.name.split(' ')[0]}</span>
          <span className="text-gray-400 text-xs font-medium">paid</span>
          <span className="font-bold text-sm text-gray-900">{item.counterparty?.name.split(' ')[0]}</span>
        </div>
        <span className="text-[11px] text-gray-400">{item.timestamp}</span>
      </div>
      <p className="text-gray-700 text-sm mb-3">
        {item.note} 
        {(item.amount || 0) <= 100 && (
          <span className="font-bold text-black ml-1.5 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
            R{item.amount?.toFixed(2)}
          </span>
        )}
      </p>
      <div className="flex gap-4 text-gray-400 text-xs font-semibold">
        <button 
          type="button"
          onClick={onLike}
          className={`flex items-center gap-1.5 transition-colors ${item.isLiked ? 'text-red-500 font-bold' : 'hover:text-black'}`}
        >
          <Heart size={14} className={item.isLiked ? 'fill-red-500 text-red-500' : ''} /> 
          <span>{item.likes}</span>
        </button>
        <button 
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 hover:text-black transition-colors"
        >
          <Share2 size={14} /> 
          <span>Share</span>
        </button>
      </div>
    </Card>
  );
};

// --- Header ---
export const Header: React.FC<{ title: string, backAction?: () => void, rightAction?: React.ReactNode }> = ({ title, backAction, rightAction }) => (
  <div className="flex items-center justify-between p-6 bg-white sticky top-0 z-40 border-b border-gray-50">
    <div className="flex items-center">
        {backAction && (
        <button onClick={backAction} className="mr-4 p-2 -ml-2 rounded-full hover:bg-gray-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
    </div>
    {rightAction && <div>{rightAction}</div>}
  </div>
);