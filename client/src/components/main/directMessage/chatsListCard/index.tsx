import React from 'react';
import './index.css';
import { Chat } from '../../../../types';

const ChatsListCard = ({
  chat,
  handleChatSelect,
}: {
  chat: Chat;
  handleChatSelect: (chatID: string | undefined) => void;
}) => (
  <div className='chats-list-card' onClick={() => handleChatSelect(chat._id)}>
    <p>{chat.participants.join(', ')}</p>
  </div>
);

export default ChatsListCard;
