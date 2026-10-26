import { generateRecommendations, readRecommendations } from '../services/recommendationService.js';
import { setFeedback } from '../services/feedbackService.js';

export async function read(req, res) {
  res.json({ data: await readRecommendations(req.user._id, req.validated.params.id) });
}
export async function generate(req, res) {
  res.json({ data: await generateRecommendations(req.user._id, req.validated.params.id, req.validated.body.revision, req.app.locals.music) });
}
export async function react(req, res) {
  const { id, provider, trackId } = req.validated.params;
  res.json({ data: await setFeedback(req.user._id, id, provider, trackId, req.validated.body.reaction) });
}
