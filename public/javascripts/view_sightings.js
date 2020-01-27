$(function() {
  let viewer = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('.title-sighting').on('click', $.proxy(this.toggleDetails, this));
      $('form').on('submit', $.proxy(this.getDirections, this));
      // events bound
    },

    getDirections: function(e) {
      // check all inputs are existing
      // check inputs are valid types
      // sanitize inputs
      // make GET request
      // trigger new map to be created for div#map showing directions
      // populate directions div with HTML-spiced directions
    },

    formatDirections: function(directionsObject) {
      // format directions into HTML
      // append HTML to correct div
    },

    toggleDetails: function(e) {
      e.stopPropagation();
      e.preventDefault();

      let $details = $(e.target).find('.sub-details');

      if ($details.is(':hidden')) {
        $('.sub-details').hide();
        $details.show();
      } else {
        $details.hide();
      }

      // insert coordinates into map form
      // create map showing these coordinates, no directions yet
    },

    sanitize: function(str) {
      const invalidChars = ['<', '>', '!', '.', ',', '*', '[', ']', '{', '}', '(', ')', '&', '=', '/', ';', "'", ':'];
      const invalidCommands = ['SELECT', 'INSERT', 'DELETE', 'DROP', 'UPDATE', 'INTO', 'CREATE', 'ALTER', 'INDEX', 
                               'script', 'FROM', 'WHERE', 'OR', 'onload', 'onmouseover', 'onerror', 'SCRIPT',
                               'META', 'meta', 'IMG', 'img', 'SRC', 'src', 'alert', 'ALERT', '&#x3C', '&#x3E', 
                               'exec', 'echo', 'EXEC', 'ECHO', 'HTTP', 'HTTPS', 'http', 'https' ];

      let sanitizedString = '';

      str.split('').forEach(function(char) {
        if (!invalidChars.includes(char)) {
          sanitizedString += char;
        }
      });

      invalidCommands.forEach(function(command) {
        sanitizedString = sanitizedString.replace(command, '');
      });

      return sanitizedString;
    }
  };

  viewer.init();
  // let l = '<script>SELECT * FROM users WHERE id = 1 OR 1=1;</script>';
  // let b = "<body onload=alert('test1')>";
  // let test = '<SCRIPT SRC=http://xss.rocks/xss.js></SCRIPT>';
  // let test2 = "<IMG SRC='javascript:alert();'>";

  // console.log(viewer.sanitize(test));
  // console.log(viewer.sanitize(test2));  
});