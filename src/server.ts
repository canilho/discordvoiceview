import express from 'express';
import path from 'path';
import { WebSocketServer } from 'ws';
import { Client, GatewayIntentBits, VoiceState, Collection, GuildMember,
         InternalDiscordGatewayAdapterCreator, APIConnection } from 'discord.js';
    import { joinVoiceChannel as discordJoinVoiceChannel, VoiceConnection, getVoiceConnection } from '@discordjs/voice';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
const token = process.env.DISCORD_TOKEN;

const app = express();
const PORT = 3000;

// Serve the reactive HTML view
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reactiveView.html'));
});

// Start the WebSocket server
const wss = new WebSocketServer({ port: 8000 });
let connectedClients: any[] = [];

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    connectedClients.push(ws);

    getChannelData(ws);

    ws.on('message', async (message) => {
        try {
            const command = JSON.parse(message.toString());

            if (command.type === 'join') {
                const guild = client.guilds.cache.first(); // Replace with your specific guild ID if needed
                if (guild) {
                    const channel = guild.channels.cache.get(command.channelId);
                    if (channel && channel.isVoiceBased()) {
                        const connection = joinVoiceChannel({
                            channelId: channel.id,
                            guildId: guild.id,
                            adapterCreator: guild.voiceAdapterCreator,
                        });
                        console.log(`Bot joined voice channel: ${channel.name}`);

                        // Handle speaking events
                        handleSpeakingEvents(connection, guild);
                    } else {
                        console.error('Invalid channel ID or not a voice channel.');
                    }
                }
            } else if (command.type === 'leave') {
                const connection = getVoiceConnection(client.guilds.cache.first()?.id || '');
                if (connection) {
                    connection.destroy();
                    console.log('Bot left the voice channel.');
                }
            }
        } catch (err) {
            console.error('Error processing WebSocket message:', err);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        connectedClients = connectedClients.filter((client) => client !== ws);
    });
});

// Initialize Discord bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers, 
    ]
});



var getChannelData = function (ws: any) {
    const guild = client.guilds.cache.first(); // Replace with your specific guild ID if needed
    if (guild) {
        const voiceChannels = guild.channels.cache
            .filter((channel) => channel.type === 2) // Type 2 = Voice Channel
            .map((channel) => ({
                id: channel.id,
                name: channel.name,
                guildname: channel.guild.name,
                users: Array.from((channel.members as Collection<string, GuildMember>).values()).map((member) => ({
                    username: member.user.username,
                    id: member.id,
                    voiceActive: member.voice.selfMute === false && member.voice.selfDeaf === false,
                    avatar: member.user.avatarURL() || null,
                }))
            }));

        const data = { voiceChannels };
        ws.send(JSON.stringify(data));
    }
}

function handleSpeakingEvents(connection: VoiceConnection, guild: any) {
    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId: string) => {
        const user: GuildMember | undefined = guild.members.cache.get(userId);
        console.log(`User started speaking: ${userId}`);
        if (user) {
            const data = {               
                userId: user.id,
                username: user.user.username,
                isSpeaking: true,
            };
            console.log(`User started speaking: ${user.user.username}`);
            connectedClients.forEach((client: WebSocket) => {
                client.send(JSON.stringify(data));
                console.log(`Sent speaking event to client: ${user.user.username}`);
            });
        }
    });

    receiver.speaking.on('end', (userId: string) => {
        const user: GuildMember | undefined = guild.members.cache.get(userId);
        console.log(`User stoped speaking: ${userId}`);
        if (user) {
            const data = {
                userId: user.id,
                username: user.user.username,
                isSpeaking: false,
            };
            console.log(`User stopped speaking: ${user.user.username}`);
            connectedClients.forEach((client: WebSocket) => {
                client.send(JSON.stringify(data));
                console.log(`Sent speaking event to client: ${user.user.username}`);
            });
        }
    });
}

// Listen for voice state updates
client.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) => {
    const guild = newState.guild;  
    var data = {}; 

    if (guild) {
        // Get all voice channels in the guild
        const voiceChannels = guild.channels.cache
            .filter((channel) => channel.type === 2) // Type 2 = Voice Channel
            .map((channel) => ({
                id: channel.id,
                name: channel.name,
                users: Array.from((channel.members as Collection<string, GuildMember>).values()).map((member) => ({
                    username: member.user.username,
                    id: member.id,
                    //voiceActive: ,
                    isSpeaking:  member.voice.selfMute === false && member.voice.selfDeaf === false,
                    avatar: member.user.avatarURL() || null,
                }))
            }));

        // Send updated voice channel list to all connected WebSocket clients
        data = { voiceChannels };
        connectedClients.forEach((client) => {
            client.send(JSON.stringify(data));
        });
    }


    if (newState.id === client.user?.id && newState.channel) {
        const existingConnection = getVoiceConnection(newState.guild.id);
    
        if (existingConnection) {
            if (existingConnection.joinConfig.channelId === newState.channel.id) {
                console.log(`Bot is already connected to the channel: ${newState.channel.name}`);
                return; // Skip reconnecting
            } else {
                console.log(`Bot is switching from channel ${existingConnection.joinConfig.channelId} to ${newState.channel.id}`);
                existingConnection.destroy(); // Disconnect from the current channel
            }
        }
    
        const connection = joinVoiceChannel({
            channelId: newState.channel.id,
            guildId: newState.guild.id,
            adapterCreator: newState.guild.voiceAdapterCreator,
        });
    
        console.log('Bot joined voice channel:', newState.channel.name);
    
        // Handle speaking events
        handleSpeakingEvents(connection, newState.guild);
    }

});

// Start the bot
client.login(token).catch((err) => {
    console.error('Failed to login:', err);
});

// Start the HTTP server
app.listen(PORT, () => {
    console.log(`HTTP server is running at http://localhost:${PORT}`);
    console.log(`WebSocket server is running at ws://localhost:8000`);
});

function joinVoiceChannel(arg0: { channelId: string; guildId: string; 
    adapterCreator: InternalDiscordGatewayAdapterCreator; }): VoiceConnection {
    return discordJoinVoiceChannel({
        channelId: arg0.channelId,
        guildId: arg0.guildId,
        adapterCreator: arg0.adapterCreator,
    });
}
