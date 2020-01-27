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