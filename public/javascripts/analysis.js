$(function() {
  let analyzer = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      $('#collection_selector').on('change', $.proxy(this.analyzePlant, this));
    },

    analyzePlant: function(e) {
      e.preventDefault();
      let id = Number($('#collection_selector').val());
      let self = this;
      let data = { id: id };

      fetch('/plants/search_single_plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(function(json) {
        let plantData = JSON.parse(json.body);
        // console.log(plantData);
        self.createGraph(plantData['main_species']);
      })
      .catch(function(err) {
        throw err;
        // DO SOMETHING HERE
      });
    },

    createGraph: function(plantData) {
      $('#analysis_graph').children().remove();

      const goodValues = ['Low', 'Medium', 'High', 'None', 'Slow', 'Moderate', 'Rapid', 'Tolerant', 'Intolerant', 'Intermediate'];
      const keys = ['specifications', 'seed', 'products', 'growth', 'fruit_or_seed' ];
      let data = [];
      let allProps;
      let field;
      let value;
      let self = this;

      keys.forEach(function(property) {
        allProps = Object.keys(plantData[property]);

        allProps.forEach(function(single) {
          if (typeof plantData[property][single] === 'string' && goodValues.includes(plantData[property][single])) {
            data.push({
              field: self.convertSnakeCase(single),
              value: self.getValue(plantData[property][single])
            });
          }
        });
      });

      let properties = data.map(function(obj) {
        return obj['field'];
      });

      let values = data.map(function(obj) {
        return obj['value'];
      });
      // create canvas
      let cv = document.createElement('canvas');
      cv.width = 400;
      cv.height = 500;
      cv.id = 'my-chart';
      $('#analysis_graph').append(cv);

      // create chart

      let noneColor = 'rgb(153, 0, 0)';
      let lowColor = 'rgb(255, 153, 51)';
      let medColor = 'rgb(255, 255, 153)';
      let highColor = 'rgb(153, 255, 153)';

      Chart.pluginService.register({
        beforeUpdate: function(chartInstance) {
          chartInstance.data.datasets.forEach(function(dataset) {
            dataset.backgroundColor = dataset.data.map(function(data) {
              if (data === 0) {
                return noneColor;
              } else if (data <= 35) {
                return lowColor;
              } else if (data <= 65) {
                return medColor;
              } else {
                return highColor;
              }
            });
          });
        }
      });

      let ctx = $('#my-chart');
      let myChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
          labels: properties,
          datasets: [{
            label: 'Rank',
            data: values,
            borderWidth: 1,
            minBarLength: 10
          }]
        },

        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });
    },

    getValue: function(string) {
      const lows = ['Low', 'Slow'];
      const meds = ['Medium', 'Moderate', 'Intermediate'];
      const highs = ['High', 'Rapid', 'Tolerant'];

      if (lows.indexOf(string) !== -1) {
        return this.randomNum(35, 10);
      } else if (meds.indexOf(string) !== -1) {
        return this.randomNum(65, 45);
      } else if (highs.indexOf(string) !== -1) {
        return this.randomNum(95, 75);
      } else {
        return 0;
      }
    },

    convertSnakeCase: function(string) {
      let arr = string.split('_');
      let capitalizedWords = [];

      arr.forEach(function(word) {
        capitalizedWords.push(word[0].toUpperCase() + word.slice(1));
      });

      return capitalizedWords.join(' ');
    },

    randomNum: function(max, min) {
      return Math.floor(Math.random() * (max - min) + min);
    }
  };

  analyzer.init();
});