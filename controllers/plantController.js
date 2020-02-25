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
const AWS = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
const fs = require('fs');
AWS.config.region = process.env.REGION;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

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

let keyCreate = function() {
  let chars = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let l = chars.length;
  let key = '';
  let idx;

  for (let i = 0; i < 16; i += 1) {
    idx = Math.floor(Math.random() * Math.floor(l));
    key += chars[idx];
  }

  return key;
};

function unescaper(str) {
  return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x5C;/g, '\\');
}

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
  body('precipitation_minimum', 'Precipitation must be realistic number.').optional().isNumeric({ min: 0, max: 300 }).escape(),
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
  body('page').optional().isNumeric().escape(),
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

  if (req.body['page']) {
    queries += `&${req.body['page']}`;
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
  let url = 'https://trefle.io/api/plants/' + req.params.id;

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
    if (error || response.body === '"Internal server error"') {
      return res.redirect('/login');
    } 

    return res.render('add_sighting', { 
      title: 'Report Sighting',
      plant_id: req.params.id
    });   
  });
};

// exports.renderAlert = function(req, res, msg, title, view, status, type) {
//   return res.status(status).render(view, { 
//     title: title, 
//     alert: msg,
//     type: type
//   });
// };
// POST Plant Sighting
exports.addSighting = [
  body('description').isLength({ min: 10, max: 400 }).trim().escape(),
  body('lat').isNumeric().escape(),
  body('lng').isNumeric().escape(),
(req, res, next) => {
  const errors = validationResult(req);

  function verifyId(param) {
    const badChars = ['<', '>', 'b', 'm', 's', 'c', '[', ']', '{', '}', '$', '%', '&', '*', '"', 'r'];

    for (let i = 0; i < param.length; i += 1) {
      if (badChars.includes(param[i]) || param.length !== 6) {
        return false;
      }
    }

    return true;
  }

  let isIdValid = verifyId(req.params.id);
  
  if (!errors.isEmpty() || Object.keys(req.body).length !== 3 || !isIdValid) {
    return res.status(404).render('add_sighting', {
      title: 'Report Sighting',
      alert: 'Data was incorrect. Try again.',
      type: 'error'
    });
  }

  async.waterfall([
    function plantExists(callback) {
      let url = 'https://trefle.io/api/plants/' + req.params.id;

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

          return res.status(404).render('add_sighting', {
            title: 'Report Sighting',
            alert: 'Data was incorrect. Try again.',
            type: 'error'
          });
        }

        let formattedPlantData = JSON.parse(response.body);
        let name;

        if (formattedPlantData['common_name'] === null) {
          name = formattedPlantData['scientific_name'];
        } else {
          name = formattedPlantData['common_name'];
        }

        callback(null, name);
      });      
    },

    function sessionDataExists(plantName, callback) {
      pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId], (err, results) => {
        if (err || results.rows.length === 0) {
          return res.redirect('/login');
        }

        callback(null, plantName, results.rows[0].id, results.rows[0].name);
      });
    },

    function postSighting(plantName, userId, userName, callback) {
      pool.query('INSERT INTO sightings (user_id, plant_id, user_name, plant_name, lat, long, description) VALUES ($1, $2, $3, $4, $5, $6, $7)', [req.session.userId, req.params.id, userName, plantName, req.body.lat, req.body.lng, req.body.description], (err, results) => {
        if (err) {
          return res.status(404).render('add_sighting', {
            title: 'Report Sighting',
            alert: 'Data was incorrect. Try again.',
            type: 'error'
          });
        }

        callback(null);        
      });
    }
  ], function(err, results) {
    if (err) {
        return res.status(404).render('add_sighting', {
        title: 'Report Sighting',
        alert: err.msg,
        type: 'error'
      });
    }

    // session data to verify
    req.session.success = 'Successfully reported sighting.';
    return res.redirect(`/profile`);

    // REDIRECT TO VIEW SIGHTINGS FOR THAT SPECIFIC PLANT INSTEAD
  });
}];

// GET Sightings for Certain Plant
exports.getViewSighting = function(req, res, next) {
  pool.query('SELECT * FROM sightings WHERE plant_id = $1 ', [req.params.id], (err, results) => {
    if (err) {
      return res.redirect('/login');
    }

    let formattedData = [];

    results.rows.forEach(function(sighting) {
      formattedData.push({
        lat: sighting['lat'],
        lng: sighting['long'],
        userName: sighting['user_name'],
        plantName: sighting['plant_name'],
        date: moment(sighting['submit_date']).format("dddd, MMMM Do YYYY"),
        description: sighting['description']
      })
    });

    let states = ['AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 'GU', 'HI', 
                  'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 
                  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 
                  'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY' ];

    // for each object, create a DOM element to represent it in view
    return res.status(200).render('view_sightings', { title: 'Reported Sightings', sightings: formattedData, states: states });
  });
};

// POST Sightings to Fetch MapKey
exports.fetchKey = function(req, res, next) {
  return res.status(200).send({
    key: process.env.MAP_KEY
  });
};

// GET collection
exports.getCollection = function(req, res, next) {
  pool.query('SELECT * FROM plants WHERE user_id = $1', [req.session.userId], (err, results) => {
    if (err) {
      return res.redirect('/login');
    }

    let data = [];

    if (results.rows.length === 0) {
      data = 0;
    } else {
      results.rows.forEach(function(plant) {
        data.push({
          name: unescaper(plant['name']),
          plant_id: plant['plant_id']
        })
      });    
    }

    return res.status(200).render('analyze_collection', {
      title: 'Plant Analysis',
      plants: data
    });
  });
};

// POST delete plant
exports.deletePlant = [
  body('id').isNumeric({ min: 6, max: 6 }).escape(),
(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(404).send({ msg: 'The wrong plant identification number was sent.' });
  }

  pool.query('DELETE FROM plants WHERE user_id = $1 AND plant_id = $2', [req.session.userId, req.body.id], (err, results) => {
    if (err) {
      return res.status(500).send({ msg: 'Something went wrong! Contact the administrator.' });
    }

    return res.status(200).send({ msg: 'Plant successfully deleted from your collection.' });
  });
}];

// GET all field notes for given plant id
exports.getSpecificNotes = function(req, res, next) {
  pool.query('SELECT * FROM notes WHERE user_id = $1 AND plant_id = $2', [req.session.userId, req.params.id], (err, results) => {
    if (err) {
      return res.redirect('/profile');
    } else if (results.rows.length < 1) {
      return res.status(200).render('fieldnotes_for_plant', {
        title: 'Field Notes',
        notes: 0
      });
    }

    let notes = [];
    let keys = ['id', 'description', 'key', 'important', 'day'];
    let obj = {};
    let day;

    results.rows.forEach(function(note) {
      keys.forEach(function(key) {
        if (key === 'day') {
          day = moment(note['day']).format("dddd, MMMM Do YYYY");
          obj[key] = day;
        } else if (note[key]) {
          obj[key] = note[key];
        }
      });

      notes.push(obj);
      obj = {};
    });

    let sess = 0;
    let type = 0;

    if (req.session.error) {
      sess = req.session.error;
      req.session.error = null;
      type = 'error';
    } else if (req.session.success) {
      sess = req.session.success;
      req.session.success = null;
      type = 'success';
    }

    return res.render('fieldnotes_for_plant', {
      title: 'Field Notes',
      notes: notes,
      data: sess,
      type: type
    });
  });
};

// POST to add field note for plant
exports.postFieldNote = [
  body('description').trim().escape(),
  body('important').isIn(['true', 'false']).escape(),
  body('upload').isIn(['true', 'false']).escape(),
(req, res, next) => {
  const errors = validationResult(req);
  const validFileTypes = ['image/jpeg'];
  let uploadButNoFile = false;
  let fileValid = true;

  if (req.body.upload === 'true') {
    if (!req.file) { 
      fileValid = false; 
    } else {
      fileValid = validFileTypes.includes(req.file.mimetype);
    }
  }

  if (!errors.isEmpty() || fileValid === false || req.body.description === '') {
    req.session.error = 'An input was invalid. Try again.';
    return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);
  }

  let fileName = 'none';
  let bool = req.body.important === 'true' || false;

  if (req.body.upload === 'true' && req.file) {
    fileName = keyCreate();
  }

  pool.query('INSERT INTO notes (description, user_id, plant_id, key, important) VALUES ($1, $2, $3, $4, $5)', [req.body.description, req.session.userId, req.params.id, fileName, bool], (err, results) => {
    if (err) {
      req.session.error = 'Could not add the note.';
      return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);
    }

    if (fileName !== 'none') {
      const params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: fs.readFileSync(req.file.path)
      };

      s3.putObject(params, function(err, data) {
        if (err) {
          req.session.error = 'Could not add note.';
          return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);
        }
      });  
    }

    req.session.success = 'Successfully added note.';
    return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);
  });


}];

// POST to delete field note for plant
exports.deleteNote = function(req, res, next) {
  pool.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [req.params.field_id, req.session.userId], (err, results) => {
    if (err) {
      req.session.error = 'An input was invalid. Try again.';
      return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);
    }  

    req.session.success = 'Successfully deleted note.';
    return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);
  });
};

// POST to update field note for plant
exports.updateNote = [
  body('description').trim().escape(),
  body('important').isIn(['true', 'false']).escape(),
(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.session.error = 'An input was invalid. Try again.';
    return res.redirect(`/plants/fieldnotes/view/${req.params.id}`); 
  }  

  let bool = req.body.important === 'true' || false;

  async.parallel([
    function updateDescription(callback) {
      if (req.body.description) {
        pool.query('UPDATE notes SET description = $1 WHERE id = $2', [req.body.description, req.params.field_id], (err, results) => {
          if (err) {
            req.session.error = 'An input was invalid. Try again.';
            return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);     
          }

          callback(null);
        });
      } else {
        callback(null);
      }
    },

    function updateImportant(callback) {
      if (req.body.important) {
        pool.query('UPDATE notes SET important = $1 WHERE id = $2', [bool, req.params.field_id], (err, results) => {
          if (err) {
            req.session.error = 'An input was invalid. Try again.';
            return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);      
          }

          callback(null);
        });           
      } else {
        callback(null);
      }
    }
  ], function(err, results) {
    if (err) {
      req.session.error = 'An input was invalid. Try again.';
      return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);        
    }

    pool.query('SELECT * FROM notes WHERE id = $1', [req.params.field_id], (err, results) => {
      if (err) {
        req.session.error = 'An input was invalid. Try again.';
        return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);     
      }

      let lastNote = results.rows[0];
      let keys = ['id', 'description', 'key', 'important', 'day'];
      let returnNote = {};

      keys.forEach(function(property) {
        if (property === 'day') {
          returnNote.day = moment(lastNote.day).format("dddd, MMMM Do YYYY");
        } else {
          returnNote[property] = lastNote[property];
        }
      });

      req.session.success = 'Successfully updated note.';
      return res.redirect(`/plants/fieldnotes/view/${req.params.id}`);
    });
  });
}];

// GET to retrieve image
exports.getImage = function(req, res, next) {
  let params = {
    Bucket: S3_BUCKET,
    Key: undefined
  };

  if (req.params.key === 'none') {
    params['Key'] = '6385aYRaZCXxLaNa';
  } else {
    params['Key'] = req.params.key;
  } 

  s3.getObject(params, function(err, data) {
    if (err) {
      return res.send({ msg: 'An error occurred. Try again.' });      
    }

    return res.send({ body: data.Body.toString('base64') });
  });   
};