const express = require('express');
const router = express.Router();
const { pool } = require('../config.js');
const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  } else {
    return next();
  }
};

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId], (err, results) => {
      if (err) {
        throw err;
      }

      return res.redirect(`/profile`);
    });
  } else {
    return next();
  }
};

const userController = require('../controllers/userController.js');

// GET index
router.get('/', userController.index);

// GET user login
router.get('/login', redirectHome, userController.getLogin);

// POST user login
router.post('/login', redirectHome, userController.login);

// GET user registration
router.get('/register', redirectHome, userController.getRegister);

// POST user registration
router.post('/register', redirectHome, userController.register);

// POST user logout
router.post('/logout', redirectLogin, userController.logout);

// GET user profile
router.get('/profile', redirectLogin, userController.profile);

// GET password key form to reset password
router.get('/passwordreset', redirectHome, userController.getPasswordReset);

// POST password key form to get key
router.post('/passwordreset/send_key', redirectHome, userController.sendKey);

// PATCH password key form to update password
router.post('/passwordreset/update_pw', redirectHome, userController.updatePassword);



module.exports = router;
