$(function() {
  let profileActions = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('button#logout').on('click', $.proxy(this.logout, this));
    },

    logout: function() {
      fetch('/logout', {
        method: 'POST'
      })
      .then(response => {
        if (response.status === 200) {
          window.location.replace('/login');
        } else {
          throw new Error(`Response status from POST logout was ${response.status}`);
        }
      })
      .catch(err => console.error(err));
    }
  };

  profileActions.init();
});