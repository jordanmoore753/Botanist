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

exports.redirectTo = function(req, res, path, sessionData, status) {
  if (sessionData.success) {
    req.session.success = sessionData.success;
  } else if (sessionData.error) {
    req.session.error = sessionData.error;
  }

  return res.status(status).redirect(path);
};

exports.reassignSessionData = function(req, res) {
  let throwaway = { info: undefined };

  if (req.session.success) {
    throwaway.info = req.session.success;
    req.session.success = null;
  } else if (req.session.error) {
    throwaway.info = req.session.error;
    req.session.error = null;
  }

  return throwaway;
};

exports.renderAlert = function(req, res, msg, title, view, status) {
  return res.status(status).render(view, { 
    title: title, 
    alert: msg
  });
};