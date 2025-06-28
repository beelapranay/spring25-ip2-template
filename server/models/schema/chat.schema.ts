import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Chat collection.
 *
 * - `participants`: an array of usernames participating in the chat.
 * - `messages`: an array of ObjectIds referencing the Message collection.
 * - Timestamps store `createdAt` & `updatedAt`.
 */
const chatSchema: Schema = new Schema(
  {
    participants: [
      {
        type: String,
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        required: false,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'Chat',
  },
);

export default chatSchema;
