const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const cors = require('cors');

// ---------- ΡΥΘΜΙΣΕΙΣ ----------
const app = express();
const PORT = process.env.PORT || 3000;

// CORS - επιτρέπει σε οποιοδήποτε site να στέλνει δεδομένα
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---------- BOT ----------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ΤΑΥΤΟΤΗΤΕΣ - ΠΡΟΣΟΧΗ: Βάλε τις σωστές τιμές!
const TOKEN = process.env.BOT_TOKEN;
const SERVER_ID = process.env.SERVER_ID;
const CHANNEL_ID = '1545817704127266879'; // Το κανάλι όπου θα στέλνονται τα μηνύματα

// ---------- ΕΚΚΙΝΗΣΗ BOT ----------
client.once('ready', () => {
    console.log(`✅ Bot online: ${client.user.tag}`);
    console.log(`📢 Θα στέλνω σε κανάλι ID: ${CHANNEL_ID}`);
    
    // Έλεγχος αν το κανάλι υπάρχει
    const guild = client.guilds.cache.get(SERVER_ID);
    if (guild) {
        const channel = guild.channels.cache.get(CHANNEL_ID);
        if (channel) {
            console.log(`✅ Βρέθηκε το κανάλι: #${channel.name}`);
        } else {
            console.error(`❌ ΠΡΟΣΟΧΗ: Δεν βρέθηκε κανάλι με ID: ${CHANNEL_ID}`);
            console.log(`💡 Διαθέσιμα κανάλια: ${guild.channels.cache.map(c => `${c.name} (${c.id})`).join(', ')}`);
        }
    } else {
        console.error(`❌ ΠΡΟΣΟΧΗ: Δεν βρέθηκε server με ID: ${SERVER_ID}`);
    }
});

// ---------- ENDPOINTS ----------
// Κύριος endpoint - δέχεται τα δεδομένα από το site
app.post('/', async (req, res) => {
    console.log('\n📥 ΝΕΟ ΑΙΤΗΜΑ!');
    console.log('📦 Λήφθηκαν δεδομένα:', JSON.stringify(req.body, null, 2));
    
    const { name, data } = req.body;
    
    // Έλεγχος αν υπάρχουν τα απαραίτητα πεδία
    if (!name || !data) {
        console.error('❌ Λείπουν δεδομένα (name ή data)');
        return res.status(400).json({ 
            success: false, 
            error: 'Missing name or data',
            received: req.body 
        });
    }
    
    try {
        // Βρίσκουμε τον server
        const guild = client.guilds.cache.get(SERVER_ID);
        if (!guild) {
            console.error(`❌ Server με ID ${SERVER_ID} δεν βρέθηκε`);
            return res.status(500).json({ success: false, error: 'Server not found' });
        }
        
        // Βρίσκουμε το κανάλι
        const channel = guild.channels.cache.get(CHANNEL_ID);
        if (!channel) {
            console.error(`❌ Κανάλι με ID ${CHANNEL_ID} δεν βρέθηκε`);
            return res.status(500).json({ success: false, error: 'Channel not found' });
        }
        
        console.log(`✅ Στέλνω στο κανάλι: #${channel.name}`);
        
        // Στέλνουμε το μήνυμα
        await channel.send(data);
        console.log(`📤 ΕΠΙΤΥΧΙΑ! Το μήνυμα στάλθηκε στο #${channel.name}`);
        
        res.json({ 
            success: true, 
            channel: channel.name,
            message: 'Data sent successfully'
        });
        
    } catch (error) {
        console.error('❌ Σφάλμα κατά την αποστολή:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack 
        });
    }
});

// Endpoint για έλεγχο υγείας
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: client.user?.tag || 'not ready',
        server: client.guilds.cache.get(SERVER_ID)?.name || 'not connected',
        channel: CHANNEL_ID
    });
});

// Test endpoint - δοκιμαστικό αίτημα
app.get('/test', (req, res) => {
    res.json({
        message: '✅ Το bot λειτουργεί!',
        bot: client.user?.tag || 'not ready',
        server: client.guilds.cache.get(SERVER_ID)?.name || 'not connected',
        channel: CHANNEL_ID,
        instructions: 'Στείλε POST request στο / με { name, data }'
    });
});

// ---------- ΕΚΚΙΝΗΣΗ ----------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server τρέχει στη θύρα: ${PORT}`);
    console.log(`🔗 Δοκίμασε το test endpoint: https://discord-bot-kvbn.onrender.com/test`);
});

// Σύνδεση του bot
client.login(TOKEN).catch(err => {
    console.error('❌ Σφάλμα σύνδεσης bot:', err);
});
