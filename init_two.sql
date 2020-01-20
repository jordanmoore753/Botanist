CREATE TABLE keys (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users (id),
  used boolean DEFAULT false,
  name text
);