$(function() {
  let mapper = {
    init: function() {
      this.drawMap();
      this.bindEvents();
      $('form')[0].action = window.location.pathname;
    },

    bindEvents: function() {
      $('textarea[name="description"]').on('keydown', $.proxy(this.preventEnter, this));
    },

    drawMap: function() {
      let mk = 'fZfmlBWpgC5pAU79YWdjp5AAnvmCuQfZ';

      L.mapquest.key = mk;

      let map = L.mapquest.map('map', {
        center: [25.7617, -80.1918],
        layers: L.mapquest.tileLayer('map'),
        zoom: 12
      });

      map.on('click', function(e) {
        $('div[class="leaflet-pane leaflet-marker-pane"] img').remove();
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;

        $('input[name="lat"]').val(lat);
        $('input[name="lng"]').val(lng);

        L.marker([lat, lng], {
          icon: L.mapquest.icons.marker({
            primaryColor: '#000000',
            secondaryColor: '#aaf0d1'
          }),
          draggable: false
        }).bindPopup(`${lat}, ${lng}`).addTo(map);        
      });
    },

    preventEnter: function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
      }
    }
  };

  mapper.init();
});