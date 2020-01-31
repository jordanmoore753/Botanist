DROP TABLE keys;
DROP TABLE plants;
DROP TABLE sightings;
DROP TABLE users;

CREATE TABLE users (
   id serial PRIMARY KEY,
   name varchar (20),
   email varchar (30),
   password text
);

CREATE TABLE keys (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id) ON DELETE CASCADE,
  used boolean DEFAULT false,
  name text
);

CREATE TABLE plants (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id) ON DELETE CASCADE,
  plant_id integer NOT NULL,
  name text NOT NULL
);

CREATE TABLE sightings (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id) ON DELETE CASCADE NOT NULL,
  plant_id integer NOT NULL,
  user_name varchar(20) NOT NULL,
  plant_name text NOT NULL,
  lat numeric NOT NULL,
  long numeric NOT NULL,
  description varchar(400) NOT NULL,
  submit_date date DEFAULT CURRENT_TIMESTAMP
);
