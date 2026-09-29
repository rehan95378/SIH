const axios = require('axios');
const RAGDocument = require('../models/RAGDocument');
const Report = require('../models/Report');
const DrillingEvent = require('../models/DrillingEvent');
const auditLog = require('../middleware/auditLog');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.indexDocument = async (req, res) => {
  try {
    const { documentId } = req.body;
    const report = await Report.findById(documentId).populate('wellId');
    if (!report) return res.status(404).json({ success: false, message: 'Document not found.' });

    // Only index approved content
    const approvedItems = (report.extractedData || []).filter(d => d.verificationStatus === 'APPROVED');
    if (approvedItems.length === 0 && !report.rawText) {
      return res.status(400).json({ success: false, message: 'No approved content to index.' });
    }

    try {
      const chunks = [];
      // Index raw text
      if (report.rawText) {
        const textChunks = chunkText(report.rawText, 500);
        textChunks.forEach((chunk, idx) => {
          chunks.push({
            chunk_id: `${documentId}-text-${idx}`,
            document_id: documentId,
            well_id: report.wellId?._id?.toString(),
            well_name: report.wellName,
            text: chunk,
            page_number: null,
            metadata: { report_type: report.reportType, title: report.title },
          });
        });
      }

      // Index approved extracted data
      approvedItems.forEach((item, idx) => {
        chunks.push({
          chunk_id: `${documentId}-event-${idx}`,
          document_id: documentId,
          well_id: report.wellId?._id?.toString(),
          well_name: report.wellName,
          text: `${item.eventType?.replace(/_/g, ' ') || ''} at depth ${item.depth}m in ${item.formation || 'unknown formation'}. ${item.description || ''} Mitigation: ${item.mitigation || 'Not recorded.'}`,
          page_number: item.sourcePage,
          metadata: {
            formation: item.formation,
            depth: item.depth,
            event_type: item.eventType,
            report_type: report.reportType,
            title: report.title,
          },
          is_verified: true,
        });
      });

      const response = await axios.post(`${AI_SERVICE_URL}/embed/batch`, { chunks }, { timeout: 120000 });

      // Save chunk metadata in MongoDB
      for (const chunk of chunks) {
        await RAGDocument.findOneAndUpdate(
          { chunkId: chunk.chunk_id },
          {
            documentId: documentId,
            wellId: chunk.well_id,
            wellName: chunk.well_name,
            chunkId: chunk.chunk_id,
            text: chunk.text,
            pageNumber: chunk.page_number,
            metadata: chunk.metadata,
            embeddingId: response.data.embedding_ids?.[chunk.chunk_id],
            isVerified: chunk.is_verified || false,
            indexedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      await Report.findByIdAndUpdate(documentId, { indexedInRAG: true, indexedAt: new Date() });
      await auditLog(req.user._id, 'KNOWLEDGE_INDEXED', 'Report', documentId, { chunkCount: chunks.length }, req);

      res.json({ success: true, message: `${chunks.length} chunks indexed successfully.`, chunkCount: chunks.length });
    } catch (aiErr) {
      console.error('AI indexing error:', aiErr.message);
      res.status(422).json({ success: false, message: 'AI service unavailable for indexing. Data saved to database.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Indexing failed.' });
  }
};

exports.ragSearch = async (req, res) => {
  try {
    const { query, wellId, topK = 5 } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Query required.' });

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/rag/search`, {
        query,
        well_id: wellId,
        top_k: parseInt(topK),
        verified_only: true,
      }, { timeout: 30000 });
      return res.json({ success: true, data: response.data.results || [] });
    } catch (aiErr) {
      // Fallback keyword search
      const events = await DrillingEvent.find({
        verificationStatus: 'APPROVED',
        description: { $regex: query, $options: 'i' },
      }).populate('wellId', 'wellName field').populate('sourceDocumentId', 'title').limit(10);

      return res.json({
        success: true,
        data: events.map(e => ({
          text: e.description,
          wellName: e.wellId?.wellName,
          depth: e.depth,
          formation: e.formation,
          eventType: e.eventType,
          documentTitle: e.sourceDocumentId?.title,
          page: e.sourcePage,
          relevance: 0.6,
        })),
        fallback: true,
        message: 'Using database keyword fallback (AI service unavailable).',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

exports.getRAGStatus = async (req, res) => {
  try {
    const indexedDocs = await RAGDocument.countDocuments({ isVerified: true });
    const totalChunks = await RAGDocument.countDocuments();
    const lastIndexed = await RAGDocument.findOne().sort({ indexedAt: -1 });

    let aiStatus = false;
    try {
      await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
      aiStatus = true;
    } catch {}

    res.json({
      success: true,
      data: {
        verifiedChunks: indexedDocs,
        totalChunks,
        lastIndexed: lastIndexed?.indexedAt,
        aiServiceAvailable: aiStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'RAG status check failed.' });
  }
};

function chunkText(text, chunkSize = 500) {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence + '. ';
    } else {
      current += sentence + '. ';
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());
  return chunks;
}
