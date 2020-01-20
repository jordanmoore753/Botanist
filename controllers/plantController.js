const OAuth2 = google.auth.OAuth2;
const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const nodeMailer = require('nodemailer');
const { google } = require('googleapis');
const async = require('async');
const { pool } = require('../config.js');
const renderHelper = require('./helpers.js');
const oauth2Client = new OAuth2(process.env.C_ID, process.env.C_SEC, "https://developers.google.com/oauthplayground");

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
  // render plant search page
  // provide all filters for form
};

// GET Plant Search
exports.searchResults = [
  // sanitize all string inputs
(req, res, next) => {
  // query the trefle API
}];

// POST Plant to User Collection
exports.addPlant = [
  // sanitize date and quantity inputs
(req, res, next) => {
  // 
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