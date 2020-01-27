const request = require('supertest');
const session = require('supertest-session');
const { pool } = require('../config.js');
const app = require('../app.js');

let testSession = null;

function removeUsers() {
  return pool.query('DELETE FROM users WHERE email = $1', ['suckboot32@gmail.com'])
  .then(function(res) {
    return res;
  })
  .catch(function(err) {
    throw err;
  });
}

function removeKeys() {
  return pool.query('DELETE FROM keys WHERE id = $1 OR 1=1', [1])
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
    await login();

    const res = await testSession.get('/login');
    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.headers.location.endsWith('/profile')).toEqual(true);
  });
});

describe('/login with non-existent email', () => {
  it('should not redirect to profile', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'kentucky@gmail.com',
        password: 'yessir1!@@@'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
    expect(res.text.includes('<p class="alert">No users with that email exist.</p>'))
  });
});

describe('/login with incorrect password', () => {
  it('should not redirect to profile', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot32@gmail.com',
        password: 'yessir1!@@@'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
    expect(res.text.includes('<p class="alert">Invalid credentials.</p>'))
  });
});

describe('/register redirect to profile with session data', () => {
  it('should redirect to profile when logged in', async () => {
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

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
    expect(res.req.finished).toEqual(true);
    expect(res.text.includes('<p class="alert">No users with that email exist.</p>')).toEqual(true);
  });
});

describe('/register too many params does not create new user', () => {
  it('should not create a user successfully, return 404', async () => {
    const res = await request(app).post('/register')
      .send({
        username: 'suck',
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1!',
        random: '<script>console.log(true);</script>'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
    expect(res.req.finished).toEqual(true);
    expect(res.text.includes('<p class="alert">One or more inputs were incorrectly written. Try again.</p>')).toEqual(true);
  });
});

describe('/register too few params does not create new user', () => {
  it('should not create a user successfully, return 404', async () => {
    const res = await testSession.post('/register')
      .send({
        username: 'suck',
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
    expect(res.req.finished).toEqual(true);
    expect(res.text.includes('<p class="alert">One or more inputs were incorrectly written. Try again.</p>')).toEqual(true);
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

describe('/logout redirects and destroys session', () => {
  it('should redirect to login if there is an error', async () => {
    const logoutResponse = await testSession.post('/logout');

    expect(logoutResponse.statusCode).toEqual(302);
    expect(logoutResponse.redirect).toEqual(true);
    expect(logoutResponse.headers.location).toEqual('/login');
  });
});

describe('reset password requires a personal key', () => {
  it('should redirect to login after getting key, only one key made no duplicate sent', async () => {
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

    expect(resDuplicate.statusCode).toEqual(404);
    expect(resDuplicate.redirect).toEqual(false);
    expect(resDuplicate.text.includes('<p class="alert">You already have a reset key: check your spam/inbox folders.</p>')).toEqual(true);
  });
});

describe('reset password requires a personal key', () => {
  it('should redirect to login after getting key, only one key made no duplicate sent', async () => {
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

    expect(resDuplicate.statusCode).toEqual(404);
    expect(resDuplicate.redirect).toEqual(false);
    expect(resDuplicate.text.includes('<p class="alert">You already have a reset key: check your spam/inbox folders.</p>')).toEqual(true);
  });
});

describe('reset password requires a valid key, pw, pw_conf, email', () => {
  it('should not reset password with invalid key, password, or password_conf', async () => {
    await removeKeys();
    const res = await testSession.post('/passwordreset/send_key')
      .send({
        email: 'suckboot32@gmail.com'
      });

    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.text.includes('Found. Redirecting to /passwordreset')).toEqual(true);

    let key;

    pool.query('SELECT * FROM keys')
    .then(function(results) {
      key = results.rows[0].name;
    })
    .catch(function(err) {
      throw err;
    });


    const resetResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot32@gmail.com',
        key: 'fdjafklfjdl',
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1!'
      }); 

    expect(resetResponse.statusCode).toEqual(404);
    expect(resetResponse.redirect).toEqual(false);
    expect(resetResponse.text.includes('<p class="alert">No usable key with that name exists for that user.</p>')).toEqual(true);

    const passwordResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot32@gmail.com',
        key: key,
        password: 'abcdefgh1',
        password_conf: 'abcdefgh1!'
      }); 

    expect(passwordResponse.statusCode).toEqual(404);
    expect(passwordResponse.redirect).toEqual(false);
    expect(passwordResponse.text.includes('<p class="alert">Incorrect data provided. Check password, key, and email.</p>')).toEqual(true);

    const passwordConfResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot32@gmail.com',
        key: key,
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1'
      }); 

    expect(passwordConfResponse.statusCode).toEqual(404);
    expect(passwordConfResponse.redirect).toEqual(false);
    expect(passwordConfResponse.text.includes('<p class="alert">Incorrect data provided. Check password, key, and email.</p>')).toEqual(true);

    const emailResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot323@gmail.com',
        key: key,
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1!'
      }); 

    expect(emailResponse.statusCode).toEqual(404);
    expect(emailResponse.redirect).toEqual(false);
    expect(emailResponse.text.includes('<p class="alert">No user with that email exists.</p>')).toEqual(true);
  });
}); 

describe('valid information allows for password reset', () => {
  it('should reset password when valid information is POSTed', async () => {
    await removeKeys();
    const res = await testSession.post('/passwordreset/send_key')
      .send({
        email: 'suckboot32@gmail.com'
      });

    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.text.includes('Found. Redirecting to /passwordreset')).toEqual(true);

    let key;

    const results = await pool.query('SELECT * FROM keys WHERE used = false');
    key = results.rows[0].name;

    const resetResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot32@gmail.com',
        key: key,
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1!'
      }); 

    expect(resetResponse.statusCode).toEqual(302);
    expect(resetResponse.redirect).toEqual(true);
    expect(resetResponse.res.text.includes('Found. Redirecting to /login')).toEqual(true);   
  });
});