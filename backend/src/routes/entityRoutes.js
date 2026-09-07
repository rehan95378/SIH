// Routes for entity listing, detail reads, and creation.
const express = require('express');
const {
  listEntities,
  getEntity,
  createEntity
} = require('../controllers/entityController');
const { entityBody } = require('../validators/schemas');
const router = express.Router();

router.get('/entities', listEntities);
router.get('/entities/:id', getEntity);
router.post('/entities', entityBody, createEntity);

module.exports = router;
