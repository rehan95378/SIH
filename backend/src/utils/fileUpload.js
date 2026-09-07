// File upload helper for report ingestion. Files stay in memory for processing.
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'text/plain') {
      return callback(new Error('Only plain-text report files are supported.'));
    }

    return callback(null, true);
  }
});

module.exports = { upload };
