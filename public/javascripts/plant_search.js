$(function() {
  let plantSearcher = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('#searcher').on('click', $.proxy(this.search, this));
      $('#result_list').on('click', 'a', $.proxy(this.openPrompt, this));
      $('#all_results').on('click', 'a.more-info-btn', $.proxy(this.openPrompt, this));
      $('#yesser').on('click', $.proxy(this.addPlantForUser, this));
      $('#noer').on('click', $.proxy(this.closePrompt, this));
      $('#field_one').on('click', $.proxy(this.showField, this));
      $('#field_two').on('click', $.proxy(this.showField, this));
      $('#field_three').on('click', $.proxy(this.showField, this));
    },

    showField: function(e) {
      e.preventDefault();
      e.stopPropagation();

      if ($(e.currentTarget).children().find('svg').attr('data-icon') === 'angle-double-up') {
        $(e.currentTarget).children().find('svg').attr('data-icon', 'angle-double-down');  
      } else {
        $(e.currentTarget).children().find('svg').attr('data-icon', 'angle-double-up');  
      }

      return $(e.currentTarget).siblings().first().toggle();
    },

    closePrompt: function() {
      $('.list-item.is-active').removeClass('is-active');
      $('#fullscreen_container').fadeOut(100);
    },

    openPrompt: function(e) {
      e.preventDefault();
      e.stopPropagation();

      $(e.target).addClass('is-active');

      $('#fullscreen_container').fadeIn(100);
      return;
    },

    addSinglePlant: function(e) {
      e.preventDefault();
      e.stopPropagation();

      let id, name;
      [id, name] = e.target.value.split(', ');

      let data = {
        id: id,
        name: name
      };

      fetch('/plants/search/add_plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(function(json) {
        let message;

        if (json.success === true) {
          message = { success: json.msg };
        } else {
          message = { error: json.msg };
        }

        self.newMsg(message);
        $('#not').trigger('click'); // close full screen container
        return;
      })
      .catch(function(err) {
        return self.newMsg({ error: 'Some error occurred. Try refreshing.' });
      });

      return;
    },

    search: function(e) {
      e.preventDefault();
      e.stopPropagation();
      // handle whether or not previous/next page clicked, not search

      let allData = this.formatFormData();
      let self = this;

      fetch(window.location.pathname + '_results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(allData)
      })
      .then(res => res.json())
      .then(function(json) {
        self.appendPageResults(JSON.parse(json.body), json['response']['headers']);
      })
      .catch(function(err) {
        return self.newMsg({ error: 'Some error occurred. Try refreshing.' });
      });

      // async GET results from query search
    },

    searchSinglePlant: function(e) {
      e.stopPropagation();
      e.preventDefault();

      let self = this;
      let data = {
        id: String($(e.target).parent().attr('id'))
      };

      fetch(window.location.pathname + '_single_plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(function(json) {
        let plantData = JSON.parse(json.body);
        self.appendSinglePlantDetails($(e.target), plantData);
      })
      .catch(function(err) {
        self.newMsg({ error: 'Some error occurred. Try refreshing.' });
      });
    },

    appendPageResults: function(plantList, headers) {
      this.reset();

      let listDiv = document.createElement('div');
      listDiv.classList.add('list', 'is-hoverable');
      listDiv.style.height = '300px';
      listDiv.style.overflow = 'auto';

      let list = document.createElement('ul');
      let listItem;
      let moreInfoLink;
      let nameArray;

      plantList.forEach(function(plant) {
        listItem = document.createElement('a');

        listItem.classList.add('list-item');
        listItem.textContent = plant.common_name ? plant.common_name : plant.scientific_name;
        nameArray = listItem.textContent.split(' ');
        nameArray = nameArray.map(function(word) {
          return word[0].toUpperCase() + word.slice(1); 
        });

        listItem.textContent = nameArray.join(' ');
        listItem.id = plant.id;
        listDiv.append(listItem);
      });

      $('#result_list').append(listDiv)


      // notification

      this.newMsg({ success: 'The search was successfully executed.' });

      // pagination

      $('#pagination').children().remove();

      if (headers['total-pages'] < 1 && plantList.length < 1) {
        let p = document.createElement('p');
        p.classList.add('is-medium', 'notification');
        p.textContent = 'No more pages.';

        $('#pagination').append(p);
        return;
      }

      let divOne = document.createElement('div');
      let pages = document.createElement('select');

      divOne.classList.add('select');

      let lastPage = Number(headers['total-pages']);
      let option;

      for (let i = 1; i <= lastPage; i += 1) {
        option = document.createElement('option');
        option.classList.add('page-number');
        option.value = i;
        option.textContent = i;
        pages.append(option);
      }

      let self = this;

      pages.addEventListener('change', (function(e) {
        e.preventDefault();
        let pageNumber = $('#pagination select option:selected')[0].value;
        let data = self.formatFormData();
        data.page = pageNumber;

        fetch(window.location.pathname + '_results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(function(json) {
          self.appendPageResults(JSON.parse(json.body), json['response']['headers']);
        })
        .catch(function(err) {
          self.newMsg({ error: err.msg });
        });
      }));

      divOne.append(pages);
      $('#pagination').append(divOne);

      if (Number(headers['page-number']) > 1) {
        $(`#pagination select`).val(Number(headers['page-number']));
      }

      return;
    },

    newMsg: function(msg) {
      $('#notifications').children().remove();

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

    closeDetails: function(e) {
      e.preventDefault();

      $('.single-plant-details').remove();
      $('#fullscreen_container').fadeOut(100);
      return;
    },

    paginate: function() {
      // bind page number buttons to this function
      // loads page of trefle's GET request with current params in form
      // defer GET request to controller again
      // eliminates default value of 1 for page
      // check if current page is less than or greater than desired
    },

    formatFormData: function() {
      let $textInputs = $('body').find('input[type="text"]');
      let $numberInputs = $('body').find('input[type="number"]');
      let $checkedInputs = $('body').find('input[type="radio"]:checked');

      let validNumInputs = [];
      let validStringInputs = [];
      let data = {};

      $textInputs.each(function (i, element) {
        if (element.value !== '') {
          validStringInputs.push(element);
        }
      });

      $numberInputs.each(function (i, element) {
        if (element.value !== '') {
          validNumInputs.push(element);
        }
      });

      validNumInputs.forEach(function(e) {
        data[e.name] = Number(e.value);
      });

      validStringInputs.forEach(function(e) {
        data[e.name] = e.value;
      });

      $checkedInputs.each(function(i, e) {
        data[e.name] = e.value;
      });

      return data;
    },

    addPlantForUser: function(e) {
      e.preventDefault();

      let self = this;
      let id = $('.list-item.is-active')[0].id;
      let name = $('.list-item.is-active')[0].textContent;

      name = name.trim();

      let data = {
        id: id,
        name: name
      };

      fetch('/plants/search/add_plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(function(json) {
        let message;

        if (json.msg === 'Successfully added plant to your collection.') {
          message = { success: json.msg };
        } else {
          message = { error: json.msg };
        }

        self.newMsg(message);
        return self.closePrompt();
      })
      .catch(function(err) {
        self.newMsg({ error: err.msg });
        return self.closePrompt();
      });

      return;
      // form includes date planted and quantity
      // POST to /search
      // must be logged in! Will be redirected to login page if not.
      // POST request will return a Promise with outcome
      // Notify user of success or failure
      // Close options for current plant
    },

    toggleField: function(e) {
      e.preventDefault();

      let originalText = e.target.text;

      if (e.target.text.startsWith('Show')) {
        $(e.target).text(originalText.replace('Show', 'Hide'));
      } else {
        $(e.target).text(originalText.replace('Hide', 'Show'));
      }

      $(e.target).siblings().toggle(1);
      // toggle show/hide fields for form filtering
    },

    reset: function() {
      $('#result_list').children().remove();
      if ($('#list_of_results')) {
        $('#list_of_results').remove();
      }

      $('.all-pages').remove();
      // removes all results
      // resets filter form
    }
  };

  plantSearcher.init();
  $('.toggle-info-btn').siblings().toggle();
});