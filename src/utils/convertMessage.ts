import { Message as DiscordMessage } from 'discord.js';
import { Message, User, Embed, Attachment, ActionRow, Button, StringSelect, TextDisplay, Section, MediaGallery, MediaGalleryItem, Separator, Container, FileComponent, Thumbnail, MessageReference } from '../types/messages';

/**
 * Convert a Button component from discord.js raw data
 */
function convertButton(raw: any): Button {
  return {
    type: 2,
    style: raw.style as 1 | 2 | 3 | 4 | 5 | 6,
    label: raw.label || undefined,
    emoji: raw.emoji ? {
      id: raw.emoji.id || null,
      name: raw.emoji.name || null,
      animated: raw.emoji.animated || false,
    } : undefined,
    custom_id: raw.customId || raw.custom_id || undefined,
    url: raw.url || undefined,
    disabled: raw.disabled || false,
  };
}

/**
 * Convert a Thumbnail component from discord.js raw data
 */
function convertThumbnail(raw: any): Thumbnail {
  return {
    type: 11,
    media: { url: raw.media?.url || raw.url || '' },
    description: raw.description || undefined,
    spoiler: raw.spoiler || false,
  };
}

/**
 * Recursively convert a discord.js component (V1 or V2) to our transcript type.
 * Handles: ActionRow(1), Button(2), StringSelect(3), Section(9), TextDisplay(10),
 * Thumbnail(11), MediaGallery(12), File(13), Separator(14), Container(17)
 */
function convertComponent(raw: any): Message['components'][number] | null {
  // discord.js may wrap data — get the raw data object
  const data = raw.data || raw;
  const type = data.type ?? raw.type;

  switch (type) {
    case 1: { // ActionRow
      const children = (data.components || raw.components || []) as any[];
      const actionRow: ActionRow = {
        type: 1,
        components: children.map((child: any) => {
          const childData = child.data || child;
          const childType = childData.type ?? child.type;
          if (childType === 2) return convertButton(childData);
          if (childType === 3) { // StringSelect
            return {
              type: 3 as const,
              custom_id: childData.customId || childData.custom_id || '',
              options: (childData.options || []).map((opt: any) => ({
                label: opt.label,
                value: opt.value,
                description: opt.description || undefined,
                emoji: opt.emoji ? {
                  id: opt.emoji.id || null,
                  name: opt.emoji.name || null,
                  animated: opt.emoji.animated || false,
                } : undefined,
                default: opt.default || false,
              })),
              placeholder: childData.placeholder || undefined,
              min_values: childData.minValues ?? childData.min_values ?? undefined,
              max_values: childData.maxValues ?? childData.max_values ?? undefined,
              disabled: childData.disabled || false,
            } as StringSelect;
          }
          // Other select types (UserSelect, RoleSelect, etc.) — render as placeholder
          if (childType >= 5 && childType <= 8) {
            return {
              type: 3 as const,
              custom_id: childData.customId || childData.custom_id || '',
              options: [],
              placeholder: childData.placeholder || 'Select...',
              disabled: childData.disabled || false,
            } as StringSelect;
          }
          return null;
        }).filter((c: any): c is Button | StringSelect => c !== null),
      };
      return actionRow;
    }

    case 9: { // Section
      const sectionChildren = (data.components || raw.components || []) as any[];
      const textDisplays: TextDisplay[] = sectionChildren
        .map((child: any) => {
          const cd = child.data || child;
          if ((cd.type ?? child.type) === 10) {
            return { type: 10 as const, content: cd.content || '' };
          }
          return null;
        })
        .filter(Boolean) as TextDisplay[];

      const rawAccessory = data.accessory || raw.accessory;
      let accessory: Button | Thumbnail | undefined;
      if (rawAccessory) {
        const accData = rawAccessory.data || rawAccessory;
        const accType = accData.type ?? rawAccessory.type;
        if (accType === 2) accessory = convertButton(accData);
        else if (accType === 11) accessory = convertThumbnail(accData);
      }

      return {
        type: 9,
        components: textDisplays,
        accessory,
      } as Section;
    }

    case 10: { // TextDisplay
      return {
        type: 10,
        content: data.content || raw.content || '',
      } as TextDisplay;
    }

    case 11: { // Thumbnail (can appear standalone in some contexts)
      return convertThumbnail(data);
    }

    case 12: { // MediaGallery
      const items: MediaGalleryItem[] = (data.items || raw.items || []).map((item: any) => {
        const itemData = item.data || item;
        return {
          url: itemData.media?.url || itemData.url || '',
          proxy_url: itemData.media?.proxy_url || itemData.proxy_url || undefined,
          height: itemData.media?.height || itemData.height || undefined,
          width: itemData.media?.width || itemData.width || undefined,
          description: itemData.description || undefined,
          spoiler: itemData.spoiler || false,
        };
      });
      return {
        type: 12,
        items,
      } as MediaGallery;
    }

    case 13: { // File
      return {
        type: 13,
        file: { url: data.file?.url || data.url || '' },
        spoiler: data.spoiler || false,
      } as FileComponent;
    }

    case 14: { // Separator
      return {
        type: 14,
        divider: data.divider !== false, // defaults to true
        spacing: data.spacing || 1,
      } as Separator;
    }

    case 17: { // Container
      const containerChildren = (data.components || raw.components || []) as any[];
      const converted = containerChildren
        .map((child: any) => convertComponent(child))
        .filter(Boolean) as Message['components'];

      // Deduplicate nested components within container
      const seen = new Set<string>();
      const childComponents = converted.filter((c) => {
        const sig = JSON.stringify(c);
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });

      return {
        type: 17,
        accent_color: data.accent_color ?? data.accentColor ?? undefined,
        spoiler: data.spoiler || false,
        components: childComponents,
      } as Container;
    }

    default:
      return null;
  }
}

export async function convertDiscordMessage(discordMessage: DiscordMessage): Promise<Message> {
  const author: User = {
    id: discordMessage.author.id,
    username: discordMessage.author.username,
    displayName: discordMessage.member?.displayName || discordMessage.author.displayName || discordMessage.author.username,
    avatarURL: discordMessage.author.displayAvatarURL({ size: 256 }) || discordMessage.author.defaultAvatarURL,
  };

  const isBot = discordMessage.author.bot;
  const authorRoleColor = discordMessage.member?.displayColor || undefined;

  const rawEmbeds: Embed[] = discordMessage.embeds.map(embed => {
    const embedData = embed.data || embed;
    let timestamp: string | undefined;
    if (embed.timestamp) {
      const ts = embed.timestamp as any;
      if (typeof ts === 'string') {
        timestamp = ts;
      } else if (ts && typeof ts.toISOString === 'function') {
        timestamp = ts.toISOString();
      }
    }
    return {
      title: embed.title || undefined,
      type: (embedData as any).type || undefined,
      description: embed.description || undefined,
      url: embed.url || undefined,
      timestamp,
    color: embed.color || undefined,
    footer: embed.footer ? {
      text: embed.footer.text,
      icon_url: embed.footer.iconURL || undefined,
      proxy_icon_url: embed.footer.proxyIconURL || undefined,
    } : undefined,
    image: embed.image ? {
      url: embed.image.url,
      proxy_url: embed.image.proxyURL || undefined,
      height: embed.image.height || undefined,
      width: embed.image.width || undefined,
    } : undefined,
    thumbnail: embed.thumbnail ? {
      url: embed.thumbnail.url,
      proxy_url: embed.thumbnail.proxyURL || undefined,
      height: embed.thumbnail.height || undefined,
      width: embed.thumbnail.width || undefined,
    } : undefined,
    video: embed.video ? {
      url: embed.video.url || undefined,
      proxy_url: embed.video.proxyURL || undefined,
      height: embed.video.height || undefined,
      width: embed.video.width || undefined,
    } : undefined,
    provider: embed.provider ? {
      name: embed.provider.name || undefined,
      url: embed.provider.url || undefined,
    } : undefined,
    author: embed.author ? {
      name: embed.author.name,
      url: embed.author.url || undefined,
      icon_url: embed.author.iconURL || undefined,
      proxy_icon_url: embed.author.proxyIconURL || undefined,
    } : undefined,
      fields: (() => {
        const raw = embed.fields?.map(field => ({
          name: field.name,
          value: field.value,
          inline: field.inline || false,
        })) ?? [];
        const seen = new Set<string>();
        return raw.length > 0
          ? raw.filter((f) => {
              const key = `${f.name}|${f.value}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
          : undefined;
      })(),
    };
  });

  // Deduplicate embeds (Discord can sometimes send duplicates, e.g. link preview + rich embed)
  const embedSeen = new Set<string>();
  const embeds: Embed[] = rawEmbeds.filter((embed) => {
    const key = [
      embed.url ?? '',
      embed.title ?? '',
      (embed.description ?? '').slice(0, 200),
      embed.thumbnail?.url ?? '',
      embed.image?.url ?? '',
      embed.fields?.length ?? 0,
    ].join('|');
    if (embedSeen.has(key)) return false;
    embedSeen.add(key);
    return true;
  });

  const components: Message['components'] = [];
  
  if (discordMessage.components && discordMessage.components.length > 0) {
    const componentSeen = new Set<string>();
    for (const component of discordMessage.components) {
      const converted = convertComponent(component as any);
      if (converted) {
        // Deduplicate components (Discord API can sometimes return duplicates)
        const sig = JSON.stringify(converted);
        if (!componentSeen.has(sig)) {
          componentSeen.add(sig);
          components.push(converted);
        }
      }
    }
  }

  // Convert attachments to rich Attachment objects
  const attachments: Attachment[] = discordMessage.attachments.map(att => ({
    url: att.proxyURL || att.url,
    filename: att.name || 'unknown',
    size: att.size ?? undefined,
    contentType: att.contentType ?? undefined,
    width: att.width ?? undefined,
    height: att.height ?? undefined,
    spoiler: att.spoiler ?? false,
  }));

  // Extract reply/reference information
  let reference: MessageReference | undefined;
  if (discordMessage.reference) {
    reference = {
      messageId: discordMessage.reference.messageId || '',
      channelId: discordMessage.reference.channelId || undefined,
      guildId: discordMessage.reference.guildId || undefined,
    };
    
    // Try to fetch referenced message if available
    if (discordMessage.reference.messageId && discordMessage.channel) {
      try {
        const referencedMsg = await discordMessage.channel.messages.fetch(discordMessage.reference.messageId).catch(() => null);
        if (referencedMsg) {
          reference.author = {
            id: referencedMsg.author.id,
            username: referencedMsg.author.username,
            displayName: referencedMsg.member?.displayName || referencedMsg.author.displayName || referencedMsg.author.username,
            avatarURL: referencedMsg.author.displayAvatarURL({ size: 256 }) || referencedMsg.author.defaultAvatarURL,
          };
          reference.content = referencedMsg.content || undefined;
          reference.attachments = referencedMsg.attachments.size > 0;
        }
      } catch {
        // Ignore errors fetching referenced message
      }
    }
  }

  // Extract interaction information (slash commands, context menus, etc.)
  let interaction: Message['interaction'] | undefined;

  // Map numeric InteractionType to string
  type InteractionTypeName = 'APPLICATION_COMMAND' | 'MESSAGE_COMPONENT' | 'AUTOCOMPLETE' | 'MODAL_SUBMIT';
  const interactionTypeMap: Record<number, InteractionTypeName> = {
    2: 'APPLICATION_COMMAND',
    3: 'MESSAGE_COMPONENT',
    4: 'AUTOCOMPLETE',
    5: 'MODAL_SUBMIT',
  };

  // Try the deprecated interaction property first (has command name)
  const legacyInteraction = (discordMessage as any).interaction;
  if (legacyInteraction) {
    const typeValue = typeof legacyInteraction.type === 'number'
      ? interactionTypeMap[legacyInteraction.type]
      : legacyInteraction.type;

    if (typeValue) {
      interaction = {
        type: typeValue,
        name: legacyInteraction.commandName || legacyInteraction.name || undefined,
        user: legacyInteraction.user ? {
          id: legacyInteraction.user.id,
          username: legacyInteraction.user.username,
          displayName: legacyInteraction.user.displayName || legacyInteraction.user.username,
          avatarURL: legacyInteraction.user.displayAvatarURL?.({ size: 256 }) || legacyInteraction.user.defaultAvatarURL,
        } : undefined,
      };
    }
  }

  // Fallback to interactionMetadata if legacy interaction not available
  if (!interaction) {
    const interactionMetadata = (discordMessage as any).interactionMetadata;
    if (interactionMetadata && interactionMetadata.type) {
      const typeValue = typeof interactionMetadata.type === 'number'
        ? interactionTypeMap[interactionMetadata.type]
        : interactionMetadata.type;

      if (typeValue) {
        interaction = {
          type: typeValue,
          name: interactionMetadata.name || undefined,
          user: interactionMetadata.user ? {
            id: interactionMetadata.user.id,
            username: interactionMetadata.user.username,
            displayName: interactionMetadata.user.displayName || interactionMetadata.user.username,
            avatarURL: interactionMetadata.user.displayAvatarURL?.({ size: 256 }) || interactionMetadata.user.defaultAvatarURL,
          } : undefined,
        };
      }
    }
  }

  return {
    author,
    content: discordMessage.content,
    embeds,
    components,
    attachments,
    createdAt: discordMessage.createdAt.toISOString(),
    editedAt: discordMessage.editedAt ? discordMessage.editedAt.toISOString() : undefined,
    reference,
    interaction,
    isBot,
    authorRoleColor: authorRoleColor || undefined,
  };
}
