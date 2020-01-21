DROP TABLE keys;
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