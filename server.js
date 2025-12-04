const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const tmi = require('tmi.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ users: {} }).write();

const PORT = 3000;

require('dotenv').config();
// ------ Configure Twitch client ------
const CHANNEL = process.env.TWITCH_CHANNEL;  // <- Change this to your channel name
const BOT_USERNAME = process.env.BOT_USERNAME;  // <- Change this to your bot's username
const OAUTH = process.env.BOT_OAUTH;  // <- Change this to your bot's OAuth token (get from twitchapps.com/tmi or similar)
// -------------------------------------

const items = [
    {name: 'Small Carp', emoji: '🐟', weight: 10},
    {name: 'Clownfish', emoji: '🐠', weight: 0.3},
    {name: 'Pufferfish', emoji: '🐡', weight: 1},
    {name: 'Golden Koi', emoji: '✨🐟', weight: 0.5},
    {name: 'Old Boot', emoji: '👢', weight: 20},
    {name: 'Sunken Treasure', emoji: '💰', weight: 0.2},
    {name: 'Rusty Anchor', emoji: '⚓', weight: 15},
    {name: 'Swordfish', emoji: '🗡️', weight: 2},
    {name: 'Oyster', emoji: '🦪', weight: 0.1},
    {name: 'Pirate Flag', emoji: '🏴‍☠️', weight: 3},
    {name: 'Shark', emoji: '🦈', weight: 1},
    {name: 'Mermaid', emoji: '🧜‍♀️', weight: 0.5},
    {name: 'Dolphin', emoji: '🐬', weight: 2},
    {name: 'Sea Turtle', emoji: '🐢', weight: 4},
    {name: 'Crab', emoji: '🦀', weight: 6},
    {name: 'Lobster', emoji: '🦞', weight: 5},
    {name: 'TopHat', emoji: '🎩', weight: 0.3},
    {name: 'Crown', emoji: '👑', weight: 0.2},
    {name: 'Diamond', emoji: '💎', weight: 0.1},
    {name: 'Pearl Necklace', emoji: '📿', weight: 0.4},
    {name: 'Treasure Map', emoji: '🗺️', weight: 1},
    {name: 'Fishing Rod', emoji: '🎣', weight: 0.5},
    {name: 'Sun Hat', emoji: '👒', weight: 0.3},
    {name: 'Sunglasses', emoji: '🕶️', weight: 0.2},
    {name: 'Trousers', emoji: '👖', weight: 0.4},
    {name: 'Tennis Shoe', emoji: '👟', weight: 0.5},
    {name: 'Backpack', emoji: '🎒', weight: 0.6},
    {name: 'Sea Shell', emoji: '🐚', weight: 2},
    {name: 'Starfish', emoji: '⭐', weight: 3},
    {name: 'Seaweed', emoji: '🌿', weight: 10},
    {name: 'Bottled Message', emoji: '📜', weight: 1},
    {name: 'Tuna', emoji: '🍣', weight: 5},
    {name: 'Cheese', emoji: '🧀', weight: 8},
    {name: 'Sea Urchin', emoji: '🦔', weight: 4},
    {name: 'Coral', emoji: '🌺', weight: 7},
    {name: 'Whale', emoji: '🐋', weight: 0.1},
    {name: 'Octopus', emoji: '🐙', weight: 3},
    {name: 'Squid', emoji: '🦑', weight: 4},
    {name: 'Surfboard', emoji: '🏄', weight: 1},
    {name: 'Balloon', emoji: '🎈', weight: 5},
    {name: 'Ice Cream', emoji: '🍦', weight: 6},
    {name: 'Cupcake', emoji: '🧁', weight: 7},
    {name: 'Silver Medal', emoji: '🥈', weight: 0.5},
    {name: 'Gold Medal', emoji: '🥇', weight: 0.2},
    {name: 'Trophy', emoji: '🏆', weight: 0.3},
    {name: 'Bronze Medal', emoji: '🥉', weight: 0.7},
    {name: 'Trident', emoji: '🔱', weight: 0.4},
    {name: 'Diving Mask', emoji: '🤿', weight: 1},
    {name: 'Dirty Sock', emoji: '🧦', weight: 12},
    {name: 'Canned Fish', emoji: '🥫', weight: 9},
    {name: 'Hamburger', emoji: '🍔', weight: 8}
];

function getRandomItem() {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of items) {
        if (roll < item.weight) return item;
        roll -= item.weight;
    }
    return items[0];
}

const client = new tmi.Client({
    options: { debug: false },
    connection: { secure: true, reconnect: true },
    identity: {
        username: BOT_USERNAME,
        password: OAUTH
    },
    channels: [CHANNEL]
});

client.connect();

app.use(express.static('public'));

server.listen(PORT, () => console.log(`Overlay → http://localhost:${PORT}`));

io.on('connection', () => console.log('OBS connected'));

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    const username = tags.username.toLowerCase();
    const msg = message.toLowerCase().trim();
    const displayName = tags['display-name'] || username;

    if (!db.has(`users.${username}`).value()) {
        db.set(`users.${username}`, {inventory: [], lastFish: 0, lastSpawn: 0}).write();
    }

    if (msg === '!spawncat') {
        const lastSpawn = db.get(`users.${username}.lastSpawn`).value() || 0;
        if (Date.now() - lastSpawn < 45000) {
            client.say(channel, `@${displayName}, your kitten is still out there! Chill ~15 sec`);
            return;
        }

        db.set(`users.${username}.lastSpawn`, Date.now()).write();

        io.emit('spawnCat', {
            username: displayName,
            color: tags.color || '#FFFFFF'
        });

        client.say(channel, `@${displayName} spawned a Fishin' Kitten! 🎣 !fish = cast`);
    }

    if (msg === '!fish') {
        const lastFish = db.get(`users.${username}.lastFish`).value() || 0;
        if (Date.now() - lastFish < 120000) { // 2 minutes
            const remaining = Math.ceil((120000 - (Date.now() - lastFish)) / 1000);
            client.say(channel, `@${displayName} kitty needs a nap! Wait ${remaining}s`);
            return;
            return;
        }

        db.set(`users.${username}.lastFish`, Date.now()).write();

        io.emit('startFishing', { username: displayName });

        setTimeout(() => {
            const item = getRandomItem();
            db.get(`users.${username}.inventory`).push(item.name).write();

            io.emit('caughtItem', {
                username: displayName,
                item: item.name,
                emoji: item.emoji,
                color: tags.color || '#FFFFFF',
                isRare: item.weight <= 3
            });

            const rarityText = item.weight <= 3 ? 'INSANE RARE!!!' : '!'
            client.say(channel, `@${displayName} caught a ${item.emoji} ${item.name} ${rarityText}`);
        }, 4000);
    }

    if (msg === '!inventory' || msg.startsWith('!inventory')) {
        let target = msg === '!inventory' ? username : msg.split(' ')[1]?.replace('@', '').toLowerCase() || username;

        const inv = db.get(`users.${target}.inventory`).value() || [];

        if (inv.length === 0) {
            client.say(channel, target === username 
                ? `@${displayName}, your inventory is empty! Go fish Sadge`
                : `@${target} has nothing yet`);
            return;
        }

        const counts = inv.reduce((acc, i) => {
            acc[i] = (acc[i] || 0) + 1;
            return acc;
        }, {});

        const list = Object.entries(counts)
            .map(([name, count]) => `${name} x${count}`)
            .join(', ');

        client.say(channel, `@${target === username ? displayName : target}'s haul: ${list}`);
    }
});