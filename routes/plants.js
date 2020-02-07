const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../config.js');

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    next();
  }
};

const redirectProfile = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/profile')
  } else {
    return res.redirect('/login');
  }
};

const plantController = require('../controllers/plantController.js');

let upload = multer({ dest: 'uploads/' });

// GET index
router.get('/', redirectProfile, plantController.index);

// GET plant search
router.get('/search', redirectLogin, plantController.getSearch);

// POST plant search results ASYNC
router.post('/search_results', redirectLogin, plantController.searchResults);

// POST plant information for one ASYNC
router.post('/search_single_plant', redirectLogin, plantController.singlePlantResults);

// POST plant to user collection ASYNC
router.post('/search/add_plant', redirectLogin, plantController.addPlant);

// GET plant add sighting
router.get('/sightings/add/:id', redirectLogin, plantController.getAddSighting);

// POST plant add sighting
router.post('/sightings/add/:id', redirectLogin, plantController.addSighting);

// GET plant view sighting
router.get('/sightings/view/:id', redirectLogin, plantController.getViewSighting);

// GET plant analysis
router.get('/analysis/collection', redirectLogin, plantController.getCollection);

// POST plant delete from collection
router.post('/analysis/collection', redirectLogin, plantController.deletePlant);

// GET field notes for a given plant
router.get('/fieldnotes/view/:id', redirectLogin, plantController.getSpecificNotes);

// GET for field note picture
router.get('/fieldnotes/pictures/:key', redirectLogin, plantController.getImage);

// POST plant field note
router.post('/fieldnotes/add/:id', redirectLogin, upload.single('image_file'), plantController.postFieldNote);

// POST delete plant specific field note
router.post('/fieldnotes/view/:id/delete/:field_id', redirectLogin, plantController.deleteNote);

// POST update plant specific field note
router.post('/fieldnotes/view/:id/update/:field_id', redirectLogin, plantController.updateNote);

module.exports = router;
