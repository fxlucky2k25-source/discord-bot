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

client.on('ready', () => {
    console.log(`✅ Bot είναι online: ${client.user.tag}`);
    console.log(`Server ID: ${SERVER_ID}`);
    
    // Έλεγχος αν ο server είναι προσβάσιμος
    const guild = client.guilds.cache.get(SERVER_ID);
    if (guild) {
        console.log(`✅ Συνδεδεμένος στον server: ${guild.name}`);
        console.log(`📊 Αριθμός καναλιών: ${guild.channels.cache.size}`);
    } else {
        console.error(`❌ Δεν βρέθηκε ο server με ID: ${SERVER_ID}`);
        console.log('💡 Σιγουρέψου ότι το bot έχει προστεθεί στον server και το SERVER_ID είναι σωστό.');
    }
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
        
        // Καθαρισμός ονόματος για το κανάλι
        const cleanName = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 30); // Discord όριο 30 χαρακτήρες
        
        // Αναζήτηση για υπάρχον κανάλι
        let channel = guild.channels.cache.find(
            c => c.type === ChannelType.GuildText && c.name === `👤-${cleanName}`
        );
        
        if (!channel) {
            console.log(`📝 Δημιουργώ νέο κανάλι: 👤-${cleanName}`);
            
            try {
                channel = await guild.channels.create({
                    name: `👤-${cleanName}`,
                    type: ChannelType.GuildText,
                    reason: `Νέα καταγραφή για τον χρήστη ${name}`
                });
                console.log(`✅ Δημιουργήθηκε κανάλι: ${channel.name} (ID: ${channel.id})`);
            } catch (createError) {
                console.error('❌ Σφάλμα κατά τη δημιουργία καναλιού:', createError);
                
                // Αν αποτύχει η δημιουργία, προσπαθούμε να στείλουμε σε ένα γενικό κανάλι
                const generalChannel = guild.channels.cache.find(
                    c => c.type === ChannelType.GuildText && 
                    (c.name === 'general' || c.name === 'bot-commands' || c.name === 'logs')
                );
                
                if (generalChannel) {
                    console.log(`📤 Στέλνω στο γενικό κανάλι: ${generalChannel.name}`);
                    await generalChannel.send(`📊 **ΝΕΑ ΚΑΤΑΓΡΑΦΗ για ${name}**\n\n${data}`);
                    return res.json({ success: true, channel: generalChannel.name, note: 'Στάλθηκε σε γενικό κανάλι' });
                }
                
                return res.json({ success: false, error: createError.message });
            }
        } else {
            console.log(`✅ Βρέθηκε υπάρχον κανάλι: ${channel.name}`);
        }
        
        // Αποστολή στο κανάλι
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

// Login του bot
client.login(TOKEN).catch(err => {
    console.error('❌ Σφάλμα σύνδεσης bot:', err);
});

// Περιμένουμε το bot να συνδεθεί πριν ξεκινήσουμε το API
client.once('ready', () => {
    console.log('🚀 Bot έτοιμο για λήψη αιτημάτων!');
});
