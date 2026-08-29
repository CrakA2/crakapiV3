export function parseRadiantRR(text: string): {
    rrNeeded: number | null;
    isRadiant: boolean;
    isImmortal: boolean;
} {
    if (text === 'Player is Radiant') {
        return { rrNeeded: 0, isRadiant: true, isImmortal: true };
    }
    if (text === 'Player is not Immortal') {
        return { rrNeeded: null, isRadiant: false, isImmortal: false };
    }
    // A pure leaderboard rank with no RR-to-go means the player is already Radiant.
    if (text.startsWith('Leaderboard #') && !text.includes('RR to Radiant')) {
        return { rrNeeded: 0, isRadiant: true, isImmortal: true };
    }
    const match = text.match(/(\d+)RR to Radiant/);
    if (match) {
        return {
            rrNeeded: parseInt(match[1]),
            isRadiant: false,
            isImmortal: true,
        };
    }
    return { rrNeeded: null, isRadiant: false, isImmortal: false };
}
