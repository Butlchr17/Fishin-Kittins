# Fishin' Kittens

# STILL IN DEVELOPMENT!

A chaotic, persistent, Twitch chat overlay where viewers spawn their own fishing cat that patrols the bottom of the screen, randomly walks in bursts, changes direction, idles completely still, and can be commanded to fish with `!fish`. Every viewer keeps their inventory forever.

- Custom Aseprite sprite sheets (walk + fish animations)
- Random color hue/saturation shifts on every spawn (rare shiny golden cats)
- Cats wander: long static idle → sudden patrol → stop → repeat forever
- 40% chance to reverse direction when starting a walk
- Always face movement direction, bounce off edges
- Fishing interrupts everything and resumes exact previous state
- Rare catches
- Handles 100+ simultaneous cats at 60 fps with zero lag

## Commands

- `!spawncat` → spawns/replaces your personal cat (45s cooldown)
- `!fish` → makes your cat fish (2 minute cooldown)
- `!inventory` → shows your haul
- `!inventory @username` → peek someone else's inventory

## Setup (5 minutes)

```bash
git clone https://github.com/Butlchr17/fishin_kittens.git
cd fishin_kittens
npm install
```

1. Get bot OAuth token → https://twitchapps.com/tmi/ (log in with bot account)
2. Create and edit your .env file:
```
TWITCH_CHANNEL=yourchannelname
BOT_USERNAME=yourbotname
BOT_OAUTH=oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
3. Run:
```bash
npm start
```

## OBS
Browser Source → URL: http://localhost:3000 → 1920×1080
Check:
    - Shutdown source when not visible
    - Refresh browser when scene becomes active

___

## Files

- server.js → bot, database, socket server
- public/index.html → entire overlay (no build step)
- db.json → persistent inventories (gitignored)
- .env → secrets (gitignored)

___
## License
MIT — do whatever you want with it
