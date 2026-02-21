<script lang="ts">
    let name = $state("");
    let tag = $state("");
    let loading = $state(false);
    let error = $state("");
    let playerData = $state<any>(null);
    let copiedEndpoint = $state<string | null>(null);
    let selectedBot = $state("raw");
    let compOnly = $state(false);
    let widgetToggles = $state({
        mmr: true,
        wl: true,
        stat: true,
        radiant: false,
    });

    const exampleData = {
        name: "Solo",
        tag: "Manan",
        region: "ap",
        puuid: "example-puuid",
        rank: "Immortal 3",
        rr: 234,
        rr_change: -12,
        wins: 7,
        losses: 2,
        streak: ["W", "W", "W", "W", "L", "W", "L", "W", "W"],
        kda: "1.45",
        headshot_percent: "28.5",
        acs: 542,
        radiant_rr: "66RR to Radiant",
    };

    function getDisplayData() {
        return playerData || exampleData;
    }

    const bots = [
        { id: "raw", name: "RAW" },
        {
            id: "nightbot",
            name: "Nightbot",
            prefix: "$(urlfetch ",
            suffix: ")",
        },
        {
            id: "streamelements",
            name: "StreamElements",
            prefix: "$(customapi ",
            suffix: ")",
        },
        {
            id: "cloudbot",
            name: "Streamlabs",
            prefix: "{readapi.",
            suffix: "}",
        },
    ];

    async function searchPlayer() {
        if (!name || !tag) {
            error = "Enter both username and tag";
            return;
        }

        loading = true;
        error = "";
        playerData = null;

        try {
            const compParam = compOnly ? "?comp" : "";
            const response = await fetch(
                `/v3/all/${encodeURIComponent(name)}/${encodeURIComponent(tag)}${compParam}`,
            );
            const data = await response.json();

            if (data.error) {
                error = data.error;
            } else {
                playerData = data;
            }
        } catch (e) {
            error = "Failed to fetch player data";
        } finally {
            loading = false;
        }
    }

    function copyUrl(endpoint: string) {
        const url = `${window.location.origin}/v3/${endpoint}`;
        navigator.clipboard.writeText(url);
        copiedEndpoint = endpoint;
        setTimeout(() => (copiedEndpoint = null), 2000);
    }

    function copyBotCommand(endpoint: string) {
        const url = `${window.location.origin}/v3/${endpoint}`;
        const bot = bots.find((b) => b.id === selectedBot);
        const command = bot?.prefix ? `${bot.prefix}${url}${bot.suffix}` : url;
        navigator.clipboard.writeText(command);
        copiedEndpoint = `${selectedBot}-${endpoint}`;
        setTimeout(() => (copiedEndpoint = null), 2000);
    }

    function copyWidgetUrl() {
        navigator.clipboard.writeText(getWidgetUrl());
        copiedEndpoint = "widget-url";
        setTimeout(() => (copiedEndpoint = null), 2000);
    }

    function getEndpoints(puuid: string, region: string) {
        const compParam = compOnly ? "?comp" : "";
        return [
            { key: "mmr", label: "MMR", endpoint: `mmr/${region}/${puuid}` },
            {
                key: "wl",
                label: "Win/Loss",
                endpoint: `wl/${region}/${puuid}${compParam}`,
            },
            {
                key: "kd",
                label: "KDA",
                endpoint: `kd/${region}/${puuid}${compParam}`,
            },
            {
                key: "hs",
                label: "Headshot",
                endpoint: `hs/${region}/${puuid}${compParam}`,
            },
            {
                key: "acs",
                label: "ACS",
                endpoint: `acs/${region}/${puuid}${compParam}`,
            },
            {
                key: "lb",
                label: "Leaderboard",
                endpoint: `leaderboard/${region}/${puuid}`,
            },
            {
                key: "rad",
                label: "Radiant",
                endpoint: `radiant/${region}/${puuid}`,
            },
        ];
    }

    function getBotCommand(endpoint: string): string {
        const url = `${window.location.origin}/v3/${endpoint}`;
        const bot = bots.find((b) => b.id === selectedBot);
        if (!bot || !bot.prefix) return url;
        return `${bot.prefix}${url}${bot.suffix}`;
    }

    function getRankColor(rank: string): string {
        const r = rank.toLowerCase();
        if (r.includes("radiant")) return "#fbbf24";
        if (r.includes("immortal")) return "#ef4444";
        if (r.includes("ascendant")) return "#22c55e";
        if (r.includes("diamond")) return "#3b82f6";
        if (r.includes("platinum")) return "#a855f7";
        if (r.includes("gold")) return "#eab308";
        if (r.includes("silver")) return "#9ca3af";
        if (r.includes("bronze")) return "#b45309";
        if (r.includes("iron")) return "#6b7280";
        return "#71717a";
    }

    function getRankIcon(rank: string): string {
        const r = rank.toLowerCase();
        const rankMap: Record<string, string> = {
            "iron i": "/rank-icons/iron1.webp",
            "iron ii": "/rank-icons/iron2.webp",
            "iron iii": "/rank-icons/iron3.webp",
            "iron 1": "/rank-icons/iron1.webp",
            "iron 2": "/rank-icons/iron2.webp",
            "iron 3": "/rank-icons/iron3.webp",
            "bronze i": "/rank-icons/bronze1.webp",
            "bronze ii": "/rank-icons/bronze2.webp",
            "bronze iii": "/rank-icons/bronze3.webp",
            "bronze 1": "/rank-icons/bronze1.webp",
            "bronze 2": "/rank-icons/bronze2.webp",
            "bronze 3": "/rank-icons/bronze3.webp",
            "silver i": "/rank-icons/silver1.webp",
            "silver ii": "/rank-icons/silver2.webp",
            "silver iii": "/rank-icons/silver3.webp",
            "silver 1": "/rank-icons/silver1.webp",
            "silver 2": "/rank-icons/silver2.webp",
            "silver 3": "/rank-icons/silver3.webp",
            "gold i": "/rank-icons/gold1.webp",
            "gold ii": "/rank-icons/gold2.webp",
            "gold iii": "/rank-icons/gold3.webp",
            "gold 1": "/rank-icons/gold1.webp",
            "gold 2": "/rank-icons/gold2.webp",
            "gold 3": "/rank-icons/gold3.webp",
            "platinum i": "/rank-icons/platinum1.webp",
            "platinum ii": "/rank-icons/platinum2.webp",
            "platinum iii": "/rank-icons/platinum3.webp",
            "platinum 1": "/rank-icons/platinum1.webp",
            "platinum 2": "/rank-icons/platinum2.webp",
            "platinum 3": "/rank-icons/platinum3.webp",
            "diamond i": "/rank-icons/diamond1.webp",
            "diamond ii": "/rank-icons/diamond2.webp",
            "diamond iii": "/rank-icons/diamond3.webp",
            "diamond 1": "/rank-icons/diamond1.webp",
            "diamond 2": "/rank-icons/diamond2.webp",
            "diamond 3": "/rank-icons/diamond3.webp",
            "ascendant i": "/rank-icons/ascendant1.webp",
            "ascendant ii": "/rank-icons/ascendant2.webp",
            "ascendant iii": "/rank-icons/ascendant3.webp",
            "ascendant 1": "/rank-icons/ascendant1.webp",
            "ascendant 2": "/rank-icons/ascendant2.webp",
            "ascendant 3": "/rank-icons/ascendant3.webp",
            "immortal i": "/rank-icons/immortal1.webp",
            "immortal ii": "/rank-icons/immortal2.webp",
            "immortal iii": "/rank-icons/immortal3.webp",
            "immortal 1": "/rank-icons/immortal1.webp",
            "immortal 2": "/rank-icons/immortal2.webp",
            "immortal 3": "/rank-icons/immortal3.webp",
            radiant: "/rank-icons/radiant.webp",
        };
        return rankMap[r] || "/rank-icons/unknown.webp";
    }

    function getWidgetUrl(): string {
        if (!playerData) return "";
        const params = new URLSearchParams();
        if (widgetToggles.mmr) params.set("mmr", "y");
        if (widgetToggles.wl) params.set("wl", "y");
        if (widgetToggles.stat) params.set("stat", "y");
        if (widgetToggles.radiant) params.set("radiant", "y");
        if (compOnly) params.set("comp", "");
        const queryString = params.toString();
        return `${window.location.origin}/wid/${playerData.region}/${playerData.puuid}${queryString ? `?${queryString}` : ""}`;
    }

    function parseRadiantRR(text: string): {
        rrNeeded: number | null;
        isRadiant: boolean;
        isImmortal: boolean;
    } {
        if (text.startsWith('Leaderboard #') && !text.includes('RR to Radiant')) {
            return { rrNeeded: 0, isRadiant: true, isImmortal: true };
        }
        if (text === "Player is Radiant" || text.startsWith('Leaderboard #')) {
            return { rrNeeded: 0, isRadiant: true, isImmortal: true };
        }
        if (text === "Player is not Immortal") {
            return { rrNeeded: null, isRadiant: false, isImmortal: false };
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
</script>

<svelte:head>
    <title>CrakAPI v3 &mdash; Valorant Stats for Stream Bots</title>
    <meta
        name="description"
        content="Lightning-fast Valorant stats API for stream bots. Get player stats instantly."
    />
</svelte:head>

<div class="page">
    {#if !playerData}
        <section class="hero">
            <div class="hero-badge">Valorant Stats API</div>
            <h1 class="hero-title">Crank out<br />player stats</h1>
            <p class="hero-subtitle">
                Text-first API for stream bots. Fast, simple, built for
                production.
            </p>

            <form
                class="search-box"
                onsubmit={(e) => {
                    e.preventDefault();
                    searchPlayer();
                }}
            >
                <div class="input-row">
                    <input
                        type="text"
                        placeholder="Username"
                        bind:value={name}
                        disabled={loading}
                        class="search-input"
                        oninput={(e) => {
                            const input = e.currentTarget;
                            if (input.value.includes("#")) {
                                input.value = input.value.replace(/#/g, "");
                                name = input.value;
                                document
                                    .querySelector<HTMLInputElement>(
                                        ".tag-input",
                                    )
                                    ?.focus();
                            }
                        }}
                    />
                    <span class="input-sep">#</span>
                    <input
                        type="text"
                        placeholder="Tag"
                        bind:value={tag}
                        disabled={loading}
                        class="tag-input"
                        onkeydown={(e) => {
                            if (e.key === "Backspace" && !tag) {
                                document
                                    .querySelector<HTMLInputElement>(
                                        ".search-input",
                                    )
                                    ?.focus();
                            }
                        }}
                    />
                </div>
                <button type="submit" class="submit-btn" disabled={loading}>
                    {#if loading}
                        <span class="btn-spinner"></span>
                    {:else}
                        Search
                    {/if}
                </button>
            </form>

            {#if error}
                <div class="error-message">{error}</div>
            {/if}
        </section>
    {:else if error}
        <div class="error-message">{error}</div>
    {/if}

    {#if playerData}
        <section class="results">
            <div class="results-header">
                <button
                    class="new-search-btn"
                    onclick={() => (playerData = null)}
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        width="16"
                        height="16"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    New Search
                </button>
                <div class="bot-buttons">
                    {#each bots as bot}
                        <button
                            class="bot-btn"
                            class:active={selectedBot === bot.id}
                            onclick={() => (selectedBot = bot.id)}
                        >
                            {bot.name}
                        </button>
                    {/each}
                    <button
                        class="bot-btn comp-btn"
                        class:active={compOnly}
                        onclick={() => (compOnly = !compOnly)}
                    >
                        Competitive Only
                    </button>
                </div>
            </div>
            <div class="results-grid">
                <div class="result-card player-card">
                    <div class="card-top">
                        <div class="player-info">
                            <h2 class="player-name">
                                {playerData.name}<span class="player-tag"
                                    >#{playerData.tag}</span
                                >
                            </h2>
                            <span class="player-region"
                                >{playerData.region.toUpperCase()}</span
                            >
                        </div>
                    </div>

                    <div
                        class="rank-box"
                        style="--rank-color: {getRankColor(playerData.rank)}"
                    >
                        <div class="rank-main">
                            <span class="rank-tier">{playerData.rank}</span>
                            <span class="rank-rr">{playerData.rr} RR</span>
                        </div>
                        {#if playerData.rr_change}
                            <span
                                class="rank-delta"
                                class:pos={playerData.rr_change > 0}
                                class:neg={playerData.rr_change < 0}
                            >
                                {playerData.rr_change > 0
                                    ? "+"
                                    : ""}{playerData.rr_change}
                            </span>
                        {/if}
                    </div>

                    <div class="stats-row" class:comp-active={playerData.comp}>
                        <div class="stat">
                            <span class="stat-label">Session</span>
                            <span class="stat-value"
                                >W{playerData.wins} / L{playerData.losses}</span
                            >
                            <span class="stat-streak"
                                >{playerData.streak.join("")}</span
                            >
                        </div>
                        <div class="stat">
                            <span class="stat-label">KDA</span>
                            <span class="stat-value">{playerData.kda}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">HS%</span>
                            <span class="stat-value"
                                >{playerData.headshot_percent}</span
                            >
                        </div>
                        <div class="stat">
                            <span class="stat-label">ACS</span>
                            <span class="stat-value">{playerData.acs}</span>
                        </div>
                        {#if playerData.comp}
                            <span class="comp-badge">COMP</span>
                        {/if}
                    </div>

                    {#if playerData.radiant_rr}
                        <div class="meta-row radiant">
                            <span class="meta-label">Radiant</span>
                            <span class="meta-value"
                                >{playerData.radiant_rr}</span
                            >
                        </div>
                    {/if}

                    <div class="widget-section">
                        <div class="widget-section-header">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                width="16"
                                height="16"
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                />
                                <path d="M3 9h18M9 21V9" />
                            </svg>
                            Stream Widget
                        </div>

                        <div class="widget-config">
                            <div class="widget-toggles">
                                <label class="toggle-item">
                                    <input
                                        type="checkbox"
                                        bind:checked={widgetToggles.mmr}
                                    />
                                    <span class="toggle-label">MMR</span>
                                </label>
                                <label class="toggle-item">
                                    <input
                                        type="checkbox"
                                        bind:checked={widgetToggles.wl}
                                    />
                                    <span class="toggle-label">W/L</span>
                                </label>
                                <label class="toggle-item">
                                    <input
                                        type="checkbox"
                                        bind:checked={widgetToggles.stat}
                                    />
                                    <span class="toggle-label"
                                        >KDA + HS + ACS</span
                                    >
                                </label>
                                <label class="toggle-item">
                                    <input
                                        type="checkbox"
                                        bind:checked={widgetToggles.radiant}
                                    />
                                    <span class="toggle-label">Radiant</span>
                                </label>
                            </div>

                            <div class="widget-preview">
                                <div class="preview-label">Preview</div>
                                <div class="preview-box">
                                    {#if widgetToggles.mmr}
                                        <div
                                            class="wid-row"
                                            style="--rank-color: {getRankColor(
                                                getDisplayData().rank,
                                            )}"
                                        >
                                            <img
                                                src={getRankIcon(
                                                    getDisplayData().rank,
                                                )}
                                                alt={getDisplayData().rank}
                                                class="wid-rank-icon"
                                            />
                                            <span class="wid-rank"
                                                >{getDisplayData().rank}</span
                                            >
                                            <span class="wid-rr"
                                                >{getDisplayData().rr} RR {#if getDisplayData().rr_change !== 0}
                                                    <span
                                                        class="wid-change"
                                                        class:pos={getDisplayData()
                                                            .rr_change > 0}
                                                        class:neg={getDisplayData()
                                                            .rr_change < 0}
                                                        >{getDisplayData()
                                                            .rr_change > 0
                                                            ? "+"
                                                            : ""}{getDisplayData()
                                                            .rr_change}</span
                                                    >{/if}</span
                                            >
                                        </div>
                                    {/if}

                                    {#if widgetToggles.wl}
                                        <div class="wid-row">
                                            <span class="wid-label"
                                                >Session</span
                                            >
                                            <span class="wid-value"
                                                >W{getDisplayData().wins} L{getDisplayData()
                                                    .losses}</span
                                            >
                                            <span class="wid-streak"
                                                >{getDisplayData().streak.join(
                                                    "",
                                                )}</span
                                            >
                                        </div>
                                    {/if}

                                    {#if widgetToggles.stat}
                                        <div class="wid-row">
                                            <span class="wid-value"
                                                >KDA {getDisplayData()
                                                    .kda}</span
                                            >
                                            <span class="wid-sep">·</span>
                                            <span class="wid-value"
                                                >HS {getDisplayData()
                                                    .headshot_percent}%</span
                                            >
                                            <span class="wid-sep">·</span>
                                            <span class="wid-value"
                                                >ACS {getDisplayData()
                                                    .acs}</span
                                            >
                                        </div>
                                    {/if}

                                    {#if (widgetToggles.radiant && playerData && getDisplayData().radiant_rr) || (!playerData && getDisplayData().radiant_rr)}
                                        <div class="wid-row radiant">
                                            <span class="wid-radiant">{getDisplayData().radiant_rr}</span>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            <button
                                class="copy-widget-btn"
                                onclick={copyWidgetUrl}
                                disabled={!playerData}
                            >
                                {#if copiedEndpoint === "widget-url"}
                                    Copied!
                                {:else if !playerData}
                                    Search player first
                                {:else}
                                    Copy Widget URL
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="result-card endpoints-card">
                    <div class="card-header">
                        <h3>Bot Integration</h3>
                    </div>

                    <div class="endpoints-list">
                        {#each getEndpoints(playerData.puuid, playerData.region) as ep}
                            <button
                                class="endpoint"
                                onclick={() => copyBotCommand(ep.endpoint)}
                            >
                                <span class="ep-name">{ep.label}</span>
                                <span
                                    class="ep-path"
                                    class:copied={copiedEndpoint ===
                                        `${selectedBot}-${ep.endpoint}`}
                                >
                                    {#if copiedEndpoint === `${selectedBot}-${ep.endpoint}`}
                                        Copied!
                                    {:else}
                                        {getBotCommand(ep.endpoint)}
                                    {/if}
                                </span>
                            </button>
                        {/each}
                    </div>

                    <div class="card-footer">
                        <code>?format=json</code> for JSON response
                    </div>
                </div>
            </div>
        </section>
    {:else}
        <section class="docs">
            <div class="docs-grid">
                <div class="doc-card">
                    <div class="doc-content">
                        <div class="doc-header">
                            <div class="doc-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                >
                                    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                                </svg>
                            </div>
                            <h4>Account</h4>
                        </div>
                        <code>/v3/account/{"{name}"}/{"{tag}"}</code>
                        <span class="doc-output">Solo#Manan (AP)</span>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-content">
                        <div class="doc-header">
                            <div class="doc-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                >
                                    <path d="M12 2v20M2 12h20" />
                                </svg>
                            </div>
                            <h4>MMR</h4>
                        </div>
                        <code>/v3/mmr/{"{region}"}/{"{puuid}"}</code>
                        <span class="doc-output">Immortal 3 - 234RR</span>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-content">
                        <div class="doc-header">
                            <div class="doc-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                >
                                    <path
                                        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                    />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h4>Win/Loss</h4>
                        </div>
                        <code>/v3/wl/{"{region}"}/{"{puuid}"}</code>
                        <span class="doc-output">W7 L2 (WWWWLWLWW)</span>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-content">
                        <div class="doc-header">
                            <div class="doc-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                >
                                    <path d="M12 20V10M18 20V4M6 20v-4" />
                                </svg>
                            </div>
                            <h4>ACS</h4>
                        </div>
                        <code>/v3/acs/{"{region}"}/{"{puuid}"}</code>
                        <span class="doc-output">542</span>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-content">
                        <div class="doc-header">
                            <div class="doc-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                            </div>
                            <h4>KDA</h4>
                        </div>
                        <code>/v3/kd/{"{region}"}/{"{puuid}"}</code>
                        <span class="doc-output">18/5/3</span>
                    </div>
                </div>

                <div class="doc-card widget-preview-card">
                    <div class="doc-content">
                        <div class="doc-header">
                            <div class="doc-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                >
                                    <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                    />
                                    <path d="M3 9h18M9 21V9" />
                                </svg>
                            </div>
                            <h4>Widget</h4>
                            <code
                                >/wid/{"{region}"}/{"{puuid}"}?mmr=y&wl=y&stat=y</code
                            >
                        </div>
                        <div class="doc-widget-preview">
                            <div class="wid-row" style="--rank-color: #ef4444">
                                <img
                                    src="/rank-icons/immortal3.webp"
                                    alt="Immortal 3"
                                    class="wid-rank-icon"
                                />
                                <span class="wid-rank">IMMORTAL 3</span>
                                <span class="wid-rr"
                                    >234 RR <span class="wid-change neg"
                                        >-12</span
                                    ></span
                                >
                            </div>
                            <div class="wid-row">
                                <span class="wid-label">Session</span>
                                <span class="wid-value">W7 L2</span>
                                <span class="wid-streak">WWWWWLWWL</span>
                            </div>
                            <div class="wid-row">
                                <span class="wid-value">KDA 18/5/3</span>
                                <span class="wid-sep">·</span>
                                <span class="wid-value">HS 28.5%</span>
                                <span class="   wid-sep">·</span>
                                <span class="wid-value">ACS 542</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-content">
                        <div class="doc-header">
                            <div class="doc-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                            </div>
                            <h4>Headshot</h4>
                        </div>
                        <code>/v3/hs/{"{region}"}/{"{puuid}"}</code>
                        <span class="doc-output">28.5%</span>
                    </div>
                </div>
            </div>
        </section>
    {/if}
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap");

    :root {
        --bg: #0a0a0c;
        --bg-soft: #111114;
        --bg-card: #18181b;
        --border: rgba(255, 255, 255, 0.08);
        --border-hover: rgba(255, 255, 255, 0.12);
        --text: #fff;
        --text-dim: #a1a1aa;
        --text-muted: #52525b;
        --accent: #f97316;
        --accent-dim: rgba(249, 115, 22, 0.15);
        --success: #22c55e;
        --danger: #ef4444;
    }

    .page {
        animation: fadeIn 0.4s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .hero {
        text-align: center;
        padding: 0 0 2.5rem;
    }

    .hero-badge {
        display: inline-block;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--accent);
        background: var(--accent-dim);
        padding: 0.375rem 0.75rem;
        border-radius: 100px;
        margin-bottom: 1.5rem;
        letter-spacing: 0.02em;
    }

    .hero-title {
        font-family:
            "Geist",
            -apple-system,
            sans-serif;
        font-size: clamp(2.5rem, 7vw, 4rem);
        font-weight: 700;
        letter-spacing: -0.04em;
        line-height: 1.05;
        color: var(--text);
        margin-bottom: 1rem;
    }

    .hero-subtitle {
        font-size: 1.125rem;
        color: var(--text-dim);
        max-width: 480px;
        margin: 0 auto 2rem;
    }

    .search-box {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        max-width: 480px;
        margin: 0 auto;
    }

    .input-row {
        display: flex;
        align-items: center;
        flex: 1;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0 0.25rem;
        transition: border-color 0.15s ease;
    }

    .input-row:focus-within {
        border-color: var(--accent);
    }

    .search-input,
    .tag-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.9375rem;
        color: var(--text);
        padding: 0.875rem 1rem;
    }

    .search-input::placeholder,
    .tag-input::placeholder {
        color: var(--text-muted);
    }

    .tag-input {
        width: 90px;
        flex: none;
    }

    .input-sep {
        font-family: "JetBrains Mono", monospace;
        color: var(--text-muted);
        font-size: 1rem;
    }

    .submit-btn {
        background: var(--accent);
        border: none;
        border-radius: 10px;
        padding: 0 1.5rem;
        font-family: "Geist", sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: all 0.15s ease;
        min-width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .submit-btn:hover:not(:disabled) {
        background: #ea580c;
    }

    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .btn-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-message {
        display: inline-block;
        margin-top: 1.25rem;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8125rem;
        color: var(--danger);
        background: rgba(239, 68, 68, 0.1);
        padding: 0.5rem 1rem;
        border-radius: 6px;
    }

    .results {
        margin-top: 0.5rem;
    }

    .results-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .new-search-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.5rem 0.875rem;
        font-family: "Geist", sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-dim);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .new-search-btn:hover {
        border-color: var(--accent);
        color: var(--text);
    }

    .new-search-btn svg {
        opacity: 0.7;
    }

    .bot-buttons {
        display: flex;
        gap: 0.375rem;
    }

    .bot-btn {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.4rem 0.75rem;
        font-family: "Geist", sans-serif;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-dim);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .bot-btn:hover {
        border-color: var(--border-hover);
        color: var(--text);
    }

    .bot-btn.active {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
    }

    .results-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    @media (max-width: 768px) {
        .results-grid {
            grid-template-columns: 1fr;
        }
    }

    .result-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 1.25rem;
    }

    .card-top {
        margin-bottom: 1rem;
    }

    .player-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .player-name {
        font-family: "Geist", sans-serif;
        font-size: 1.375rem;
        font-weight: 600;
        color: var(--text);
        letter-spacing: -0.02em;
    }

    .player-tag {
        font-weight: 400;
        color: var(--text-muted);
    }

    .player-region {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--text-muted);
        background: var(--bg-soft);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        letter-spacing: 0.05em;
    }

    .rank-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-soft);
        border: 1px solid var(--border);
        border-left: 3px solid var(--rank-color, var(--text-muted));
        border-radius: 10px;
        padding: 0.875rem 1rem;
        margin-bottom: 1rem;
    }

    .rank-main {
        display: flex;
        align-items: baseline;
        gap: 0.625rem;
    }

    .rank-tier {
        font-family: "Geist", sans-serif;
        font-size: 1.0625rem;
        font-weight: 600;
        color: var(--text);
    }

    .rank-rr {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8125rem;
        color: var(--text-dim);
    }

    .rank-delta {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
    }

    .rank-delta.pos {
        color: var(--success);
        background: rgba(34, 197, 94, 0.12);
    }
    .rank-delta.neg {
        color: var(--danger);
        background: rgba(239, 68, 68, 0.12);
    }

    .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        position: relative;
    }

    .stats-row.comp-active {
        border: 1px solid rgba(251, 191, 36, 0.3);
        background: rgba(251, 191, 36, 0.05);
        border-radius: 10px;
        padding: 0.5rem;
    }

    .comp-badge {
        position: absolute;
        top: -8px;
        right: 8px;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.5625rem;
        font-weight: 600;
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.15);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        letter-spacing: 0.05em;
    }

    .stat {
        background: var(--bg-soft);
        border-radius: 8px;
        padding: 0.75rem;
        text-align: center;
    }

    .stat-label {
        display: block;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.625rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.25rem;
    }

    .stat-value {
        display: block;
        font-family: "Geist", sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text);
    }

    .stat-streak {
        display: block;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        color: var(--accent);
        margin-top: 0.2rem;
        letter-spacing: 0.1em;
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: var(--bg-soft);
        border-radius: 6px;
    }

    .meta-row.radiant {
        background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.08),
            rgba(245, 158, 11, 0.04)
        );
    }

    .meta-label {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        color: var(--text-muted);
        text-transform: uppercase;
    }

    .meta-value {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-dim);
    }

    .widget-section {
        margin-top: 1rem;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
    }

    .widget-section-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--bg-soft);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.625rem 0.875rem;
        font-family: "Geist", sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text);
    }

    .widget-section-header svg {
        color: var(--accent);
    }

    .widget-config {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .widget-toggles {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .toggle-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        background: var(--bg-soft);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.375rem 0.625rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .toggle-item:hover {
        border-color: var(--border-hover);
    }

    .toggle-item input {
        accent-color: var(--accent);
        width: 14px;
        height: 14px;
    }

    .toggle-label {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .widget-preview {
        background: rgba(10, 10, 12, 0.6);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.75rem;
    }

    .preview-label {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.625rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }

    .preview-box {
        background: transparent;
        font-family: "JetBrains Mono", monospace;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .wid-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .wid-row:not(.radiant) {
        padding-left: 0.625rem;
        border-left: 2px solid var(--rank-color, #71717a);
    }

    .wid-rank-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
    }

    .wid-rank {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text);
    }

    .wid-rr {
        font-size: 0.75rem;
        color: var(--text-dim);
    }

    .wid-change {
        font-size: 0.625rem;
        font-weight: 600;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
    }

    .wid-change.pos {
        color: var(--success);
        background: rgba(34, 197, 94, 0.15);
    }

    .wid-change.neg {
        color: var(--danger);
        background: rgba(239, 68, 68, 0.15);
    }

    .wid-label {
        font-size: 0.5625rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .wid-value {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text);
    }

    .wid-streak {
        font-size: 0.625rem;
        color: var(--accent);
        letter-spacing: 0.1em;
    }

    .wid-sep {
        color: var(--text-muted);
        font-size: 0.75rem;
    }

    .wid-row.radiant {
        background: linear-gradient(
            90deg,
            rgba(251, 191, 36, 0.12),
            transparent
        );
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        border-left: 2px solid #fbbf24;
    }

    .wid-radiant {
        font-size: 0.6875rem;
        font-weight: 600;
        color: #fbbf24;
        letter-spacing: 0.05em;
    }

    .copy-widget-btn {
        background: var(--accent);
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-family: "Geist", sans-serif;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .copy-widget-btn:hover {
        background: #ea580c;
    }

    .endpoints-card .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .endpoints-card h3 {
        font-family: "Geist", sans-serif;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text);
    }

    .endpoints-list {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .endpoint {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        background: var(--bg-soft);
        border: 1px solid transparent;
        border-radius: 8px;
        padding: 0.625rem 0.875rem;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        width: 100%;
    }

    .endpoint:hover {
        border-color: var(--border-hover);
    }

    .ep-name {
        font-family: "Geist", sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text);
    }

    .ep-path {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.625rem;
        color: var(--text-muted);
        transition: color 0.15s ease;
        word-break: break-all;
        line-height: 1.4;
    }

    .ep-path.copied {
        color: var(--success);
    }

    .card-footer {
        margin-top: 0.875rem;
        padding-top: 0.875rem;
        border-top: 1px solid var(--border);
        text-align: center;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        color: var(--text-muted);
    }

    .card-footer code {
        color: var(--accent);
        background: var(--accent-dim);
        padding: 0.15rem 0.375rem;
        border-radius: 3px;
    }

    .docs {
        margin-top: 1rem;
    }

    .docs-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.25rem;
    }

    @media (max-width: 900px) {
        .docs-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 500px) {
        .docs-grid {
            grid-template-columns: 1fr;
        }

        .docs-grid .widget-preview-card {
            grid-column: span 1;
        }
    }

    .docs-grid .widget-preview-card {
        grid-column: span 2;
    }

    .doc-card {
        display: flex;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1rem;
        transition: border-color 0.15s ease;
    }

    .doc-card:hover {
        border-color: var(--border-hover);
    }

    .doc-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-soft);
        border-radius: 8px;
        color: var(--accent);
        flex-shrink: 0;
    }

    .doc-icon svg {
        width: 18px;
        height: 18px;
    }

    .doc-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.375rem;
    }

    .doc-header .doc-icon {
        width: 20px;
        height: 20px;
        background: transparent;
        padding: 0;
    }

    .doc-header .doc-icon svg {
        width: 16px;
        height: 16px;
    }

    .doc-header code {
        display: inline;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.5625rem;
        color: var(--text-muted);
        background: var(--bg-soft);
        padding: 0.15rem 0.375rem;
        border-radius: 3px;
        word-break: break-all;
    }

    .doc-content h4 {
        font-family: "Geist", sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text);
        margin: 0;
    }

    .doc-content code {
        display: block;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.6875rem;
        color: var(--text-dim);
        background: var(--bg-soft);
        padding: 0.375rem 0.5rem;
        border-radius: 4px;
        margin-bottom: 0.375rem;
        word-break: break-all;
    }

    .doc-output {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.75rem;
        color: var(--accent);
        font-weight: 500;
    }

    .doc-widget-preview {
        margin-top: 0.5rem;
        background: linear-gradient(
            to bottom right,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.1) 60%,
            transparent 100%
        );
        padding: 0.5rem 0.75rem;
        font-family: "JetBrains Mono", monospace;
    }

    .doc-widget-preview .wid-row {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-wrap: wrap;
        font-size: 0.625rem;
    }

    .doc-widget-preview .wid-row:not(.radiant) {
        padding-left: 0.5rem;
        border-left: 2px solid var(--rank-color, #71717a);
    }

    .doc-widget-preview .wid-rank-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
    }

    .doc-widget-preview .wid-rank {
        font-weight: 600;
        color: #fff;
    }

    .doc-widget-preview .wid-rr {
        color: rgba(255, 255, 255, 0.7);
    }

    .doc-widget-preview .wid-change {
        font-size: 0.5rem;
        font-weight: 600;
        padding: 0.125rem 0.25rem;
        border-radius: 2px;
    }

    .doc-widget-preview .wid-change.neg {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.15);
    }

    .doc-widget-preview .wid-label {
        font-size: 0.5rem;
        color: var(--text-muted);
        text-transform: uppercase;
    }

    .doc-widget-preview .wid-value {
        color: #fff;
    }

    .doc-widget-preview .wid-streak {
        color: var(--accent);
        letter-spacing: 0.1em;
    }

    .doc-widget-preview .wid-sep {
        color: var(--text-muted);
    }

    @media (max-width: 540px) {
        .search-box {
            flex-direction: column;
        }

        .input-row {
            width: 100%;
        }

        .submit-btn {
            padding: 0.875rem;
            width: 100%;
        }

        .stats-row {
            grid-template-columns: 1fr;
        }
    }
</style>
