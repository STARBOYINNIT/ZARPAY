import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

function createPresentationScriptPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4', // 595.28 x 841.89 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  function checkPageBreak(neededHeight) {
    if (currentY + neededHeight > pageHeight - margin - 30) {
      doc.addPage();
      currentY = margin;
      drawPageHeader();
    }
  }

  function drawPageHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('ZARPAY  |  OFFICIAL PRESENTATION & DEMO SCRIPT', margin, 28);
    doc.setFont('helvetica', 'normal');
    doc.text('MZANSI DIGITAL WALLET SHOWCASE', pageWidth - margin, 28, { align: 'right' });
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.75);
    doc.line(margin, 34, pageWidth - margin, 34);
  }

  // --- Cover / Header Banner ---
  drawPageHeader();

  // Badge
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, currentY, 115, 18, 9, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('LIVE DEMO MANUAL', margin + 57.5, currentY + 12, { align: 'center' });

  currentY += 28;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text('ZarPay Presentation & Pitch Script', margin, currentY);
  currentY += 20;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text('A step-by-step 5-minute showcase guide with speaker notes, stage directions, and Q&A.', margin, currentY);
  currentY += 18;

  // Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 54, 8, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('SHOWCASE METADATA', margin + 12, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('• Duration: ~5 Minutes (Flexible)', margin + 12, currentY + 30);
  doc.text('• Demo PIN: 12345 (5 digits)', margin + 12, currentY + 44);
  doc.text('• Audience: Evaluators, Friends, Investors', margin + 180, currentY + 30);
  doc.text('• Focus: Real fintech workflow, biometrics, ZarAI', margin + 180, currentY + 44);
  doc.text('• Currency: South African Rand (ZAR)', margin + 370, currentY + 30);
  doc.text('• Keynote Tone: Confident, energetic, relatable', margin + 370, currentY + 44);

  currentY += 68;

  const sections = [
    {
      part: 'PART 1: THE HOOK & INTRODUCTION',
      time: '0:00 - 0:30',
      action: 'Start on the 5-Digit PIN Login Screen. Hold your phone up or display screen.',
      say: [
        `"Good day everyone! How many times have you tried to split a restaurant bill with friends, or send money home quickly, only to be stopped by high inter-bank transfer fees, endless branch queues, or waiting 2 to 3 business days for payment to reflect?"`,
        `"Traditional banking wasn't built for our modern, on-the-go lifestyle. That's why I created ZarPay — South Africa's modern digital wallet built for lightning-fast peer-to-peer payments, zero transaction fees, and AI-powered financial mentorship."`
      ],
      tip: 'Speak with conviction. Make direct eye contact with the audience during the opening question.'
    },
    {
      part: 'PART 2: AUTHENTICATION & 5-DIGIT PIN SECURITY',
      time: '0:30 - 1:15',
      action: 'Live demo entering the 5-digit PIN (1-2-3-4-5) or biometric unlock into the phone.',
      say: [
        `"Security in fintech is paramount. When opening ZarPay, every session is fortified with a mandatory 5-digit security PIN alongside biometrics like Face ID and Fingerprint recognition."`,
        `"Watch as I punch in my 5-digit PIN [demonstrate 1-2-3-4-5]. Instant vibration feedback, zero lag. If I'm on a modern phone, one scan of my Face ID or fingerprint opens the wallet in under half a second. Once logged in, every user also receives an immediate simulated email notification verifying their secure session."`
      ],
      tip: 'Type the PIN clearly so everyone sees the 5 dots illuminate and transition into the home dashboard.'
    },
    {
      part: 'PART 3: THE DIGITAL WALLET & ZERO-FEE BANKING',
      time: '1:15 - 2:00',
      action: 'Navigate to the Wallet tab, tap "+ Add Cash", and select Capitec or FNB Instant EFT.',
      say: [
        `"Here is the main ZarPay dashboard. You can see your live balance in South African Rand (ZAR) — in this demo, R 12,450.00."`,
        `"Adding money is seamless. I click '+ Add Cash', choose from our integrated instant EFT partners — Capitec, FNB, Standard Bank, or Nedbank — specify an amount like R 250, and confirm. Within a second, the balance updates live, confetti pops, and an official confirmation email is delivered to my inbox. No waiting for bank business days."`
      ],
      tip: 'Show the instant EFT modal and highlight the South African banking logos.'
    },
    {
      part: 'PART 4: PEER-TO-PEER INSTANT PAYMENTS & CASHTAGS',
      time: '2:00 - 3:00',
      action: 'Tap the Pay/Send button in the center nav bar. Search for a friend or tap an existing contact.',
      say: [
        `"Now, for the core superpower of ZarPay: Instant P2P Payments. Traditional EFT requires account numbers, branch codes, and proof-of-payment PDFs. On ZarPay, you only need a Cashtag or phone number."`,
        `"Let's say I'm reimbursing my friend Sipho for Friday night braai meat. I tap Pay, search @sipho, enter R 150, type 'Braai meat & drinks', and hit Send. Boom! Instant chime, transaction logged, interactive receipt ready to share on WhatsApp, and zero bank charges."`
      ],
      tip: 'Open the receipt popup to show the transaction ID, timestamp, and WhatsApp share button.'
    },
    {
      part: 'PART 5: STASH JARS & MICRO-SAVINGS',
      time: '3:00 - 3:45',
      action: 'Open the Stash Jars section in Wallet. Tap "+ Create Stash" or deposit R 50 into Emergency Fund.',
      say: [
        `"Most young South Africans struggle to save because high-interest savings accounts lock your money away with stiff penalties. ZarPay introduces 'Stash Jars' — gamified micro-savings."`,
        `"Users can create custom stashes like 'December Holiday', 'Car Deposit', or 'Emergency Fund'. Watch me transfer R 100 straight from my spending balance into my Emergency Jar. It tracks your percentage goal visually, helping users build real wealth one small deposit at a time."`
      ],
      tip: 'Highlight that micro-savings can be unlocked without any penalty fees.'
    },
    {
      part: 'PART 6: ZarAI — THE SMART FINANCIAL MENTOR',
      time: '3:45 - 4:30',
      action: 'Tap the ZarAI tab in bottom navigation. Tap a prompt chip like "How do I cut down on takeaways?".',
      say: [
        `"What truly sets ZarPay apart from legacy banking apps is ZarAI — our built-in financial mentor powered by Google Gemini AI."`,
        `"ZarAI analyzes your actual transaction history to give street-smart, localized financial coaching in relatable South African English. Watch: I tap 'How do I cut down on takeaways?' and ZarAI breaks down my spending patterns, offers practical meal-prep advice, and calculates how much moola I can save each month."`
      ],
      tip: 'Point out the localized slang and encouraging, non-judgmental tone.'
    },
    {
      part: 'PART 7: COMMUNITY, QUIZ & CLOSING HOOK',
      time: '4:30 - 5:15',
      action: 'Tap the Community tab, show the live social payment feed, and tap "Take Quiz" to win bonus Rand.',
      say: [
        `"Finally, ZarPay fosters financial wellness through community. Our feed shows friends paying each other with fun emojis, and our 'Learn & Earn Quiz' rewards users with real wallet balance when they complete financial literacy challenges."`,
        `"To wrap up: ZarPay solves South Africa's banking friction with 5-digit PIN security, zero-fee instant transfers, micro-savings stashes, and Gemini AI intelligence. It's not just another wallet — it's the financial companion Mzansi deserves."`,
        `"Thank you! You can scan the QR code right here on my phone to try ZarPay yourself. I welcome any questions!"`
      ],
      tip: 'Open the Share Modal or QR code on screen so people can scan and test on their devices.'
    }
  ];

  for (const s of sections) {
    checkPageBreak(130);

    // Section Header Box
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, currentY, contentWidth, 22, 4, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text(s.part, margin + 8, currentY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229); // indigo
    doc.text(`[${s.time}]`, pageWidth - margin - 8, currentY + 14, { align: 'right' });

    currentY += 30;

    // Stage Action / Direction Box
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, currentY, contentWidth, 24, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(67, 56, 202);
    doc.text('STAGE ACTION:', margin + 8, currentY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(s.action, margin + 80, currentY + 15);

    currentY += 32;

    // Spoken Script
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('WHAT TO SAY (VERBATIM OR BULLETS):', margin, currentY);
    currentY += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    for (const paragraph of s.say) {
      const splitText = doc.splitTextToSize(paragraph, contentWidth - 10);
      const neededH = splitText.length * 12 + 6;
      checkPageBreak(neededH);
      doc.text(splitText, margin + 5, currentY);
      currentY += neededH;
    }

    // Pro presenter tip
    checkPageBreak(24);
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text('PRESENTER TIP:', margin + 8, currentY + 13);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text(s.tip, margin + 82, currentY + 13);

    currentY += 28;
  }

  // --- Q&A Cheat Sheet Section ---
  checkPageBreak(180);

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, currentY, contentWidth, 24, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('PRESENTER CHEAT SHEET & ANTICIPATED Q&A', margin + 10, currentY + 16);
  currentY += 34;

  const qas = [
    {
      q: 'Q: How does ZarPay make money if P2P transfers are free?',
      a: 'A: ZarPay utilizes a freemium merchant model — charging businesses a tiny 0.5% fee on commercial payments (half of card machines) plus premium high-yield Stash vaults.'
    },
    {
      q: 'Q: What happens if a user forgets their 5-digit PIN?',
      a: 'A: Account recovery triggers an encrypted verification link to their verified registered email address and biometric verification before PIN reset.'
    },
    {
      q: 'Q: What is the underlying tech stack powering this prototype?',
      a: 'A: Full-stack TypeScript: React 19 frontend with Tailwind CSS, Node/Express backend on Google Cloud Run, and Google Gemini Flash AI SDK for real-time financial mentorship.'
    },
    {
      q: 'Q: How does ZarPay ensure compliance with South African financial laws?',
      a: 'A: Designed according to FSCA guidelines, PASA clearing standards, and POPIA privacy encryption protocols.'
    }
  ];

  for (const item of qas) {
    checkPageBreak(45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(item.q, margin, currentY);
    currentY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const splitA = doc.splitTextToSize(item.a, contentWidth);
    doc.text(splitA, margin, currentY);
    currentY += splitA.length * 11 + 10;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('ZarPay (South Africa) — Confidential Presentation Guide & Demo Script', margin, pageHeight - 20);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  // Output file paths
  const publicPath = path.resolve('public', 'ZarPay_Presentation_Script.pdf');
  const rootPath = path.resolve('ZarPay_Presentation_Script.pdf');

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(publicPath, Buffer.from(pdfOutput));
  fs.writeFileSync(rootPath, Buffer.from(pdfOutput));

  console.log(`Successfully generated PDF at ${publicPath} and ${rootPath}`);
  console.log(`Total Pages: ${totalPages}`);
}

createPresentationScriptPDF();
