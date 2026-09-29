const path = require('path');
const fs = require('fs');
const axios = require('axios');
const multer = require('multer');
const Report = require('../models/Report');
const RAGDocument = require('../models/RAGDocument');
const DrillingEvent = require('../models/DrillingEvent');
const Well = require('../models/Well');
const auditLog = require('../middleware/auditLog');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed.'), false);
};

exports.upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });

    const { wellId, wellName, title, reportType } = req.body;
    let resolvedWellName = wellName;

    if (wellId) {
      const well = await Well.findById(wellId);
      if (well) resolvedWellName = well.wellName;
    }

    const report = await Report.create({
      title: title || req.file.originalname.replace('.pdf', ''),
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      wellId: wellId || null,
      wellName: resolvedWellName,
      reportType: reportType || 'OTHER',
      uploadedBy: req.user._id,
      extractionStatus: 'PENDING',
      verificationStatus: 'PENDING_REVIEW',
      sourceMetadata: { originalName: req.file.originalname, uploadIp: req.ip },
    });

    await auditLog(req.user._id, 'REPORT_UPLOADED', 'Report', report._id, { fileName: req.file.originalname }, req);
    res.status(201).json({ success: true, data: report, message: 'Report uploaded. Ready for AI extraction.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to upload report.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { wellId, verificationStatus, extractionStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (wellId) filter.wellId = wellId;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (extractionStatus) filter.extractionStatus = extractionStatus;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate('wellId', 'wellName field')
      .populate('uploadedBy', 'name email')
      .select('-rawText')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: reports, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('wellId', 'wellName field latitude longitude')
      .populate('uploadedBy', 'name email');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report.' });
  }
};

exports.processReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('wellId');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    await Report.findByIdAndUpdate(req.params.id, { extractionStatus: 'PROCESSING' });

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    let extractedData = [];
    let rawText = '';
    let pageCount = 0;

    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fs.createReadStream(report.filePath), { filename: report.fileName, contentType: 'application/pdf' });
      form.append('well_name', report.wellName || '');
      form.append('report_type', report.reportType || 'OTHER');

      const response = await axios.post(`${aiServiceUrl}/extract-report`, form, {
        headers: form.getHeaders(),
        timeout: 120000,
      });

      extractedData = response.data.extracted_events || [];
      rawText = response.data.raw_text || '';
      pageCount = response.data.page_count || 0;
    } catch (aiError) {
      console.error('AI service error, using fallback:', aiError.message);
      // Fallback: minimal extraction
      extractedData = [];
    }

    const processedData = extractedData.map(item => ({
      eventType: item.event_type || 'OTHER',
      depth: item.depth,
      formation: item.formation,
      severity: item.severity || 'MEDIUM',
      description: item.description,
      mitigation: item.mitigation,
      sourcePage: item.page_number,
      confidence: item.confidence || 0.7,
      verificationStatus: 'PENDING',
    }));

    await Report.findByIdAndUpdate(req.params.id, {
      extractionStatus: 'COMPLETED',
      extractedData: processedData,
      rawText: rawText.substring(0, 50000),
      pageCount,
    });

    await auditLog(req.user._id, 'REPORT_PROCESSED', 'Report', report._id, { eventCount: processedData.length }, req);

    const updatedReport = await Report.findById(req.params.id);
    res.json({ success: true, data: updatedReport, message: `Extraction complete. ${processedData.length} events found.` });
  } catch (error) {
    await Report.findByIdAndUpdate(req.params.id, { extractionStatus: 'FAILED' });
    console.error(error);
    res.status(500).json({ success: false, message: 'Report processing failed.' });
  }
};

exports.approveExtractedItem = async (req, res) => {
  try {
    const { itemId, editedData } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const item = report.extractedData.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Extracted item not found.' });

    // Apply edits if provided
    if (editedData) {
      Object.assign(item, editedData);
    }

    item.verificationStatus = 'APPROVED';
    item.verifiedBy = req.user._id;
    item.verifiedAt = new Date();
    await report.save();

    // Create verified drilling event
    if (report.wellId) {
      const existingEvent = await DrillingEvent.findOne({
        wellId: report.wellId,
        depth: item.depth,
        eventType: item.eventType,
        sourceDocumentId: report._id,
      });

      if (!existingEvent) {
        const newEvent = await DrillingEvent.create({
          wellId: report.wellId,
          eventType: item.eventType,
          depth: item.depth,
          formation: item.formation,
          severity: item.severity,
          description: item.description,
          mitigation: item.mitigation,
          sourceDocumentId: report._id,
          sourcePage: item.sourcePage,
          verificationStatus: 'APPROVED',
          createdBy: req.user._id,
          verifiedBy: req.user._id,
          verifiedAt: new Date(),
        });
      }
    }

    // Index in RAG via AI service
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      await axios.post(`${aiServiceUrl}/embed`, {
        document_id: report._id.toString(),
        well_id: report.wellId ? report.wellId.toString() : null,
        well_name: report.wellName,
        text: `${item.description} ${item.mitigation || ''}`.trim(),
        page_number: item.sourcePage,
        metadata: {
          formation: item.formation,
          depth: item.depth,
          event_type: item.eventType,
          report_type: report.reportType,
          title: report.title,
        },
      }, { timeout: 30000 });
    } catch (embErr) {
      console.error('RAG indexing error (non-fatal):', embErr.message);
    }

    await Report.findByIdAndUpdate(req.params.id, {
      verificationStatus: report.extractedData.every(d => d.verificationStatus !== 'PENDING') ? 'FULLY_APPROVED' : 'PARTIALLY_APPROVED',
    });

    await auditLog(req.user._id, 'DATA_APPROVED', 'Report', report._id, { itemId, eventType: item.eventType }, req);
    res.json({ success: true, data: report, message: 'Item approved and knowledge base updated.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to approve item.' });
  }
};

exports.rejectExtractedItem = async (req, res) => {
  try {
    const { itemId, reason } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const item = report.extractedData.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.verificationStatus = 'REJECTED';
    item.adminNotes = reason;
    item.verifiedBy = req.user._id;
    item.verifiedAt = new Date();
    await report.save();

    await auditLog(req.user._id, 'DATA_REJECTED', 'Report', report._id, { itemId, reason }, req);
    res.json({ success: true, data: report, message: 'Item rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject item.' });
  }
};

exports.getReportFile = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (!fs.existsSync(report.filePath)) return res.status(404).json({ success: false, message: 'File not found on server.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${report.fileName}"`);
    fs.createReadStream(report.filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to serve file.' });
  }
};
