import { Client, TextChannel, ThreadChannel, Message as DiscordMessage, Collection } from 'discord.js';
import { Message } from '../types/messages';
import { convertDiscordMessage } from './convertMessage';

export async function fetchChannelMessages(
  client: Client,
  channelId: string,
  limit: number = -1
): Promise<{ messages: Message[]; channelName: string }> {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  
  if (!channel) {
    throw new Error(`Channel with ID ${channelId} not found`);
  }

  if (!channel.isTextBased() || (!(channel instanceof TextChannel) && !(channel instanceof ThreadChannel))) {
    throw new Error(`Channel with ID ${channelId} is not a text channel or thread`);
  }

  const textChannel = channel as TextChannel | ThreadChannel;
  const channelName = textChannel.name || 'Unknown Channel';

  const messages: Message[] = [];
  const seenMessageIds = new Set<string>();
  let lastMessageId: string | undefined;
  let fetchedCount = 0;
  const batchSize = 100;

  while (true) {
    const options: { limit: number; before?: string } = { limit: batchSize };
    if (lastMessageId) {
      options.before = lastMessageId;
    }

    const fetched = await textChannel.messages.fetch(options);
    
    // Type guard: messages.fetch() with options returns a Collection
    if (!('size' in fetched) || (fetched as any).size === 0) {
      break;
    }

    const fetchedCollection = fetched as unknown as Collection<string, DiscordMessage>;
    // Discord returns newest-first; reverse to process oldest-first within the batch
    const fetchedArray = Array.from(fetchedCollection.values()).reverse();
    
    for (const msg of fetchedArray) {
      if (seenMessageIds.has(msg.id)) {
        continue;
      }
      seenMessageIds.add(msg.id);

      messages.push(await convertDiscordMessage(msg));
      fetchedCount++;
      
      if (limit > 0 && fetchedCount >= limit) {
        break;
      }
    }

    if (limit > 0 && fetchedCount >= limit) {
      break;
    }

    // Paginate using the oldest message in this batch (first after reverse)
    const oldestMsg = fetchedArray[0];
    if (oldestMsg) {
      lastMessageId = oldestMsg.id;
    }
    
    if (fetchedCollection.size < batchSize) {
      break;
    }
  }

  // Sort messages chronologically (oldest first)
  messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return { messages, channelName };
}
