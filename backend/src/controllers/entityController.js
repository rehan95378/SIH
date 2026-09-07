// Entity controller translates HTTP requests into entity-service calls.
const { asyncHandler } = require('../utils/asyncHandler');
const entityService = require('../services/entityService');

const listEntities = asyncHandler(async (req, res) => {
  const entities = await entityService.getEntities({
    type: req.query.type,
    sourceDocumentId: req.query.source_document_id,
    search: req.query.search,
    limit: req.query.limit,
    offset: req.query.offset
  });

  res.json({ entities });
});

const getEntity = asyncHandler(async (req, res) => {
  const entity = await entityService.getEntity(req.params.id);

  if (!entity) {
    return res.status(404).json({ message: 'Entity not found.' });
  }

  return res.json({ entity });
});

const createEntity = asyncHandler(async (req, res) => {
  const entity = await entityService.createEntity(req.body);
  return res.status(201).json({ entity });
});

module.exports = { listEntities, getEntity, createEntity };
