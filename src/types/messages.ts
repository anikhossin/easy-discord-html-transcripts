export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarURL: string;
}

/**
 * Discord embed footer structure
 * @see https://discord.com/developers/docs/resources/message#embed-object-embed-footer-structure
 */
export interface EmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

/**
 * Discord embed author structure
 * @see https://discord.com/developers/docs/resources/message#embed-object-embed-author-structure
 */
export interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

/**
 * Discord embed image/thumbnail structure
 * @see https://discord.com/developers/docs/resources/message#embed-object-embed-image-structure
 */
export interface EmbedImage {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

/**
 * Discord embed video structure
 * @see https://discord.com/developers/docs/resources/message#embed-object-embed-video-structure
 */
export interface EmbedVideo {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

/**
 * Discord embed provider structure
 * @see https://discord.com/developers/docs/resources/message#embed-object-embed-provider-structure
 */
export interface EmbedProvider {
  name?: string;
  url?: string;
}

/**
 * Discord embed field structure
 * @see https://discord.com/developers/docs/resources/message#embed-object-embed-field-structure
 */
export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Discord embed object structure
 * @see https://discord.com/developers/docs/resources/message#embed-object-embed-structure
 */
export interface Embed {
  title?: string;
  type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link';
  description?: string;
  url?: string;
  timestamp?: string; // ISO8601 timestamp
  color?: number; // Color code as integer
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedImage;
  video?: EmbedVideo;
  provider?: EmbedProvider;
  author?: EmbedAuthor;
  fields?: EmbedField[]; // Max 25 fields
}

/**
 * Partial emoji object structure
 * @see https://discord.com/developers/docs/resources/emoji#emoji-object
 */
export interface PartialEmoji {
  id?: string | null;
  name?: string | null;
  animated?: boolean;
}

/**
 * Discord button style values
 * @see https://discord.com/developers/docs/components/reference#button-button-styles
 */
type ButtonStyle = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Discord button component structure
 * @see https://discord.com/developers/docs/components/reference#button-button-structure
 * 
 * Button requirements by style:
 * - Style 1-4 (Primary, Secondary, Success, Danger): Must have `custom_id`, cannot have `url` or `sku_id`
 * - Style 5 (Link): Must have `url`, cannot have `custom_id`
 * - Style 6 (Premium): Must have `sku_id`, cannot have `custom_id`, `label`, `url`, or `emoji`
 */
export interface Button {
  type: 2; // ComponentType.BUTTON
  id?: number; // Optional identifier for component
  style: ButtonStyle; // Button style (1-6)
  label?: string; // Text that appears on the button; max 80 characters
  emoji?: PartialEmoji; // Emoji object with name, id, and animated
  custom_id?: string; // Developer-defined identifier; 1-100 characters (required for styles 1-4)
  sku_id?: string; // Identifier for purchasable SKU (required for style 6)
  url?: string; // URL for link-style buttons; max 512 characters (required for style 5)
  disabled?: boolean; // Whether the button is disabled (defaults to false)
}

/**
 * Discord string select option structure
 * @see https://discord.com/developers/docs/components/reference#string-select-select-option-structure
 */
export interface StringSelectOption {
  label: string; // User-facing name of the option; max 100 characters
  value: string; // Dev-defined value of the option; max 100 characters
  description?: string; // Additional description of the option; max 100 characters
  emoji?: PartialEmoji; // Emoji object with id, name, and animated
  default?: boolean; // Will show this option as selected by default
}

/**
 * Discord string select component structure
 * @see https://discord.com/developers/docs/components/reference#string-select-string-select-structure
 * 
 * Notes:
 * - Available in messages and modals
 * - Must be placed inside an Action Row in messages and a Label in modals
 * - The `required` field is only available for String Selects in modals (ignored in messages)
 * - Using `disabled` in a modal will result in an error (modals cannot have disabled components)
 */
export interface StringSelect {
  type: 3; // ComponentType.STRING_SELECT
  id?: number; // Optional identifier for component
  custom_id: string; // ID for the select menu; 1-100 characters
  options: StringSelectOption[]; // Specified choices in a select menu; max 25
  placeholder?: string; // Placeholder text if nothing is selected or default; max 150 characters
  min_values?: number; // Minimum number of items that must be chosen (defaults to 1); min 0, max 25
  max_values?: number; // Maximum number of items that can be chosen (defaults to 1); max 25
  required?: boolean; // Whether the string select is required to answer in a modal (defaults to true, only for modals)
  disabled?: boolean; // Whether select menu is disabled in a message (defaults to false, only for messages)
}

/**
 * Union type for action row child components
 * Action rows can contain up to 5 buttons or a single select component
 */
type ActionRowChildComponent = Button | StringSelect;

/**
 * Discord action row component structure
 * @see https://discord.com/developers/docs/components/reference#action-row-action-row-structure
 * 
 * Notes:
 * - Top-level layout component
 * - Can contain up to 5 buttons or a single select component
 * - Label is recommended over Action Row in modals
 */
export interface ActionRow {
  type: 1; // ComponentType.ACTION_ROW
  id?: number; // Optional identifier for component
  components: ActionRowChildComponent[]; // Up to 5 buttons or a single select component
}

/**
 * Discord text display component structure (Components V2)
 * @see https://discord.com/developers/docs/components/reference#text-display
 * 
 * Notes:
 * - Used to display markdown text
 * - Available in messages and modals
 * - Replaces the `content` field when using Components V2
 */
export interface TextDisplay {
  type: 10; // ComponentType.TEXT_DISPLAY
  id?: number; // Optional identifier for component
  content: string; // Markdown text content
}

/**
 * Discord thumbnail component structure (Components V2)
 * @see https://discord.com/developers/docs/components/reference#thumbnail
 * 
 * Notes:
 * - Used as an accessory inside a Section component
 * - Displays an image on the right side of the section
 */
export interface Thumbnail {
  type: 11; // ComponentType.THUMBNAIL
  id?: number;
  media: { url: string }; // The media/image URL
  description?: string;   // Alt text for accessibility
  spoiler?: boolean;       // Whether the thumbnail is a spoiler
}

/**
 * Discord section component structure (Components V2)
 * @see https://discord.com/developers/docs/components/reference#section
 * 
 * Notes:
 * - Container to display text alongside an accessory component
 * - Available only in messages
 * - Contains 1-3 TextDisplay components as text content
 * - Accessory can be a Button or Thumbnail
 */
export interface Section {
  type: 9; // ComponentType.SECTION
  id?: number; // Optional identifier for component
  components: TextDisplay[]; // 1-3 TextDisplay components
  accessory?: Button | Thumbnail; // Accessory component (Button or Thumbnail)
}

/**
 * Discord media gallery item structure (Components V2)
 */
export interface MediaGalleryItem {
  url: string; // URL of the media item
  proxy_url?: string; // Proxied URL of the media item
  height?: number; // Height of the media item
  width?: number; // Width of the media item
  description?: string; // Alt text for accessibility
  spoiler?: boolean; // Whether the media item is a spoiler
}

/**
 * Discord media gallery component structure (Components V2)
 * @see https://discord.com/developers/docs/components/reference#media-gallery
 * 
 * Notes:
 * - Used to display images and other media in a grid (up to 10 items)
 * - Available only in messages
 */
export interface MediaGallery {
  type: 12; // ComponentType.MEDIA_GALLERY
  id?: number; // Optional identifier for component
  items: MediaGalleryItem[]; // Array of media items to display
}

/**
 * Discord separator component structure (Components V2)
 * @see https://discord.com/developers/docs/components/reference#separator
 * 
 * Notes:
 * - Component to add vertical padding between other components
 * - Available only in messages
 */
export interface Separator {
  type: 14; // ComponentType.SEPARATOR
  id?: number; // Optional identifier for component
  divider?: boolean; // Whether to show a divider line (default true)
  spacing?: 1 | 2;   // SeparatorSpacingSize: 1=Small, 2=Large
}

/**
 * Discord file component structure (Components V2)
 * @see https://discord.com/developers/docs/components/reference#file
 * 
 * Notes:
 * - Displays an attached file
 * - Available only in messages
 * - Requires the file to be attached to the message
 */
export interface FileComponent {
  type: 13; // ComponentType.FILE
  id?: number; // Optional identifier for component
  file: { url: string }; // The file URL (resolved CDN URL for received messages)
  spoiler?: boolean; // Whether the file is a spoiler
}

/**
 * Discord container component structure (Components V2)
 * @see https://discord.com/developers/docs/components/reference#container
 * 
 * Notes:
 * - Container that visually groups a set of components
 * - Available only in messages
 * - Replaces the `embeds` field when using Components V2
 * - Can contain other components including nested containers
 */
export interface Container {
  type: 17; // ComponentType.CONTAINER
  id?: number; // Optional identifier for component
  accent_color?: number; // Accent color (integer) shown as left bar, like embed color
  spoiler?: boolean; // Whether the container content is spoilered
  components: (
    | ActionRow 
    | TextDisplay 
    | Section 
    | MediaGallery 
    | Separator 
    | FileComponent 
    | Container
  )[]; // Array of child components (can include nested containers)
}

export interface MessageReference {
    messageId: string;
    channelId?: string;
    guildId?: string;
    author?: User;
    content?: string;
    attachments?: boolean; // Whether the referenced message had attachments
}

/**
 * Rich attachment object with metadata
 */
export interface Attachment {
    url: string;
    filename: string;
    size?: number;          // File size in bytes
    contentType?: string;   // MIME type e.g. 'image/png'
    width?: number;         // For images/videos
    height?: number;        // For images/videos
    spoiler?: boolean;      // Whether the file is a spoiler (filename starts with SPOILER_)
}

export interface Message {
    author: User;
    content: string;
    embeds: Embed[];
    components: (ActionRow | TextDisplay | Section | MediaGallery | Separator | FileComponent | Container | Thumbnail)[];
    attachments: Attachment[];
    createdAt: string;
    editedAt?: string;
    reference?: MessageReference;
    interaction?: {
        type: 'APPLICATION_COMMAND' | 'MESSAGE_COMPONENT' | 'AUTOCOMPLETE' | 'MODAL_SUBMIT';
        name?: string;
        user?: User;
    };
    isBot?: boolean;
    /** Role color of the author (hex integer) */
    authorRoleColor?: number;
}