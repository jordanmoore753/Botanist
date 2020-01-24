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

// POST plant search results ASYNC
router.post('/search_results', plantController.searchResults);

// POST plant information for one ASYNC
router.post('/search_single_plant', plantController.singlePlantResults);

// POST plant to user collection ASYNC
router.post('/search/add_plant', plantController.addPlant);

// GET plant add sighting
router.get('/sightings/add/:id', redirectLogin, plantController.getAddSighting);

// POST plant add sighting
router.post('/sightings/add/:id', redirectLogin, plantController.addSighting);

// GET plant view sighting
router.get('/sightings/view/:id', plantController.getViewSighting);

module.exports = router;
