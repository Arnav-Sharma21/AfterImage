import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, maxlength: 254, lowercase: true, trim: true },
  displayName: { type: String, required: true, trim: true, maxlength: 60 },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true, autoCreate: false, autoIndex: false });

export const User = mongoose.model('User', userSchema);
