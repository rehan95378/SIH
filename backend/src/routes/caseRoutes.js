// Routes for case-specific investigation operations.
const express = require('express');
const {
  listCases,
  getCase,
  createCase,
  updateCaseStatus
} = require('../controllers/caseController');
const { caseBody, caseStatusBody } = require('../validators/schemas');
const router = express.Router();

router.get('/cases', listCases);
router.get('/cases/:id', getCase);
router.post('/cases', caseBody, createCase);
router.patch('/cases/:id/status', caseStatusBody, updateCaseStatus);

module.exports = router;
