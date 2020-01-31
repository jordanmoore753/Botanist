$(function() {
  let viewer = {
    init: function() {
      this.bindEvents();
      this.startMap();
      //this.startMap();
    },

    bindEvents: function() {
      $('.title-sighting').on('click', $.proxy(this.toggleDetails, this));
      $('#sightings_list').on('click', 'a', $.proxy(this.showDetails, this));
      $('form').on('submit', $.proxy(this.getDirections, this));
      $('#directions_btn').on('mouseover', $.proxy(this.showHiddenInstructions, this));
      $('#directions_btn').on('mouseleave', $.proxy(this.hideInstructions, this));
      $('#directions_btn').on('click', $.proxy(this.showForm, this));
      $('#fullscreen_container').on('click', $.proxy(this.hideForm, this));
      $('form button').on('click', function(e) {
        $('form').trigger('submit');
      });
      // events bound
    },

    showDetails: function(e) {
      e.preventDefault();

      $('#notification_box').children().remove();
      $('.list-item').removeClass('is-active');
      $(e.target).addClass('is-active');

      let list = document.createElement('div');
      list.classList.add('list', 'is-hoverable');
      list.id = 'temp_list';

      $('#notification_box').append(list);

      let data = {};

      ['username', 'plantname', 'lat', 'lng', 'description'].forEach(function(property) {
        data[property] = $(e.target).attr(`data-${property}`);
      });

      let plantNameArray = data.plantname.split(' ');
      let capitalizedPlantName = [];

      plantNameArray.forEach(function(word) {
        capitalizedPlantName.push(word[0].toUpperCase() + word.slice(1));
      });

      data.description = data.description.replace(/&#x27;/gi, "'");
      data.plantname = capitalizedPlantName.join(' ');

      let span;
      let p;
      let elementsToAppend = [];

      Object.keys(data).forEach(function(property) {
        let converts = {
          username: 'User',
          plantname: 'Plant',
          lat: 'Latitude',
          lng: 'Longitude',
          description: 'Description'
        };

        span = document.createElement('span');
        a = document.createElement('p');

        span.classList.add('tag', 'is-primary', 'is-medium');
        span.textContent = `${converts[property]}`;
        a.append(span);

        a.classList.add('is-medium', 'list-item', 'has-background-light', 'has-text-black');
        a.append(' ' + data[property]);

        $('#temp_list').append(a);
      });

      this.genStaticMap(data.lat, data.lng);
    },

    genStaticMap: function(lat, lng) {
      let random = 'key';
      let img;
      $('#map').children().remove();
      let coordinates = this.forgetSchema();

      fetch(`https://www.mapquestapi.com/staticmap/v5/map?${random}=${coordinates}&locations=${lat},${lng}&zoom=10&size=800,800`, {
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

    hideForm: function(e) {
      e.preventDefault();

      if ($(e.target).attr('id') === 'fullscreen_container' || 
          $(e.target).hasClass('is-one-quarter') || 
          $(e.target).hasClass('is-centered')) {
        $('#fullscreen_container').fadeOut(100);
      }
      
      return;
    },

    showForm: function(e) {
      e.preventDefault();

      if ($('.is-active').length === 0) {
        return;
      }

      $('#directions_hover').hide();
      $('#fullscreen_container').fadeIn(100);
    },

    showHiddenInstructions: function(e) {
      return $('#directions_hover').fadeIn(300);
    },

    hideInstructions: function(e) {
      return $('#directions_hover').fadeOut(300);
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

      let sanitizedInputs = []; 
      let self = this;

      $('form input').each(function(index, e) {
        sanitizedInputs.push(self.sanitize(e.value).trim());
      });

      let random = 'key';
      let coordinates = this.forgetSchema();
      sanitizedInputs.push(this.sanitize($('form select')[0].value).trim());
      
      let startLocation = `${sanitizedInputs[0]}, ${sanitizedInputs[1]}, ${sanitizedInputs[2]}`;
      let lat = $('.is-active').attr('data-lat');
      let lng = $('.is-active').attr('data-lng');
      let endLocation = [lat, lng].join(',');

      console.log(startLocation);

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
        console.log(err);
        return;
        window.location.replace('/login');
      });
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

    newMsg: function(msg) {
      $('#notification_box').children().remove();

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

      $('#notification_box').append(notification);
    },

    formatDirections: function(directionsObject) {
      $('#notification_box').children().remove();

      if (directionsObject === undefined || directionsObject.info.statuscode === 402) {
        console.log('yes');
        return this.newMsg({ error: 'The directions could not be calculated for this route.' });
      }

      let listDiv = document.createElement('div');
      listDiv.classList.add('list');

      let maneuvers = directionsObject.route.legs[0].maneuvers;
      let totalTime = directionsObject.route.legs[0].formattedTime;
      let totalDistance = directionsObject.route.legs[0].distance;
      let item;

      maneuvers.forEach(function(obj) {
        item = document.createElement('li');
        item.classList.add('list-item');
        item.textContent = obj.narrative;
        item.textContent += ` (${obj.distance} miles)`;
        listDiv.append(item);
      });

      item = document.createElement('li');
      item.classList.add('list-item', 'has-background-primary', 'has-text-white');

      [totalTime, totalDistance].forEach(function(value) {
        if (value === totalTime) {
          item.textContent += `Time: ${value}, `;
        } else {
          item.textContent += `Distance: ${value} miles.`;
        }
      });

      listDiv.append(item);
      return $('#notification_box').append(listDiv)
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

    // if sightings
    //   ul#list_of_sightings
    //     each sighting in sightings
    //       li(class='title-sighting') #{sighting.date}
    //         div(hidden, class="sub-details")
    //           p(class='detail') #[span User]: #{sighting.userName}
    //           p(class='detail') #[span Plant]: #{sighting.plantName}
    //           p#lat(class='detail') #[span Latitude]: #{sighting.lat}
    //           p#lng(class='detail') #[span Longitude]: #{sighting.lng}
    //           p(class='detail') #[span Description]: #{sighting.description}
      //     select(name='state', required)
      //   each state in states
      //     option #{state}
      // button(type='submit') Get Directions