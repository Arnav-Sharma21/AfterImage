import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackId: { type: String, ref: 'Track', required: true },
  reaction: { type: String, enum: ['like', 'dislike', 'neutral'], required: true }
}, { timestamps: true, versionKey: false, autoCreate: false, autoIndex: false });
feedbackSchema.index({ userId: 1, trackId: 1 }, { unique: true });
feedbackSchema.index({ userId: 1, updatedAt: -1 });
export const UserFeedback = mongoose.model('UserFeedback', feedbackSchema);
