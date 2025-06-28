import express, { Response } from 'express';
import {
  saveChat,
  createMessage,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../services/chat.service';
import { populateDocument } from '../utils/database.util';
import {
  CreateChatRequest,
  AddMessageRequestToChat,
  AddParticipantRequest,
  ChatIdRequest,
  GetChatByParticipantsRequest,
  ChatUpdatePayload,
  Chat,
} from '../types/chat';
import { Message } from '../types/message';
import { FakeSOSocket } from '../types/socket';

const chatController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Validates that the request body contains all required fields for a chat.
   * @param req The incoming request containing chat data.
   * @returns `true` if the body contains valid chat fields; otherwise, `false`.
   */
  const isCreateChatRequestValid = (req: CreateChatRequest): boolean => {
    return !!(
      req.body &&
      req.body.participants &&
      Array.isArray(req.body.participants) &&
      req.body.participants.length > 0 &&
      req.body.participants.every((participant: string) => typeof participant === 'string' && participant.trim().length > 0)
    );
  };

  /**
   * Validates that the request body contains all required fields for a message.
   * @param req The incoming request containing message data.
   * @returns `true` if the body contains valid message fields; otherwise, `false`.
   */
  const isAddMessageRequestValid = (req: AddMessageRequestToChat): boolean => {
    return !!(
      req.body &&
      req.body.msg &&
      req.body.msgFrom &&
      typeof req.body.msg === 'string' &&
      typeof req.body.msgFrom === 'string' &&
      req.body.msg.trim().length > 0 &&
      req.body.msgFrom.trim().length > 0
    );
  };

  /**
   * Validates that the request body contains all required fields for a participant.
   * @param req The incoming request containing participant data.
   * @returns `true` if the body contains valid participant fields; otherwise, `false`.
   */
  const isAddParticipantRequestValid = (req: AddParticipantRequest): boolean => {
    // Type guard to ensure req.body exists and has the right shape
    if (!req.body || typeof req.body !== 'object') {
      return false;
    }
    
    // Check if userId exists and is a string (to match test expectations)
    if (!('userId' in req.body) || typeof req.body.userId !== 'string') {
      return false;
    }
    
    // Now we can safely access userId as a string
    return req.body.userId.trim().length > 0;
  };

  /**
   * Handles POST requests to create a new chat using saveChat.
   * Enriches the result using the populateDocument utility.
   * A chatUpdate socket event is emitted to notify the client.
   */
  const createChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    try {
      if (!isCreateChatRequestValid(req)) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }

      const result = await saveChat(req.body);

      if ('error' in result) {
        res.status(500).json(result);
        return;
      }

      // Enrich the result using populateDocument utility
      const populatedChat = await populateDocument(result._id!.toString(), 'chat');

      if ('error' in populatedChat) {
        res.status(500).json(populatedChat);
        return;
      }

      // Emit chatUpdate socket event
      const updatePayload: ChatUpdatePayload = {
        chat: populatedChat as Chat,
        type: 'created'
      };
      socket.emit('chatUpdate', updatePayload);

      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Handles POST requests to add a message to an existing chat using createMessage and addMessageToChat.
   * A chatUpdate socket event is emitted to notify the client that a new message was added to the chat.
   * This socket event should only be emitted to users currently in the specific chat room.
   */
  const addMessageToChatRoute = async (req: AddMessageRequestToChat, res: Response): Promise<void> => {
    try {
      if (!isAddMessageRequestValid(req)) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }

      const { chatId } = req.params;
      
      // Create the message - ensure all required fields are properly typed
      const messageData: Message = {
        msg: req.body.msg,
        msgFrom: req.body.msgFrom,
        msgDateTime: req.body.msgDateTime || new Date(),
        type: (req.body as any).type || 'direct'  // Temporary type assertion
      };
      
      const messageResult = await createMessage(messageData);

      if ('error' in messageResult) {
        res.status(500).json(messageResult);
        return;
      }

      // Add message to chat
      const chatResult = await addMessageToChat(chatId, messageResult._id!.toString());

      if ('error' in chatResult) {
        res.status(500).json(chatResult);
        return;
      }

      // Enrich the result using populateDocument utility
      const populatedChat = await populateDocument(chatResult._id!.toString(), 'chat');

      if ('error' in populatedChat) {
        res.status(500).json(populatedChat);
        return;
      }

      // Emit chatUpdate socket event only to users in the specific chat room
      const updatePayload: ChatUpdatePayload = {
        chat: populatedChat as Chat,
        type: 'newMessage'
      };
      socket.to(chatId).emit('chatUpdate', updatePayload);

      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Handles GET requests to retrieve a chat by ID using getChat.
   * Enriches the result using the populateDocument helper function.
   */
  const getChatRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    try {
      const { chatId } = req.params;
      const result = await getChat(chatId);

      if ('error' in result) {
        res.status(404).json(result);
        return;
      }

      // Enrich the result using populateDocument
      const populatedChat = await populateDocument(result._id!.toString(), 'chat');

      if ('error' in populatedChat) {
        res.status(500).json(populatedChat);
        return;
      }

      res.status(200).json(populatedChat);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Handles POST requests to add a participant to an existing chat using addParticipantToChat.
   */
  const addParticipantToChatRoute = async (req: AddParticipantRequest, res: Response): Promise<void> => {
    try {
      if (!isAddParticipantRequestValid(req)) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }

      const { chatId } = req.params;
      const { userId } = req.body;

      const result = await addParticipantToChat(chatId, userId);

      if ('error' in result) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Handles GET requests to retrieve all chats that contain the username provided as part of the route parameters.
   * Populates all of the chat documents before returning a response.
   * Throws an error if the population fails for any of the chats.
   */
  const getChatsByUserRoute = async (req: GetChatByParticipantsRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const chats = await getChatsByParticipants([username]);

      // Populate all chat documents
      const populatedChats = [];
      for (const chat of chats) {
        const populatedChat = await populateDocument(chat._id!.toString(), 'chat');

        if ('error' in populatedChat) {
          res.status(500).send('Error retrieving chat: Failed populating chats');
          return;
        }

        populatedChats.push(populatedChat);
      }

      res.status(200).json(populatedChats);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Socket event listeners
  socket.on('connection', (conn) => {
    conn.on('joinChat', (chatID: string) => {
      if (chatID && typeof chatID === 'string' && chatID.trim().length > 0) {
        conn.join(chatID);
      }
    });

    conn.on('leaveChat', (chatID: string | undefined) => {
      if (chatID && typeof chatID === 'string' && chatID.trim().length > 0) {
        conn.leave(chatID);
      }
    });
  });

  // Register the routes - matching the test endpoints exactly
  router.post('/createChat', createChatRoute);
  router.post('/:chatID/addMessage', addMessageToChatRoute);
  router.get('/:chatID', getChatRoute);
  router.post('/:chatID/addParticipant', addParticipantToChatRoute);
  router.get('/getChatsByUser/:username', getChatsByUserRoute);

  return router;
};

export default chatController;