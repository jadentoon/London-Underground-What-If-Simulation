/**
 * Utility functions for handling tfl line delay/status data
 */

/**
 * Maps TfL status severity to a color code
 * @param {number} severity - TfL status severity (0-10)
 * @returns {string} Hex color code
 */
export function getDelaySeverityColor(severity) {
    //colour gradient from green (Good Service - 10) to red (Closed - 0)
    const colors = {
        10: '#22c55e', 
        9: '#84cc16',  
        6: '#f59e0b',  
        5: '#f97316',  
        4: '#f97316',  
        3: '#ef4444',  
        2: '#dc2626',  
        0: '#991b1b',  
    };
    return colors[severity] || '#6b7280'; // gray fallback for unknown severity
}

/**
 * Gets a human-readable label for delay severity
 * @param {number} severity - TfL status severity (0-10)
 * @returns {string} Human-readable label
 */
export function getDelaySeverityLabel(severity) {
    const labels = {
        10: 'Good Service',
        9: 'Minor Delays',
        6: 'Severe Delays',
        5: 'Part Closure',
        4: 'Planned Closure',
        3: 'Part Suspended',
        2: 'Suspended',
        0: 'Closed',
    };
    return labels[severity] || 'Unknown';
}
