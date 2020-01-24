$(function() {
  let plantSearcher = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('#filter_form').on('submit', $.proxy(this.search, this));
      $('.toggle-info-btn').on('click', $.proxy(this.toggleField, this));
      $('#all_results').on('click', 'a.more-info-btn', $.proxy(this.searchSinglePlant, this));
      // $('#fullscreen_container').on('submit', '#close_details', $.proxy(this.closeDetails, this));
      // $('#fullscreen_container').on('submit', '.single-plant-add-form', $.proxy(this.addPlantForUser, this));
      // bind buttons
    },

    search: function(e) {
      e.preventDefault();

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
        self.appendPageResults(JSON.parse(json.body));
      })
      .catch(function(err) {
        throw err;
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
        throw err;
      });
    },

    appendPageResults: function(plantList) {
      this.reset();

      let list = document.createElement('ul');
      let listItem;
      let moreInfoLink;
      let nameArray;

      plantList.forEach(function(plant) {
        listItem = document.createElement('li');
        moreInfoLink = document.createElement('a');

        moreInfoLink.textContent = plant.common_name ? plant.common_name : plant.scientific_name;
        nameArray = moreInfoLink.textContent.split(' ');
        nameArray = nameArray.map(function(word) {
          return word[0].toUpperCase() + word.slice(1); 
        });

        moreInfoLink.textContent = nameArray.join(' ');

        listItem.id = plant.id;

        listItem.classList.add('plant-list-element');
        moreInfoLink.classList.add('more-info-btn');

        listItem.append(moreInfoLink);
        list.append(listItem);
      });

      list.id = 'list_of_results';
      $('#all_results').append(list);
      // make list item for each plant, make id the id of plant
      // more info button, common and scientific name
      // more info invokes async
      return;
    },

    appendSinglePlantDetails: function($element, plantDetails) {
      function titleize(string) {
        let array = string.split('_');
        let newString = '';

        array.forEach(function(word) {
          newString += word[0].toUpperCase() + word.slice(1) + ' ';
        });

        return newString;
      }

      if ($element.children().length > 0) {
        $element.children().remove();
        return;
      }

      let section = document.createElement('section');
      section.classList.add('single-plant-details');

      let closeBtn = document.createElement('button');
      closeBtn.type = 'submit';
      closeBtn.textContent = 'Close Details';
      closeBtn.id = 'close_details';

      section.append(closeBtn);

      let uList = document.createElement('ul');
      uList.classList.add('plant-detail-list');

      let listItem;
      let details = {
        image: 'Not Available',
        common_name: plantDetails.main_species.common_name || 'Not Available',
        scientific_name: plantDetails.main_species.scientific_name || 'Not Available',
        temperature_minimum: plantDetails.main_species.growth.temperature_minimum.deg_f + 'F' || 'Not Available',
        precipitation_minimum: plantDetails.main_species.growth.precipitation_minimum.inches + ' inches' || 'Not Available',
        shade_tolerance: plantDetails.main_species.growth.shade_tolerance || 'Not Available',
        drought_tolerance: plantDetails.main_species.growth.drought_tolerance || 'Not Available',
        moisture_use: plantDetails.main_species.growth.moisture_use || 'Not Available',
        fruit_or_seed_color: plantDetails.main_species.fruit_or_seed.color || 'Not Available',
        flower_color: plantDetails.main_species.flower.color || 'Not Available',
        seed_period_begin: plantDetails.main_species.fruit_or_seed.seed_period_begin || 'Not Available',
        seed_period_end: plantDetails.main_species.fruit_or_seed.seed_period_end || 'Not Available',
        seed_abundance: plantDetails.main_species.fruit_or_seed.seed_abundance || 'Not Available',
        seeds_per_pound: String(plantDetails.main_species.seed.seeds_per_pound) || 'Not Available',
        bloom_period: plantDetails.main_species.seed.bloom_period || 'Not Available',
        vegetative_spread_rate: plantDetails.main_species.seed.vegetative_spread_rate || 'Not Available',
        growth_rate: plantDetails.main_species.specifications.growth_rate || 'Not Available',
      };

      if (plantDetails.images.length > 0) {
        details['image'] = plantDetails.images[0].url;
      } 

      let keys = Object.keys(details);
      let image;
      let span;

      keys.forEach(function(attribute) {
        listItem = document.createElement('li');
        listItem.classList.add('single-plant-list-item');

        if (attribute === 'image' && details[attribute] !== 'Not Available') {
          image = document.createElement('img');
          image.src = details[attribute];
          image.classList.add('single-plant-image');
          listItem.append(image);
        } else {
          listItem.textContent = titleize(attribute) + ': ' + titleize(details[attribute]);
        }

        uList.append(listItem);
      });

      let addPlantLink = document.createElement('a');
      addPlantLink.classList.add('add-btn-plant');
      addPlantLink.textContent = 'Add Plant';

      let addPlantForm = document.createElement('form');
      addPlantForm.classList.add('single-plant-add-form');

      let submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.value = $element.parent().attr('id');
      submitBtn.textContent = 'Add Plant';

      addPlantForm.append(submitBtn);
      uList.append(addPlantForm);
      section.append(uList);

      $('#fullscreen_container').fadeIn(100);
      $('#fullscreen_container').append(section);
      $('#close_details').on('click', $.proxy(this.closeDetails, this));
      $('.single-plant-add-form').on('submit', $.proxy(this.addPlantForUser, this));
      return;
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
      let $textInputs = $('#filter_form').find('input[type="text"]');
      let $numberInputs = $('#filter_form').find('input[type="number"]');
      let $checkedInputs = $('#filter_form').find('input[type="radio"]:checked');

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
      // format any input with a value
      // for the Trefle API GET request in controller
      // return as Object
    },

    addPlantForUser: function(e) {
      e.preventDefault();

      if ($('.success').length > 0) {
        $('.success').remove();
      } else if ($('.failure').length > 0) {
        $('.failure').remove();
      }

      let $button = $(e.target).find('button');
      let name = $(e.target).parent().find('li')[1];

      if (name.textContent === 'Common Name : Not Available ') {
        name = $(e.target).parent().find('li')[2].textContent.replace('Scientific Name : ', '');
      } else {
        name = name.textContent.replace('Common Name : ', '');
      }

      name = name.trim();

      let data = {
        id: $button[0].value,
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
        let message = document.createElement('p');
        message.textContent = json.msg;

        if (json.success === true) {
          message.classList.add('success');
        } else {
          message.classList.add('failure');
        }

        $(e.target).parent().parent()[0].append(message);
        return;
        // body
      })
      .catch(err => console.error(err));

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
      if ($('#list_of_results')) {
        $('#list_of_results').remove();
      }
      // removes all results
      // resets filter form
    }
  };

  plantSearcher.init();
  $('.toggle-info-btn').siblings().toggle();
});