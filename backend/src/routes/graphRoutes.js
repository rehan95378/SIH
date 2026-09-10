// Routes for graph reads and relationship creation.
const express = require('express');
const {
  getGraph,
  getEntityRelationships,
  getNodeDetail,
  createRelationship
} = require('../controllers/graphController');
const { edgeBody } = require('../validators/schemas');
const router = express.Router();

router.get('/graph', getGraph);
router.get('/entities/:entityId/relationships', getEntityRelationships);
router.get('/graph/node/:id', getNodeDetail);
router.post('/relationships', edgeBody, createRelationship);

module.exports = router;
