// Routes for graph reads and relationship creation.
const express = require('express');
const {
  getGraph,
  getEntityRelationships,
  createRelationship
} = require('../controllers/graphController');
const { edgeBody } = require('../validators/schemas');
const router = express.Router();

router.get('/graph', getGraph);
router.get('/entities/:entityId/relationships', getEntityRelationships);
router.post('/relationships', edgeBody, createRelationship);

module.exports = router;
