import { User, Transaction, SavingsGoal, FeedItem, EmailNotification, BankAccount } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Thabo Mbeki',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  handle: '@thabo_sa',
  phone: '072 123 4567',
  email: 'thabo.mbeki@zarpay.co.za',
  password: 'Password123!',
  isVerified: true,
  joinedDate: 'Jan 2024',
  balance: 12450.00,
  pin: '12345'
};

export const CONTACTS: User[] = [
  { 
    id: 'u2', 
    name: 'Nomsa Dlamini', 
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', 
    handle: '@nomsa_d', 
    phone: '082 555 0001',
    email: 'nomsa@wits.ac.za',
    pin: '12345'
  },
  { 
    id: 'u3', 
    name: 'Johan Smit', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', 
    handle: '@jsmit', 
    phone: '083 555 0002',
    email: 'johan.smit@uct.ac.za'
  },
  { 
    id: 'u4', 
    name: 'Lerato Kganyago', 
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80', 
    handle: '@lerato_k', 
    phone: '071 555 0003',
    email: 'lerato@gmail.com'
  },
  { 
    id: 'u5', 
    name: 'Priya Naidoo', 
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', 
    handle: '@priya_n', 
    phone: '061 555 0004',
    email: 'priya.naidoo@sun.ac.za'
  },
  { 
    id: 'u6', 
    name: 'Campus Cafe & Tuckshop', 
    avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80', 
    handle: '@campus_food', 
    phone: '076 555 0005',
    email: 'campuscafe@varsity.co.za'
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'sent',
    amount: 85.00,
    date: '2026-10-25T10:30:00',
    counterparty: CONTACTS[0],
    note: 'Lunch at Nandos Braamfontein 🍗',
    category: 'Food & Dining',
    reference: 'ZP-8492019',
    status: 'completed'
  },
  {
    id: 't2',
    type: 'received',
    amount: 1500.00,
    date: '2026-10-24T14:15:00',
    counterparty: CONTACTS[1],
    note: 'Freelance UI/UX design project 🎨',
    category: 'Freelance & Income',
    reference: 'ZP-8491823',
    status: 'completed'
  },
  {
    id: 't3',
    type: 'sent',
    amount: 25.00,
    date: '2026-10-23T08:45:00',
    counterparty: CONTACTS[4],
    note: 'Morning Rooibos tea & scone ☕',
    category: 'Food & Dining',
    reference: 'ZP-8489012',
    status: 'completed'
  },
  {
    id: 't4',
    type: 'sent',
    amount: 120.00,
    date: '2026-10-22T17:20:00',
    counterparty: CONTACTS[2],
    note: 'Split taxi fare from Sandton to Campus 🚕',
    category: 'Transport',
    reference: 'ZP-8487654',
    status: 'completed'
  }
];

export const MOCK_SAVINGS: SavingsGoal[] = [
  { id: 's1', name: 'New MacBook Air', target: 18000, current: 7500, icon: '💻', category: 'Tech' },
  { id: 's2', name: 'December Durban Hol', target: 5000, current: 2800, icon: '🏖️', category: 'Travel' },
  { id: 's3', name: 'Emergency Rainy Day Stash', target: 10000, current: 4200, icon: '🛡️', category: 'Safety' },
  { id: 's4', name: 'Sneakers & Streetwear', target: 3000, current: 1500, icon: '👟', category: 'Style' }
];

export const MOCK_FEED: FeedItem[] = [
  {
    id: 'f1',
    type: 'transaction',
    user: CONTACTS[0],
    counterparty: CONTACTS[4],
    amount: 20,
    note: 'Hot Amagwinya & Atchar for breakfast 🥯',
    timestamp: '5m ago',
    likes: 18,
    isLiked: false
  },
  {
    id: 'f2',
    type: 'tip',
    title: 'Mzansi Money Hack #14',
    content: 'Buying groceries in bulk with your roommates at Boxer or Checkers saves up to R600 each per month! Cook big batches on Sunday.',
    timestamp: '1h ago',
    likes: 312,
    isLiked: true
  },
  {
    id: 'f3',
    type: 'transaction',
    user: CONTACTS[2],
    counterparty: CONTACTS[3],
    amount: 50,
    note: 'MTN 5GB Night Owl Data Bundle 📱⚡',
    timestamp: '3h ago',
    likes: 9,
    isLiked: false
  },
  {
    id: 'f4',
    type: 'spotlight',
    title: 'Campus Food Vendor: Mama D’s Kotas',
    content: 'Best hot quarter loaf Kotas on campus! Pay via ZarPay QR code to score R5 cash back on every order.',
    timestamp: '6h ago',
    likes: 142,
    isLiked: true
  }
];

export const INITIAL_NOTIFICATIONS: EmailNotification[] = [
  {
    id: 'n1',
    to: 'thabo.mbeki@zarpay.co.za',
    subject: 'Welcome to ZarPay 🇿🇦 - Account Activated',
    preview: 'Your account is now verified and active. Send and receive money with zero fees!',
    body: `Hi Thabo,\n\nWelcome to ZarPay! Your account (@thabo_sa) has been successfully verified.\n\nYou now have full access to:\n- Instant peer-to-peer payments\n- AI Financial Mentorship with ZarAI\n- Stash Jars for automated goal savings\n- Community Money Moves feed\n\nIf you have any questions, reach out to support@zarpay.co.za.\n\nWarm regards,\nThe ZarPay Security Team 🇿🇦`,
    timestamp: 'Just now',
    type: 'welcome',
    read: false,
    reference: 'ZP-AUTH-001'
  },
  {
    id: 'n2',
    to: 'thabo.mbeki@zarpay.co.za',
    subject: 'Proof of Payment: R85.00 to Nomsa Dlamini',
    preview: 'Your instant payment of R85.00 has cleared successfully.',
    body: `Hi Thabo,\n\nThis is your official Proof of Payment (POP).\n\nDetails:\n- Amount: R85.00\n- Recipient: Nomsa Dlamini (@nomsa_d)\n- Note: Lunch at Nandos Braamfontein\n- Ref: ZP-8492019\n- Date: 25 Oct 2026\n\nFunds have been transferred instantly with zero transaction fees.`,
    timestamp: '2h ago',
    type: 'transaction',
    read: true,
    reference: 'ZP-8492019'
  }
];

export const MOCK_BANKS: BankAccount[] = [
  {
    id: 'b1',
    bankName: 'Capitec Bank',
    accountNumber: '•••• 4492',
    accountType: 'Savings Account',
    isPrimary: true,
    color: '#002B49'
  },
  {
    id: 'b2',
    bankName: 'First National Bank (FNB)',
    accountNumber: '•••• 9104',
    accountType: 'Cheque Account',
    isPrimary: false,
    color: '#0097A7'
  },
  {
    id: 'b3',
    bankName: 'Standard Bank',
    accountNumber: '•••• 3812',
    accountType: 'Access Account',
    isPrimary: false,
    color: '#0033A0'
  }
];