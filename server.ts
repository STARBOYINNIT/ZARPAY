import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API endpoint for ZarAI financial insights
app.post('/api/analyze-spending', async (req, res) => {
  const { transactions = [], query = '' } = req.body;

  if (!ai || !apiKey) {
    return res.status(200).json({
      text: "ZarAI is running in offline demo mode. Please attach a Gemini API key in Settings > Secrets to enable live AI responses.",
    });
  }

  const transactionContext = Array.isArray(transactions)
    ? transactions
        .map(
          (t: any) =>
            `- ${t.date || 'Recent'}: ${t.type === 'sent' ? 'Spent' : 'Received'} R${t.amount} for "${t.note || 'Payment'}" (${t.category || 'General'}) with ${t.counterparty?.name || 'Contact'}`
        )
        .join('\n')
    : 'No transactions recorded yet.';

  const systemInstruction = `
    You are ZarAI, a savvy, street-smart financial mentor for South African students and young professionals.
    Your goal is to teach financial literacy, encourage saving, and help users handle their money wisely.
    
    Tone: Encouraging, practical, relatable (use South African English nuances where appropriate, like "e-wallet", "bucks", "moola", "lekker").
    
    Key Functions:
    1. Analyze spending habits and budget trends.
    2. Give actionable tips on how to save money (e.g. cooking at home, bulk buys, student discounts).
    3. Encourage micro-savings (saving small amounts like R5, R10, or R20).
    4. Explain financial concepts simply without corporate jargon.
    
    Do not make up transactions. Rely on the context provided.
  `;

  const prompt = `Context:\n${transactionContext}\n\nUser Question: ${query}`;

  // Prioritize stable available models
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let generatedText = '';
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        generatedText = response.text;
        break;
      }
    } catch (err: any) {
      console.warn(`Attempt with model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  if (generatedText) {
    return res.json({ text: generatedText });
  }

  console.error('All Gemini model attempts failed:', lastError);
  return res.status(200).json({
    text: "Eish, my connection had a quick hiccup. Here's a quick tip while I reconnect: Try setting aside 10% of every payment into a separate micro-savings pocket before spending!",
  });
});

// Endpoint to download the official presentation script PDF
app.get('/api/download-presentation-script', (_req, res) => {
  const filePath = path.resolve(__dirname, 'public', 'ZarPay_Presentation_Script.pdf');
  res.download(filePath, 'ZarPay_Presentation_Script.pdf', (err) => {
    if (err) {
      console.error('Error serving presentation script PDF:', err);
      if (!res.headersSent) {
        res.status(500).send('Unable to download presentation script PDF');
      }
    }
  });
});

// Endpoint to download the full ZarPay project ZIP archive
app.get(['/api/download-zip', '/api/download-project-zip'], (_req, res) => {
  const filePath = path.resolve(__dirname, 'public', 'zarpay_project.zip');
  res.setHeader('Content-Type', 'application/zip');
  res.download(filePath, 'zarpay_full_project.zip', (err) => {
    if (err) {
      console.error('Error serving project ZIP:', err);
      if (!res.headersSent) {
        res.status(500).send('Unable to download project ZIP');
      }
    }
  });
});

// Setup Vite middlewares in development or static serving in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
