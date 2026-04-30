const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['Morning', 'Afternoon', 'Evening'];

export default function AvailabilityPicker({ value, onChange }) {
    // value is an array like: [{ day: 'Monday', times: ['Morning', 'Evening'] }, ...]
    const availability = value || [];

    const isSelected = (day, time) => {
        const dayEntry = availability.find(a => a.day === day);
        return dayEntry?.times?.includes(time) || false;
    };

    const toggle = (day, time) => {
        const existing = [...availability];
        const dayIndex = existing.findIndex(a => a.day === day);

        if (dayIndex === -1) {
            // Add new day with this time
            existing.push({ day, times: [time] });
        } else {
            const dayEntry = { ...existing[dayIndex] };
            const times = [...(dayEntry.times || [])];
            const timeIndex = times.indexOf(time);

            if (timeIndex === -1) {
                times.push(time);
            } else {
                times.splice(timeIndex, 1);
            }

            if (times.length === 0) {
                existing.splice(dayIndex, 1);
            } else {
                dayEntry.times = times;
                existing[dayIndex] = dayEntry;
            }
        }

        onChange(existing);
    };

    return (
        <div className="avail-picker">
            <div className="avail-grid">
                {/* Header row */}
                <div className="avail-cell avail-header"></div>
                {TIMES.map(time => (
                    <div key={time} className="avail-cell avail-header">{time}</div>
                ))}

                {/* Day rows */}
                {DAYS.map(day => (
                    <>
                        <div key={`${day}-label`} className="avail-cell avail-day-label">{day.slice(0, 3)}</div>
                        {TIMES.map(time => (
                            <button
                                key={`${day}-${time}`}
                                type="button"
                                className={`avail-cell avail-slot ${isSelected(day, time) ? 'active' : ''}`}
                                onClick={() => toggle(day, time)}
                                title={`${day} ${time}`}
                            >
                                {isSelected(day, time) ? '✓' : ''}
                            </button>
                        ))}
                    </>
                ))}
            </div>
        </div>
    );
}

// Helper to format availability for display
export function formatAvailability(availability) {
    if (!availability || availability.length === 0) return 'Not specified';

    try {
        const parsed = typeof availability === 'string' ? JSON.parse(availability) : availability;
        if (!Array.isArray(parsed) || parsed.length === 0) return 'Not specified';

        return parsed
            .map(a => {
                const dayShort = a.day?.slice(0, 3);
                const times = (a.times || []).map(t => t.toLowerCase()).join(', ');
                return `${dayShort} ${times}`;
            })
            .join(' · ');
    } catch {
        return 'Not specified';
    }
}
