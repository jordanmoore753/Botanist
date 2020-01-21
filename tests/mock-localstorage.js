global.window = {};
require('./mock-localstorage.js');
window.localStorage = global.localStorage;