import React from 'react';
import { Message as MessageType } from '../types/messages';
import { Message } from './Message';
import type { UserMap } from '../utils/parseMarkdown';

interface ChannelViewProps {
  messages: MessageType[];
  channelName?: string;
  /** Map of user ID -> display role, shown as (Role) beside author name */
  userRoles?: Record<string, string>;
}

/** Format a date for the date separator */
function formatDateSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (msgDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Get date key for grouping (YYYY-MM-DD) */
function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const ChannelView: React.FC<ChannelViewProps> = ({ messages, channelName, userRoles }) => {
  // Build userMap from message authors (userId -> username) for mention display
  const userMap: UserMap = {};
  for (const msg of messages) {
    userMap[msg.author.id] = msg.author.username;
  }

  // Group messages by author and time proximity (within 7 minutes)
  // Break groups on: different author, time gap, replies, interactions, date change
  const elements: React.ReactNode[] = [];
  let lastDateKey = '';

  for (let i = 0; i < messages.length; i++) {
    const current = messages[i];
    if (!current) continue;

    const previous = i > 0 ? messages[i - 1] : null;
    const currentDate = new Date(current.createdAt);
    const currentDateKey = getDateKey(current.createdAt);

    // Insert date separator if date changed
    if (currentDateKey !== lastDateKey) {
      elements.push(
        <div key={`date-${currentDateKey}`} className="discord-date-separator">
          <div className="discord-date-separator-line" />
          <span className="discord-date-separator-text">{formatDateSeparator(currentDate)}</span>
          <div className="discord-date-separator-line" />
        </div>
      );
      lastDateKey = currentDateKey;
    }

    // Determine if this is a new message group
    const isGroupStart = !previous ||
      previous.author.id !== current.author.id ||
      (currentDate.getTime() - new Date(previous.createdAt).getTime()) > 7 * 60 * 1000 ||
      !!current.reference ||       // Replies always start a new group
      !!current.interaction ||     // Slash commands always start a new group
      getDateKey(previous.createdAt) !== currentDateKey; // Date change starts new group

    elements.push(
      <Message
        key={`msg-${i}`}
        message={current}
        isGroupStart={isGroupStart}
        userMap={userMap}
        userRole={userRoles?.[current.author.id]}
      />
    );
  }

  return (
    <div className="discord-channel-view">
      <div className="discord-channel-header">
        <div className="discord-channel-header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41001 9L8.35001 15H14.35L15.41 9H9.41001Z" />
          </svg>
        </div>
        <div className="discord-channel-header-name">{channelName || 'channel'}</div>
      </div>
      <div className="discord-messages-container">
        {elements}
      </div>
    </div>
  );
};
