import mongoose from 'mongoose';
import { MOODS } from '../../../shared/moods.js';
import { isPublicImageUrl } from '../../../shared/images.js';

const moodspaceSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 1000 },
  moods: {
    type: [{ type: String, enum: MOODS }],
    required: true,
    validate: value => value.length >= 1 && value.length <= 5 && new Set(value).size === value.length
  },
  soundTuning: { type: new mongoose.Schema(Object.fromEntries(['energy', 'melancholy', 'warmth', 'intensity', 'nostalgia'].map(key => [key, { type: Number, min: 0, max: 1 }])), { _id: false }), default: () => ({}) },
  revision: { type: Number, default: 0, min: 0, required: true },
  images: { type: [new mongoose.Schema({
    id: { type: String, required: true },
    url: { type: String, required: true, maxlength: 2048, validate: isPublicImageUrl },
    assetId: { type: String, match: /^[a-f\d]{24}$/i },
    alt: { type: String, required: true, maxlength: 200 },
    caption: { type: String, default: '', maxlength: 500 }
  }, { _id: false })], default: [], validate: items => items.length <= 12 && new Set(items.map(item => item.id)).size === items.length },
  fragments: { type: [new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['quote', 'note', 'image-caption'], required: true },
    text: { type: String, required: true, maxlength: 1000 }
  }, { _id: false })], default: [] },
  recommendation: { type: new mongoose.Schema({
    generation: Number, contentRevision: Number, preferenceRevision: Number,
    algorithmVersion: String, generatedAt: Date,
    profile: mongoose.Schema.Types.Mixed,
    warnings: [String],
    tracks: [new mongoose.Schema({ trackId: String, score: Number, reasons: [String], evidence: mongoose.Schema.Types.Mixed }, { _id: false })]
  }, { _id: false }), default: null },
  savedTracks: { type: [new mongoose.Schema({
    trackId: { type: String, ref: 'Track', required: true },
    savedAt: { type: Date, required: true }
  }, { _id: false })], default: [] }
}, { timestamps: true, versionKey: false, autoCreate: false, autoIndex: false });

moodspaceSchema.index({ ownerId: 1, updatedAt: -1, _id: -1 });

export const Moodspace = mongoose.model('Moodspace', moodspaceSchema);
