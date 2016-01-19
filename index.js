'use strict';

const RSVP = require('rsvp');

const config = require('./config.js');
const db = require('./lib/db.js');
const fs = require('./lib/fs.js');
const pmwiki = require('./lib/pmwiki.js');

var initialize = function() {
    return new RSVP.all([
        fs.initialize(config),
        db.initialize(config),
        pmwiki.initialize(config)
    ]);
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
    return RSVP.allSettled(allVersions);
};

var getWikiPages = function() {
    return pmwiki.getWikiPages();
}

var summarize = function() {
    return db.summarize();
}

// TODO: tally failures and successes
var commitVersions = function(results) {
    // db.size();
    db.lineUp(); // TODO: Decompose this function and make it return a promise
    // return <wathever>
};

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
        console.log('Done.');
    });
