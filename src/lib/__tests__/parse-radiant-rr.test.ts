import { describe, it, expect } from 'vitest';
import { parseRadiantRR } from '$lib/parse-radiant-rr';

describe('parseRadiantRR', () => {
    it('returns radiant+immortal for "Player is Radiant"', () => {
        expect(parseRadiantRR('Player is Radiant')).toEqual({
            rrNeeded: 0,
            isRadiant: true,
            isImmortal: true,
        });
    });

    it('returns radiant+immortal for a leaderboard rank with no RR text', () => {
        expect(parseRadiantRR('Leaderboard #5')).toEqual({
            rrNeeded: 0,
            isRadiant: true,
            isImmortal: true,
        });
    });

    it('returns not-radiant with parsed RR for a leaderboard rank containing RR text', () => {
        expect(parseRadiantRR('Leaderboard #5 - 12RR to Radiant')).toEqual({
            rrNeeded: 12,
            isRadiant: false,
            isImmortal: true,
        });
    });

    it('returns not-immortal for "Player is not Immortal"', () => {
        expect(parseRadiantRR('Player is not Immortal')).toEqual({
            rrNeeded: null,
            isRadiant: false,
            isImmortal: false,
        });
    });

    it('parses the RR needed for an immortal player', () => {
        expect(parseRadiantRR('45RR to Radiant')).toEqual({
            rrNeeded: 45,
            isRadiant: false,
            isImmortal: true,
        });
    });

    it('returns not-immortal for arbitrary text', () => {
        expect(parseRadiantRR('Radiant')).toEqual({
            rrNeeded: null,
            isRadiant: false,
            isImmortal: false,
        });
        expect(parseRadiantRR('some random string')).toEqual({
            rrNeeded: null,
            isRadiant: false,
            isImmortal: false,
        });
    });
});
