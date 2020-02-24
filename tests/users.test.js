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
    const res = await request(app).get('/profile');
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
    expect(res.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">No users with that email exist.'))
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
    expect(res.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">Invalid credentials.'))
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
    expect(res.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">No users with that email exist.')).toEqual(true);
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
    expect(res.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">One or more inputs were incorrectly written. Try again.')).toEqual(true);
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
    expect(res.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">One or more inputs were incorrectly written. Try again.')).toEqual(true);
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
    expect(resDuplicate.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">You already have a reset key: check your spam/inbox folders.')).toEqual(true);
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
    expect(resDuplicate.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">You already have a reset key: check your spam/inbox folders.')).toEqual(true);
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

    //console.log(resetResponse.text);
    expect(resetResponse.statusCode).toEqual(404);
    expect(resetResponse.redirect).toEqual(false);
    expect(resetResponse.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">No usable key with that name exists for that user.')).toEqual(true);

    const passwordResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot32@gmail.com',
        key: key,
        password: 'abcdefgh1',
        password_conf: 'abcdefgh1!'
      }); 

    expect(passwordResponse.statusCode).toEqual(404);
    expect(passwordResponse.redirect).toEqual(false);
    expect(passwordResponse.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">Incorrect data provided. Check password, key, and email.')).toEqual(true);

    const passwordConfResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot32@gmail.com',
        key: key,
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1'
      }); 

    expect(passwordConfResponse.statusCode).toEqual(404);
    expect(passwordConfResponse.redirect).toEqual(false);
    expect(passwordConfResponse.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">Incorrect data provided. Check password, key, and email.')).toEqual(true);

    const emailResponse = await testSession.post('/passwordreset/update_pw')
      .send({
        email_two: 'suckboot323@gmail.com',
        key: key,
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1!'
      }); 

    expect(emailResponse.statusCode).toEqual(404);
    expect(emailResponse.redirect).toEqual(false);
    expect(emailResponse.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">No user with that email exists.')).toEqual(true);
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

describe('tasks route', () => {
  it('should get all tasks', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    const res2 = await testSession.get('/tasks');
    expect(res2.statusCode).toEqual(200);
    expect(res2.redirect).toEqual(false);
    console.log(res2.res.text);
  });

  it('should not get all tasks, not logged in', async () => {
    const res2 = await request.get('tasks');

    expect(res2.statusCode).toEqual(302);
    expect(res2.redirect).toEqual(true);
    expect(res2.headers.location).toBe('/login');
  });

  it('should add tasks', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    const data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    const res2 = await testSession.post('/tasks/new')
      .send(data);

    expect(res2.statusCode).toEqual(200);
    expect(res2.redirect).toEqual(false);
    console.log(res2.res.body);
  });

  it('should not add task, not logged in', async () => {
    const data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    const res2 = await request.post('/tasks/new')
      .send(data);

    expect(res2.statusCode).toEqual(302);
    expect(res2.redirect).toEqual(true);
    expect(res2.headers.location).toBe('/login');
  });

  it('should not add task, invalid params', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    let data = {
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    let res2 = await testSession.post('/tasks/new')
      .send(data);

    expect(res2.statusCode).toEqual(404);
    expect(res2.redirect).toEqual(false);
    console.log(res2.res.body);

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20',
      one: '22'
    };

    res2 = await testSession.post('/tasks/new')
      .send(data);

    expect(res2.statusCode).toEqual(404);
    expect(res2.redirect).toEqual(false);
    console.log(res2.res.body);

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: 'finger',
    };

    res2 = await testSession.post('/tasks/new')
      .send(data);

    expect(res2.statusCode).toEqual(404);
    expect(res2.redirect).toEqual(false);
    console.log(res2.res.body);

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'med',
      urgent: 'false',
      date_due: '2020-04-20',
    };

    res2 = await testSession.post('/tasks/new')
      .send(data);

    expect(res2.statusCode).toEqual(404);
    expect(res2.redirect).toEqual(false);
    console.log(res2.res.body);

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'yum',
      date_due: '2020-04-20',
    };

    res2 = await testSession.post('/tasks/new')
      .send(data);

    expect(res2.statusCode).toEqual(404);
    expect(res2.redirect).toEqual(false);
    console.log(res2.res.body);
  });

  it('should remove tasks', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    const data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    const res2 = await testSession.post('/tasks/new')
      .send(data);

    const poolRes = await pool.query('SELECT * FROM tasks');
    const id = poolRes.rows[0].user_id;
    const res3 = await testSession.post(`/tasks/delete/${id}`);

    expect(res3.statusCode).toEqual(200);
    expect(res3.redirect).toEqual(false);
    console.log(res3.res.body);
  });

  it('should not remove task, not logged in', async () => {
    const res3 = await request.post(`/tasks/delete/1`);

    expect(res3.statusCode).toEqual(302);
    expect(res3.redirect).toEqual(true);
    expect(res3.headers.location).toBe('/login');
  });

  it('should not remove task, doesnt exist', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    const res3 = await request.post(`/tasks/delete/1`);

    expect(res3.statusCode).toEqual(404);
    expect(res3.redirect).toEqual(false);
    console.log(res3.res.body);
  });

  it('should update tasks', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    let data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    const res2 = await testSession.post('/tasks/new')
      .send(data);

    const poolRes = await pool.query('SELECT * FROM tasks');
    const id = poolRes.rows[0].user_id;

    data = {
      title: 'Not Mountain',
      urgent: 'true'
    };

    // test for limited data
    const res3 = await testSession.post(`/tasks/update/${id}`)
      .send(data);

    expect(res3.statusCode).toBe(200);
    expect(res3.redirect).toBe(false);
    console.log(res3.res.body);

    // test for full data
    data = {
      description: 'Sample descriptionription.',
      title: 'Whatever!',
      difficulty: 'easy',
      urgent: 'false',
      date_due: '2020-04-21'
    };

    const res4 = await testSession.post(`/tasks/update/${id}`)
      .send(data);

    expect(res3.statusCode).toBe(200);
    expect(res3.redirect).toBe(false);
    console.log(res3.res.body);
  });

  it('should not update task, not logged in', async () => {
    let data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    const res2 = await request.post(`/tasks/update/1`)
      .send(data);

    expect(res3.statusCode).toEqual(302);
    expect(res3.redirect).toEqual(true);
    expect(res3.headers.location).toBe('/login');
  });

  it('should not update task, invalid params', async () => {
    const res = await testSession.post('/login')
      .send({
        email: 'suckboot323@gmail.com',
        password: 'abcdefgh1!'
      });

    let data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    const res2 = await testSession.post('/tasks/new')
      .send(data);

    const poolRes = await pool.query('SELECT * FROM tasks');
    const id = poolRes.rows[0].user_id;

    // too many params

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: '2020-04-20',
      one: 'more'
    };

    let res3 = await testSession.post(`/tasks/update/${id}`)
      .send(data);

    expect(res3.statusCode).toBe(404);
    expect(res3.redirect).toBe(false);
    console.log(res3.res.body);

    // wrong date type

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: 'false',
      date_due: 'one'
    };

    res3 = await testSession.post(`/tasks/update/${id}`)
      .send(data);

    expect(res3.statusCode).toBe(404);
    expect(res3.redirect).toBe(false);
    console.log(res3.res.body);

    // not true or false for urgent

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'medium',
      urgent: '123',
      date_due: '2020-04-20'
    };

    res3 = await testSession.post(`/tasks/update/${id}`)
      .send(data);

    expect(res3.statusCode).toBe(404);
    expect(res3.redirect).toBe(false);
    console.log(res3.res.body);
    // not easy, medium, hard for difficulty

    data = {
      description: 'Go the top of Hunter Mountain and collect frost samples for lab work.',
      title: 'Hunter Mountain Work',
      difficulty: 'sucker',
      urgent: 'false',
      date_due: '2020-04-20'
    };

    res3 = await testSession.post(`/tasks/update/${id}`)
      .send(data);

    expect(res3.statusCode).toBe(404);
    expect(res3.redirect).toBe(false);
    console.log(res3.res.body);
  });
});