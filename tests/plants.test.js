const request = require('supertest');
const session = require('supertest-session');
const { pool } = require('../config.js');
const app = require('../app.js');

let testSession;

function removeUsers() {
  return pool.query('DELETE FROM users WHERE email = $1', ['plantdaddymail@gmail.com'])
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

afterAll(function() {
  pool.query('DELETE FROM plants');
  pool.query('DELETE FROM sightings');
})
// plant search tests

describe('Open up plant search route', () => {
  it('should be GET and route: /plants/search, refused if no session', async () => {
    const res = await request(app).get('/plants/search');
    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
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
  it('should insert Ogeechee Tupelo for user', async () => {
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });

    const l = await testSession.post('/login')
    .send({
      email: 'suck@gmail.com',
      password: 'abcdefgh1!'
    });

    const res = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo'
      });

    const dbRes = await pool.query('SELECT * FROM plants');

    expect(dbRes.rows.length).toBe(1)
    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes("<p class='success'>Ogeechee Tupelo added to user's plants.</p>"));
  });
});

describe('No POST to insert duplicate plant for given user', () => {
  it('should not insert Ogeechee Tupelo for user', async () => {
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });

    const l = await testSession.post('/login')
    .send({
      email: 'suck@gmail.com',
      password: 'abcdefgh1!'
    });

    const res = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes("<p class='success'>Ogeechee Tupelo added to user's plants.</p>"));

    const resSecond = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo'
      });

    expect(resSecond.statusCode).toEqual(200);
    expect(resSecond.redirect).toEqual(false); 
    expect(res.res.text.includes("<p class='failure'>Plant already added to your collection.</p>"));

    // login data saved to session
  });
});

describe('No POST to insert plant into DB for given user', () => {
  it('should not insert since no one is logged in', async () => {
    const res = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes("<p class='error'>You are not logged in.</p>"));
    // no login data in session
  });
});

describe('No POST to insert plant into DB with incorrect id', () => {
  it('should not insert since id is invalid', async () => {
    const l = await login();

    const res = await testSession.post('/search/add_plant')
      .send({
        id: '<script>console.log("I am in!");</script>',
        name: 'Ogeechee Tupelo'
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
        name: '<script>true;</script>'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.redirect).toEqual(false);
  });
});

// sighting tests

describe('GET to view_sightings', () => {
  it('should return a page with title Reported Sightings and loaded sightings from DB', async () => {
    const r = await testSession.post('/register')
      .send({
        username: 'suck',
        email: 'suck@gmail.com',
        password: 'abcdefgh1!',
        password_conf: 'abcdefgh1!'
      });

    const l = await testSession.post('/login')
      .send({
        email: 'suck@gmail.com',
        password: 'abcdefgh1!'
      });

    const postPlant = await testSession.post('/plants/sightings/add/159446')
      .send({
        description: 'This is the first plant I ever saw. I love it! Great location.',
        lat: '23.111',
        lng: '-73.222',
      });

    expect(postPlant.text.includes('Found. Redirecting to')).toEqual(true);
    expect(postPlant.redirect).toEqual(true);
    expect(postPlant.statusCode).toEqual(302);

    const res = await testSession.get('/plants/sightings/view/159446');

    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.text.includes('<a class="list-item" href="#" data-lat="23.111" data-lng="-73.222" data-username="suck" data-plantname="Ogeechee tupelo" data-description="This is the first plant I ever saw. I love it! Great location.">')).toEqual(true);

    const remove = await pool.query('DELETE FROM users WHERE email = $1', ['suck@gmail.com']);
  });

  it('should redirect to login if plant does not exist', async () => {
    const res = await request(app).get('/plants/sightings/view/79379707979879');

    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.text).toEqual('Found. Redirecting to /login');
  });
});

describe('GET to /sightings/add/:id', () => {
  it('should return a page with title: Report Sighting and load available plants to report from DB', async () => {
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });

    const l = await testSession.post('/login')
    .send({
      email: 'suck@gmail.com',
      password: 'abcdefgh1!'
    });

    const res = await testSession.get('/plants/sightings/add/159446');
    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    //expect(res.text.includes('<form id="sighting-form" method="POST" action="/plants/sightings/add/159446">')).toEqual(true);
  });

  it('should redirect to login with no user session data', async () => {
    const res = await testSession.get('/plants/sightings/add/159446');
    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.text).toEqual('Found. Redirecting to /login');
  });

  it('should redirect to login with invalid plant id', async () => {
    const res = await testSession.get('/plants/sightings/add/15944656789');
    expect(res.statusCode).toEqual(302);
    expect(res.redirect).toEqual(true);
    expect(res.text).toEqual('Found. Redirecting to /login');
  });
});

describe('POST to /sightings/add/:id', () => {
  it('should INSERT sighting into DB and redirect to plant index', async () => {
    const removeSightings = await pool.query('DELETE FROM sightings');
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });
    const l = await testSession.post('/login')
      .send({
        email: 'suck@gmail.com',
        password: 'abcdefgh1!'
      });

    const postPlant = await testSession.post('/plants/sightings/add/159446')
      .send({
        description: 'This is the first plant I ever saw. I love it! Great location.',
        lat: '23.111',
        lng: '-73.222',
      });

    const query = await pool.query('SELECT * FROM sightings;');

    expect(query.rows.length).toBe(1);
    expect(query.rows[0].plant_id).toBe(159446);
    expect(postPlant.statusCode).toEqual(302);
    expect(postPlant.redirect).toEqual(true);
    expect(postPlant.text.includes('Found. Redirecting to')).toEqual(true);
  });
});

describe('No POST to /sightings/add/:id', () => {
  it('should Not INSERT sighting into DB since no session data', async () => {
    const removeSightings = await pool.query('DELETE FROM sightings');
    const postPlant = await testSession.post('/plants/sightings/add/159446')
      .send({
        description: 'This is the first plant I ever saw. I love it! Great location.',
        lat: '23.111',
        lng: '-73.222',
      });

    const query = await pool.query('SELECT * FROM sightings;');

    expect(query.rows.length).toBe(0);
    expect(postPlant.statusCode).toEqual(302);
    expect(postPlant.redirect).toEqual(true);
    expect(postPlant.text).toBe('Found. Redirecting to /login');
  });

  it('should Not INSERT sighting into DB since invalid data', async () => {
    const removeSightings = await pool.query('DELETE FROM sightings');
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });
    const l = await testSession.post('/login')
      .send({
        email: 'suck@gmail.com',
        password: 'abcdefgh1!'
      });

    const postPlant = await testSession.post('/plants/sightings/add/159446')
      .send({
        description: 'This is the first plant I ever saw. I love it! Great location.',
        lat: '<script>console.log(true);</script>',
        lng: 'dfjafjdaj',
      });

    const query = await pool.query('SELECT * FROM sightings;');

    expect(query.rows.length).toBe(0);
    expect(postPlant.statusCode).toEqual(404);
    expect(postPlant.redirect).toEqual(false);
    expect(postPlant.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">Data was incorrect. Try again.</p></div>')).toBe(true);
  });

  it('should Not INSERT sighting into DB since missing body attributes', async () => {
    const removeSightings = await pool.query('DELETE FROM sightings');
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });

    const l = await testSession.post('/login')
      .send({
        email: 'suck@gmail.com',
        password: 'abcdefgh1!'
      });

    const postPlant = await testSession.post('/plants/sightings/add/159446')
      .send({
        description: 'This is the first plant I ever saw. I love it! Great location.',
        lat: '23.1234543',
      });

    const query = await pool.query('SELECT * FROM sightings;');
    expect(query.rows.length).toBe(0);
    expect(postPlant.statusCode).toEqual(404);
    expect(postPlant.redirect).toEqual(false);
    expect(postPlant.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">Data was incorrect. Try again.</p></div>')).toBe(true);
  });

  it('should Not INSERT sighting into DB since additional body attributes', async () => {
    const removeSightings = await pool.query('DELETE FROM sightings');
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });
    const l = await testSession.post('/login')
      .send({
        email: 'suck@gmail.com',
        password: 'abcdefgh1!'
      });

    const postPlant = await testSession.post('/plants/sightings/add/159446')
      .send({
        description: 'This is the first plant I ever saw. I love it! Great location.',
        lat: '23.1234543',
      });

    const query = await pool.query('SELECT * FROM sightings;');

    expect(query.rows.length).toBe(0);
    expect(postPlant.statusCode).toEqual(404);
    expect(postPlant.redirect).toEqual(false);
    expect(postPlant.text.includes('<div class="notification is-danger is-light"><p class="is-medium has-text-centered">Data was incorrect. Try again.</p></div>')).toBe(true);
  });
});

describe('POST to DELETE plant', () => {
  it('should not work if user not logged in', async () => {
    const res = await request(app).post('/plants/analysis/collection')
      .send({
        id: 159446
      });

    expect(res.redirect).toBe(true);
    expect(res.statusCode).toBe(302);
    expect(res.text).toBe('Found. Redirecting to /login');
  });

  it('should not work if id is incorrect', async () => {
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });

    const l = await testSession.post('/login')
      .send({
        email: 'suck@gmail.com',
        password: 'abcdefgh1!'
      });

    const res = await testSession.post('/plants/analysis/collection')
      .send({
        id: '<script>console.log(true);</script>'
      });

    expect(res.redirect).toBe(false);
    expect(res.statusCode).toBe(404);
    expect(res.body.msg).toBe('The wrong plant identification number was sent.');
  });

  it('should work if user is logged in and passes correct id', async () => {
    const r = await testSession.post('/register')
    .send({
      username: 'suck',
      email: 'suck@gmail.com',
      password: 'abcdefgh1!',
      password_conf: 'abcdefgh1!'
    });

    const l = await testSession.post('/login')
      .send({
        email: 'suck@gmail.com',
        password: 'abcdefgh1!'
      });

    const res = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo'
      });

    const deleteRes = await testSession.post('/plants/analysis/collection')
      .send({
        id: 159446
      });

    expect(deleteRes.redirect).toBe(false);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.msg).toBe('Plant successfully deleted from your collection.');    
  });
});

describe('GET to field notes', () => {
  it('should populate a list of available plants', async () => {

  });
})

describe('POST to add field note', () => {
  it('should not add without session data', async () => {

  });

  it('should not add without description', async () => {

  });

  it('should not add with invalid data', async () => {

  });

  it('should add with valid data', async () => {

  });
});

describe('POST to delete field note', () => {
  it('should not delete without session data', async () => {

  });

  it('should not delete with non-existent id', async () => {

  });

  it('should delete with correct id', async () => {

  });
});

describe('GET to all notes for given plant', () => {
  it('should redirect to login if not logged in', async () => {

  });

  it('should load all notes for plant id', async () => {

  });
});

describe('POST to update field note', () => {
  it('should redirect to login if not session data', async () => {

  });

  it('should not update if id is non-existent', async () => {

  });

  it('should not update if plant_id is non-existent', async () => {

  });

  it('should not update if data is invalid', async () => {

  });

  it('should update if data is valid', async () => {

  });
});