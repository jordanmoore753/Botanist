$(function() {
  function toBase64(arr) {
     //arr = new Uint8Array(arr) if it's an ArrayBuffer
     return btoa(
        arr.reduce((data, byte) => data + String.fromCharCode(byte), '')
     );
  }

  let noteManager = {
    init: function() {
      this.bindEvents();
      this.id = window.location.pathname.split('/')[4];
    },

    bindEvents: function() {
      $('#collection').on('click', 'a', $.proxy(this.selectItem, this));
      $('#add_note_btn').on('click', $.proxy(this.showAddForm, this));
      $('#delete_note_btn').on('click', $.proxy(this.showDeletePrompt, this));
      $('#update_note_btn').on('click', $.proxy(this.showUpdateForm, this));
      $('.no_btn').on('click', $.proxy(this.hideForm, this));
      $('.uploader').on('click', function(e) {
        if ($(this).attr('value') === 'true') {
          $('#img_field').show();
        } else {
          $('#img_field').hide();
        }

        return;
      });
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

    getImage: function() {
      let key = $('.list a.is-active').attr('data-key');
      let self = this;

      fetch(`/plants/fieldnotes/pictures/${key}`)
      .then((res) => res.json())
      .then(function(json) {
        return self.createImage(json.body);
      })
      .catch(function(error) {
        return self.newMsg({ error: error.msg });
      });
    },

    unescaper(str) {
      return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/g, '/').replace(/&#x5C;/g, '\\').replace(/&#96;/g, '`');
    },

    createImage: function(imgData) {
      $('#picture div').remove();
      let div = document.createElement('div');
      let img = document.createElement('img');

      if (imgData.endsWith('default.jpg')) {
        img.src = imgData;
      } else {
        img.src = `data:image/jpeg;base64,${imgData}`;
      }

      div.classList.add('box');

      div.append(img);

      $('#picture').append(div);
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

      this.hideForm();


      let note_id = $('.list a.is-active').attr('data-value');
      $('#update_form form').attr('action', `/plants/fieldnotes/view/${this.id}/update/${note_id}`);
      $('#update_form').show();
      // assign path for POST form
    },

    showDeletePrompt: function() {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a note to delete.' });
        return;
      }

      this.hideForm();

      let note_id = $('.list a.is-active').attr('data-value');
      $('#delete_form form').attr('action', `/plants/fieldnotes/view/${this.id}/delete/${note_id}`);
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