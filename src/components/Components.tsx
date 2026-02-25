import React from 'react';
import {
  ActionRow,
  Button,
  StringSelect,
  TextDisplay,
  Section,
  MediaGallery,
  Separator,
  Container,
  FileComponent,
  Thumbnail,
} from '../types/messages';
import { parseDiscordContent } from '../utils/parseMarkdown';

type Component = ActionRow | TextDisplay | Section | MediaGallery | Separator | Container | FileComponent | Thumbnail;

interface ComponentsProps {
  components: Component[];
}

/** Get file extension from URL or filename */
function getFileExtFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('.');
    return parts.length > 1 ? (parts[parts.length - 1] ?? '').toUpperCase() : '';
  } catch {
    const parts = url.split('.');
    return parts.length > 1 ? (parts[parts.length - 1] ?? '').toUpperCase() : '';
  }
}

/** Get filename from URL */
function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || 'file';
  } catch {
    return url.split('/').pop() || 'file';
  }
}

export const Components: React.FC<ComponentsProps> = ({ components }) => {

  const renderButton = (button: Button, index: number): React.ReactNode => {
    const buttonClass = `discord-button discord-button-${button.style}`;

    const emojiContent = button.emoji ? (
      <span className="discord-button-emoji">
        {button.emoji.id
          ? <img
              src={`https://cdn.discordapp.com/emojis/${button.emoji.id}.${button.emoji.animated ? 'gif' : 'webp'}?size=20`}
              alt={button.emoji.name || ''}
              className="discord-button-emoji-img"
            />
          : button.emoji.name}
      </span>
    ) : null;

    const content = (
      <>
        {emojiContent}
        {button.label}
      </>
    );

    if (button.style === 5 && button.url) {
      return (
        <a
          key={index}
          href={button.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} discord-button-link`}
        >
          {content}
          <svg className="discord-button-link-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 5V3H5.375C4.06519 3 3 4.06519 3 5.375V18.625C3 19.936 4.06519 21 5.375 21H18.625C19.936 21 21 19.936 21 18.625V14H19V19H5V5H10Z" />
            <path d="M21 2.99902H14V4.99902H17.586L9.29297 13.292L10.707 14.706L19 6.41302V9.99902H21V2.99902Z" />
          </svg>
        </a>
      );
    }

    return (
      <button
        key={index}
        className={buttonClass}
        disabled={button.disabled}
      >
        {content}
      </button>
    );
  };

  const renderStringSelect = (select: StringSelect, index: number): React.ReactNode => {
    return (
      <div key={index} className="discord-select-wrapper">
        <div className={`discord-select${select.disabled ? ' disabled' : ''}`}>
          <span className="discord-select-text">
            {select.placeholder || 'Make a selection'}
          </span>
          <svg className="discord-select-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
          </svg>
        </div>
      </div>
    );
  };

  const renderThumbnail = (thumbnail: Thumbnail, index: number): React.ReactNode => {
    return (
      <div key={index} className={`discord-thumbnail${thumbnail.spoiler ? ' discord-thumbnail-spoiler' : ''}`}>
        <img
          src={thumbnail.media.url}
          alt={thumbnail.description || ''}
          className="discord-thumbnail-img"
        />
        {thumbnail.spoiler && <div className="discord-spoiler-overlay-small">SPOILER</div>}
      </div>
    );
  };

  const renderComponent = (component: Component, index: number): React.ReactNode => {
    switch (component.type) {
      case 1: { // ActionRow
        const actionRow = component as ActionRow;
        return (
          <div key={index} className="discord-action-row">
            {actionRow.components.map((child, i) => {
              if (child.type === 2) return renderButton(child as Button, i);
              if (child.type === 3) return renderStringSelect(child as StringSelect, i);
              return null;
            })}
          </div>
        );
      }

      case 10: { // TextDisplay
        const textDisplay = component as TextDisplay;
        return (
          <div key={index} className="discord-text-display">
            {parseDiscordContent(textDisplay.content)}
          </div>
        );
      }

      case 9: { // Section
        const section = component as Section;
        return (
          <div key={index} className="discord-section">
            <div className="discord-section-text">
              {section.components.map((td, i) => (
                <div key={i} className="discord-section-text-item">
                  {parseDiscordContent(td.content)}
                </div>
              ))}
            </div>
            {section.accessory && (
              <div className="discord-section-accessory">
                {section.accessory.type === 2
                  ? renderButton(section.accessory as Button, 0)
                  : renderThumbnail(section.accessory as Thumbnail, 0)
                }
              </div>
            )}
          </div>
        );
      }

      case 11: { // Thumbnail (standalone)
        return renderThumbnail(component as Thumbnail, index);
      }

      case 12: { // MediaGallery
        const gallery = component as MediaGallery;
        const itemCount = gallery.items.length;
        const gridClass = itemCount === 1 ? 'discord-media-gallery-1'
          : itemCount === 2 ? 'discord-media-gallery-2'
          : 'discord-media-gallery-multi';

        return (
          <div key={index} className={`discord-media-gallery ${gridClass}`}>
            {gallery.items.map((item, i) => (
              <div key={i} className={`discord-media-gallery-item${item.spoiler ? ' discord-media-gallery-spoiler' : ''}`}>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={item.url}
                    alt={item.description || `Media ${i + 1}`}
                    className="discord-media-gallery-img"
                  />
                </a>
                {item.spoiler && <div className="discord-spoiler-overlay-small">SPOILER</div>}
              </div>
            ))}
          </div>
        );
      }

      case 13: { // FileComponent
        const fileComp = component as FileComponent;
        const filename = getFilenameFromUrl(fileComp.file.url);
        const ext = getFileExtFromUrl(fileComp.file.url);
        return (
          <div key={index} className={`discord-file-attachment${fileComp.spoiler ? ' discord-file-spoiler' : ''}`}>
            <div className="discord-file-icon">
              <svg width="30" height="40" viewBox="0 0 30 40" fill="none">
                <path d="M0 4C0 1.79086 1.79086 0 4 0H19L30 11V36C30 38.2091 28.2091 40 26 40H4C1.79086 40 0 38.2091 0 36V4Z" fill="#d3d6fd" />
                <path d="M19 0L30 11H23C20.7909 11 19 9.20914 19 7V0Z" fill="#7984f5" />
                <text x="15" y="28" textAnchor="middle" fill="#4752c4" fontSize="8" fontWeight="600" fontFamily="sans-serif">{ext}</text>
              </svg>
            </div>
            <div className="discord-file-info">
              <a href={fileComp.file.url} target="_blank" rel="noopener noreferrer" className="discord-file-name">
                {filename}
              </a>
            </div>
            <a href={fileComp.file.url} target="_blank" rel="noopener noreferrer" className="discord-file-download" title="Download">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.293 9.293L17.707 10.707L12 16.414L6.293 10.707L7.707 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z" />
              </svg>
            </a>
          </div>
        );
      }

      case 14: { // Separator
        const separator = component as Separator;
        const spacingClass = separator.spacing === 2 ? 'discord-separator-large' : 'discord-separator-small';
        if (separator.divider === false) {
          return <div key={index} className={`discord-separator-spacing ${spacingClass}`} />;
        }
        return <div key={index} className={`discord-separator ${spacingClass}`} />;
      }

      case 17: { // Container
        const container = component as Container;
        const accentColor = container.accent_color
          ? `#${container.accent_color.toString(16).padStart(6, '0')}`
          : undefined;

        return (
          <div
            key={index}
            className={`discord-container${container.spoiler ? ' discord-container-spoiler' : ''}`}
          >
            {accentColor && (
              <div className="discord-container-accent" style={{ backgroundColor: accentColor }} />
            )}
            <div className="discord-container-content">
              {container.components.map((child, i) => renderComponent(child as Component, i))}
            </div>
            {container.spoiler && <div className="discord-container-spoiler-overlay">SPOILER</div>}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="discord-components">
      {components.map((component, index) => renderComponent(component, index))}
    </div>
  );
};
