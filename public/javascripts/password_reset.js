$(function() {
  let passwordReset = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('a#change_option').on('click', $.proxy(this.toggleDivs, this));
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

      $('.notification').remove();
      $('.async-msg').text('');
      $('.async-msg').hide();
      $('.msg').hide();
      return;
    } 
  };

  passwordReset.init();
});