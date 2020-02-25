const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const nodeMailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const async = require('async');
const { pool } = require('../config.js');
const oauth2Client = new OAuth2(process.env.C_ID, process.env.C_SEC, "https://developers.google.com/oauthplayground");
const renderHelper = require('./helpers.js');
const gravatar = require('gravatar');
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
  res.render('index', { title: 'Botanist' });
};

exports.profile = function(req, res, next) {
  pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId], (err, results) => {
    if (err || results.rows.length === 0) {
      return res.redirect('/login');
    }

    let msg = renderHelper.reassignSessionData(req, res);

    return res.render('user_profile', { 
      title: 'User Profile', 
      userInfo: {
        name: results.rows[0].name,
        email: results.rows[0].email
      },
      alert: msg.info,
      type: msg.type,
      avatar: gravatar.url(results.rows[0].email,  {s: '100', r: 'x', d: 'retro'}, true)
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

    if (!errors.isEmpty() || Object.keys(req.body).length !== 4) {
      return renderHelper.renderAlert(req, res, 'One or more inputs were incorrectly written. Try again.', 'Register', 'register', 404, 'error');
    }

    bcrypt.hash(req.body.password, 10).then((hash) => {
      pool.query('INSERT INTO users(name, email, password) VALUES($1, $2, $3)', [req.body.username, req.body.email, hash], (err, results) => {
        if (err) {
          return renderHelper.renderAlert(req, res, 'There was an error while creating user. Contact an administrator.', 'Register', 'register', 500, 'error');
        }

        return renderHelper.redirectTo(req, res, '/login', { success: 'Successfully created user.' }, 200, 'success');
      });      
    });

}];

exports.getLogin = function(req, res, next) {
  let msg = renderHelper.reassignSessionData(req, res);
  return res.render('login', { title: 'Login', alert: msg.info, type: msg.type });
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
      return renderHelper.renderAlert(req, res, 'No users with that email exist.', 'Login', 'login', 404, 'error');
    } 

    bcrypt.compare(req.body.password, results.rows[0].password)
    .then(response => {
      if (response) {
        req.session.userId = results.rows[0].id;
        return renderHelper.redirectTo(req, res, `/profile`, { success: 'Successfully logged in.' }, 200, 'success');
      } else {
        return renderHelper.renderAlert(req, res, 'Invalid credentials.', 'Login', 'login', 404, 'error');
      }
    })
    .catch(err => {
      return renderHelper.renderAlert(req, res, 'A severe error occurred. Contact an administrator.', 'Login', 'login', 500, 'error');
    });
  });
}];

exports.logout = function(req, res, next) {
  req.session.destroy(err => {
    if (err) {
      return renderHelper.redirectTo(req, res, '/login', { error: 'There was a problem while trying to log out.' }, 500, 'error');
    }

    res.clearCookie(process.env.SESS_NAME);
    return res.status(200).redirect('/login');
  });
};

exports.getPasswordReset = function(req, res, next) {
  let msg = renderHelper.reassignSessionData(req, res);
  return res.render('reset_pw', { title: 'Reset Password', alert: msg.info, type: msg.type });
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
    return renderHelper.renderAlert(req, res, 'Incorrect data provided. Check password, key, and email.', 'Password Reset', 'reset_pw', 404, 'error');
  }

  async.waterfall([
    function getUserId(callback) {
      pool.query('SELECT * FROM users WHERE email = $1', [req.body.email_two], (err, results) => {
        if (err || results.rows.length < 1) {
          return renderHelper.renderAlert(req, res, 'No user with that email exists.', 'Password Reset', 'reset_pw', 404, 'error');
        }

        callback(null, results.rows[0].id);     
      });
    },

    function checkKey(userId, callback) {
      pool.query('SELECT * FROM keys WHERE user_id = $1 AND name = $2 AND used = $3', [userId, req.body.key, false], (err, results) => {
        if (err || results.rows.length < 1) {
          return renderHelper.renderAlert(req, res, 'No usable key with that name exists for that user.', 'Password Reset', 'reset_pw', 404, 'error');
        }

        callback(null, userId, results.rows[0].id);         
      });
    },

    function setUsed(userId, keyId, callback) {
      pool.query('UPDATE keys SET used = $1 WHERE id = $2 AND user_id = $3', [true, keyId, userId], (err, results) => {
        if (err) {
          return renderHelper.renderAlert(req, res, 'Could not update the given user key to used status.', 'Password Reset', 'reset_pw', 500, 'error');
        }

        callback(null, userId);       
      });
    },

    function patchUser(userId, callback) {
      bcrypt.hash(req.body.password, 10).then((hash) => {
        pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId], (err, results) => {
          if (err) {
            return renderHelper.renderAlert(req, res, 'Could not update the password.', 'Password Reset', 'reset_pw', 500, 'error');
          }

          callback(null);
        });      
      });
    }

  ], function(err, results) {
    if (err) {
      return renderHelper.renderAlert(req, res, 'Something (big) went horribly wrong. Sorry! Contact an administrator.', 'Password Reset', 'reset_pw', 500, 'error');
    }

    return renderHelper.redirectTo(req, res, '/login', { success: 'Successfully updated password.' }, 200, 'success');
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
    return renderHelper.renderAlert(req, res, 'Some inputs were incorrectly formatted.', 'Password Reset', 'reset_pw', 404, 'error');
  }

  let key = keyCreate();

  async.waterfall([
    function getUserId(callback) {
      pool.query('SELECT * FROM users WHERE email = $1', [req.body.email], (err, results) => {
        if (err || results.rows.length < 1) {
          return renderHelper.renderAlert(req, res, 'No user with that email exists.', 'Password Reset', 'reset_pw', 404, 'error');
        } 

        callback(null, results.rows[0].id);
      });
    },

    function insertKey(id, callback) {
      pool.query('SELECT * FROM keys WHERE user_id = $1 AND used = $2', [id, false], (err, results) => {
        if (err || results.rows.length > 0) {
          return renderHelper.renderAlert(req, res, 'You already have a reset key: check your spam/inbox folders.', 'Password Reset', 'reset_pw', 404, 'error');
        } 

        pool.query('INSERT INTO keys (user_id, name) VALUES ($1, $2)', [id, key], (err, results) => {
          if (err) {
            return renderHelper.renderAlert(req, res, 'Some error occured while creating a key. Contact an administrator.', 'Password Reset', 'reset_pw', 500, 'error');
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
          return renderHelper.renderAlert(req, res, 'Unable to send email with key. Contact administrator.', 'Password Reset', 'reset_pw', 500, 'error');
        }
        
        callback(null, smtpTransport.close());
      });
    }
  ], function(err, result) {
    if (err) {
      return renderHelper.renderAlert(req, res, 'Something (big) went horribly wrong. Sorry! Contact an administrator.', 'Password Reset', 'reset_pw', 500, 'error');
    }

    return renderHelper.redirectTo(req, res, '/passwordreset', { success: 'Key was created and sent to the specified email address.' }, 200, 'success');
  });
}];

exports.getTasks = function(req, res, next) {
  pool.query('SELECT * FROM tasks WHERE user_id = $1', [req.session.userId], (err, results) => {
    if (err) {
      return res.render('tasks', { title: 'Tasks', tasks: 0 });
    }

    let tasks = [];

    results.rows.forEach(function(task) {
      tasks.push({
        description: task.description,
        title: task.title,
        due_date: moment(task.due_date).format("dddd, MMMM Do YYYY"),
        urgent: task.urgent,
        difficulty: task.difficulty,
        id: task.id
      });
    });

    return res.render('tasks', { title: 'Tasks', tasks: tasks });
  });
};

exports.newTask = [
  body('description').isLength({ min: 10, max: 1000 }).escape(),
  body('title').isLength({ min: 1, max: 30 }).escape(),
  body('due_date').isISO8601().escape(),
  body('urgent').isIn(['true', 'false']).escape(),
  body('difficulty').isIn(['easy', 'medium', 'hard']).escape(),
(req, res, next) => {
  const errors = validationResult(req);
  let bool = false;

  if (req.body.urgent === 'true') {
    bool = true;
  }

  if (!errors.isEmpty()) {
    return res.status(404).send({
      success: false,
      msg: 'There was a problem with some inputs. Try again.'
    });
  }

  pool.query('INSERT INTO tasks(title, description, due_date, urgent, difficulty, user_id) VALUES($1, $2, $3, $4, $5, $6)', [req.body.title, req.body.description, req.body.due_date, req.body.urgent, req.body.difficulty, req.session.userId], (err, results) => {
    if (err) {
      return res.status(404).send({
        success: false,
        msg: 'There was a problem while creating the task. Contact the admin.'
      });
    }

    return res.status(200).send({
      success: true,
      msg: {
        description: req.body.description,
        title: req.body.title,
        due_date: moment(req.due_date).format("dddd, MMMM Do YYYY"),
        urgent: req.body.urgent,
        difficulty: req.body.difficulty
      }
    });
  });
}];

exports.updateTask = [
  body('description').optional().isLength({ min: 10, max: 500 }).escape(),
  body('title').optional().isLength({ min: 1, max: 30 }).escape(),
  body('due_date').optional().isISO8601().escape(),
(req, res, next) => {
  const goodKeys = ['description', 'title', 'due_date', 'urgent', 'difficulty'];
  let keys = Object.keys(req.body);
  let goodKeysOnly = true;

  for (let i = 0; i < keys.length; i += 1) {
    if (!goodKeys.includes(keys[i])) {
      goodKeysOnly = false;
      break;
    }
  }

  const errors = validationResult(req);

  if (!errors.isEmpty() || !goodKeysOnly) {
    return res.status(404).send({
      success: false,
      msg: 'Could not update. There was a problem with an input.'
    });
  } 

  let bool = false;

  if (req.body.urgent === 'true') {
    bool = true;
  }

  async.series([
    function updateDescription(callback) {
      if (req.body.description) {
        pool.query('UPDATE tasks SET description = $1 WHERE id = $2', [req.body.description, req.params.id], (err, results) => {
          if (err) {
            return res.status(404).send({
              success: false,
              msg: 'There was a problem with the description input.'
            });
          }

          callback(null);
        });
      } else {
        callback(null);
      }
    },

    function updateTitle(callback) {
      if (req.body.title) {
        pool.query('UPDATE tasks SET title = $1 WHERE id = $2', [req.body.title, req.params.id], (err, results) => {
          if (err) {
            return res.status(404).send({
              success: false,
              msg: 'There was a problem with the title input.'
            });
          }

          callback(null);
        });
      } else {
        callback(null);
      }
    },

    function updateDate(callback) {
      if (req.body.due_date) {
        pool.query('UPDATE tasks SET due_date = $1 WHERE id = $2', [req.body.due_date, req.params.id], (err, results) => {
          if (err) {
            return res.status(404).send({
              success: false,
              msg: 'There was a problem with the date input.'
            });
          }

          callback(null);
        });
      } else {
        callback(null);
      }


    }
  ], function(err, results) {
    if (err) {
      return res.status(404).send({
        success: false,
        msg: 'Could not perform one of the updates.'
      });
    }

    // success! updated. return the task from db using req.params.id
    pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId], (err, results) => {
      if (err) {
        return res.status(404).send({
          success: false,
          msg: 'Could not return the task from the database.'
        });
      }

      let s = results.rows[0];

      return res.status(200).send({
        success: true,
        msg: {
          description: s.description,
          title: s.title,
          due_date: moment(s.due_date).format("dddd, MMMM Do YYYY"),
          difficulty: s.difficulty,
          urgent: s.urgent,
          id: s.id
        }
      });
    });
  });
}];

exports.deleteTask = function(req, res, next) {
  pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId], (err, results) => {
    if (err) {
      return res.status(404).send({
        success: false,
        msg: 'Task could not be marked finished.'
      });
    }

    return res.status(200).send({
      success: true,
      msg: 'Task successfully marked finished and removed.'
    });
  });
};