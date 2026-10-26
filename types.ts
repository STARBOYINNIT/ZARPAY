export interface User {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  phone?: string;
  email?: string;
  password?: string;
  isVerified?: boolean;
  joinedDate?: string;
  balance?: number;
  pin?: string;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  date: string;
  counterparty: User;
  note: string;
  category: string;
  reference?: string;
  status?: 'completed' | 'pending' | 'processing';
  voucherCode?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string; // Emoji
  category?: string;
}

export interface FeedItem {
  id: string;
  type: 'transaction' | 'tip' | 'spotlight';
  user?: User; // For transactions
  counterparty?: User; // For transactions
  amount?: number;
  note?: string;
  title?: string; // For tips
  content?: string; // For tips
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  type: 'welcome' | 'transaction' | 'security' | 'stash' | 'deposit';
  read: boolean;
  reference?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  isPrimary: boolean;
  color: string;
}

export enum AppScreen {
  HOME = 'HOME',
  SEND = 'SEND',
  COMMUNITY = 'COMMUNITY',
  WALLET = 'WALLET',
  AI_ASSISTANT = 'AI_ASSISTANT',
  GUIDE = 'GUIDE',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}