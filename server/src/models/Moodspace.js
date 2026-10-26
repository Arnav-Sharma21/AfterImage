import mongoose from 'mongoose';
import { MOODS } from '../../../shared/moods.js';

const moodspaceSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 1000 },
  moods: {
    type: [{ type: String, enum: MOODS }],
    required: true,
    validate: value => value.length >= 1 && value.length <= 5 && new Set(value).size === value.length
  },
  revision: { type: Number, default: 0, min: 0, required: true }
}, { timestamps: true, versionKey: false, autoCreate: false, autoIndex: false });

moodspaceSchema.index({ ownerId: 1, updatedAt: -1, _id: -1 });

export const Moodspace = mongoose.model('Moodspace', moodspaceSchema);
