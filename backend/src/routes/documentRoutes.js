// Routes for raw report management and evidence access.
const express = require('express');
const {
  listDocuments,
  getDocument,
  createDocument
} = require('../controllers/documentController');
const { documentBody } = require('../validators/schemas');
const router = express.Router();

router.get('/documents', listDocuments);
router.get('/documents/:id', getDocument);
router.post('/documents', documentBody, createDocument);

module.exports = router;
