// Ingest controller receives raw reports and starts the extraction pipeline.
const { asyncHandler } = require("../utils/asyncHandler");
const { processReport } = require("../services/ingestService");

const supportedDataTypes = new Set(["report", "cdr", "financial", "social"]);

const getDataType = (value) => {
  const dataType = value || "report";
  if (!supportedDataTypes.has(dataType)) {
    const error = new Error("data_type must be report, cdr, financial, or social.");
    error.statusCode = 400;
    throw error;
  }
  return dataType;
};

const ingestReport = asyncHandler(async (req, res) => {
  const result = await processReport({
    id: req.body.id,
    title: req.body.title,
    content: req.body.content,
    contentBase64: req.body.content_base64,
    mimeType: req.body.mime_type,
    dataType: getDataType(req.body.data_type),
    createdBy: req.user.id,
  });

  return res.status(201).json(result);
});

const ingestFileReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "A file is required.", status: 400 });
  }

  const result = await processReport({
    id: req.body.id,
    title: req.body.title || req.file.originalname,
    content: ['text/plain', 'text/csv', 'application/csv'].includes(req.file.mimetype)
      ? req.file.buffer.toString("utf8")
      : '',
    contentBase64: req.file.buffer.toString("base64"),
    mimeType: req.file.mimetype,
    dataType: getDataType(req.body.data_type),
    createdBy: req.user.id,
  });

  return res.status(201).json(result);
});

module.exports = { ingestReport, ingestFileReport };
