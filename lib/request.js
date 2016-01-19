var request = require('request');

var lockDuration = 200;

var isLocked = false;
var lock = function() { isLocked = true; }
var unlock = function() { isLocked = false; }

module.exports = function(url, handler) {
    var makeRequest = function() {
        lock();
        setTimeout(unlock, lockDuration);
        request(url, handler);
    }
    var tryRequest = function() {
        if(isLocked) setTimeout(tryRequest, lockDuration);
        else makeRequest();
    }
    tryRequest();
};
