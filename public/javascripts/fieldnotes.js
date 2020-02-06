$(function() {
  let noteManager = {
    init: function() {
      this.bindEvents();
      this.id = window.location.pathname.split('/')[4];
    },

    bindEvents: function() {
      $('#add_note_btn').on('click', $.proxy(this.showAddForm, this));
      $('#delete_note_btn').on('click', $.proxy(this.showDeletePrompt, this));
      $('#update_note_btn').on('click', $.proxy(this.showUpdateForm, this));
      $('.no_btn').on('click', $.proxy(this.hideForm, this));
    },

    toggleContainer: function() {
      return $('#fullscreen_container').toggle();
    },

    hideForm: function() {
      $('#add_form').hide();
      $('#update_form').hide();
      $('#delete_form').hide();
      return this.toggleContainer();
    },

    showAddForm: function() {
      this.hideForm();
      $('#add_form').show();
      $('#add_form form').attr('action', `/plants/fieldnotes/add/${this.id}`);
      // assign path for POST form
    },

    showUpdateForm: function() {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a note to update.' });
        return;
      }

      $('#update_form form').attr('action', `/plants/fieldnotes/view/${this.id}/update/`);
      // assign path for POST form
    },

    showDeletePrompt: function() {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a note to delete.' });
        return;
      }

      $('#delete_form form').attr('action', `/plants/fieldnotes/view/${this.id}/delete/`);
      // assign path for POST form using active id
    },

    newMsg: function(msg) {
      $('div.notification').remove();
      $('#notifications p').remove();

      let notification = document.createElement('div');
      let message = document.createElement('p');

      if (msg.success) {
        notification.classList.add('notification');
        notification.classList.add('is-success', 'is-light');
      } else {
        notification.classList.add('notification');
        notification.classList.add('is-light', 'is-danger');
      }

      message.textContent = msg.success || msg.error;
      message.classList.add('is-medium', 'has-text-centered');
      notification.append(message);

      $('#notifications').append(notification);
    },

    // addNote: function(e) {
    //   e.preventDefault();
    // },

    // updateNote: function(e) {
    //   e.preventDefault();
    // },

    // deleteNote: function(e) {
    //   e.preventDefault();
    // }
  };

  noteManager.init();
});