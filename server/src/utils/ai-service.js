/**
 * AIService — Multi-provider AI wrapper for Skill Next Door.
 *
 * Supported providers:
 *   - groq  (free tier, uses groq-sdk with Llama models)
 *   - gemini (uses @google/genai)
 *
 * Configure via .env:
 *   AI_PROVIDER=groq|gemini
 *   AI_API_KEY=your-key
 *   AI_MODEL=optional-model-override
 *
 * All methods return null if AI is not configured or fails.
 * All methods catch errors internally and never throw to callers.
 */

const AI_API_KEY = process.env.AI_API_KEY;
const AI_PROVIDER = (process.env.AI_PROVIDER || 'groq').toLowerCase();
const AI_ENABLED = !!AI_API_KEY && AI_PROVIDER !== 'none';

const TIMEOUT_MS = 15000;

// ---------- Provider Initialisation ----------

let groqClient = null;
let geminiClient = null;

if (AI_ENABLED && AI_PROVIDER === 'groq') {
    try {
        const Groq = require('groq-sdk');
        groqClient = new Groq({ apiKey: AI_API_KEY });
    } catch (err) {
        console.warn('AI Service: Failed to initialise Groq SDK:', err.message);
    }
}

if (AI_ENABLED && AI_PROVIDER === 'gemini') {
    try {
        const { GoogleGenAI } = require('@google/genai');
        geminiClient = new GoogleGenAI({ apiKey: AI_API_KEY });
    } catch (err) {
        console.warn('AI Service: Failed to initialise Gemini SDK:', err.message);
    }
}

if (AI_ENABLED) {
    console.log(`AI Service: Enabled (provider: ${AI_PROVIDER})`);
} else {
    console.log('AI Service: Disabled (no AI_API_KEY configured or AI_PROVIDER=none)');
}

// ---------- Provider Defaults ----------

const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant';
const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODEL = 'gemini-2.0-flash-lite';

const AI_MODEL = process.env.AI_MODEL || null; // user override

// ---------- Unified AI Call ----------

async function callAI(prompt, { json = false } = {}) {
    if (!AI_ENABLED) return null;

    if (AI_PROVIDER === 'groq') return callGroq(prompt, { json });
    if (AI_PROVIDER === 'gemini') return callGemini(prompt, { json });

    return null;
}

async function callGroq(prompt, { json = false } = {}) {
    if (!groqClient) return null;

    const models = AI_MODEL ? [AI_MODEL] : [GROQ_DEFAULT_MODEL, GROQ_FALLBACK_MODEL];

    for (const model of models) {
        try {
            const response = await Promise.race([
                groqClient.chat.completions.create({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 1024,
                    ...(json ? { response_format: { type: 'json_object' } } : {}),
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), TIMEOUT_MS)),
            ]);

            const text = response.choices?.[0]?.message?.content?.trim() || '';
            if (!text) return null;

            if (json) {
                const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                return JSON.parse(cleaned);
            }
            return text;
        } catch (err) {
            const msg = String(err.message || err);
            const isRateLimit = msg.includes('429') || msg.includes('rate_limit') || msg.includes('quota');
            console.error(`AI Service (groq/${model}):`, isRateLimit ? 'Rate limited, trying fallback...' : msg);
            if (!isRateLimit) return null;
        }
    }

    console.error('AI Service: All Groq models exhausted');
    return null;
}

async function callGemini(prompt, { json = false } = {}) {
    if (!geminiClient) return null;

    const models = AI_MODEL ? [AI_MODEL] : [GEMINI_DEFAULT_MODEL, GEMINI_FALLBACK_MODEL];

    for (const model of models) {
        try {
            const config = {};
            if (json) {
                config.responseMimeType = 'application/json';
            }

            const response = await Promise.race([
                geminiClient.models.generateContent({
                    model,
                    contents: prompt,
                    config,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), TIMEOUT_MS)),
            ]);

            const text = response.text?.trim() || '';
            if (!text) return null;

            if (json) {
                const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                return JSON.parse(cleaned);
            }
            return text;
        } catch (err) {
            const msg = String(err.message || err);
            const isQuotaError = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
            console.error(`AI Service (gemini/${model}):`, isQuotaError ? 'Quota exceeded, trying fallback...' : msg);
            if (!isQuotaError) return null;
        }
    }

    console.error('AI Service: All Gemini models exhausted');
    return null;
}

// ---------- Public Methods ----------

const AIService = {
    isEnabled() {
        return AI_ENABLED;
    },

    /**
     * Try to map a coach-entered skill to an existing canonical skill.
     * Returns: { canonicalSkillSuggestion, confidence, suggestedAliases, isNewSkill }
     */
    async normaliseCoachSkill(input, existingSkillNames) {
        if (!AI_ENABLED) return null;

        const skillList = existingSkillNames.slice(0, 50).join(', ');

        const prompt = `You are a skill normalisation assistant for a coaching marketplace.

A coach entered this skill: "${input}"

Here are the existing canonical skills in the system:
${skillList}

Determine:
1. Does this input match an existing canonical skill? If so, which one?
2. What confidence level? (high, medium, low)
3. Is this genuinely a new skill not covered by existing ones?

Return a JSON object:
{
  "canonicalSkillSuggestion": "ExistingSkillName or null",
  "confidence": "high|medium|low",
  "isNewSkill": true/false
}

Rules:
- Only suggest high confidence if the match is clearly and obviously correct
- For medium/low confidence or no match, set isNewSkill to true
- Return valid JSON only`;

        return await callAI(prompt, { json: true });
    },

    /**
     * Improve a rough coach bio into a polished version.
     * Returns: polished text string
     */
    async improveCoachBio(text, context = {}) {
        if (!AI_ENABLED) return null;

        const contextStr = [
            context.skillName ? `Skill: ${context.skillName}` : '',
            context.yearsExp ? `Experience: ${context.yearsExp} years` : '',
            context.headline ? `Headline: ${context.headline}` : '',
        ].filter(Boolean).join('. ');

        const prompt = `You are a writing assistant for an Australian coaching marketplace.

Improve this coach's bio to be clearer, more professional, and appealing to potential students.
Keep the same meaning and facts. Do not invent new claims.
Keep the tone warm and approachable, not corporate.
Keep it concise (2-4 sentences, under 300 characters if possible).
Write in first person.

${contextStr ? `Context: ${contextStr}\n` : ''}
Original bio:
"${text}"

Return ONLY the improved bio text, no quotes or labels.`;

        return await callAI(prompt, { json: false });
    },

    /**
     * Generate headline options for a coach profile.
     * Returns: array of 3-5 headline strings
     */
    async improveCoachHeadline(text, context = {}) {
        if (!AI_ENABLED) return null;

        const contextStr = [
            context.skillName ? `Skill: ${context.skillName}` : '',
            context.yearsExp ? `Experience: ${context.yearsExp} years` : '',
            context.bio ? `Bio: ${context.bio.slice(0, 200)}` : '',
        ].filter(Boolean).join('. ');

        const prompt = `You are a writing assistant for an Australian coaching marketplace.

Generate 4 short, compelling headline options for a coach profile.
Each headline should be under 80 characters.
Make them varied: some professional, some friendly, some highlighting experience.

${contextStr ? `Context: ${contextStr}\n` : ''}
Current headline: "${text}"

Return a JSON array of 4 headline strings. Example:
["Headline option 1", "Headline option 2", "Headline option 3", "Headline option 4"]

Return valid JSON only.`;

        return await callAI(prompt, { json: true });
    },

    /**
     * Suggest skill tags based on coach profile content.
     * Returns: array of suggested skill/tag strings
     */
    async suggestCoachSkillTags(context = {}) {
        if (!AI_ENABLED) return null;

        const prompt = `You are a skill tagging assistant for an Australian coaching marketplace.

Based on this coach profile, suggest 3-6 relevant skills or tags.

Headline: "${context.headline || ''}"
Bio: "${context.bio || ''}"
Current skill: "${context.skillName || ''}"

Return a JSON array of skill name strings that this coach likely teaches.
Prioritise common, searchable terms. Keep names short (1-3 words).
Example: ["Piano", "Music Theory", "Keyboard"]

Return valid JSON only.`;

        return await callAI(prompt, { json: true });
    },
};

module.exports = AIService;
