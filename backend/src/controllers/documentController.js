// Document controller translates report HTTP requests into service calls.
const { asyncHandler } = require('../utils/asyncHandler');
const documentService = require('../services/documentService');

const listDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.getDocuments({
    createdBy: req.query.created_by,
    limit: req.query.limit,
    offset: req.query.offset
  });

  return res.json({ documents });
});

const getDocument = asyncHandler(async (req, res) => {
  const document = await documentService.getDocument(req.params.id);

  if (!document) {
    return res.status(404).json({ message: 'Document not found.' });
  }

  return res.json({ document });
});

const createDocument = asyncHandler(async (req, res) => {
  const document = await documentService.createDocument({
    ...req.body,
    createdBy: req.body.created_by || req.user?.id
  });
  return res.status(201).json({ document });
});

module.exports = {
  listDocuments,
  getDocument,
  createDocument
};
