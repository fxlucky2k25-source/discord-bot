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
    console.log(`Server ID: ${SERVER_ID}`);
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
        
        console.log(`✅ Βρέθηκε server: ${guild.name}`);
        
        const cleanName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        let channel = guild.channels.cache.find(
            c => c.name === `👤-${cleanName}`
        );
        
        if (!channel) {
            console.log('📝 Δημιουργώ νέο κανάλι...');
            channel = await guild.channels.create({
                name: `👤-${cleanName}`,
                type: 0,
                reason: 'Νέα καταγραφή'
            });
            console.log(`✅ Δημιουργήθηκε: ${channel.name}`);
        } else {
            console.log(`✅ Βρέθηκε υπάρχον: ${channel.name}`);
        }
        
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
    res.json({ status: 'online', bot: client.user?.tag || 'not ready' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 API τρέχει στη πόρτα: ${PORT}`);
});

client.login(TOKEN);

client.login(TOKEN);
