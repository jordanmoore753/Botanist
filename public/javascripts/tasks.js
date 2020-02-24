$(function() {
  let taskManager = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('#collection').on('click', 'a', $.proxy(this.selectItem, this));
      $('#add_note_btn').on('click', $.proxy(this.showAddForm, this));
      $('#delete_note_btn').on('click', $.proxy(this.showDeletePrompt, this));
      $('#update_note_btn').on('click', $.proxy(this.showUpdateForm, this));
      $('.no_btn').on('click', $.proxy(this.hideForm, this));
      $('#adding_form').on('submit', $.proxy(this.addTask, this));
      $('#updating_form').on('submit', $.proxy(this.updateTask, this));
      $('#deleting_form').on('submit', $.proxy(this.updateTask, this));
    },

    selectItem: function(e) {
      e.preventDefault();
      e.stopPropagation();

      $('.list a').removeClass('is-active');
      e.target.classList.add('is-active');

      return this.getAllDetails();
    },

    getAllDetails: function() {
      $('#notifications div').remove();
      this.getImage();
      return this.populateDetails();
    },

    populateDetails: function() {
      $('#note div').remove();

      let desc = $('.list a.is-active').attr('data-desc');
      let note = document.createElement('div');
      let words = document.createElement('p');

      note.classList.add('box');
      words.classList.add('is-medium');
      words.textContent = this.unescaper(desc);

      note.append(words);
      $('#note').append(note);
    },

    unescaper(str) {
      return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/g, '/').replace(/&#x5C;/g, '\\').replace(/&#96;/g, '`');
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
      $('#add_form form').attr('action', `/tasks/new`);
      // assign path for POST form
    },

    showUpdateForm: function() {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a task to update.' });
        return;
      }

      this.hideForm();


      let task_id = $('.list a.is-active').attr('data-value');
      $('#update_form form').attr('action', `/tasks/update/${task_id}`);
      $('#update_form').show();
      // assign path for POST form
    },

    showDeletePrompt: function() {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a task to delete.' });
        return;
      }

      this.hideForm();

      let task_id = $('.list a.is-active').attr('data-value');
      $('#delete_form form').attr('action', `/tasks/delete/${task_id}`);
      $('#delete_form').show();
      // assign path for POST form using active id
    },

    newMsg: function(msg) {
      $('div.notification').remove();
      $('#notifications div').remove();

      let notification = document.createElement('div');
      let message = document.createElement('p');

      if (msg.success) {
        notification.classList.add('notification', 'box');
        notification.classList.add('is-success', 'is-light');
      } else {
        notification.classList.add('notification', 'box');
        notification.classList.add('is-light', 'is-danger');
      }

      message.textContent = msg.success || msg.error;
      message.classList.add('is-medium', 'has-text-centered');
      notification.append(message);

      $('#notifications').append(notification);
    },

    updateTask: function(e) {
      e.preventDefault();
      const eq = {
        0: 'description',
        1: 'title',
        2: 'due_date'
      };

      let data = {};

      let d = $('#updating_form textarea[name="description"]').val();
      let t = $('#updating_form input[name="title"]').val();
      let date = $('#updating_form input[name="due_date"]').val();

      [d, t, date].forEach(function(value, i) {
        if (value !== undefined) {
          data[eq[i]] = value;
        }
      });

      console.log(data);
      // fetch request
    },

    addTask: function(e) {
      e.preventDefault();

      let data = {
        description: $('#adding_form textarea[name="description"]').val(),
        title: $('#adding_form input[name="title"]').val(),
        due_date: $('#adding_form input[name="due_date"]').val(),
        urgent: $('#adding_form input[name="urgent"]:checked').val(),
        difficulty: $('#adding_form input[name="difficulty"]:checked').val()
      };

      // fetch request
    },

    removeTask: function(e) {
      e.preventDefault();
    },

    populateUpdate: function(body) {

    },

    populateAdd: function(body) {

    },

    populateDelete: function(body) {

    }
  };

  taskManager.init();
});