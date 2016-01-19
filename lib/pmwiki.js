'use strict';

const fs = require('fs');
const RSVP = require('RSVP');
const request = require('./request');
var _config;

// filter out empty responses, they cause problems down the line
var parseResponse = function(response) {
    response = JSON.parse(response);
    response.revisions.forEach(function(revision, i) {
        if(revision.source === '') {
            response.revisions.splice(i, 1);
        }
    });
    return response;
}

module.exports.initialize = function(config) {
    _config = config;
}

module.exports.getRevisions = function(wikiPageUrl) {
    return new RSVP.Promise(function(resolve, reject) {
        request(wikiPageUrl, function(error, response, body) {
            if(error || response.statusCode !== 200) {
                reject({
                    message: 'Error retrieving revisions for wiki page, is the server running?',
                    error: error || response.statusCode,
                    url: wikiPageUrl
                });
            }
            else {
                if(body !== '') {
                    var response = parseResponse(body);
                    console.log('%s returned %s revision(s)', wikiPageUrl, response.revisions.length);
                    resolve(response);
                }
                else {
                    reject({
                        message: 'No revisions for URL, does the page exist?',
                        error: wikiPageUrl
                    });
                }
            } // end else
        }); // end request
    }); // end return promise
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
                // console.log(body);
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
            } // end else
        }); // end request
    }); // end return promise
};
