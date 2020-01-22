$(function() {
  let plantSearcher = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('#filter_form').on('submit', $.proxy(this.search, this));
      // bind buttons
    },

    search: function(e) {
      e.preventDefault();

      let allData = this.formatFormData();

      // fetch('/search_results', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },

      //   body: JSON.stringify(allData)
      // })
      // .then(function(response) {
      //   this.appendResults(response);
      // })
      // .catch(function(err) {
      //   throw err;
      // });

      // async GET results from query search
      // controller handles this GET request and returns API data
      // include form data as body
      // controller formats body data as query params, must be page 1
      // return json promise, format into list of plants
      // change results on page
      // remove previous results
      // populates list of plants
      // allow asynchronously add planting crops for each plant in results
    },

    appendResults: function(plantList) {

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

    addPlantForUser: function() {
      // form includes date planted and quantity
      // POST to /search
      // must be logged in! Will be redirected to login page if not.
      // POST request will return a Promise with outcome
      // Notify user of success or failure
      // Close options for current plant
    },

    toggleFields: function() {
      // toggle show/hide fields for form filtering
    },

    reset: function() {
      // removes all results
      // resets filter form
    }
  };

  plantSearcher.init();
});