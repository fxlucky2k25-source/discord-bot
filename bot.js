const { Client, GatewayIntentBits } = require('discord.js');

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

client.on('ready', () => {
    console.log(`✅ Bot είναι online: ${client.user.tag}`);
});

// Εδώ θα μπαίνει ο κώδικας για τα κανάλια
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Αν το μήνυμα έρχεται από την HTML σελίδα
    if (message.content.startsWith('!track')) {
        const args = message.content.split('|');
        const userName = args[1] || 'Unknown';
        const data = args[2] || '';
        
        // Βρες ή δημιούργησε κανάλι
        const guild = client.guilds.cache.get(SERVER_ID);
        let channel = guild.channels.cache.find(c => c.name === `👤-${userName.toLowerCase()}`);
        
        if (!channel) {
            channel = await guild.channels.create({
                name: `👤-${userName.toLowerCase()}`,
                type: 0
            });
        }
        
        await channel.send(data);
    }
});

client.login(TOKEN);
