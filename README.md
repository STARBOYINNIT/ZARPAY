# ZarPay — Modern South African Peer-to-Peer Fintech App

> Fast, fee-free payments, instant EFT top-ups, gamified micro-savings stashes, and localized AI financial guidance for South Africa.

---

## 🚀 Overview

**ZarPay** is a high-performance digital wallet engineered specifically for the South African consumer landscape. It eliminates traditional banking friction—slow EFT settlement times, excessive inter-bank fees, and cumbersome proof-of-payment sharing—by offering instant payments via **@cashtag**, phone number, or QR code.

### Key Highlights
- 🔒 **5-Digit PIN & Biometric Security:** Mandatory 5-digit PIN authentication paired with mock Face ID / Fingerprint sensor prompts and vibration haptic feedback.
- ⚡ **Instant EFT & Zero Transaction Fees:** Simulated instant top-ups from Capitec, FNB, Standard Bank, Nedbank, and Absa.
- 🔔 **Multi-Channel Email Notifications:** Real-time email dispatch simulations with unread badges, timestamped receipts, and security alerts.
- 🍯 **Stash Jars (Micro-Savings):** Goal-based savings pockets with visual progress bars, instant transfers, and zero withdrawal penalties.
- 🤖 **ZarAI Financial Mentor:** Built on Google Gemini with local South African context (mentorship on budgets, groceries, takeaways, and saving moola).
- 🎙️ **Pitch & Presentation Suite:** Embedded 5-minute showcase script, prompter mode, interactive product guide, and ready-to-print 3-page PDF presentation script.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React icons
- **Data & Charts:** Recharts
- **Audio & Sensory:** Web Audio API sound synthesizer (cash chime, pop, lock feedback), HTML5 Vibration API
- **PDF Generation:** jsPDF, html2canvas, Node.js PDFKit generator script
- **Backend Server:** Node.js, Express, tsx (`server.ts`)
- **AI SDK:** `@google/genai` (Google Gemini 2.5 Flash / 3.8 Flash)

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup (Optional)
If you wish to use live Google Gemini AI responses for ZarAI:
```bash
cp .env.example .env
```
Add your key to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(ZarAI functions in offline demo mode automatically if no key is provided.)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Demo Credentials

| Role | Name | Email | 5-Digit PIN | Handle |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Demo** | Thabo Mbeki | `thabo.mbeki@zarpay.co.za` | **`12345`** | `@thabo` |
| **Contact 1** | Nomsa Dlamini | `nomsa.d@gmail.com` | **`12345`** | `@nomsa` |
| **Contact 2** | Sipho Ndlovu | `sipho.n@outlook.com` | **`12345`** | `@sipho` |
| **New Users** | Self-Registration | Any valid email + phone | Set custom 5-digit PIN | Custom |

---

## 📂 Project Structure

```
├── App.tsx                     # Main interactive application & navigation coordinator
├── server.ts                   # Express backend API, Gemini AI proxy & download endpoints
├── constants.ts                # Mock accounts, transactions, contacts & Stash Jars
├── types.ts                    # TypeScript definitions
├── index.html                  # HTML5 entry point
├── index.tsx                   # React root mount
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite bundler configuration
├── components/
│   └── Components.tsx          # Reusable UI cards, buttons, navbars, and badges
├── services/
│   └── geminiService.ts        # Client-side API connector for ZarAI
├── scripts/
│   └── generate_presentation_pdf.js # PDFKit generation script for 3-page pitch script
└── public/
    ├── ZarPay_Presentation_Script.pdf # 3-page official presentation script
    └── zarpay_project.zip             # Downloadable full project archive
```

---

## 📄 Presentation Script & Pitch Materials

- **In-App:** Click the **Showcase** icon or go to **Profile > Showcase Script & Pitch Guide**.
- **Downloadable PDF:** Accessible at `/api/download-presentation-script` or `/ZarPay_Presentation_Script.pdf`.
- **Downloadable ZIP:** Accessible at `/api/download-zip` or `/zarpay_project.zip`.
