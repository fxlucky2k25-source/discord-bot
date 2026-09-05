const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
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
const CHANNEL_ID = '1545817704127266879'; // Το ID του καναλιού που θες

client.on('ready', () => {
    console.log(`✅ Bot είναι online: ${client.user.tag}`);
    console.log(`Server ID: ${SERVER_ID}`);
    console.log(`📢 Θα στέλνω σε κανάλι με ID: ${CHANNEL_ID}`);
});

// Δέχεται POST από την HTML σελίδα
app.post('/', async (req, res) => {
    console.log('📥 Έλαβα request!');
    console.log('Body:', req.body);
    
    const { name, data } = req.body;
    
    if (!name || !data) {
        console.error('❌ Λείπουν δεδομένα!');
        return res.json({ success: false, error: 'Missing data' });
    }
    
    try {
        const guild = client.guilds.cache.get(SERVER_ID);
        
        if (!guild) {
            console.error('❌ Δεν βρέθηκε ο server!');
            return res.json({ success: false, error: 'Server not found' });
        }
        
        // Βρίσκουμε το κανάλι με το συγκεκριμένο ID
        const channel = guild.channels.cache.get(CHANNEL_ID);
        
        if (!channel) {
            console.error(`❌ Δεν βρέθηκε κανάλι με ID: ${CHANNEL_ID}`);
            return res.json({ success: false, error: 'Channel not found' });
        }
        
        console.log(`✅ Βρέθηκε κανάλι: ${channel.name}`);
        
        // Στέλνουμε τα δεδομένα
        await channel.send(data);
        console.log(`📤 Στάλθηκε στο: ${channel.name}`);
        
        res.json({ success: true, channel: channel.name });
        
    } catch (error) {
        console.error('❌ Σφάλμα:', error);
        res.json({ success: false, error: error.message });
    }
});

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'online', 
        bot: client.user?.tag || 'not ready',
        server: client.guilds.cache.get(SERVER_ID)?.name || 'not connected'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 API τρέχει στη πόρτα: ${PORT}`);
});

client.login(TOKEN);
