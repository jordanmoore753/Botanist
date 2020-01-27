$(function() {
  let viewer = {
    init: function() {
      this.bindEvents();
      //this.startMap();
    },

    bindEvents: function() {
      $('.title-sighting').on('click', $.proxy(this.toggleDetails, this));
      $('form').on('submit', $.proxy(this.getDirections, this));
      // events bound
    },

    asyncher: function() {
      let ones = 'pAU79';
      let twos = 'YWdjp5';
      let threes = ones + twos;

      threes = threes.slice(1);
      return 'p' + threes;
    },

    getDirections: async function(e) {
      e.preventDefault();

      if ($('.sub-details:visible').length === 0) {
        console.log('need active coordinates');
        return;
      }

      let sanitizedInputs = []; 
      let self = this;

      $('form input').each(function(index, e) {
        sanitizedInputs.push(self.sanitize(e.value).trim());
      });

      let random = 'key';
      let coordinates = this.forgetSchema();
      sanitizedInputs.push(this.sanitize($('form select')[0].value).trim());
      
      let startLocation = `${sanitizedInputs[0]}, ${sanitizedInputs[1]}, ${sanitizedInputs[2]}`;
      let $activeSighting = $('.sub-details:visible');
      let lat = $activeSighting.find('#lat')[0].textContent.replace('Latitude: ', '');
      let lng = $activeSighting.find('#lng')[0].textContent.replace('Longitude: ', '');
      let endLocation = [lat, lng].join(',');

      fetch(`http://www.mapquestapi.com/directions/v2/route?${random}=${coordinates}&from=${startLocation}&to=${endLocation}&narrativeType=text`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(function(json) {
        self.formatDirections(json);
        self.changeMap(startLocation, endLocation);
      })
      .catch(function(err) {
        window.location.replace('/login');
      });

      // check all inputs are existing
      // check inputs are valid types
      // sanitize inputs
      // make GET request
      // trigger new map to be created for div#map showing directions
      // populate directions div with HTML-spiced directions
    },

    changeMap: function(startLocation, endLocation) {
      let random = 'key';
      let img;
      $('#map').children().remove();
      let coordinates = this.forgetSchema();

      fetch(`https://www.mapquestapi.com/staticmap/v5/map?${random}=${coordinates}&start=${startLocation}&end=${endLocation}&size=800,800`, {
        method: 'GET'
      })
      .then(function(response) {
        img = document.createElement('img');
        img.src = response.url;
        $('#map')[0].append(img);
        return 'done';
      })
      .catch(function(err) {
        window.location.replace('/login');
      });
    },

    mapper: function() {
      let chars = 'fZfml'.split(''); 
      let bigChars = 'BWpgC5'.split('');

      return chars.join('') + bigChars.join('');
    },

    startMap: function() {
      let childCoordinate = this.forgetSchema();

      L.mapquest.key = childCoordinate;

      this.features = L.featureGroup();
      this.mapObj = L.mapquest.map('map', {
        center: [40.7128, -74.0059],
        layers: L.mapquest.tileLayer('map'),
        zoom: 13
      });

      return;
    },

    forgetSchema: function() {
      let child = this.mapper();
      child += this.asyncher();
      child += this.toggler();
      return child;
    },

    formatDirections: function(directionsObject) {
      $('#directions_list li').remove();
      $('#directions p').remove();

      let maneuvers = directionsObject.route.legs[0].maneuvers;
      let totalTime = directionsObject.route.legs[0].formattedTime;
      let totalDistance = directionsObject.route.legs[0].distance;
      let item;

      maneuvers.forEach(function(obj) {
        item = document.createElement('li');
        item.classList.add('direction-element');
        item.textContent = obj.narrative;
        item.textContent += ` (${obj.distance} miles)`;
        $('#directions_list')[0].append(item);
      });

      item = document.createElement('p');
      item.classList.add('direction-overall-time-distance');
      let span;

      [totalTime, totalDistance].forEach(function(value) {
        span = document.createElement('span');

        if (value === totalTime) {
          span.classList.add('direction-time');
          span.textContent = `Time: ${value}, `;
        } else {
          span.classList.add('direction-distance');
          span.textContent = `Distance: ${value} miles.`;
        }

        item.append(span);
      });

      $('#directions')[0].append(item);
      return;
    },

    toggler: function() {
      let doc = 'AAnvm';
      let soc = 'AAndm';
      let roc = 'CuQfZ';
      let boc = 'BBnvm';

      return doc + roc;      
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
});