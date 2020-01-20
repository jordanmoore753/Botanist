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

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId], (err, results) => {
      if (err) {
        throw err;
      }

      return res.redirect(`/${results.rows[0].id}/profile`);
    });
  } else {
    next();
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

// GET password key form to reset password
router.get('/passwordreset', redirectHome, userController.getPasswordReset);

// POST password key form to get key
router.post('/passwordreset', redirectHome, userController.sendKey);

// PATCH password key form to update password
router.patch('/passwordreset', redirectHome, userController.updatePassword);

// GET user profile
router.get('/:id/profile', redirectLogin, userController.profile);

module.exports = router;
