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

// plant search tests

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
  it('should insert Ogeechee Tupelo for user', async () => {
    const l = await login();

    const res = await testSession.post('/plants/search/add_plant')
      .send({
        id: '159446',
        name: 'Ogeechee Tupelo'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.redirect).toEqual(false);
    expect(res.res.text.includes("<p class='success'>Ogeechee Tupelo added to user's plants.</p>"));
    // login data saved to session
  });
});

describe('No POST to insert duplicate plant for given user', () => {
  it('should not insert Ogeechee Tupelo for user', async () => {
    const l = await login();

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

  });

  it('should redirect to login if plant does not exist', async () => {

  });
});

describe('GET to submit_sighting', () => {
  it('should return a page with title: Add Sighting and load available plants to report from DB', async () => {

  });

  it('should redirect to login with no user session data', async () => {

  });
});

describe('POST to /sightings/add/:id', () => {
  it('should INSERT sighting into DB and redirect to plant index', async () => {

  });
});

describe('No POST to /sightings/add/:id due to invalid input values', () => {
  it('should Not INSERT sighting into DB, render add sighting page again', async () => {

  });
});

describe('No POST to /sightings/add/:id due to no session data', () => {
  it('should Not INSERT sighting into DB, render add sighting page again', async () => {

  });
});