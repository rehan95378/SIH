// This service validates report data before it reaches the database.
const documentRepository = require('../repository/documentRepository');

const validateText = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
};

const getDocuments = (filters) => documentRepository.listDocuments(filters);

const getDocument = (id) => {
  validateText(id, 'Document id');
  return documentRepository.getDocumentById(id);
};

const createDocument = async ({ id, title, content, createdBy } = {}) => {
  validateText(id, 'id');
  validateText(title, 'title');
  validateText(content, 'content');

  if (createdBy !== undefined && createdBy !== null) {
    validateText(createdBy, 'createdBy');
  }

  return documentRepository.createDocument({
    id,
    title,
    content,
    createdBy
  });
};

module.exports = {
  getDocuments,
  getDocument,
  createDocument
};
