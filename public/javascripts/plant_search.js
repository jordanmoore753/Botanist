$(function() {
  let plantSearcher = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      // bind buttons
    },

    search: function() {
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

    paginate: function() {
      // bind page number buttons to this function
      // loads page of trefle's GET request with current params in form
      // defer GET request to controller again
      // eliminates default value of 1 for page
      // check if current page is less than or greater than desired
    },

    formatFormData: function() {
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

    reset: function() {
      // removes all results
      // resets filter form
    }
  };

  plantSearcher.init();
});