$(function() {
  let analyzer = {
    init: function() {
      this.bindEvents();

      if ($('.list a').length > 0) {
        $('.list a').first().trigger('click');
      }
    },

    bindEvents: function() {
      $('#analysis_graph').on('click', '.key-item', $.proxy(this.clickShowDetail, this));
      $('#collection').on('click', 'a', $.proxy(this.analyzePlant, this));
      $('#deleter_btn').on('click', $.proxy(this.deletePlant, this));
      $('#add_viewer_btn').on('click', $.proxy(this.goToAdd, this));
      $('#view_sightings_btn').on('click', $.proxy(this.goToView, this));
      $('#view_notes_btn').on('click', $.proxy(this.goToNotes, this));
    },

    clickShowDetail: function(e) {
      e.preventDefault();

      $('#details_info div').remove();
      $('#details_info p').remove();

      let li;
      let content = document.createElement('div');
      content.classList.add('content');
      $('#details_info').css('height', '325px');
      $('#details_info').css('overflow', 'auto');

      let ol = document.createElement('ol');
      ol.style.marginLeft = '0em';
      ol.style.marginTop = `0`;
      content.append(ol);

      $('#details_info').append(content);
      let $items = $(e.target).find('li');
      let f;
      let s;
      let one;
      let two;

      $items.each(function(i, e) {
        f = e.textContent.split(':')[0];
        s = e.textContent.split(':')[1];
        one = document.createElement('span');
        one.classList.add('key-class');
        one.textContent = f;
        two = document.createElement('span');
        two.classList.add('desc-class');
        two.textContent = ': ' + s;

        li = document.createElement('li');
        li.append(one);
        li.append(two);
        li.classList.add('detail-item');
        $('#details_info div ol').append(li);
      });

      $('#details_info li').css('display', 'block');
       // insert all sub a links into separate column
    },

    populateDetails: function(plantData) {
      const capitalize = (key) => {
        let stringArr = key.split('_');
        stringArr = stringArr.map((word) => word[0].toUpperCase() + word.slice(1));
        return stringArr.join(' ');
      };

      const getValues = (parentList, object) => {
        const noValues = '012345678';
        const noConversions = ['cm', 'acre', 'deg_c'];
        const special = ['inches', 'sqm', 'ft', 'deg_f'];
        const converts = {
          true: 'Yes',
          false: 'No',
          null: 'Information not available.'
        };
        const inc = ['specifications', 'soils_adaptation', 'seed', 'propagation', 'products', 'growth', 'fruit_or_seed'];
        const convertsTwo = {
          inches: 'Precipitation (Low-High): ',
          deg_f: 'Temperature Minimum: ',
          ft: 'Height (Max-Mature): ',
          sqm: 'Planting Density (Min-Max): '
        };

        let div;
        let li;
        let keys = Object.keys(object);

        keys.forEach(function(key) {
          if (object[key] === null) {
            return;
          } else if (typeof object[key] === 'object' && inc.includes(key)) {
            let div = document.createElement('a');

            div.textContent = noValues.includes(key) ? '' : capitalize(key);
            div.classList.add('list-item', 'key-item');
            parentList.append(div);

            getValues(div, object[key]);
          } else if (typeof object[key] === 'object') {
            getValues(parentList, object[key]);
          } else {
            if (noConversions.includes(key)) {
              return;
            }

            li = document.createElement('li');
            li.classList.add('list-item', 'has-text-primary');

            if (special.includes(key)) {
              li.textContent = convertsTwo[key] + object[key] + ' ' + capitalize(key);
              li.style.display = 'none';
              parentList.append(li);
              return;
            }

            li.textContent = capitalize(key) + ': ';
            li.textContent += converts[object[key]] ? converts[object[key]] : object[key];
            li.style.display = 'none';
            parentList.append(li);
          }
        });
      };

      $('#analysis_graph div').remove();
      let fields = ['specifications', 'soils_adaptation', 'seed', 'propagation', 'products', 'growth', 'fruit_or_seed'];
      let firstObject = [];
      fields.forEach(function(key) {
        firstObject[key] = plantData[key];
      });

      let div = document.createElement('div');
      div.classList.add('list', 'is-hoverable');

      getValues(div, firstObject);
      $('#analysis_graph').append(div);
      return;
    },

    goToAdd: function(e) {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a plant to add a sighting for.' });
        return;
      }

      let id = $('.list-item.is-active').attr('data-value');
      return window.location.replace('/plants/sightings/add/' + id);
    },

    goToView: function(e) {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a plant to view sightings for.' });
        return;
      }

      let id = $('.list-item.is-active').attr('data-value');
      return window.location.replace('/plants/sightings/view/' + id);
    },

    goToNotes: function(e) {
      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a plant to view field notes for.' });
        return;
      }

      let id = $('.list-item.is-active').attr('data-value');
      return window.location.replace('/plants/fieldnotes/view/' + id);     
    },

    deletePlant: function(e) {
      e.preventDefault();

      if ($('.list a.is-active').length < 1) {
        this.newMsg({ error: 'You must select a plant to delete.' });
        return;
      }

      let id = $('.list-item.is-active').attr('data-value');
      let self = this;
      let data = { id: id };

      fetch('/plants/analysis/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(function(json) {
        $('.list-item.is-active').remove();

        if ($('.list-item').length === 0) {
          $('.list').remove();
          let b = document.createElement('div');
          let para = document.createElement('p');

          b.classList.add('box');
          para.classList.add('is-medium');
          para.textContent = 'There are no plants in your collection.';

          b.append(para);
          $('#collection').append(b);
        }

        $('#analysis_graph div').remove();
        self.resetDetails();
        return self.newMsg({ success: json.msg });
      })
      .catch(function(err) {
        return self.newMsg({ error: 'That plant could not be deleted.' });
      });
    },

    resetDetails: function() {
      $('#details_info p').remove();
      $('#details_info div').remove();
      $('#details_info').css('height', 'auto');

      let p = document.createElement('p');
      p.textContent = 'Click on an attribute in the list to the left to see its information.';
      p.classList.add('is-medium', 'has-text-centered');

      $('#details_info').append(p);
    },

    newMsg: function(msg) {
      $('div.notification').remove();
      $('canvas').remove();
      $('#analysis_graph p').remove();

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

      $('#analysis_graph').append(notification);
    },

    analyzePlant: function(e) {
      e.preventDefault();
      
      $('#analysis_graph p').remove();
      let id = $(e.target).attr('data-value');
      let self = this;
      let data = { id: id };

      $('.list a').removeClass('is-active');
      e.target.classList.add('is-active');

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
        self.resetDetails();
        self.populateDetails(plantData['main_species']);
        //self.createGraph(plantData['main_species']);
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
      let id = plantData['id'];

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

      // change values of buttons and href

      // create canvas
      let cv = document.createElement('canvas');
      cv.width = 300;
      cv.height = 400;
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
        return this.randomNum(35, 30);
      } else if (meds.indexOf(string) !== -1) {
        return this.randomNum(65, 60);
      } else if (highs.indexOf(string) !== -1) {
        return this.randomNum(95, 90);
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