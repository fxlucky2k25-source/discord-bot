const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.BOT_TOKEN;
const SERVER_ID = process.env.SERVER_ID;

client.on('ready', () => {
    console.log(`✅ Bot είναι online: ${client.user.tag}`);
});

// Δέχεται POST από την HTML σελίδα
app.post('/', async (req, res) => {
    const { name, data } = req.body;
    
    try {
        const guild = client.guilds.cache.get(SERVER_ID);
        
        if (!guild) {
            return res.json({ success: false, error: 'Server not found' });
        }
        
        const cleanName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        let channel = guild.channels.cache.find(
            c => c.name === `👤-${cleanName}`
        );
        
        if (!channel) {
            channel = await guild.channels.create({
                name: `👤-${cleanName}`,
                type: 0
            });
            console.log(`✅ Νέο κανάλι: ${channel.name}`);
        }
        
        await channel.send(data);
        console.log(`📤 Στάλθηκε στο: ${channel.name}`);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Σφάλμα:', error);
        res.json({ success: false, error: error.message });
    }
});

// Health check - ΣΗΜΑΝΤΙΚΟ!
app.get('/', (req, res) => {
    res.json({ status: 'online', bot: 'ready' });
});

// ΑΝΟΙΓΕΙ ΤΗΝ ΠΟΡΤΑ ΕΔΩ!
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 API τρέχει στη πόρτα: ${PORT}`);
});

client.login(TOKEN);
