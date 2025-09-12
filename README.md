# GIToday

**A Discord bot to report GitHub organization commit statistics.**

---

## Table of Contents

- [GIToday](#gitoday)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Usage](#usage)
  - [Configuration](#configuration)
  - [Deployment](#deployment)

---

## Features

- Slash-command `/report` to generate commit activity reports for a GitHub organization or single repo  
- Supports relative time windows (e.g. `7d`, `24h`) and absolute windows via ISO8601 timestamps  
- Outputs leaderboard of commit lines added (and optionally deleted/total) per contributor  
- HTML embed or message output formatted nicely for Discord  
- Time window cap: up to **90 days** to avoid performance issues  

---

## Requirements

- Node.js (v24 or later recommended)  
- A GitHub Personal Access Token (PAT) with permissions to read from the organization and its repos  
- A Discord Bot Token, with appropriate permissions to send messages, use slash commands, etc.  
- Environment variables configured (see [Configuration](#configuration))  

---

## Usage

Once configured, you can use commands like:

| Command | Description |
|---|---|
| `/report` | Reports commit stats for org, default last 1 day |
| `/report rel=7d` | Last 7 days for org |
| `/report since=2025-09-01 until=2025-09-10` | Absolute window |
| `/report repo=my-repo rel=24h` | Last 24h for a specific repo |

Example output:  
> Org Total · last 7d  
> 1. **Alice** · `add: 1234`  
> 2. **Bob** · `add: 432`  

---

## Configuration

You need a `.env` file or environment variables with the following keys:

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your Discord bot token |
| `GITHUB_TOKEN` | GitHub PAT with read permissions |
| `GITHUB_ORG` | Your GitHub organization name |
| `GUILD_ID` | (Optional) Discord Guild ID to register commands for testing |
| (other vars as needed) | — |

Also configure `tsconfig.json`, `.gitignore`, etc., as per project settings.

---

## Deployment

Steps to deploy:

1. Install dependencies:  
   ```bash
   npm install