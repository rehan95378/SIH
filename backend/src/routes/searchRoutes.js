// Routes for searching the crime network by term or entity.
const express = require('express');
const { search } = require('../controllers/searchController');
const router = express.Router();

router.get('/search', search);

module.exports = router;
