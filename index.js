'use strict';

const RSVP = require('rsvp');

const config = require('./config.js');
const db = require('./lib/db.js');
const fs = require('./lib/fs.js');
const pmwiki = require('./lib/pmwiki.js');

var _startTime;

var initialize = function() {
    _startTime = Date.now();
    return new RSVP.all([
        fs.initialize(config),
        db.initialize(config),
        pmwiki.initialize(config)
    ]);
};

var commitVersions = function(results) {
    return db.selectVersions(fs.commitVersion);
};

var getVersions = function(pages) {
    console.log('Exporting %s of %s total wiki pages...', pages.filteredWikiPages.length, pages.allWikiPages.length);
    var allVersions = pages.filteredWikiPages.map(function(versions) {
        return pmwiki
                .getVersions(versions)
                .then(fs.save)
                .then(db.store)
                .catch(function(error) {
                    console.error(error.message);
                    console.error(error.error);
                });
    });
    return RSVP.all(allVersions);
};

var getWikiPages = function() {
    return pmwiki.getWikiPages();
}

var summarize = function() {
    return db.summarize();
}

initialize()
    .then(getWikiPages)
    .then(getVersions)
    .then(summarize)
    .then(commitVersions)
    .catch(function(error) {
        console.error(error.message);
        console.error(error.error);
    })
    .finally(function() {
        var elapsedTime = ((Date.now() - _startTime) / 1000).toFixed(0);
        console.log('Export complete after', elapsedTime, 'seconds.');
    });
