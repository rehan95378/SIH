// Analytics controller exposes graph scoring through HTTP.
const { asyncHandler } = require('../utils/asyncHandler');
const graphService = require('../services/graphService');
const analyticsService = require('../services/analyticsService');

const getAnalytics = asyncHandler(async (req, res) => {
  const graph = await graphService.buildGraph({
    sourceDocumentId: req.query.source_document_id,
    nodeLimit: req.query.node_limit,
    nodeOffset: req.query.node_offset,
    edgeLimit: req.query.edge_limit,
    edgeOffset: req.query.edge_offset
  });

  const analytics = await analyticsService.computeScores(graph);
  return res.json(analytics);
});

module.exports = { getAnalytics };
