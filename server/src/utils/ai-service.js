/**
 * AIService — Lightweight AI wrapper for CoachFinder MVP.
 * 
 * Uses Google Gemini (free tier) by default.
 * All methods return null if AI_API_KEY is not configured.
 * All methods catch errors internally and never throw to callers.
 */

const AI_API_KEY = process.env.AI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const AI_ENABLED = !!AI_API_KEY;

let genai = null;

if (AI_ENABLED && AI_PROVIDER === 'gemini') {
    try {
        const { GoogleGenAI } = require('@google/genai');
        genai = new GoogleGenAI({ apiKey: AI_API_KEY });
    } catch (err) {
        console.warn('AI Service: Failed to initialise Gemini SDK:', err.message);
    }
}

if (AI_ENABLED) {
    console.log(`AI Service: Enabled (provider: ${AI_PROVIDER})`);
} else {
    console.log('AI Service: Disabled (no AI_API_KEY configured)');
}

// ---------- Helpers ----------

const TIMEOUT_MS = 12000;

async function callGemini(prompt, { json = false } = {}) {
    if (!genai) return null;

    try {
        const config = {};
        if (json) {
            config.responseMimeType = 'application/json';
        }

        const response = await Promise.race([
            genai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), TIMEOUT_MS)),
        ]);

        const text = response.text?.trim() || '';
        if (!text) return null;

        if (json) {
            // Strip markdown code fences if present
            const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            return JSON.parse(cleaned);
        }
        return text;
    } catch (err) {
        console.error('AI Service call error:', err.message);
        return null;
    }
}

// ---------- Public Methods ----------

const AIService = {
    isEnabled() {
        return AI_ENABLED;
    },

    /**
     * Parse a natural-language learner search query into structured fields.
     * Returns: { skillQuery, locationQuery, sessionMode, level, availability, priceIntent }
     */
    async parseLearnerSearchQuery(query) {
        if (!AI_ENABLED) return null;

        const prompt = `You are a search query parser for an Australian coaching marketplace.
Parse the following learner search query into structured fields.

Query: "${query}"

Return a JSON object with these fields (use null for anything not clearly mentioned):
- skillQuery: the skill, subject, or activity being searched for (string or null)
- locationQuery: suburb, area, or city mentioned (string or null)
- sessionMode: "online", "in_person", or null
- level: "beginner", "intermediate", "advanced", "kids", or null
- availability: "weekday", "weekend", "morning", "afternoon", "evening", or null
- priceIntent: "cheap", "affordable", "premium", or null

Important rules:
- Only extract values that are clearly stated or strongly implied
- Do not invent values
- For Australian suburb names, preserve exact spelling
- For skills, use the simplest form (e.g. "piano" not "piano coaching")
- Return valid JSON only`;

        return await callGemini(prompt, { json: true });
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
3. What useful aliases/tags could be derived from the input?
4. Is this genuinely a new skill not covered by existing ones?

Return a JSON object:
{
  "canonicalSkillSuggestion": "ExistingSkillName or null",
  "confidence": "high|medium|low",
  "suggestedAliases": ["alias1", "alias2"],
  "isNewSkill": true/false
}

Rules:
- Only suggest high/medium confidence if the match is clearly correct
- For low confidence or no match, set isNewSkill to true
- Keep suggested aliases practical and search-friendly
- Return valid JSON only`;

        return await callGemini(prompt, { json: true });
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

        return await callGemini(prompt, { json: false });
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

        return await callGemini(prompt, { json: true });
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

        return await callGemini(prompt, { json: true });
    },
};

module.exports = AIService;
