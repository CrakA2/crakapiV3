<p align="center">
  <img src="https://api.crak.in/games-valorant.png" alt="CrakAPI" width="128" />
</p>

<h1 align="center">CrakAPI v3</h1>

<p align="center">
  <a href="https://api.crak.in"><img src="https://img.shields.io/badge/Live API-api.crak.in-f97316?style=flat" alt="Live API" /></a>
  <a href="https://github.com/CrakA2/crakapiV3"><img src="https://img.shields.io/badge/GitHub-CrakA2/crakapiV3-f97316?style=flat" alt="GitHub" /></a>
</p>

Fast, text-first Valorant stats API built for stream bots.

## Why CrakAPI?

- **Text-first** — Responses optimized for chat, no parsing needed
- **Blazing fast** — Multi-tier caching with request coalescing
- **Stream-ready** — Works with Nightbot, StreamElements, StreamLabs
- **Developer-friendly** — Clean JSON API when you need it

## Live API

```
https://api.crak.in
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your HenrikDev API key to .env
# Get one at https://discord.com/invite/X3GaVkX2YN

# Development
npm run dev

# Production build
npm run build
npm run preview
```

## API Endpoints

| Endpoint | Description | Text Output |
|----------|-------------|-------------|
| `GET /v3/account/{name}/{tag}` | Player account | `PlayerName#TAG (NA)` |
| `GET /v3/mmr/{region}/{puuid}` | Current rank | `Diamond 2 - 67RR (+22)` |
| `GET /v3/wl/{region}/{puuid}` | Win/Loss | `W5 L2 (WWLLW)` |
| `GET /v3/kd/{region}/{puuid}` | KDA | `18/5/3` |
| `GET /v3/hs/{region}/{puuid}` | Headshot % | `28.5%` |
| `GET /v3/acs/{region}/{puuid}` | Average Combat Score | `245 ACS` |
| `GET /v3/leaderboard/{region}/{puuid}` | Leaderboard rank | `Rank #1,247` |
| `GET /v3/radiant/{region}/{puuid}` | RR to Radiant | `156RR to Radiant` |
| `GET /v3/all/{name}/{tag}` | All data | JSON response |

### Parameters

- `{name}` — Player username (not encoded)
- `{tag}` — Player tag without `#`
- `{region}` — `na`, `eu`, `ap`, `kr`, `latam`, `br`
- `{puuid}` — Player UUID from account endpoint

### Response Format

Default is text. Add `?format=json` for JSON:

```json
{
  "name": "PlayerName",
  "tag": "TAG",
  "puuid": "...",
  "region": "na",
  "rank": "Diamond 2",
  "rr": 67,
  "wins": 5,
  "losses": 2,
  "kda": "18/5/3",
  "headshot_percent": "28.5%",
  "acs": "245 ACS"
}
```

### Competitive Filter

Add `?comp` to filter stats to competitive matches only:

- **W/L** — Counts only competitive matches in session
- **KDA/HS%/ACS** — Stats from last competitive match

```
/v3/wl/na/PLAYER_PUUID?comp
/v3/kd/na/PLAYER_PUUID?comp
/v3/all/PlayerName/TAG?comp
```

## Stream Bot Integration

### Nightbot

```
$(urlfetch https://api.crak.in/v3/wl/na/PLAYER_PUUID)
```

### StreamElements

```
${urlfetch https://api.crak.in/v3/wl/na/PLAYER_PUUID}
```

### StreamLabs

```
$(customapi https://api.crak.in/v3/wl/na/PLAYER_PUUID)
```

## OBS Widget

Browser source overlay for streamers with live stats.

```
https://api.crak.in/wid/{region}/{puuid}?mmr=y&wl=y&stat=y&radiant=y
```

### Widget Parameters

| Param | Description |
|-------|-------------|
| `mmr=y` | Show rank + RR |
| `wl=y` | Show session W/L |
| `stat=y` | Show KDA + HS% + ACS |
| `radiant=y` | Show RR to Radiant |
| `comp` | Filter to competitive only |
| `platform=pc` | Platform (default: pc) |

The widget auto-refreshes every 60 seconds and has a transparent background for OBS overlays. A "COMP" badge appears when competitive filter is active.

## Tech Stack

- **Framework** — SvelteKit
- **Language** — TypeScript
- **API** — [HenrikDev](https://docs.henrikdev.xyz)
- **Hosting** — Node.js (PM2)

## License

MIT
