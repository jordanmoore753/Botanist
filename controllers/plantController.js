const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const nodeMailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const async = require('async');
const { pool } = require('../config.js');
const renderHelper = require('./helpers.js');
const oauth2Client = new OAuth2(process.env.C_ID, process.env.C_SEC, "https://developers.google.com/oauthplayground");
const https = require('https');
const request = require('request');
const moment = require('moment');

oauth2Client.setCredentials({
  refresh_token: process.env.R_TOK
});

let accessToken = oauth2Client.getAccessToken();
let smtpTransport = nodeMailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'plantdaddymail@gmail.com',
    clientId: process.env.C_ID,
    clientSecret: process.env.C_SEC,
    refreshToken: process.env.R_TOK,
    accessToken: accessToken
  }
});

// GET Plant Index
exports.index = function(req, res, next) {
  res.render('plant_index', { title: 'Plant Options' });
};

// GET Plant Search
exports.getSearch = function(req, res, next) {
  res.render('plant_search', { title: 'Plant Search' });
};

// POST Plant Search
exports.searchResults = [
  body('common_name', 'Length can be less than 20 characters.').optional().isLength({ min: 2, max: 20 }).trim().escape(),
  body('scientific_name', 'Length can be less than 25 characters.').optional().isLength({ min: 2, max: 25 }).trim().escape(),
  body('resprout_ability', 'Must be one of valid options.').optional().isIn(['true', 'false']).trim().escape(),
  body('fruit_conspicuous', 'Must be one of valid options.').optional().isIn(['true', 'false']).trim().escape(),
  body('flower_conspicuous', 'Must be one of valid options.').optional().isIn(['true', 'false']).trim().escape(),
  body('precipitation_minimum', 'Precipitation must be realistic number.').optional().isNumeric({ min: 0, max: 200 }).escape(),
  body('temperature_minimum', 'Temperature is in Farenheit.').optional().isNumeric({ min: 0, max: 200 }).escape(),
  body('growth_rate', 'Must be one of valid options.').optional().isIn(['Rapid', 'Slow', 'Moderate']).trim().escape(),
  body('bloom_period', 'Must be one of valid options.').optional().isIn(['Spring', 'Summer', 'Winter', 'Fall']).trim().escape(),
  body('active_growth_period', 'Must be one of valid options.').optional().isIn(['Spring', 'Summer', 'Winter', 'Fall']).trim().escape(),
  body('shade_tolerance', 'Must be one of valid options.').optional().isIn(['Tolerant', 'Intolerant', 'Intermediate']).trim().escape(),
  body('drought_tolerance', 'Must be one of valid options.').optional().isIn(['Low', 'Medium', 'High']).trim().escape(),
  body('moisture_use', 'Must be one of valid options.').optional().isIn(['Low', 'Medium', 'High']).trim().escape(),
  body('protein_potential', 'Must be one of valid options.').optional().isIn(['Low', 'Medium', 'High']).trim().escape(),
  body('fruit_seed_abundance', 'Must be one of valid options.').optional().isIn(['Low', 'Medium', 'High']).trim().escape(),
  body('palatable_human', 'Must be one of valid options.').optional().isIn(['true', 'false']).trim().escape(),
  body('fruit_seed_color', 'Choose a real, valid color.').optional().isLength({ min: 3, max: 15 }).trim().escape(),

(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.send(errors);
    // return errors to populate on screen
  }

  let params = Object.keys(req.body);
  let queryString = 'https://trefle.io/api/plants?complete_data=true';
  let queries = [];

  params.forEach(function(param) {
    queries.push(param + '=' + req.body[param]);
  });

  queries = queries.join('&');

  if (queries.length > 0) {
    queryString += '&';
  }

  request({
    method: 'GET',
    auth: {
      'user': null,
      'pass': null,
      'sendImmediately': true,
      'bearer': process.env.TREFLE_ID
    },
    url: queryString + queries
  }, function(error, response, body) {
    if (error) {
      return res.send(error.msg);
    }

    return res.send({
      response: response,
      body: body
    });
  });
  // query the trefle API
  // return trefle results as Promise to be rendered by client side
}];

// POST info to GET plant data for a single plant
exports.singlePlantResults = [
  body('id', 'Must be 6-digit number').isLength({ min: 6, max: 6 }).isNumeric().trim().escape(),
(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.send({
      errors: errors.errors
    });
  }

  let url = 'https://trefle.io/api/plants/' + req.body.id;

  request({
    method: 'GET',
    auth: {
      'user': null,
      'pass': null,
      'sendImmediately': true,
      'bearer': process.env.TREFLE_ID
    },
    url: url
  }, function(error, response, body) {
    if (error) {
      return res.send(error.msg);
    }

    return res.send({
      response: response,
      body: body
    });
  });
}];

// POST Plant to User Collection
exports.addPlant = [
  body('id', 'Must be 6-digit number').isLength({ min: 6, max: 6 }).isNumeric().trim().escape(),
  body('name').isLength({ min: 2, max: 45 }).trim().escape(),
  // sanitize date and quantity inputs
(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.send({
      msg: 'Inputs were improperly formatted.'
    });
  } else if (!req.session.userId) {
    return res.send({
      msg: 'You are not logged in.'
    });    
  }

  let userId;

  async.waterfall([
    function getUserId(callback) {
      pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId], (err, results) => {
        if (err) {
          return res.send({
            msg: 'User does not exist; could not add plant.'
          });
        }

        callback(null, results.rows[0].id);
      });   
    },

    function checkPlantExists(userId, callback) {
      pool.query('SELECT * FROM plants WHERE user_id = $1 AND plant_id = $2', [userId, req.body.id], (err, results) => {
        if (err || results.rows.length > 0) {
          return res.send({
            msg: 'Plant already added to your collection.'
          });
        }

        callback(null, userId);
      });
    },

    function addPlant(userId, callback) {
      pool.query('INSERT INTO plants(user_id, plant_id, name) VALUES($1, $2, $3)', [userId, req.body.id, req.body.name], (err, results) => {
        if (err) {
          return res.status(404).send({
            msg: 'Plant could not be added.'
          });
        }

        callback(null);    
      });
    }
  ], function(err, results) {
    if (err) {
      return res.send({
        msg: err
      });
    }

    return res.send({
      msg: 'Successfully added plant to your collection.'
    });
  });


  // insert row into crops or houseplants relation
  // return a promise to be handled by Fetch on client side
}];

// GET Plant Sighting Add Page
exports.getAddSighting = function(req, res, next) {
  return res.render('add_sighting', { 
    title: 'Report Sighting',
    plant_id: req.params.id
  });
  // render
};

// POST Plant Sighting
exports.addSighting = [
  body('description').isLength({ min: 10, max: 400 }).trim().escape(),
  body('plant_id').isNumeric().escape(),
  body('lat').isNumeric().escape(),
  body('lng').isNumeric().escape(),
(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('add_sighting', {
      title: 'Report Sighting',
      msg: 'Data was incorrect. Try again.'
    });
  }

  async.waterfall([
    function plantExists(callback) {
      let url = 'https://trefle.io/api/plants/' + req.body.plant_id;

      request({
        method: 'GET',
        auth: {
          'user': null,
          'pass': null,
          'sendImmediately': true,
          'bearer': process.env.TREFLE_ID
        },
        url: url
      }, function(error, response, body) {
        if (error) {
          return res.render('add_sighting', {
            title: 'Report Sighting',
            msg: 'Data was incorrect. Try again.'
          });
        }

        callback(null);
      });      
    },

    function sessionDataExists(callback) {
      pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId], (err, results) => {
        if (err || results.rows.length === 0) {
          return res.redirect('/login');
        }

        callback(null, results.rows[0].id);
      });
    },

    function postSighting(userId, callback) {
      pool.query('INSERT INTO sightings (user_id, plant_id, lat, long, description) VALUES ($1, $2, $3, $4, $5)', [req.session.userId, req.body.plant_id, req.body.lat, req.body.lng, req.body.description], (err, results) => {
        if (err) {
          return res.render('add_sighting', {
            title: 'Report Sighting',
            msg: 'Some data was invalid or missing. Try again.'
          });
        }

        callback(null);        
      });
    }
  ], function(err, results) {
    if (err) {
      return res.render('add_sighting', {
        title: 'Report Sighting',
        msg: err
      });
    }

    // session data to verify
    req.session.success = 'Successfully reported sighting.';
    return res.redirect(`/${req.session.userId}/profile`);
  });
}];

// GET Sightings for Certain Plant
exports.getViewSighting = function(req, res, next) {
  // render
};

// refactor DB to hold only plants with no date or quantity
// allow favoriting (a boolean)
// refactor form to not take quantity or date planted, only id and name