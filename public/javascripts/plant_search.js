$(function() {
  let plantSearcher = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('#filter_form').on('submit', $.proxy(this.search, this));
      $('.toggle-info-btn').on('click', $.proxy(this.toggleField, this));
      $('#all_results').on('click', 'a', $.proxy(this.searchSinglePlant, this));
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
        console.log(plantData);
        self.appendSinglePlantDetails($(e.target), plantData);
      })
      .catch(function(err) {
        throw err;
      });
    },

    appendPageResults: function(plantList) {
      if ($('#list_of_results')) {
        $('#list_of_results').remove();
      }

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

    appendSinglePlantDetails: function(element, plantDetails) {
      let section = document.createElement('section');
      section.classList.add('single-plant-details');

      let uList = document.createElement('ul');
      uList.classList.add('plant-detail-list');

      let listItem;
      let details = {
        image: plantDetails.main_species.images[0].url || 'Not Available',
        scientific_name: plantDetails.scientific_name || 'Not Available',
        temperature_minimum: plantDetails.main_species.growth.temperature_minimum.deg_f || 'Not Available',
        precipitation_minimum: plantDetails.main_species.growth.precipitation_minimum.inches || 'Not Available',
        shade_tolerance: plantDetails.main_species.growth.shade_tolerance || 'Not Available',
        drought_tolerance: plantDetails.main_species.growth.drought_tolerance || 'Not Available',
        moisture_use: plantDetails.main_species.growth.moisture_use || 'Not Available',
        fruit_or_seed_color: plantDetails.main_species.fruit_or_seed.color || 'Not Available',
        flower_color: plantDetails.main_species.flower.color || 'Not Available',
        seed_period_begin: plantDetails.main_species.fruit_or_seed.seed_period_begin || 'Not Available',
        seed_period_end: plantDetails.main_species.fruit_or_seed.seed_period_end || 'Not Available',
        seed_abundance: plantDetails.main_species.fruit_or_seed.seed_abundance || 'Not Available',
        seeds_per_pound: plantDetails.main_species.seed.seeds_per_pound || 'Not Available',
        bloom_period: plantDetails.main_species.seed.bloom_period || 'Not Available',
        vegetative_spread_rate: plantDetails.main_species.seed.vegetative_spread_rate || 'Not Available',
        growth_rate: plantDetails.main_species.specifications.growth_rate || 'Not Available',
      };


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
        data[e.name] = e.value.toLowerCase();
      });

      $checkedInputs.each(function(i, e) {
        data[e.name] = e.value;
      });

      return data;
      // format any input with a value
      // for the Trefle API GET request in controller
      // return as Object
    },

    addPlantForUser: function() {
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
      // removes all results
      // resets filter form
    }
  };

  plantSearcher.init();
  $('.toggle-info-btn').siblings().toggle();
});