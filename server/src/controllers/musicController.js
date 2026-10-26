import * as spaceTracks from '../services/spaceTrackService.js';

export async function search(req, res) {
  const query = req.validated.query;
  const result = await req.app.locals.music.search(query);
  res.json({ data: result.tracks, meta: { page: query.page, hasMore: result.hasMore, provider: 'jamendo' } });
}

export async function playback(req, res) {
  const { provider, trackId } = req.validated.params;
  res.json({ data: await req.app.locals.music.resolvePlayback(provider, trackId) });
}

export async function saved(req, res) {
  res.json({ data: await spaceTracks.listSavedTracks(req.user._id, req.validated.params.id) });
}

export async function save(req, res) {
  const { id, provider, trackId } = req.validated.params;
  await spaceTracks.saveTrack(req.user._id, id, provider, trackId, req.app.locals.music);
  res.json({ data: { message: 'Track saved to your space.' } });
}

export async function remove(req, res) {
  const { id, provider, trackId } = req.validated.params;
  await spaceTracks.removeTrack(req.user._id, id, provider, trackId);
  res.json({ data: { message: 'Track removed from your space.' } });
}
