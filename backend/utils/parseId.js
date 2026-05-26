export function parseIdParam(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  req.params.id = String(id);
  next();
}
