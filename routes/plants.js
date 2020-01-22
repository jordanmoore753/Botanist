const express = require('express');
const router = express.Router();
const { pool } = require('../config.js');

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    next();
  }
};

const plantController = require('../controllers/plantController.js');

// GET index
router.get('/', plantController.index);

// GET plant search
router.get('/search', plantController.getSearch);

// GET plant search results
router.get('/search_form', plantController.searchResults);

// POST plant to user collection
router.post('/search', plantController.addPlant);

// GET plant tracker
router.get('/tracker', plantController.getTracker);

// GET plant tracker results
router.get('/tracker/:name/results', plantController.trackerResults);

// GET plant sighting details
router.get('/tracker/:name/results/:id', plantController.getSightingDetails);

// GET plant reporting 
router.get('/tracker/:name/report', plantController.getReporter);

// POST plant reporting
router.post('/tracker/:name/report', plantController.reportSighting);

module.exports = router;
