// Case controller translates case HTTP requests into service calls.
const { asyncHandler } = require('../utils/asyncHandler');
const caseService = require('../services/caseService');

const listCases = asyncHandler(async (req, res) => {
  const cases = await caseService.getCases({
    status: req.query.status,
    createdBy: req.query.created_by,
    limit: req.query.limit,
    offset: req.query.offset
  });

  return res.json({ cases });
});

const getCase = asyncHandler(async (req, res) => {
  const caseRecord = await caseService.getCase(req.params.id);
  if (!caseRecord) return res.status(404).json({ message: 'Case not found.' });
  return res.json({ case: caseRecord });
});

const createCase = asyncHandler(async (req, res) => {
  const caseRecord = await caseService.createCase({
    ...req.body,
    createdBy: req.user.id
  });
  return res.status(201).json({ case: caseRecord });
});

const updateCaseStatus = asyncHandler(async (req, res) => {
  const caseRecord = await caseService.changeCaseStatus(
    req.params.id,
    req.body.status
  );
  if (!caseRecord) return res.status(404).json({ message: 'Case not found.' });
  return res.json({ case: caseRecord });
});

module.exports = {
  listCases,
  getCase,
  createCase,
  updateCaseStatus
};
