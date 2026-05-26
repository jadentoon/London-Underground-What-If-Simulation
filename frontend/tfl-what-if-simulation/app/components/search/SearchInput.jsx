/**
 * Text input used by the station search UI.
 * 
 * Keeps the search field, leading icon and clear button consistent between
 * desktop and mobile layouts. Search state is owned by the parent component.
 * 
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the search surface.
 * @param {string} props.accentColour - Colour used for the search icon.
 * @param {string} props.value - Current search query.
 * @param {(value: string) => void} props.onChange - Called when the query changes.
 * @param {() => void} props.onClear - Called when the clear button is clicked.
 * @param {() => void} props.onFocus - Called when the input receives focus.
 * @param {(event: React.KeyboardEvent<HTMLInputElement>) => void} props.onKeyDown - Handles keyboard navigation.
 * @param {boolean} [props.compact=false] - Whether to render the mobile compact layout. 
 * @returns {JSX.Element}
 */
export function SearchInput({
    COLORS,
    accentColour,
    value,
    onChange,
    onClear,
    onFocus,
    onKeyDown,
    compact = false,
}) {
    const hasQuery = value.trim().length > 0;

    if (compact) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 18,
                    background: COLORS.card,
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: COLORS.shadow,
                }}
            >
                <span style={{ fontSize: 16, color: accentColour }}>⌕</span>
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onFocus={onFocus}
                    placeholder="Search stations"
                    style={{
                        flex: 1,
                        border: "none",
                        background: "transparent",
                        color: COLORS.text,
                        outline: "none",
                        fontSize: 14,
                    }}
                    aria-label="Search stations"
                    onKeyDown={onKeyDown}
                />
                {hasQuery && (
                    <button
                        type="button"
                        onClick={onClear}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            border: "none",
                            background: COLORS.subtle,
                            color: COLORS.textMuted,
                            cursor: "pointer",
                        }}
                    >
                        x
                    </button>
                )}
            </div>
        );
    }

    return (
        <div style={{ position: "relative" }}>
            <span
                style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: accentColour,
                    fontSize: 15,
                    pointerEvents: "none",
                }}
            >
                ⌕
            </span>

            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onFocus={onFocus}
                placeholder="Search stations"
                style={{
                    width: "100%",
                    padding: "11px 40px 11px 34px",
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.soft,
                    color: COLORS.text,
                    outline: "none",
                    fontSize: 14,
                }}
                aria-label="Search stations"
                onKeyDown={onKeyDown}
            />

            {hasQuery && (
                <button
                    type="button"
                    onClick={onClear}
                    style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        border: "none",
                        background: COLORS.subtle,
                        color: COLORS.textMuted,
                        cursor: "pointer",
                    }}
                    aria-label="Clear search"
                >
                    x
                </button>
            )}
        </div>
    );
}