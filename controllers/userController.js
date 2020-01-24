const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const nodeMailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const async = require('async');
const { pool } = require('../config.js');
const oauth2Client = new OAuth2(process.env.C_ID, process.env.C_SEC, "https://developers.google.com/oauthplayground");
const renderHelper = require('./helpers.js');

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

let bcrypt = require('bcryptjs');
let keyCreate = function() {
  let chars = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let l = chars.length;
  let key = '';
  let idx;

  for (let i = 0; i < 26; i += 1) {
    idx = Math.floor(Math.random() * Math.floor(l));
    key += chars[idx];
  }

  return key;
};

exports.index = function(req, res, next) {
  res.render('index', { title: 'User Index' });
};

exports.profile = function(req, res, next) {
  async.parallel({
    users: function(callback) {
      pool.query('SELECT * FROM users WHERE id = $1', [req.params.id], callback);
    }
  }, function(err, results) {
    if (err) {
      return renderHelper.redirectTo(req, res, '/login', { error: 'A problem occurred while loading the user.' }, 500);
    }

    let msg = renderHelper.reassignSessionData(req, res);

    return res.render('user_profile', { 
      title: 'User Profile', 
      userInfo: results.users.rows[0],
      alert: msg.info
    });
  });
};

exports.getRegister = function(req, res, next) {
  let msg = renderHelper.reassignSessionData(req, res);
  return res.render('register', { title: 'Registration', alert: msg.info });
};

exports.register = [
  body('username')
    .trim()
    .not().isEmpty()
    .isLength({ min: 1, max: 20 })
    .escape()
    .custom(value => {
      return pool.query('SELECT * FROM users WHERE name = $1', [value]).then(user => {
        if (user.rows.length > 0) {
          return Promise.reject('Username already in use.');
        }
      });
    }),
  body('email')
    .isEmail()
    .normalizeEmail()
    .escape()
    .custom(value => {
      return pool.query('SELECT * FROM users WHERE email = $1', [value]).then(user => {
        if (user.rows.length > 0) {
          return Promise.reject('Email already in use.');
        }
      });
    }),
  body('password_conf')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match.');
      } else {
        return true;
      }
    }),
  body('password')
    .escape()
    .custom(value => {
      let symbols = '!@#$%^&*'.split('');
      let numbers = '1234567890'.split('');
      let symCount, numCount;
      [symCount, numCount] = [0, 0];

      symbols.forEach(function(char) {
        if (value.indexOf(char) !== -1) {
          symCount += 1;
        }
      });

      numbers.forEach(function(num) {
        if (value.indexOf(num) !== -1) {
          numCount += 1;
        }
      });

      if (symCount < 1 || numCount < 1 || value.length < 8) {
        throw new Error('Password must be at least 8 characters and include at least one symbol and one number.');
      } else {
        return true;
      }
    }),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return renderHelper.redirectTo(req, res, '/register', { error: 'One or some inputs were incorrectly written. Try again.' }, 404);
    }

    bcrypt.hash(req.body.password, 10).then((hash) => {
      pool.query('INSERT INTO users(name, email, password) VALUES($1, $2, $3)', [req.body.username, req.body.email, hash], (err, results) => {
        if (err) {
          return renderHelper.redirectTo(req, res, '/register', { error: 'There was an error while creating user. Contact an administrator.' }, 500);
        }

        return renderHelper.redirectTo(req, res, '/login', { success: 'Successfully created user.' }, 200);
      });      
    });

}];

exports.getLogin = function(req, res, next) {
  let msg = renderHelper.reassignSessionData(req, res);
  return res.render('login', { title: 'Login', alert: msg.info });
};

exports.login = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .escape(),
  body('password')
    .escape(),
  (req, res, next) => {

  pool.query('SELECT * FROM users WHERE email = $1', [req.body.email], (err, results) => {
    if (err || results.rows.length < 1) {
      return renderHelper.redirectTo(req, res, '/login', { error: 'No users with that email exist.' }, 404);
    } 

    bcrypt.compare(req.body.password, results.rows[0].password)
    .then(response => {
      if (response) {
        req.session.userId = results.rows[0].id;
        return renderHelper.redirectTo(req, res, `/${results.rows[0].id}/profile`, { success: 'Successfully logged in.' }, 200);
      } else {
        return renderHelper.redirectTo(req, res, '/login', { error: 'Invalid credentials.' }, 404);
      }
    })
    .catch(err => {
      return renderHelper.redirectTo(req, res, '/login', { error: 'A severe error occurred. Contact an administrator.' }, 500);
    });
  });
}];

exports.logout = function(req, res, next) {
  req.session.destroy(err => {
    if (err) {
      return renderHelper.redirectTo(req, res, '/login', { error: 'There was a problem while trying to log out.' }, 500);
    }

    res.clearCookie(process.env.SESS_NAME);
    return res.status(200).redirect('/login');
  });
};

exports.getPasswordReset = function(req, res, next) {
  let msg = renderHelper.reassignSessionData(req, res);
  return res.render('reset_pw', { title: 'Reset Password', alert: msg.info });
};

exports.updatePassword = [
  body('email_two')
    .isEmail()
    .normalizeEmail()
    .escape(),
  body('password_conf')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match.');
      } else {
        return true;
      }
    }),
  body('password')
    .escape()
    .custom(value => {
      let symbols = '!@#$%^&*'.split('');
      let numbers = '1234567890'.split('');
      let symCount, numCount;
      [symCount, numCount] = [0, 0];

      symbols.forEach(function(char) {
        if (value.indexOf(char) !== -1) {
          symCount += 1;
        }
      });

      numbers.forEach(function(num) {
        if (value.indexOf(num) !== -1) {
          numCount += 1;
        }
      });

      if (symCount < 1 || numCount < 1 || value.length < 8) {
        throw new Error('Password must be at least 8 characters and include at least one symbol and one number.');
      } else {
        return true;
      }
    }),
  body('key')
    .escape(),
(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Incorrect data provided. Check password, key, and email.' }, 404);
  }

  async.waterfall([
    function getUserId(callback) {
      pool.query('SELECT * FROM users WHERE email = $1', [req.body.email_two], (err, results) => {
        if (err || results.rows.length < 1) {
          return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'No user with that email exists.' }, 404);
        }

        callback(null, results.rows[0].id);     
      });
    },

    function checkKey(userId, callback) {
      pool.query('SELECT * FROM keys WHERE user_id = $1 AND name = $2 AND used = $3', [userId, req.body.key, false], (err, results) => {
        if (err || results.rows.length < 1) {
          return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'No key exists for that user, or the key has already been used.' }, 404);
        }

        callback(null, userId, results.rows[0].id);         
      });
    },

    function setUsed(userId, keyId, callback) {
      pool.query('UPDATE keys SET used = $1 WHERE id = $2 AND user_id = $3', [true, keyId, userId], (err, results) => {
        if (err) {
          return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Could not update the given user key to used. Try again.' }, 500);
        }

        callback(null, userId);       
      });
    },

    function patchUser(userId, callback) {
      bcrypt.hash(req.body.password, 10).then((hash) => {
        pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId], (err, results) => {
          if (err) {
            return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Could not update the password. Try again.' }, 500);
          }

          callback(null);
        });      
      });
    }

  ], function(err, results) {
    if (err) {
      return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Something (big) went horribly wrong. Sorry! Contact an administrator.' }, 500);
    }

    return renderHelper.redirectTo(req, res, '/login', { success: 'Successfully updated password.' }, 200);
  });
}];

exports.sendKey = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .escape(),

(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Some inputs were incorrectly formatted.' }, 404);
  }

  let key = keyCreate();

  async.waterfall([
    function getUserId(callback) {
      pool.query('SELECT * FROM users WHERE email = $1', [req.body.email], (err, results) => {
        if (err || results.rows.length < 1) {
          return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'No user with that email exists.' }, 404);
        } 

        callback(null, results.rows[0].id);
      });
    },

    function insertKey(id, callback) {
      pool.query('SELECT * FROM keys WHERE user_id = $1 AND used = $2', [id, false], (err, results) => {
        if (err || results.rows.length > 0) {
          return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'You already have a reset key: check your email inbox/spam folder.' }, 404);
        } 

        pool.query('INSERT INTO keys (user_id, name) VALUES ($1, $2)', [id, key], (err, results) => {
          if (err) {
            return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Some error occurred while creating a key. Contact an administrator.' }, 500);
          }

          callback(null, key);
        });
      });
    },

    function sendEmail(hash, callback) {
      let mailOptions = {
        from: 'plantdaddymail@gmail.com',
        to: req.body.email,
        subject: 'Reset Password Key',
        generateTextFromHTML: true,
        html: `<p>Here is the key for resetting your password. This key is good for one use only.</p><p>Key: <span style='color: red;'>${hash}</span></p>`
      };

      smtpTransport.sendMail(mailOptions, (error, response) => {
        if (error) {
          return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Unable to send email with key. Contact an administrator.' }, 500);
        }
        
        callback(null, smtpTransport.close());
      });
    }
  ], function(err, result) {
    if (err) {
      return renderHelper.redirectTo(req, res, '/passwordreset', { error: 'Something (big) went horribly wrong. Sorry! Contact an administrator.' }, 500);
    }

    return renderHelper.redirectTo(req, res, '/passwordreset', { success: 'Key was created and sent to the specified email address.' }, 200);
  });
}];