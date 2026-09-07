// Ingest controller receives raw reports and starts the extraction pipeline.
const { asyncHandler } = require("../utils/asyncHandler");
const { processReport } = require("../services/ingestService");

const ingestReport = asyncHandler(async (req, res) => {
  const result = await processReport({
    id: req.body.id,
    title: req.body.title,
    content: req.body.content,
    createdBy: req.user.id,
  });

  return res.status(201).json(result);
});

const ingestFileReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "A plain-text file is required.", status: 400 });
  }

  const result = await processReport({
    id: req.body.id,
    title: req.body.title || req.file.originalname,
    content: req.file.buffer.toString("utf8"),
    createdBy: req.user.id,
  });

  return res.status(201).json(result);
});

module.exports = { ingestReport, ingestFileReport };
