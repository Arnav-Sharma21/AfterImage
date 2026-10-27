import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicId: { type: String, required: true, unique: true },
  cloudinaryAssetId: String,
  url: String,
  width: Number,
  height: Number,
  bytes: Number,
  status: { type: String, enum: ['uploading', 'ready', 'deleting', 'failed', 'deleted'], required: true },
  // Pins protect a space write from a concurrent cleanup. A crashed writer may
  // leave a pin: conservatively retain that asset rather than deleting data.
  pins: { type: Number, default: 0, min: 0 },
  cleanupFailed: { type: Boolean, default: false }
}, { timestamps: true, autoCreate: false, autoIndex: false });
schema.index({ ownerId: 1, status: 1, createdAt: 1 });
export const MediaAsset = mongoose.model('MediaAsset', schema);
