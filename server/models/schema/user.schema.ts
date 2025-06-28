import { Schema } from 'mongoose';

/**
 * Mongoose schema for the User collection.
 */
const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      immutable: true,
    },
    password: {
      type: String,
    },
    dateJoined: {
      type: Date,
    },
    biography: {
      type: String,
      default: '',
    },
  },
  { collection: 'User' },
);

export default userSchema;
