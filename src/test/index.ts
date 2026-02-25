import { AttachmentBuilder, Client, GatewayIntentBits, TextChannel } from "discord.js";
import { createChannelTranscript } from "../utils/createChannelTranscript";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const channelId = "13411012345678901234";

client.on("clientReady", async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  const transcript = await createChannelTranscript(client, channelId);
  const ch = client.channels.cache.get(channelId) || await client.channels.fetch(channelId);
  if (ch instanceof TextChannel) {
    await ch.send({ 
        files: [
            new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), { name: "transcript.html" })
        ]
    });
  }
});




client.login("YOUR_BOT_TOKEN");
