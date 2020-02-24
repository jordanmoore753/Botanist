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

const redirectProfile = (req, res, next) => {
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
router.get('/login', redirectProfile, userController.getLogin);

// POST user login
router.post('/login', redirectProfile, userController.login);

// GET user registration
router.get('/register', redirectProfile, userController.getRegister);

// POST user registration
router.post('/register', redirectProfile, userController.register);

// POST user logout
router.post('/logout', redirectLogin, userController.logout);

// GET user profile
router.get('/profile', redirectLogin, userController.profile);

// GET password key form to reset password
router.get('/passwordreset', redirectProfile, userController.getPasswordReset);

// POST password key form to get key
router.post('/passwordreset/send_key', redirectProfile, userController.sendKey);

// PATCH password key form to update password
router.post('/passwordreset/update_pw', redirectProfile, userController.updatePassword);

// GET tasks for user
router.get('/tasks', redirectLogin, userController.getTasks);

// POST task, add task for user
router.post('/tasks/new', redirectLogin, userController.newTask);

// POST task, update task for user
router.post('/tasks/update/:id', redirectLogin, userController.updateTask);

// POST task, delete task for user
router.post('/tasks/delete/:id', redirectLogin, userController.deleteTask);

module.exports = router;
