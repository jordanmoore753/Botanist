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
      $('#deleting_form').on('submit', $.proxy(this.removeTask, this));
      $('textarea').on('keydown', $.proxy(this.preventEnter, this));
    },

    preventEnter: function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
      }
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
      return this.populateDetails();
    },

    populateDetails: function() {
      $('#note div').remove();
      let self = this;
      let desc = $('.list a.is-active').attr('data-desc');
      let date = $('.list a.is-active').attr('data-due');

      let note = document.createElement('div');
      let list = document.createElement('div');
      let words = document.createElement('p');
      let dateP = document.createElement('p');
      let s;
      let t;

      list.classList.add('list');

      [dateP, words].forEach(function(e, i) {
        s = document.createElement('span');
        s.classList.add('tag', 'is-primary');
        s.setAttribute('style', 'margin-right: 10px;');
        if (i === 1) {
          s.textContent = 'Description';
          t = document.createTextNode(self.unescaper(desc));
        } else {
          s.textContent = 'Due Date';
          t = document.createTextNode(self.unescaper(date));
        }

        e.append(s);
        e.append(t);
        e.classList.add('is-medium', 'list-item');
      });

      note.classList.add('box');
      note.setAttribute('style', 'max-height: 300px; width: 100%; overflow: auto;');

      note.append(dateP);
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
    },

    showUpdateForm: function() {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ success: false, msg: 'You must select a task to update.' });
        return;
      }

      this.hideForm();

      let task_id = $('.list a.is-active').attr('data-value');
      $('#update_form form').attr('action', `/tasks/update/${task_id}`);
      $('#update_form').show();
    },

    showDeletePrompt: function() {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ success: false, msg: 'You must select a task to delete.' });
        return;
      }

      this.hideForm();

      let task_id = $('.list a.is-active').attr('data-value');
      $('#delete_form form').attr('action', `/tasks/delete/${task_id}`);
      $('#delete_form').show();
    },

    newMsg: function(msg) {
      $('#note .box').remove();
      $('div.notification').remove();
      $('#notifications div').remove();

      let notification = document.createElement('div');
      let message = document.createElement('p');

      if (msg.success === true) {
        notification.classList.add('notification', 'box');
        notification.classList.add('is-success', 'is-light');
      } else {
        notification.classList.add('notification', 'box');
        notification.classList.add('is-light', 'is-danger');
      }

      message.textContent = msg.msg;
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
      const self = this;
      const id = $('.is-active').attr('data-value');

      let data = {};

      let d = $('#updating_form textarea[name="description"]').val();
      let t = $('#updating_form input[name="title"]').val();
      let date = $('#updating_form input[name="due_date"]').val();

      [d, t, date].forEach(function(value, i) {
        if (value.length > 0) { data[eq[i]] = value; }
      });

      fetch(`/tasks/update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(function(json) {
        if (json.success === true) {
          $('#notifications div').remove();
          self.populateUpdate(json.msg);
          self.populateDetails();
        } else {
          self.newMsg(json);
        }

        self.hideForm();
      })
      .catch(function(err) {

      });
    },

    addTask: function(e) {
      e.preventDefault();
      const self = this;

      let data = {
        description: $('#adding_form textarea[name="description"]').val(),
        title: $('#adding_form input[name="title"]').val(),
        due_date: $('#adding_form input[name="due_date"]').val(),
        urgent: $('#adding_form input[name="urgent"]:checked').val(),
        difficulty: $('#adding_form input[name="difficulty"]:checked').val()
      };

      return fetch('/tasks/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(function(json) {
        if (json.success === true) {
          self.populateAdd(json.msg);
          self.newMsg({
            success: true,
            msg: 'Successfully added task.'
          });          
        } else {
          self.newMsg(json);
        }

        self.hideForm();
      })
      .catch(function(err) {
        self.newMsg(err);
        self.hideForm();
      });
    },

    removeTask: function(e) {
      e.preventDefault();
      const self = this;

      let id = $('.is-active').attr('data-value');

      return fetch(`/tasks/delete/${id}`, {
        method: 'POST'
      })
      .then(res => res.json())
      .then(function(json) {
        self.populateDelete();
        self.hideForm();
      })
      .catch(function(err) {
        self.newMsg(err);
        self.hideForm();
      });
    },

    populateUpdate: function(body) {
      $('.is-active').empty();
      $('.is-active').attr('data-desc', body.description);
      $('.is-active').attr('data-value', body.id);
      $('.is-active').attr('data-due', body.due_date);

      let s = document.createElement('span');
      s.setAttribute('style', 'margin-right: 10px;');

      if (body.urgent === true) {
        s.classList.add('tag', 'is-warning');
        s.textContent = 'URGENT';
      } else if (body.difficulty === 'easy') {
        s.classList.add('tag', 'is-success', 'is-light');
        s.textContent = 'Easy';
      } else if (body.difficulty === 'medium') {
        s.classList.add('tag', 'is-warning', 'is-light');
        s.textContent = 'Medium';
      } else {
        s.classList.add('tag', 'is-danger', 'is-light');
        s.textContent = 'Hard';
      }

      let t = document.createTextNode(body.title);

      $('.is-active').append(s);
      $('.is-active').append(t);
    },

    populateAdd: function(body) {
      $('.is-active').removeClass('is-active');

      let newItem = document.createElement('a');
      newItem.classList.add('list-item');

      // add data attributes
      newItem.dataset.value = body.id;
      newItem.dataset.due = body.due_date;
      newItem.dataset.desc = body.description;

      let s = document.createElement('span');
      s.setAttribute('style', 'margin-right: 10px;');

      if (body.urgent === 'true') {
        s.classList.add('tag', 'is-warning');
        s.textContent = 'URGENT';
      } else if (body.difficulty === 'easy') {
        s.classList.add('tag', 'is-success', 'is-light');
        s.textContent = 'Easy';
      } else if (body.difficulty === 'medium') {
        s.classList.add('tag', 'is-warning', 'is-light');
        s.textContent = 'Medium';
      } else {
        s.classList.add('tag', 'is-danger', 'is-light');
        s.textContent = 'Hard';
      }

      newItem.append(s);

      s = document.createTextNode(body.title);
      newItem.append(s);

      $('#collection .box').remove();
      s = document.createElement('div');
      s.classList.add('list', 'is-hoverable');

      if ($('#collection div').length === 0) {
        s.append(newItem);
        $('#collection').append(s);        
      }

      $('#collection div').append(newItem);
      return;
    },

    populateDelete: function() {
      $('.is-active').remove();
      this.newMsg({
        success: true,
        msg: 'Successfully removed task.'
      });
    }
  };

  taskManager.init();
});