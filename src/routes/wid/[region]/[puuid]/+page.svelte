<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';

  interface Props {
    data: {
      region: string;
      data: {
        mmr: { rank: string; rr: number; rr_change: number } | null;
        wl: { wins: number; losses: number; draws: number; streak: string[] } | null;
        stat: { kda: string; hs: string; acs: string } | null;
        radiant: { rrNeeded: number | null; isRadiant: boolean; isImmortal: boolean } | null;
        comp: boolean;
      };
      error?: string;
    };
  }

  let { data }: Props = $props();

  function buildTitle(): string {
    if (data.error) return 'Valorant Stats';
    const parts: string[] = [];
    if (data.data.mmr) {
      parts.push(data.data.mmr.rank);
    }
    if (data.data.wl) {
      parts.push(`W${data.data.wl.wins} L${data.data.wl.losses}`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'Valorant Stats';
  }

  function buildDescription(): string {
    if (data.error) return data.error;
    const parts: string[] = [];
    if (data.data.mmr) {
      parts.push(`${data.data.mmr.rr} RR`);
    }
    if (data.data.stat) {
      parts.push(`KDA ${data.data.stat.kda}`);
      parts.push(`HS ${data.data.stat.hs}%`);
      parts.push(`ACS ${data.data.stat.acs}`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'Valorant competitive stats';
  }

  function getRankIcon(rank: string): string {
    const r = rank.toLowerCase();
    
    const rankMap: Record<string, string> = {
      'iron i': '/rank-icons/iron1.webp',
      'iron ii': '/rank-icons/iron2.webp',
      'iron iii': '/rank-icons/iron3.webp',
      'iron 1': '/rank-icons/iron1.webp',
      'iron 2': '/rank-icons/iron2.webp',
      'iron 3': '/rank-icons/iron3.webp',
      'bronze i': '/rank-icons/bronze1.webp',
      'bronze ii': '/rank-icons/bronze2.webp',
      'bronze iii': '/rank-icons/bronze3.webp',
      'bronze 1': '/rank-icons/bronze1.webp',
      'bronze 2': '/rank-icons/bronze2.webp',
      'bronze 3': '/rank-icons/bronze3.webp',
      'silver i': '/rank-icons/silver1.webp',
      'silver ii': '/rank-icons/silver2.webp',
      'silver iii': '/rank-icons/silver3.webp',
      'silver 1': '/rank-icons/silver1.webp',
      'silver 2': '/rank-icons/silver2.webp',
      'silver 3': '/rank-icons/silver3.webp',
      'gold i': '/rank-icons/gold1.webp',
      'gold ii': '/rank-icons/gold2.webp',
      'gold iii': '/rank-icons/gold3.webp',
      'gold 1': '/rank-icons/gold1.webp',
      'gold 2': '/rank-icons/gold2.webp',
      'gold 3': '/rank-icons/gold3.webp',
      'platinum i': '/rank-icons/platinum1.webp',
      'platinum ii': '/rank-icons/platinum2.webp',
      'platinum iii': '/rank-icons/platinum3.webp',
      'platinum 1': '/rank-icons/platinum1.webp',
      'platinum 2': '/rank-icons/platinum2.webp',
      'platinum 3': '/rank-icons/platinum3.webp',
      'diamond i': '/rank-icons/diamond1.webp',
      'diamond ii': '/rank-icons/diamond2.webp',
      'diamond iii': '/rank-icons/diamond3.webp',
      'diamond 1': '/rank-icons/diamond1.webp',
      'diamond 2': '/rank-icons/diamond2.webp',
      'diamond 3': '/rank-icons/diamond3.webp',
      'ascendant i': '/rank-icons/ascendant1.webp',
      'ascendant ii': '/rank-icons/ascendant2.webp',
      'ascendant iii': '/rank-icons/ascendant3.webp',
      'ascendant 1': '/rank-icons/ascendant1.webp',
      'ascendant 2': '/rank-icons/ascendant2.webp',
      'ascendant 3': '/rank-icons/ascendant3.webp',
      'immortal i': '/rank-icons/immortal1.webp',
      'immortal ii': '/rank-icons/immortal2.webp',
      'immortal iii': '/rank-icons/immortal3.webp',
      'immortal 1': '/rank-icons/immortal1.webp',
      'immortal 2': '/rank-icons/immortal2.webp',
      'immortal 3': '/rank-icons/immortal3.webp',
      'radiant': '/rank-icons/radiant.webp',
    };
    
    return rankMap[r] || '/rank-icons/unknown.webp';
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

  function formatStreak(streak: string[]): string {
    return streak.join('');
  }

  function buildOgImageUrl(): string {
    const params = new URLSearchParams();
    if (data.data.mmr) {
      params.set('rank', data.data.mmr.rank);
      params.set('rr', String(data.data.mmr.rr));
    }
    if (data.data.wl) {
      params.set('wl', `W${data.data.wl.wins} L${data.data.wl.losses}`);
    }
    if (data.data.stat) {
      params.set('stats', `KDA ${data.data.stat.kda} · HS ${data.data.stat.hs}% · ACS ${data.data.stat.acs}`);
    }
    return `/api/og?${params.toString()}`;
  }

  onMount(() => {
    const interval = setInterval(() => {
      invalidate('wid:data');
    }, 60000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>{buildTitle()}</title>
  <meta property="og:title" content={buildTitle()} />
  <meta property="og:description" content={buildDescription()} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Crak API" />
  <meta property="og:image" content={buildOgImageUrl()} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="600" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={buildTitle()} />
  <meta name="twitter:description" content={buildDescription()} />
  <meta name="twitter:image" content={buildOgImageUrl()} />
</svelte:head>

<div class="widget">
  {#if data.error}
    <div class="error">{data.error}</div>
  {:else}
    {#if data.data.mmr}
      <div class="wid-row" style="--rank-color: {getRankColor(data.data.mmr.rank)}">
        <img 
          src={getRankIcon(data.data.mmr.rank)} 
          alt={data.data.mmr.rank}
          class="wid-rank-icon"
        />
        <span class="wid-rank">{data.data.mmr.rank}</span>
        <span class="wid-rr">{data.data.mmr.rr} RR {#if data.data.mmr.rr_change !== 0} <span class="wid-change" class:pos={data.data.mmr.rr_change > 0} class:neg={data.data.mmr.rr_change < 0}>{data.data.mmr.rr_change > 0 ? '+' : ''}{data.data.mmr.rr_change}</span>{/if}</span>
      </div>
    {/if}

    {#if data.data.wl}
      <div class="wid-row">
        <span class="wid-label">Session</span>
        <span class="wid-value">W{data.data.wl.wins} L{data.data.wl.losses}</span>
        {#if data.data.wl.streak.length > 0}
          <span class="wid-streak">{formatStreak(data.data.wl.streak)}</span>
        {/if}
      </div>
    {/if}

    {#if data.data.stat}
      <div class="wid-row">
        <span class="wid-value">KDA {data.data.stat.kda}</span>
        <span class="wid-sep">·</span>
        <span class="wid-value">HS {data.data.stat.hs}%</span>
        <span class="wid-sep">·</span>
        <span class="wid-value">ACS {data.data.stat.acs}</span>
      </div>
    {/if}

    {#if data.data.radiant}
      <div class="wid-row radiant">
        {#if data.data.radiant.isRadiant}
          <span class="wid-radiant">RADIANT</span>
        {:else if data.data.radiant.isImmortal && data.data.radiant.rrNeeded !== null}
          <span class="wid-radiant">{data.data.radiant.rrNeeded} RR to Radiant</span>
        {:else}
          <span class="wid-dim">Not Immortal</span>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  :global(body) {
    background: transparent !important;
  }

  .widget {
    background: linear-gradient(to bottom right, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.1) 60%, transparent 100%);
    font-family: 'JetBrains Mono', 'SF Mono', monospace;
    padding: 12px 16px;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .wid-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .wid-row:not(.radiant) {
    padding-left: 10px;
    border-left: 2px solid var(--rank-color, #71717a);
  }

  .wid-rank-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .wid-rank {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .wid-rr {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }

  .wid-change {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .wid-change.pos {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.2);
  }

  .wid-change.neg {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.2);
  }

  .wid-label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .wid-value {
    font-size: 12px;
    font-weight: 500;
    color: #fff;
  }

  .wid-sep {
    color: rgba(255, 255, 255, 0.3);
    font-size: 11px;
  }

  .wid-streak {
    font-size: 10px;
    color: #f97316;
    letter-spacing: 0.1em;
  }

  .wid-row.radiant {
    background: linear-gradient(90deg, rgba(251, 191, 36, 0.15), transparent);
    padding: 4px 8px;
    border-radius: 0;
    border-left: 2px solid #fbbf24;
  }

  .wid-radiant {
    font-size: 11px;
    font-weight: 600;
    color: #fbbf24;
    letter-spacing: 0.1em;
  }

  .wid-dim {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
  }

  .error {
    font-size: 11px;
    color: #ef4444;
    padding: 4px 8px;
  }
</style>
