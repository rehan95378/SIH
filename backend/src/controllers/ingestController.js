// Ingest controller receives raw reports and starts the extraction pipeline.
const { asyncHandler } = require("../utils/asyncHandler");
const { processReport } = require("../services/ingestService");
const { createJob, completeJob, failJob, getJob } = require("../utils/jobTracker");

const supportedDataTypes = new Set(["report", "csv", "cdr", "financial", "social"]);

const getDataType = (value) => {
  const dataType = value || "report";
  if (!supportedDataTypes.has(dataType)) {
    const error = new Error("data_type must be report, csv, cdr, financial, or social.");
    error.statusCode = 400;
    throw error;
  }
  return dataType;
};

const ingestReport = asyncHandler(async (req, res) => {
  const jobId = createJob();
  const input = {
    id: req.body.id,
    title: req.body.title || "Evidence report",
    content: req.body.content || req.body.text,
    contentBase64: req.body.content_base64,
    mimeType: req.body.mime_type,
    dataType: getDataType(req.body.data_type),
    createdBy: req.user.id,
  };
  setImmediate(() => processReport(input).then(
    (result) => completeJob(jobId, result),
    (error) => failJob(jobId, error)
  ));
  return res.status(202).json({ status: "processing", job_id: jobId });
});

const ingestFileReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "A file is required.", status: 400 });
  }

  const jobId = createJob();
  const input = {
    id: req.body.id,
    title: req.body.title || req.file.originalname,
    content: ['text/plain', 'text/csv', 'application/csv'].includes(req.file.mimetype)
      ? req.file.buffer.toString("utf8")
      : '',
    contentBase64: req.file.buffer.toString("base64"),
    mimeType: req.file.mimetype,
    dataType: getDataType(req.body.data_type),
    createdBy: req.user.id,
  };
  setImmediate(() => processReport(input).then(
    (result) => completeJob(jobId, result),
    (error) => failJob(jobId, error)
  ));
  return res.status(202).json({ status: "processing", job_id: jobId });
});

const getIngestStatus = asyncHandler(async (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Job not found.", status: 404 });
  if (job.status === "failed") {
    return res.status(500).json({ status: "failed", message: job.error });
  }
  return res.json({
    status: job.status,
    ...(job.status === "done" ? job.result : {})
  });
});

module.exports = { ingestReport, ingestFileReport, getIngestStatus };
