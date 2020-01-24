const request = require('supertest');
const session = require('supertest-session');
const { pool } = require('../config.js');
const app = require('../app.js');

let testSession = null;

function removeUsers() {
  return pool.query('DELETE FROM users WHERE id = $1 OR 1=1', [1])
  .then(res => res)
  .catch(function(err) {
    throw err;
  });
}

async function register() {
  return await request(app).post('/register')
    .send({
      username: 'suckboot',
      email: 'suckboot32@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });
}

async function login() {
  return await testSession.post('/login')
    .send({
      email: 'suckboot32@gmail.com',
      password: 'abcdefgh1!'
    });
}

beforeEach(function() {
  testSession = session(app);
  return register();
});

afterEach(function() {
  return removeUsers();
});

describe('Redirect when profile accessed but no session data', () => {
  it('should redirect to login when not logged in', async () => {
    const res = await request(app).get('/1/profile');
    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.headers.location).toEqual('/login');
  });
});

describe('/login redirect to profile with session data', () => {
  it('should redirect to profile when logged in', async () => {
    await register();
    await login();

    const res = await testSession.get('/login');
    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.headers.location.endsWith('/profile')).toEqual(true);
  });
});

describe('/register redirect to profile with session data', () => {
  it('should redirect to profile when logged in', async () => {
    await register();
    await login();

    const res = await testSession.get('/register');
    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.headers.location.endsWith('/profile')).toEqual(true);
  });
});

describe('/register creates a new user', () => {
  it('should create a user successfully, login, redirect to profile', async () => {
    const registerRes = await request(app).post('/register')
      .send({
        username: 'bootsuck',
        email: 'suckboot32333@gmail.com',
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1!'
      });  

    expect(registerRes.statusCode).toEqual(302);
    expect(registerRes.text.includes('Redirecting to /login')).toEqual(true);

    const res = await login();

    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.headers.location.endsWith('/profile')).toEqual(true);
  });
});

describe('/register invalid data does not create new user', () => {
  it('should not create a user successfully, no login', async () => {
    await request(app).post('/register')
      .send({
        username: 'suckboot2',
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1ddd!'
      });

    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.req.finished).toEqual(true);
    expect(res.res.url).toEqual('');
  });
});

describe('/logout redirects and destroys session', () => {
  it('should redirect to index and destroy session', async () => {
    const loginRes = await login();
    const profileUrl = loginRes.header.location;
    const logoutResponse = await testSession.post('/logout');

    expect(logoutResponse.statusCode).toEqual(302);
    expect(logoutResponse.redirect).toEqual(true);
    expect(logoutResponse.headers.location).toEqual('/login');

    const res = await testSession.get('/register');
    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes('<title>Registration</title>')).toEqual(true);
  });
});

describe('reset password requires a personal key', () => {
  it('should redirect to login after getting key, only one key made', async () => {
    const res = await testSession.post('/passwordreset/send_key')
      .send({
        email: 'suckboot32@gmail.com'
      });

    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.res.text.includes('<title>Reset Password</title>'));

    const resDuplicate = await testSession.post('/passwordreset/send_key')
      .send({
        email: 'suckboot32@gmail.com'
      });

    expect(resDuplicate.statusCode).toEqual(302);
    expect(resDuplicate.redirect).toEqual(true);
    expect(resDuplicate.req.finished).toEqual(true);
  });
});