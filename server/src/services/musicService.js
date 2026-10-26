import { AppError } from '../middleware/errors.js';

export function createMusicService(provider) {
  return {
    search: query => provider.search(query),
    getCandidates: query => provider.getCandidates(query),
    async getTrack(providerName, id) {
      if (providerName !== provider.name) throw new AppError(422, 'PROVIDER_UNSUPPORTED', 'This music provider is not supported.');
      return provider.getTrack(id);
    },
    async resolvePlayback(providerName, id) {
      const track = await this.getTrack(providerName, id);
      if (!track.isPlayable || !track.streamUrl) throw new AppError(410, 'STREAM_UNAVAILABLE', 'This track has no eligible stream. Try another track.');
      return track;
    }
  };
}
