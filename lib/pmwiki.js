'use strict';

const fs = require('fs');
const RSVP = require('RSVP');
const request = require('./request');
var _config;

module.exports.initialize = function(config) {
    _config = config;
}

module.exports.getVersions = function(wikiPageUrl) {
    return new RSVP.Promise(function(resolve, reject) {
        request(wikiPageUrl, function(error, response, body) {
            if(error || response.statusCode !== 200) {
                reject({
                    message: 'Error retrieving versions for wiki page, is the server running?',
                    error: error || response.statusCode,
                    url: wikiPageUrl
                });
            }
            else {
                if(body !== '') {
                    var response = JSON.parse(body);
                    console.log('%s → %s version(s)', wikiPageUrl, response.versions.length);
                    resolve(response);
                }
                else {
                    reject({
                        message: 'No versions for URL, does the page exist?',
                        error: wikiPageUrl
                    });
                }
            }
        });
    });
};

module.exports.getWikiPages = function() {
    return new RSVP.Promise(function(resolve, reject) {
        var exportAllUrl = _config.serverBaseUrl + '?action=exportAll';
        request(exportAllUrl, function(error, response, body) {
            if(error || response.statusCode !== 200) {
                reject({
                    message: 'Error retrieving list of wiki pages, is the server running?',
                    error: error || response.statusCode,
                    url: exportAllUrl
                });
            }
            else {
                var filteredWikiPages = [];
                var allWikiPages = JSON.parse(body);
                allWikiPages.forEach(function(page, index) {
                    for(var i = 0; i < _config.excludedWikiPages.length; i++) {
                        if(page.indexOf(_config.excludedWikiPages[i]) !== -1) return;
                    }
                    filteredWikiPages.push(_config.serverBaseUrl + '?n=' + page + '?action=export');
                });
                resolve({
                    allWikiPages: allWikiPages,
                    filteredWikiPages: filteredWikiPages
                });
            }
        });
    });
};
