// Search controller handles queries across entities, documents, and reports.
const { asyncHandler } = require('../utils/asyncHandler');
const { searchRecords } = require('../services/searchService');

const search = asyncHandler(async (req, res) => {
  const results = await searchRecords({
    query: req.query.q,
    type: req.query.type,
    limit: req.query.limit
  });

  return res.json({ results });
});

module.exports = { search };
