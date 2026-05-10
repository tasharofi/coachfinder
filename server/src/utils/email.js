const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        console.warn('[Email] SMTP not configured — emails will be logged to console only');
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        family: 4, // Force IPv4 — Railway containers can't reach Gmail over IPv6
    });

    return transporter;
}

async function sendEmail({ to, subject, html, text }) {
    const transport = getTransporter();
    const from = process.env.SMTP_FROM || 'CoachFinder <noreply@coachfinder.com>';

    if (!transport) {
        console.log(`[Email] Would send to: ${to}`);
        console.log(`[Email] Subject: ${subject}`);
        console.log(`[Email] Body: ${text || html}`);
        return { messageId: 'console-only' };
    }

    try {
        const info = await transport.sendMail({ from, to, subject, html, text });
        console.log(`[Email] Sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Email] Failed to send to ${to}:`, error.message);
        return null;
    }
}

// --- Template Functions ---

async function sendCoachApprovedEmail(coachEmail, coachName) {
    return sendEmail({
        to: coachEmail,
        subject: 'Your CoachFinder profile is now live!',
        html: `
            <h2>Congratulations, ${coachName}!</h2>
            <p>Your coach profile has been reviewed and approved by our team.</p>
            <p>Your profile is now visible to learners searching on CoachFinder.</p>
            <p>You'll receive an email notification when a learner sends you a booking request.</p>
            <br>
            <p>— The CoachFinder Team</p>
        `,
        text: `Congratulations, ${coachName}! Your coach profile has been approved and is now live on CoachFinder.`,
    });
}

async function sendCoachRejectedEmail(coachEmail, coachName) {
    return sendEmail({
        to: coachEmail,
        subject: 'CoachFinder profile update',
        html: `
            <h2>Hi ${coachName},</h2>
            <p>We've reviewed your coach profile application and unfortunately we're unable to approve it at this time.</p>
            <p>If you believe this was in error, please contact our support team.</p>
            <br>
            <p>— The CoachFinder Team</p>
        `,
        text: `Hi ${coachName}, we've reviewed your coach profile and are unable to approve it at this time.`,
    });
}

async function sendContactRequestToCoach(coachEmail, coachName, requestData) {
    const { learnerName, learnerEmail, message, preferredMode, preferredDays, preferredTimes, preferredSuburb } = requestData;
    const days = JSON.parse(preferredDays || '[]').join(', ') || 'Not specified';
    const times = JSON.parse(preferredTimes || '[]').join(', ') || 'Not specified';

    return sendEmail({
        to: coachEmail,
        subject: `New booking request from ${learnerName}`,
        html: `
            <h2>Hi ${coachName},</h2>
            <p>You have a new booking request on CoachFinder!</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                <tr><td style="padding: 8px; font-weight: bold;">From:</td><td style="padding: 8px;">${learnerName}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${learnerEmail}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Session type:</td><td style="padding: 8px;">${preferredMode || 'Either'}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Preferred days:</td><td style="padding: 8px;">${days}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Preferred times:</td><td style="padding: 8px;">${times}</td></tr>
                ${preferredSuburb ? `<tr><td style="padding: 8px; font-weight: bold;">Location:</td><td style="padding: 8px;">${preferredSuburb}</td></tr>` : ''}
            </table>
            <h3>Message:</h3>
            <p>${message || 'No message provided.'}</p>
            <br>
            <p>Please respond to the learner directly at <a href="mailto:${learnerEmail}">${learnerEmail}</a>.</p>
            <p>— The CoachFinder Team</p>
        `,
        text: `New booking request from ${learnerName} (${learnerEmail}). Message: ${message}`,
    });
}

async function sendContactConfirmationToLearner(learnerEmail, learnerName, coachName) {
    return sendEmail({
        to: learnerEmail,
        subject: `Your booking request to ${coachName} has been sent`,
        html: `
            <h2>Hi ${learnerName},</h2>
            <p>Your booking request to <strong>${coachName}</strong> has been sent successfully!</p>
            <p>The coach will review your request and get back to you via email.</p>
            <br>
            <p>— The CoachFinder Team</p>
        `,
        text: `Hi ${learnerName}, your booking request to ${coachName} has been sent. The coach will respond via email.`,
    });
}

async function sendNewApplicationNotification(coachName, coachEmail) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    return sendEmail({
        to: adminEmail,
        subject: `New coach application: ${coachName}`,
        html: `
            <h2>New Coach Application</h2>
            <p><strong>${coachName}</strong> (${coachEmail}) has submitted a coach application.</p>
            <p>Please review it in the admin panel.</p>
        `,
        text: `New coach application from ${coachName} (${coachEmail}). Please review in admin panel.`,
    });
}

module.exports = {
    sendEmail,
    sendCoachApprovedEmail,
    sendCoachRejectedEmail,
    sendContactRequestToCoach,
    sendContactConfirmationToLearner,
    sendNewApplicationNotification,
};
