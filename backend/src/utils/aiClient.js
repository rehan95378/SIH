// This client supports an optional AI service and a local rule-based MVP.
// The local mode keeps the backend usable while the separate AI teammate
// connects a trained model to the same response contract.
const normaliseWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const slug = (value) => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const localExtract = (documentId, content) => {
  const entities = [];
  const seen = new Set();
  const addEntity = (type, name, confidence) => {
    const cleanName = normaliseWhitespace(name).replace(/[.,;:]+$/, '');
    const key = `${type}:${cleanName.toLowerCase()}`;
    if (!cleanName || seen.has(key)) return;

    seen.add(key);
    entities.push({
      id: `${documentId}-${slug(type)}-${slug(cleanName)}`,
      type,
      name: cleanName,
      source_document_id: documentId,
      confidence
    });
  };

  for (const value of content.match(/\+?\d[\d\s().-]{7,}\d/g) || []) {
    addEntity('phone', value, 0.98);
  }

  for (const value of content.match(/\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}\b/gi) || []) {
    addEntity('vehicle', value.toUpperCase(), 0.95);
  }

  const organisationPattern = /\b[A-Z][\w&]*(?:\s+[A-Z][\w&]*){0,5}\s+(?:Logistics|Industries|Corporation|Corp|Company|Ltd|Limited|Organization|Organisation)\b/g;
  for (const value of content.match(organisationPattern) || []) {
    addEntity('organization', value, 0.9);
  }

  const locationPattern = /\b(?:near|at|in|from)\s+([A-Z][\w-]*(?:\s+[A-Z][\w-]*){0,3})/g;
  for (const match of content.matchAll(locationPattern)) {
    addEntity('location', match[1], 0.78);
  }

  const personPattern = /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g;
  for (const value of content.match(personPattern) || []) {
    if (!['The', 'A', 'An', 'This', 'Report', 'Near', 'At', 'In', 'From'].includes(value)) {
      addEntity('person', value, 0.7);
    }
  }

  const relationships = [];
  for (let sourceIndex = 0; sourceIndex < entities.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < entities.length; targetIndex += 1) {
      relationships.push({
        id: `${documentId}-edge-${sourceIndex}-${targetIndex}`,
        source: entities[sourceIndex].id,
        target: entities[targetIndex].id,
        relationship_type: 'co_occurs',
        source_document_id: documentId
      });
    }
  }

  return {
    status: 'local_rule_based',
    document_id: documentId,
    entities,
    relationships
  };
};

const callRemoteModel = async (url, documentId, content) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, content }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`AI service returned HTTP ${response.status}.`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const callAiModel = async ({ documentId, content }) => {
  if (typeof documentId !== 'string' || documentId.trim() === '') {
    throw new Error('documentId must be a non-empty string.');
  }

  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('content must be a non-empty string.');
  }

  if (process.env.AI_SERVICE_URL) {
    return callRemoteModel(process.env.AI_SERVICE_URL, documentId, content);
  }

  return localExtract(documentId, content);
};

module.exports = { callAiModel, localExtract };
