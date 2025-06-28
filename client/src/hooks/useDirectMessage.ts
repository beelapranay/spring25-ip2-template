import { useEffect, useState } from 'react';
import { Chat, ChatUpdatePayload, Message, User } from '../types';
import useUserContext from './useUserContext';
import { createChat, getChatById, getChatsByUser, sendMessage } from '../services/chatService';

/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging between users.
 * It includes a selected user, messages, and a new message state.
 */

const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [chatToCreate, setChatToCreate] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const handleJoinChat = (chatID: string) => {
    socket.emit('joinChat', chatID);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?._id) {
      return;
    }

    console.log('Sending message to chat ID:', selectedChat._id);

    try {
      const messageToSend: Omit<Message, 'type'> = {
        msg: newMessage.trim(),
        msgFrom: user.username,
        msgDateTime: new Date(),
      };

      await sendMessage(messageToSend, selectedChat._id);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleChatSelect = async (chatID: string | undefined) => {
    if (!chatID) {
      return;
    }

    try {
      const chatData = await getChatById(chatID);
      setSelectedChat(chatData);
      handleJoinChat(chatID);
    } catch (error) {
      console.error('Error selecting chat:', error);
    }
  };

  const handleUserSelect = (selectedUser: User) => {
    setChatToCreate(selectedUser.username);
  };

  const handleCreateChat = async () => {
    if (!chatToCreate || !user._id) {
      return;
    }

    try {
      const participants = [user.username, chatToCreate];
      const newChat = await createChat(participants);
      setChats(prevChats => [...prevChats, newChat]);
      setSelectedChat(newChat);
      if (newChat._id) {
        handleJoinChat(newChat._id);
      }
      setShowCreatePanel(false);
      setChatToCreate('');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const userChats = await getChatsByUser(user.username);
        setChats(userChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      switch (type) {
        case 'created':
          setChats(prevChats => {
            const chatExists = prevChats.some(existingChat => existingChat._id === chat._id);
            if (!chatExists) {
              return [...prevChats, chat];
            }
            return prevChats;
          });
          break;

        case 'newMessage':
          if (selectedChat && selectedChat._id === chat._id) {
            setSelectedChat(chat);
          }
          setChats(prevChats =>
            prevChats.map(existingChat => (existingChat._id === chat._id ? chat : existingChat)),
          );
          break;
        default:
          throw new Error(`Invalid chatUpdate type: ${type}`);
      }
    };

    fetchChats();
    socket.on('chatUpdate', handleChatUpdate);

    return () => {
      socket.off('chatUpdate', handleChatUpdate);
      if (selectedChat?._id) {
        socket.emit('leaveChat', selectedChat._id);
      }
    };
  }, [user.username, socket, selectedChat?._id]);

  return {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
  };
};

export default useDirectMessage;
