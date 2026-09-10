// Graph controller translates graph HTTP requests into service calls.
const { asyncHandler } = require('../utils/asyncHandler');
const graphService = require('../services/graphService');

const getGraph = asyncHandler(async (req, res) => {
  const graph = await graphService.buildGraph({
    sourceDocumentId: req.query.source_document_id,
    nodeLimit: req.query.node_limit,
    nodeOffset: req.query.node_offset,
    edgeLimit: req.query.edge_limit,
    edgeOffset: req.query.edge_offset
  });

  return res.json(graph);
});

const getEntityRelationships = asyncHandler(async (req, res) => {
  const edges = await graphService.getRelationshipsForEntity(req.params.entityId, {
    limit: req.query.limit,
    offset: req.query.offset
  });

  return res.json({ edges });
});

const getNodeDetail = asyncHandler(async (req, res) => {
  const detail = await graphService.getNodeDetail(req.params.id);
  if (!detail) return res.status(404).json({ message: 'Node not found.', status: 404 });
  return res.json(detail);
});

const createRelationship = asyncHandler(async (req, res) => {
  const edge = await graphService.createRelationship(req.body);
  return res.status(201).json({ edge });
});

module.exports = {
  getGraph,
  getEntityRelationships,
  getNodeDetail,
  createRelationship
};
