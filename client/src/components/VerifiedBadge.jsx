import { useState } from 'react';

export function VerifiedCoachBadge({ size = 'default' }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <span
            className={`badge badge-verified ${size}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
            </svg>
            Verified
            {showTooltip && (
                <span className="badge-tooltip">
                    This coach has been reviewed and approved by our team.
                </span>
            )}
        </span>
    );
}

export function EmailVerifiedBadge({ size = 'default' }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <span
            className={`badge badge-email ${size}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
            Email verified
            {showTooltip && (
                <span className="badge-tooltip">
                    This user's email has been verified.
                </span>
            )}
        </span>
    );
}
