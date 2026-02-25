# Transcript Builder

A React SSR package for converting Discord messages to HTML transcripts with Discord-like styling.

## Features

- 🎨 Discord-like theme and styling
- 📝 Full message rendering (content, embeds, attachments, components)
- 🔄 Convert Discord.js messages to React components
- 📄 Generate HTML transcript files
- 🌐 Server-side rendering support

## Installation

```bash
pnpm add @easy-system/transcript-builder
```

## Usage

### Basic Usage - Generate HTML String

```typescript
import { Client, GatewayIntentBits } from 'discord.js';
import { createChannelTranscript } from '@easy-system/transcript-builder';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

await client.login('YOUR_BOT_TOKEN');

// Generate HTML string
const html = await createChannelTranscript(client, 'CHANNEL_ID', {
  footerText: 'Powered by Easy System',
  removeEmails: true,
  limit: 100, // Optional: limit number of messages (-1 for all)
});

console.log(html);
```

### Save to File

```typescript
import { createChannelTranscript } from '@easy-system/transcript-builder';

// Save transcript to file
await createChannelTranscript(client, 'CHANNEL_ID', {
  outputPath: './transcript.html',
  footerText: 'Powered by Easy System',
  removeEmails: true,
});
```

### Fetch Messages Only

```typescript
import { fetchChannelMessages } from '@easy-system/transcript-builder';

const { messages, channelName } = await fetchChannelMessages(
  client,
  'CHANNEL_ID',
  100 // limit (-1 for all)
);

console.log(`Fetched ${messages.length} messages from ${channelName}`);
```

### Convert Single Message

```typescript
import { convertDiscordMessage } from '@easy-system/transcript-builder';
import { Message as DiscordMessage } from 'discord.js';

const discordMessage: DiscordMessage = await channel.messages.fetch('MESSAGE_ID');
const message = convertDiscordMessage(discordMessage);
```

### Generate HTML from Messages

```typescript
import { generateTranscriptHTML } from '@easy-system/transcript-builder';

const html = await generateTranscriptHTML(messages, 'Channel Name', {
  footerText: 'Powered by Easy System',
  removeEmails: true,
});
```

## API Reference

### `createChannelTranscript(client, channelId, options?)`

Creates a transcript HTML file or string from a Discord channel.

**Parameters:**
- `client`: Discord.js Client instance
- `channelId`: The ID of the channel to create a transcript from
- `options`: Optional configuration
  - `limit?: number` - Maximum number of messages to fetch (-1 for all)
  - `footerText?: string` - Text to display in the footer
  - `removeEmails?: boolean` - Whether to remove email addresses
  - `outputPath?: string` - If provided, saves to file instead of returning HTML

**Returns:** `Promise<string | void>`

### `fetchChannelMessages(client, channelId, limit?)`

Fetches messages from a Discord channel and converts them to the Message type.

**Parameters:**
- `client`: Discord.js Client instance
- `channelId`: The ID of the channel
- `limit`: Maximum number of messages (-1 for all)

**Returns:** `Promise<{ messages: Message[], channelName: string }>`

### `convertDiscordMessage(discordMessage)`

Converts a Discord.js Message to the transcript builder Message type.

**Parameters:**
- `discordMessage`: Discord.js Message instance

**Returns:** `Message`

### `generateTranscriptHTML(messages, channelName, options?)`

Generates HTML string from an array of messages.

**Parameters:**
- `messages`: Array of Message objects
- `channelName`: Name of the channel
- `options`: Optional configuration
  - `footerText?: string`
  - `removeEmails?: boolean`

**Returns:** `Promise<string>`

## Server Endpoints

If using the transcript-viewer server, the following endpoints are available:

- `GET /channel/:channelId/transcript` - Generate HTML transcript
  - Query params: `limit`, `removeEmails`
- `GET /api/channel/:channelId/messages` - Get messages as JSON
  - Query params: `limit`

## Components

The package exports React components that can be used for custom rendering:

- `Message` - Renders a single message
- `Embed` - Renders Discord embeds
- `Components` - Renders Discord message components (buttons, selects, etc.)
- `ChannelView` - Renders a full channel view with all messages

## Styling

The package includes Discord-like CSS styles that are automatically included in generated HTML. The styles match Discord's dark theme.

## License

Private - Easy System
