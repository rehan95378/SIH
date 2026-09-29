/**
 * Direct Gemini API service (Node.js)
 * Uses @google/genai SDK — compatible with AQ.* API keys.
 * Falls back gracefully when key is missing or API call fails.
 */
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL   = process.env.GEMINI_MODEL   || 'gemini-3.8-flash';

// Fallback model chain — tried in order if primary is unavailable
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

let _ai = null;

function getAI() {
  if (_ai) return _ai;
  if (!GEMINI_API_KEY) return null;
  try {
    _ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    return _ai;
  } catch (e) {
    console.error('[GeminiService] Init failed:', e.message);
    return null;
  }
}

/**
 * Returns true when a Gemini API key is present in env.
 */
function isConfigured() {
  return Boolean(GEMINI_API_KEY);
}

const SYSTEM_INSTRUCTION =
  'You are an expert industrial drilling knowledge assistant for an oil and gas company. ' +
  'You have two modes of operation:\n' +
  '1. PROJECT-SPECIFIC queries (about specific wells, incidents, formations in this project): ' +
  'Use ONLY the supplied verified context. NEVER invent well data, incidents, or source pages. ' +
  'If the context does not contain the answer, say so clearly.\n' +
  '2. GENERAL DRILLING KNOWLEDGE queries (industry concepts, best practices, technical explanations): ' +
  'Answer freely and helpfully using your full drilling engineering knowledge. ' +
  'Provide practical, detailed answers about depths, formations, mud systems, casing design, ' +
  'well control, NPT, risk mitigation, borewell drilling, and all other drilling topics.\n' +
  'Always be helpful. Never refuse a general drilling question. ' +
  'Label your response clearly: start with "Based on industry knowledge:" for general answers, ' +
  'or "Based on verified project data:" for project-specific answers. ' +
  'This is a decision-support tool — always recommend engineering review for critical decisions.';

/**
 * Try generating with a specific model. Returns text or throws.
 */
async function tryModel(ai, model, prompt, temperature) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature,
      maxOutputTokens: 2048,
    },
  });
  if (!response.text) throw new Error('Empty response');
  return response.text;
}

/**
 * Generate a text response from Gemini.
 * Tries the configured model first, then falls back through FALLBACK_MODELS.
 * @param {string} prompt
 * @param {number} [temperature=0.2]
 * @returns {Promise<string|null>}
 */
async function generate(prompt, temperature = 0.2) {
  const ai = getAI();
  if (!ai) return null;

  // Build model list: configured model first, then fallbacks (deduped)
  const primaryModel = GEMINI_MODEL;
  const modelChain = [primaryModel, ...FALLBACK_MODELS.filter(m => m !== primaryModel)];

  for (const model of modelChain) {
    try {
      const text = await tryModel(ai, model, prompt, temperature);
      if (model !== primaryModel) {
        console.log(`[GeminiService] Used fallback model: ${model}`);
      }
      return text;
    } catch (e) {
      const isRetryable = e.message.includes('503') || e.message.includes('UNAVAILABLE') || e.message.includes('high demand');
      const isModelGone = e.message.includes('404') || e.message.includes('no longer available') || e.message.includes('not found');
      if (isRetryable || isModelGone) {
        console.warn(`[GeminiService] ${model} unavailable (${isRetryable ? '503' : '404'}), trying next model...`);
        continue;
      }
      // Non-retryable error (auth, quota, etc.) — log and stop
      console.error(`[GeminiService] generate failed (${model}):`, e.message.substring(0, 200));
      return null;
    }
  }

  console.error('[GeminiService] All models exhausted.');
  return null;
}

module.exports = { isConfigured, generate, GEMINI_MODEL };
