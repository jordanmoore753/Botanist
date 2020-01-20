$(function() {
  let passwordReset = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('a#change_option').on('click', $.proxy(this.toggleDivs, this));
      $('#reset_form').on('submit', $.proxy(this.resetPassword, this));
    },

    toggleDivs: function(e) {
      e.preventDefault();

      let currentText = $('#change_option').text();

      if (currentText === 'Already have key?') {
        $('#request_key_form_container').hide();
        $('#reset_form_container').show();
        $('#change_option').text('No key?');
      } else {
        $('#request_key_form_container').show();
        $('#reset_form_container').hide();
        $('#change_option').text('Already have key?');
      }

      $('.async-msg').text('');
      $('.async-msg').hide();
      $('.msg').hide();
      return;
    },

    resetPassword: function(e) {
      e.preventDefault();

      $('.async-msg').text('');
      $('.async-msg').hide();

      let body = {
        email_two: $('#email_two').val(),
        key: $('#key').val(),
        password: $('#password').val(),
        password_conf: $('#password_conf').val()
      };

      fetch('/passwordreset', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      .then(response => response.json())
      .then(function(json) {
        if (json.status === 404 || json.status === 500) {
          $('.async-msg').text(json.error);
          $('.async-msg').show();
        } else if (json.status === 302) {
          return window.location.replace('/login');
        }
      })
      .catch(function(err) {
        throw new Error(err.msg);
      });
    } 
  };

  passwordReset.init();
});