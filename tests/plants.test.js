const request = require('supertest');
const session = require('supertest-session');
const { pool } = require('../config.js');
const app = require('../app.js');

let testSession;

function removeUsers() {
  return pool.query('DELETE FROM users WHERE id = $1 OR 1=1', [1])
  .then(res => res)
  .catch(function(err) {
    throw err;
  });
}

async function login() {
  return await testSession.post('/login')
    .send({
      email: 'plantdaddymail@gmail.com',
      password: '1234567891!d'
    });
}

beforeEach(function() {
  testSession = session(app);
});

afterEach(function() {
  testSession = null;
});

describe('Open up plant search route', () => {
  it('should be GET and route: /plants/search', async () => {
    const res = await request(app).get('/plants/search');
    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes('<title>Plant Search</title>')).toEqual(true);
  });
});

describe('POST to retrieve plants matching criteria from Trefle API', () => {
  it('should receive 30 plants', async () => {
    const res = await request(app).post('/plants/search_results')
      .send({
        resprout_ability: 'true',
        fruit_conspicuous: 'true',
        growth_rate: 'Rapid'
      });

    let plants = JSON.parse(res.body.response.body);
    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(plants[0].hasOwnProperty('slug')).toEqual(true);
    expect(plants[0].hasOwnProperty('complete_data')).toEqual(true);
    expect(plants[0].hasOwnProperty('common_name')).toEqual(true);
    expect(plants[0].hasOwnProperty('id')).toEqual(true);
    expect(plants.length === 30).toEqual(true);
  });
});

describe('POST to retrieve plant details for single plant from Trefle API', () => {
  it('should receive plant details for Ogeechee Tupelo', async () => {
    const res = await request(app).post('/plants/search_single_plant')
      .send({
        id: '159446'
      });

    let plant = JSON.parse(res.body.response.body);
    expect(plant.scientific_name).toEqual('Nyssa ogeche');
    expect(plant.native_status).toEqual('L48(N)');
    expect(plant.main_species.id).toEqual(159446);
    expect(plant.main_species.growth.moisture_use).toEqual('High');
  });
});

describe('POST to insert plant into DB for given user', () => {
  it('should insert Ogeechee Tupelo, 34 quantity, for suckboot32', async () => {
    const l = await login();

    const res = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo',
        quantity: 34,
        date_planted: '2020-01-01'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes("<p class='success'>Ogeechee Tupelo added to user's plants.</p>"));
    // login data saved to session
  });
});

describe('No POST to insert plant into DB for given user', () => {
  it('should not insert since no one is logged in', async () => {
    const res = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo',
        quantity: 34,
        date_planted: '2020-01-01'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes("<p class='error'>You are not logged in.</p>"));
    // no login data in session
  });
});

describe('No POST to insert plant into DB with incorrect date', () => {
  it('should not insert since date is invalid', async () => {
    const l = await login();

    const res = await testSession.post('/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo',
        quantity: 34,
        date_planted: '<script>console.log("I am in!");</script>'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
  });
});

describe('No POST to insert plant into DB with incorrect quantity', () => {
  it('should not insert since quantity is invalid', async () => {
    const l = await login();

    const res = await testSession.post('/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo',
        quantity:'<script>console.log("I am in!");</script>',
        date_planted: '2020-01-01'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
  });
});

describe('No POST to insert plant into DB with incorrect id', () => {
  it('should not insert since id is invalid', async () => {
    const l = await login();

    const res = await testSession.post('/search/add_plant')
      .send({
        id: '<script>console.log("I am in!");</script>',
        name: 'Ogeechee Tupelo',
        quantity: 34,
        date_planted: '2020-01-01'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
  });
});

describe('No POST to insert plant into DB with escaped/long name', () => {
  it('should not insert since name is too long and escaped', async () => {
    const l = await login();

    const res = await testSession.post('/search/add_plant')
      .send({
        id: '159446',
        name: '<script>true;</script>',
        quantity: 34,
        date_planted: '2020-01-01'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
  });
});
// user tests

// describe('Redirect when profile accessed but no session data', () => {
//   it('should redirect to login when not logged in', async () => {
//     const res = await request(app).get('/1/profile');
//     expect(res.statusCode).toEqual(302);
//     expect(res.redirect).toEqual(true);
//     expect(res.headers.location).toEqual('/login');
//   });
// });

// describe('/login redirect to profile with session data', () => {
//   it('should redirect to profile when logged in', async () => {
//     await register();
//     await login();

//     const res = await testSession.get('/login');
//     expect(res.statusCode).toEqual(302);
//     expect(res.redirect).toEqual(true);
//     expect(res.headers.location.endsWith('/profile')).toEqual(true);
//   });
// });

// describe('/register redirect to profile with session data', () => {
//   it('should redirect to profile when logged in', async () => {
//     await register();
//     await login();

//     const res = await testSession.get('/register');
//     expect(res.statusCode).toEqual(302);
//     expect(res.redirect).toEqual(true);
//     expect(res.headers.location.endsWith('/profile')).toEqual(true);
//   });
// });

// describe('/register creates a new user', () => {
//   it('should create a user successfully, login, redirect to profile', async () => {
//     const registerRes = await request(app).post('/register')
//       .send({
//         username: 'bootsuck',
//         email: 'suckboot32333@gmail.com',
//         password: 'abcdefgh1!',
//         password_conf: 'abcdefgh1!'
//       });  

//     expect(registerRes.statusCode).toEqual(200);
//     expect(registerRes.res.text.includes('<title>Login</title>')).toEqual(true);

//     const res = await login();

//     expect(res.statusCode).toEqual(302);
//     expect(res.redirect).toEqual(true);
//     expect(res.headers.location.endsWith('/profile')).toEqual(true);
//   });
// });

// describe('/register invalid data does not create new user', () => {
//   it('should not create a user successfully, no login', async () => {
//     await request(app).post('/register')
//       .send({
//         username: 'suckboot2',
//         email: 'suckboot323@gmail.com',
//         password: 'abcdefgh1!',
//         password_conf: 'abcdefgh1ddd!'
//       });

//     const res = await testSession.post('/login')
//       .send({
//         email: 'suckboot323@gmail.com',
//         password: 'abcdefgh1!'
//       });

//     expect(res.statusCode).toEqual(200);
//     expect(res.redirect).toEqual(false);
//     expect(res.req.finished).toEqual(true);
//     expect(res.res.url).toEqual('');
//   });
// });

// describe('/logout redirects and destroys session', () => {
//   it('should redirect to index and destroy session', async () => {
//     const loginRes = await login();
//     const profileUrl = loginRes.header.location;
//     const logoutResponse = await testSession.post('/logout');

//     expect(logoutResponse.statusCode).toEqual(302);
//     expect(logoutResponse.redirect).toEqual(true);
//     expect(logoutResponse.headers.location).toEqual('/login');

//     const res = await testSession.get('/register');
//     expect(res.statusCode).toEqual(200);
//     expect(res.redirect).toEqual(false);
//     expect(res.res.text.includes('<title>Registration</title>')).toEqual(true);
//   });
// });

// describe('reset password requires a personal key', () => {
//   it('should redirect to login after getting key, only one key made', async () => {
//     const res = await testSession.post('/passwordreset')
//       .send({
//         email: 'suckboot32@gmail.com'
//       });

//     expect(res.statusCode).toEqual(200);
//     expect(res.redirect).toEqual(false);
//     expect(res.res.text.includes('<title>Reset Password</title>'));

//     const resDuplicate = await testSession.post('/passwordreset')
//       .send({
//         email: 'suckboot32@gmail.com'
//       });

//     expect(resDuplicate.statusCode).toEqual(200);
//     expect(resDuplicate.redirect).toEqual(false);
//     expect(resDuplicate.req.finished).toEqual(true);
//     expect(resDuplicate.res.text.includes('<li>You already have a reset key: check your email inbox/spam folder.</li>')).toEqual(true);
//   });
// });