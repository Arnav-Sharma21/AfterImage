import * as spaceService from '../services/spaceService.js';

export async function list(req, res) {
  res.json(await spaceService.listSpaces(req.user._id, req.validated.query));
}

export async function detail(req, res) {
  res.json({ data: await spaceService.getSpace(req.user._id, req.validated.params.id) });
}

export async function create(req, res) {
  const space = await spaceService.createSpace(req.user._id, req.validated.body);
  res.status(201).location(`/api/spaces/${space.id}`).json({ data: space });
}

export async function update(req, res) {
  res.json({ data: await spaceService.updateSpace(req.user._id, req.validated.params.id, req.validated.body, req.app.locals.media) });
}

export async function remove(req, res) {
  await spaceService.deleteSpace(req.user._id, req.validated.params.id, req.validated.body.revision, req.app.locals.media);
  res.json({ data: { message: 'Space deleted.' } });
}
