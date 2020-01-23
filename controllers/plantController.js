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
  body('quantity').isInt({ min: 1, max: 1000 }).escape(),
  body('date_planted').isISO8601().toDate().escape(),
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

    function addPlant(userId, callback) {
      pool.query('INSERT INTO plants(user_id, plant_id, name, quantity, planted_date) VALUES($1, $2, $3, $4, $5)', [userId, req.body.id, req.body.name, req.body.quantity, req.body.date_planted], (err, results) => {
        if (err) {
          return res.send({
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

// GET Plant Tracker
exports.getTracker = function(req, res, next) {
  // query the database for all sightings, extract common names
  // common names enter a select dropdown list to choose from
  // no need to sanitize data
};

// GET Plant Tracker Results
exports.trackerResults = function(req, res, next) {
  // return json formatted data to asynchronously update
  // return list of all sightings for certain plant
  // include location and data for each result
};

// GET Tracked Sighting Details
exports.getSightingDetails = function(req, res, next) {
  // populate all data from row for this sighting
  // show coordinates on geolocation map
};

// GET Report Tracking
exports.getReporter = function(req, res, next) {
  // render page and form for reporting individual sighting
};

// POST Report Tracking
exports.reportSighting = [
  // ensure date is date
  // check coordinates are valid
  // sanitize all inputs
(req, res, next) => {
  // insert into sightings relation
  // redirect to tracking home
}];