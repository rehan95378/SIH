// File upload helper for report ingestion. Files stay in memory for processing.
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = new Set([
      'text/plain',
      'text/csv',
      'application/csv',
      'application/pdf',
      'image/jpeg',
      'image/png'
    ]);
    if (!allowed.has(file.mimetype)) {
      return callback(new Error('Only text, CSV, PDF, JPEG, and PNG files are supported.'));
    }

    return callback(null, true);
  }
});

module.exports = { upload };
