// Routes for uploading and processing raw reports.
const express = require('express');
const { ingestReport, ingestFileReport } = require('../controllers/ingestController');
const { ingestBody } = require('../validators/schemas');
const { upload } = require('../utils/fileUpload');
const router = express.Router();

router.post('/ingest', ingestBody, ingestReport);
router.post('/ingest/file', upload.single('file'), ingestFileReport);

module.exports = router;
