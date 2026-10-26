import { Transaction } from '../types';

export const analyzeSpending = async (transactions: Transaction[], query: string): Promise<string> => {
  try {
    const response = await fetch('/api/analyze-spending', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions,
        query,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data.text || "I couldn't analyze that right now. Give it another shot!";
  } catch (error) {
    console.error('ZarAI Request Error:', error);
    return "Eish, my brain had a brief connection delay. Check your internet connection or try asking again in a moment!";
  }
};