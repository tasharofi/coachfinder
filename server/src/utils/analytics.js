// Simple analytics event logger for MVP
// Logs to console. Can be extended to file/DB/analytics service later.

function trackEvent(eventName, data = {}) {
    const event = {
        event: eventName,
        timestamp: new Date().toISOString(),
        ...data,
    };
    console.log(`[Analytics] ${eventName}`, JSON.stringify(data));
    return event;
}

// Pre-defined event helpers
const track = {
    coachApplicationStarted: (userId) => trackEvent('coach_application_started', { userId }),
    coachApplicationSubmitted: (userId, coachProfileId) => trackEvent('coach_application_submitted', { userId, coachProfileId }),
    coachApproved: (coachProfileId) => trackEvent('coach_approved', { coachProfileId }),
    coachProfileViewed: (coachSlug, viewerUserId) => trackEvent('coach_profile_viewed', { coachSlug, viewerUserId }),
    learnerRequestSubmitted: (coachProfileId, learnerUserId) => trackEvent('learner_request_submitted', { coachProfileId, learnerUserId }),
    searchPerformed: (filters) => trackEvent('search_performed', { filters }),
    filterUsed: (filterName, filterValue) => trackEvent('filter_used', { filterName, filterValue }),
    becomeCoachCtaClicked: (userId) => trackEvent('become_coach_cta_clicked', { userId }),
};

module.exports = { trackEvent, track };
