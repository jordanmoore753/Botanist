exports.databaseError = function(res) {
  return res.status(500).send({ error: 'Database error: contact Admin, plantdaddymail@gmail.com', status: 500 });
};

exports.userError = function(res, text) {
  return res.status(404).send({ error: `${text}`, status: 404 });
};

exports.successfulPatch = function(res) {
  return res.status(302).send({ msg: 'User password successfully changed.', status: 302 });
};

exports.renderMsgs = function(res, msgs, title, route) {
  return res.render(route, { 
    title: title,
    msgs: msgs
  });
};