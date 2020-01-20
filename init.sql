CREATE TABLE users (
   id serial PRIMARY KEY,
   name varchar (20),
   email varchar (30),
   password text
);

CREATE TABLE keys (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id),
  used boolean DEFAULT false,
  name text
);

CREATE TABLE threads (
  id serial PRIMARY KEY,
  user_one integer REFERENCES users (id),
  user_two integer REFERENCES users (id),
);

CREATE TABLE crops (
  id serial PRIMARY KEY,
  planted_date date NOT NULL DEFAULT CURRENT_DATE,
  user_id integer REFERENCES users (id),
  plant_id integer NOT NULL
);

CREATE TABLE messages (
  id serial PRIMARY KEY,
  thread_id integer REFERENCES threads (id),
  user_id integer REFERENCES users (id),
  string varchar(300)
);

CREATE TABLE posts (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id),
  post_date date NOT NULL DEFAULT CURRENT_DATE,
  string varchar(300) NOT NULL,
  title varchar(30) NOT NULL
);

CREATE TABLE replies (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id),
  post_date date NOT NULL DEFAULT CURRENT_DATE,
  string varchar(300) NOT NULL
);