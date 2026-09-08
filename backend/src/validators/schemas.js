// Request schemas and a small middleware factory for validating JSON bodies.
const entitySchema = {
  id: 'string',
  type: 'string',
  name: 'string',
  source_document_id: 'string',
  confidence: 'number'
};

const edgeSchema = {
  id: 'string',
  source: 'string',
  target: 'string',
  relationship_type: 'string',
  source_document_id: 'string'
};

const bodyValidator = (requiredFields, optionalFields = {}) => (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object.', status: 400 });
  }

  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (req.body[field] === undefined || req.body[field] === null) {
      return res.status(400).json({ message: `Missing required field: ${field}.`, status: 400 });
    }

    if (typeof req.body[field] !== expectedType) {
      return res.status(400).json({
        message: `${field} must be a ${expectedType}.`,
        status: 400
      });
    }
  }

  for (const [field, expectedType] of Object.entries(optionalFields)) {
    if (req.body[field] !== undefined && typeof req.body[field] !== expectedType) {
      return res.status(400).json({
        message: `${field} must be a ${expectedType}.`,
        status: 400
      });
    }
  }

  return next();
};

const entityBody = bodyValidator(entitySchema);
const edgeBody = bodyValidator(edgeSchema);
const loginBody = bodyValidator({ email: 'string', password: 'string' });
const registerBody = loginBody;
const documentBody = bodyValidator({ id: 'string', title: 'string', content: 'string' });
const ingestBody = (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Request body must be a JSON object.', status: 400 });
  }
  if (typeof body.title !== 'string' || body.title.trim() === '') {
    return res.status(400).json({ message: 'title must be a non-empty string.', status: 400 });
  }
  const hasText = typeof body.content === 'string' && body.content.trim() !== '';
  const hasBase64 = typeof body.content_base64 === 'string' && body.content_base64.trim() !== '';
  if (!hasText && !hasBase64) {
    return res.status(400).json({
      message: 'content or content_base64 must be a non-empty string.',
      status: 400
    });
  }
  for (const field of [
    'id',
    'created_by',
    'content',
    'content_base64',
    'mime_type',
    'data_type'
  ]) {
    if (body[field] !== undefined && typeof body[field] !== 'string') {
      return res.status(400).json({
        message: `${field} must be a string.`,
        status: 400
      });
    }
    if (
      body.data_type !== undefined
      && !['report', 'cdr', 'financial', 'social'].includes(body.data_type)
    ) {
      return res.status(400).json({
        message: 'data_type must be report, cdr, financial, or social.',
        status: 400
      });
    }
  }
  return next();
};
const caseBody = bodyValidator({ id: 'string', title: 'string' }, {
  description: 'string',
  status: 'string'
});
const caseStatusBody = bodyValidator({ status: 'string' });
const reportBody = bodyValidator({ id: 'string', document_id: 'string' }, {
  case_id: 'string',
  summary: 'string',
  status: 'string'
});

module.exports = {
  entitySchema,
  edgeSchema,
  entityBody,
  edgeBody,
  loginBody,
  registerBody,
  documentBody,
  ingestBody,
  caseBody,
  caseStatusBody,
  reportBody
};
