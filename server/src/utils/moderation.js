/**
 * Content moderation utility for Skill Next Door.
 * Provides profanity filtering, spam detection, HTML injection prevention,
 * and field-level validation with character limits.
 */

// Common profanity/offensive words blocklist (keep concise for MVP)
const BLOCKED_WORDS = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock',
    'pussy', 'bastard', 'slut', 'whore', 'nigger', 'nigga', 'faggot',
    'retard', 'cunt',
];

// Patterns that suggest spam or malicious content
const SPAM_PATTERNS = [
    /https?:\/\/bit\.ly/i,
    /https?:\/\/tinyurl/i,
    /https?:\/\/t\.co/i,
    /buy\s+now/i,
    /click\s+here/i,
    /free\s+money/i,
    /make\s+\$?\d+.*per\s+(day|hour|week)/i,
    /viagra|cialis|pharmacy/i,
    /casino|poker|betting|gambling/i,
    /crypto.*invest/i,
];

// Field-specific character limits
const FIELD_LIMITS = {
    headline: { min: 5, max: 120 },
    bio: { min: 20, max: 2000 },
    certifications: { min: 0, max: 1000 },
    linkedinUrl: { min: 0, max: 500 },
    name: { min: 2, max: 100 },
    phone: { min: 0, max: 20 },
    serviceRadius: { min: 0, max: 200 },
    details: { min: 0, max: 1000 },
};

// Allowed URL patterns for LinkedIn/website field
const ALLOWED_URL_PATTERNS = [
    /^https?:\/\/(www\.)?linkedin\.com\//i,
    /^https?:\/\//i, // generic https URL — lenient for MVP
];

/**
 * Check text for profanity.
 * @param {string} text
 * @returns {{ clean: boolean, words: string[] }}
 */
function checkProfanity(text) {
    if (!text) return { clean: true, words: [] };
    const lower = text.toLowerCase();
    const found = BLOCKED_WORDS.filter(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lower);
    });
    return { clean: found.length === 0, words: found };
}

/**
 * Check text for spam patterns.
 * @param {string} text
 * @returns {{ clean: boolean, reason: string|null }}
 */
function checkSpam(text) {
    if (!text) return { clean: true, reason: null };
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(text)) {
            return { clean: false, reason: `Detected spam pattern: ${pattern.source}` };
        }
    }
    return { clean: true, reason: null };
}

/**
 * Check for HTML/script injection.
 * @param {string} text
 * @returns {{ clean: boolean, reason: string|null }}
 */
function checkInjection(text) {
    if (!text) return { clean: true, reason: null };
    // Block HTML tags
    if (/<[^>]*script/i.test(text)) {
        return { clean: false, reason: 'Script tags are not allowed' };
    }
    if (/<\/?[a-z][^>]*>/i.test(text)) {
        return { clean: false, reason: 'HTML tags are not allowed' };
    }
    // Block javascript: protocol
    if (/javascript:/i.test(text)) {
        return { clean: false, reason: 'JavaScript URLs are not allowed' };
    }
    return { clean: true, reason: null };
}

/**
 * Check for meaningless/repeated text.
 * @param {string} text
 * @returns {{ clean: boolean, reason: string|null }}
 */
function checkQuality(text) {
    if (!text || text.length < 5) return { clean: true, reason: null };
    // Check for repeated characters (e.g. "aaaaaaa")
    if (/(.)\1{6,}/.test(text)) {
        return { clean: false, reason: 'Text contains excessive repeated characters' };
    }
    // Check for repeated words (e.g. "test test test test")
    const words = text.trim().split(/\s+/);
    if (words.length >= 4) {
        const unique = new Set(words.map(w => w.toLowerCase()));
        if (unique.size === 1) {
            return { clean: false, reason: 'Text contains only repeated words' };
        }
    }
    return { clean: true, reason: null };
}

/**
 * Validate a single field value.
 * @param {string} fieldName
 * @param {string} value
 * @returns {{ valid: boolean, reason: string|null }}
 */
function validateField(fieldName, value) {
    if (value === undefined || value === null) {
        return { valid: true, reason: null };
    }

    const str = String(value);

    // Length limits
    const limits = FIELD_LIMITS[fieldName];
    if (limits) {
        if (str.length > limits.max) {
            return { valid: false, reason: `${fieldName} exceeds maximum length of ${limits.max} characters` };
        }
        if (limits.min > 0 && str.length < limits.min && str.length > 0) {
            return { valid: false, reason: `${fieldName} must be at least ${limits.min} characters` };
        }
    }

    // URL validation for link fields
    if (fieldName === 'linkedinUrl' && str.length > 0) {
        const isValidUrl = ALLOWED_URL_PATTERNS.some(p => p.test(str));
        if (!isValidUrl) {
            return { valid: false, reason: 'Please provide a valid URL (starting with http:// or https://)' };
        }
    }

    // Content checks for text fields
    if (['headline', 'bio', 'certifications', 'name', 'details'].includes(fieldName)) {
        const profanity = checkProfanity(str);
        if (!profanity.clean) {
            return { valid: false, reason: 'Content contains inappropriate language' };
        }

        const spam = checkSpam(str);
        if (!spam.clean) {
            return { valid: false, reason: spam.reason };
        }

        const injection = checkInjection(str);
        if (!injection.clean) {
            return { valid: false, reason: injection.reason };
        }

        const quality = checkQuality(str);
        if (!quality.clean) {
            return { valid: false, reason: quality.reason };
        }
    }

    return { valid: true, reason: null };
}

/**
 * Validate multiple fields at once.
 * @param {Object} fields - Map of fieldName -> value
 * @returns {{ valid: boolean, errors: Object }}
 */
function validateFields(fields) {
    const errors = {};
    let valid = true;

    for (const [field, value] of Object.entries(fields)) {
        const result = validateField(field, value);
        if (!result.valid) {
            errors[field] = result.reason;
            valid = false;
        }
    }

    return { valid, errors };
}

module.exports = {
    validateField,
    validateFields,
    checkProfanity,
    checkSpam,
    checkInjection,
    checkQuality,
    FIELD_LIMITS,
};
