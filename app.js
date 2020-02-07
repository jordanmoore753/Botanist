const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const Redis = require('ioredis');
const favicon = require('serve-favicon');
const RedisStore = require('connect-redis')(session);
const helmet = require('helmet');
const compression = require('compression');
const { pool } = require('./config.js');

const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// routing
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const plantsRouter = require('./routes/plants');

const app = express();

let client = new Redis(process.env.REDIS_URL);

let store = new RedisStore({ client });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(
  session({
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESS_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60,
      sameSite: true, 
    },
    store: new RedisStore({ client })
  })
);

app.use(compression());
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', usersRouter);
app.use('/plants', plantsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  if (req.app.get('env') === 'development' || req.app.get('env') === 'test') {
    res.status(err.status || 500);
    return res.render('error');
  } else {
    return res.redirect('/login');
  }
});

module.exports = app;
