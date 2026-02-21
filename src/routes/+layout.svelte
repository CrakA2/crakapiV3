<script lang="ts">
    import "../app.css";
    import { page } from "$app/stores";

    let { children } = $props();

    let isWidget = $derived($page.url.pathname.startsWith("/wid"));
</script>

{#if isWidget}
    {@render children()}
{:else}
    <div class="app">
        <div class="bg-grid"></div>

        <header>
            <nav>
                <a href="/" class="logo">
                    <div class="logo-icon">
                        <svg viewBox="0 0 32 32" fill="none">
                            <path
                                d="M16 4L4 12v8l12 8 12-8V12L16 4z"
                                stroke="currentColor"
                                stroke-width="1.5"
                            />
                            <path
                                d="M16 12l-6 4v4l6 4 6-4v-4l-6-4z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                    <span class="logo-text">CrakAPI</span>
                    <span class="logo-badge">v3</span>
                </a>
                <div class="nav-links">
                    <a
                        href="https://github.com/CrakA2/crakapiV3"
                        target="_blank"
                        rel="noopener"
                        class="nav-link nav-icon"
                        aria-label="GitHub"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                            />
                        </svg>
                    </a>
                </div>
            </nav>
        </header>

        <main>
            {@render children()}
        </main>

        <footer>
            <div class="footer-content">
                <p>CrakAPI v3 &mdash; Valorant Stats API</p>
                <p>
                    Not associated with Riot Games. Henrik's API under the hood.
                    Meant to make Valorant easier.
                </p>
            </div>
        </footer>
    </div>
{/if}

<style>
    :global(*, *::before, *::after) {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    :global(html, body) {
        height: 100%;
    }

    .app {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .bg-grid {
        position: fixed;
        inset: 0;
        background-image:
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.02) 1px,
                transparent 1px
            );
        background-size: 60px 60px;
        pointer-events: none;
        z-index: 0;
    }

    header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(10, 10, 12, 0.8);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    nav {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.875rem 1.5rem;
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        text-decoration: none;
    }

    .logo-icon {
        width: 28px;
        height: 28px;
        color: #f97316;
    }

    .logo-icon svg {
        width: 100%;
        height: 100%;
    }

    .logo-text {
        font-size: 1.125rem;
        font-weight: 600;
        color: #fff;
        letter-spacing: -0.02em;
    }

    .logo-badge {
        font-family: "IBM Plex Mono", monospace;
        font-size: 0.625rem;
        font-weight: 500;
        color: #f97316;
        background: rgba(249, 115, 22, 0.12);
        padding: 0.1875rem 0.4375rem;
        border-radius: 4px;
    }

    .nav-links {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .nav-link {
        font-size: 0.875rem;
        font-weight: 500;
        color: #71717a;
        text-decoration: none;
        padding: 0.5rem 0.875rem;
        border-radius: 6px;
        transition: all 0.15s ease;
    }

    .nav-link:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.04);
    }

    .nav-icon {
        padding: 0.5rem;
    }

    .nav-icon svg {
        width: 18px;
        height: 18px;
    }

    main {
        flex: 1;
        position: relative;
        z-index: 1;
        padding: 3rem 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    footer {
        position: relative;
        z-index: 1;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding: 1.5rem;
    }

    .footer-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8125rem;
        color: #52525b;
    }

    @media (max-width: 640px) {
        nav {
            padding: 0.875rem 1rem;
        }

        main {
            padding: 2rem 1rem;
        }

        .footer-content {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
        }
    }
</style>
