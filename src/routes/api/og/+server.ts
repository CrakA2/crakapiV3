import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { RequestEvent } from '@sveltejs/kit';

const fonts: Record<string, ArrayBuffer> = {};

async function loadFonts() {
    if (Object.keys(fonts).length === 0) {
        fonts.inter = await fetch('https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip')
            .then(r => r.arrayBuffer())
            .then(async (zip) => {
                const { unzip } = await import('unzipit');
                const { entries } = await unzip(zip);
                const ttf = await entries['Inter-Regular.ttf'].arrayBuffer();
                return ttf;
            });
        fonts.interBold = await fetch('https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip')
            .then(r => r.arrayBuffer())
            .then(async (zip) => {
                const { unzip } = await import('unzipit');
                const { entries } = await unzip(zip);
                const ttf = await entries['Inter-Bold.ttf'].arrayBuffer();
                return ttf;
            });
    }
    return fonts;
}

function getRankColor(rank: string): string {
    const r = rank.toLowerCase();
    if (r.includes('radiant')) return '#fbbf24';
    if (r.includes('immortal')) return '#ef4444';
    if (r.includes('ascendant')) return '#22c55e';
    if (r.includes('diamond')) return '#3b82f6';
    if (r.includes('platinum')) return '#a855f7';
    if (r.includes('gold')) return '#eab308';
    if (r.includes('silver')) return '#9ca3af';
    if (r.includes('bronze')) return '#b45309';
    if (r.includes('iron')) return '#6b7280';
    return '#71717a';
}

function buildHomeSvg(): Record<string, unknown> {
    return {
        type: 'div',
        props: {
            style: {
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #0a0a0c 0%, #18181b 50%, #0a0a0c 100%)',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
            },
            children: {
                type: 'div',
                props: {
                    style: { display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                        {
                            type: 'div',
                            props: {
                                style: { fontSize: '48px', fontWeight: 700, color: '#f97316', letterSpacing: '-0.02em' },
                                children: 'crak.in',
                            },
                        },
                        {
                            type: 'div',
                            props: {
                                style: { fontSize: '24px', color: '#a1a1aa' },
                                children: 'Valorant Competitive Stats API',
                            },
                        },
                        {
                            type: 'div',
                            props: {
                                style: { marginTop: '20px', display: 'flex', gap: '12px' },
                                children: ['MMR', 'Win/Loss', 'KDA', 'Headshot %'].map((text) => ({
                                    type: 'div',
                                    props: {
                                        style: {
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '12px 16px',
                                            color: '#fff',
                                            fontSize: '14px',
                                        },
                                        children: text,
                                    },
                                })),
                            },
                        },
                    ],
                },
            },
        },
    };
}

function buildWidgetSvg(rank: string, rr: string, wl: string, stats: string, rankColor: string): Record<string, unknown> {
    const children: Record<string, unknown>[] = [];
    
    if (rank) {
        children.push({
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    paddingLeft: '16px',
                    borderLeft: `4px solid ${rankColor}`,
                },
                children: [
                    {
                        type: 'div',
                        props: {
                            style: {
                                width: '48px',
                                height: '48px',
                                background: `${rankColor}20`,
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            },
                            children: {
                                type: 'div',
                                props: {
                                    style: { width: '32px', height: '32px', background: rankColor, borderRadius: '4px' },
                                },
                            },
                        },
                    },
                    {
                        type: 'div',
                        props: {
                            style: { display: 'flex', flexDirection: 'column', gap: '4px' },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '32px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' },
                                        children: rank.toUpperCase(),
                                    },
                                },
                                {
                                    type: 'div',
                                    props: {
                                        style: { fontSize: '20px', color: '#a1a1aa' },
                                        children: `${rr} RR`,
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        });
    }
    
    if (wl) {
        children.push({
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: '16px',
                    borderLeft: '4px solid #71717a',
                },
                children: [
                    {
                        type: 'div',
                        props: {
                            style: { fontSize: '14px', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em' },
                            children: 'Session',
                        },
                    },
                    {
                        type: 'div',
                        props: {
                            style: { fontSize: '24px', fontWeight: 600, color: '#fff' },
                            children: wl,
                        },
                    },
                ],
            },
        });
    }
    
    if (stats) {
        children.push({
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    paddingLeft: '16px',
                    borderLeft: '4px solid #71717a',
                    fontSize: '18px',
                    color: '#fff',
                },
                children: stats,
            },
        });
    }
    
    children.push({
        type: 'div',
        props: {
            style: { marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' },
            children: [
                {
                    type: 'div',
                    props: {
                        style: { fontSize: '14px', color: '#f97316', fontWeight: 600 },
                        children: 'crak.in',
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: { width: '4px', height: '4px', background: '#52525b', borderRadius: '50%' },
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: { fontSize: '12px', color: '#52525b' },
                        children: 'Valorant Stats',
                    },
                },
            ],
        },
    });
    
    return {
        type: 'div',
        props: {
            style: {
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(24,24,27,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
            },
            children: {
                type: 'div',
                props: {
                    style: { display: 'flex', flexDirection: 'column', gap: '16px' },
                    children,
                },
            },
        },
    };
}

export async function GET({ url }: RequestEvent) {
    const fonts = await loadFonts();
    
    const rank = url.searchParams.get('rank') || '';
    const rr = url.searchParams.get('rr') || '';
    const wl = url.searchParams.get('wl') || '';
    const stats = url.searchParams.get('stats') || '';
    const isHome = url.searchParams.get('home') === 'true';
    
    const rankColor = rank ? getRankColor(rank) : '#71717a';
    
    const node = isHome ? buildHomeSvg() : buildWidgetSvg(rank, rr, wl, stats, rankColor);
    
    const svg = await satori(node as Parameters<typeof satori>[0], {
        width: 600,
        height: 300,
        fonts: [
            {
                name: 'Inter',
                data: fonts.inter,
                weight: 400,
                style: 'normal',
            },
            {
                name: 'Inter',
                data: fonts.interBold,
                weight: 700,
                style: 'normal',
            },
        ],
    });
    
    const resvg = new Resvg(svg, {
        fitTo: {
            mode: 'width',
            value: 1200,
        },
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    return new Response(new Uint8Array(pngBuffer), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
};
