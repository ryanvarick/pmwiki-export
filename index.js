'use strict';

const RSVP = require('rsvp');

const config = require('./config.js');
const db = require('./lib/db.js');
const fs = require('./lib/fs.js');
const pmwiki = require('./lib/pmwiki.js');

// setup/startup
var initialize = function() {
    return new RSVP.all([
        fs.initialize(config),
        db.initialize(config),
        pmwiki.initialize(config)
    ]);
};

// initialize an empty Git repository
var initRepo = function(results) {
    return fs.initializeRepo();
}

// get the list of wiki pages from the server
var getWikiPages = function() {
    return pmwiki.getWikiPages();
}

// get the list of revisions for a given wiki page
var getRevisions = function(pages) {
    console.log('Exporting %s of %s total wiki pages...', pages.filteredWikiPages.length, pages.allWikiPages.length);
    var allRevisions = pages.filteredWikiPages.map(function(revisions) {
        return pmwiki
                .getRevisions(revisions)
                .then(fs.save)
                .then(db.store)
                .catch(function(error) {
                    console.error(error);
                });
    });
    return RSVP.allSettled(allRevisions);
};

// TODO: tally failures and successes
var commitRevisions = function(results) {
    db.size();
    db.lineUp(); // TODO: Decompose this function and make it return a promise
    // return <wathever>
};

// TODO: tally failures and successes
var finalizeRepo = function(results) {
    return new RSVP.Promise(function(resolve, reject) {
        // console.log('Tag/convert to MD')
    });
};

initialize()
    .then(getWikiPages)
    .then(getRevisions)
    .then(initRepo)
    .then(commitRevisions)
    .then(finalizeRepo)
    .catch(function(error) {
        console.error(error.message);
        console.error(error.error);
    })
    .finally(function() {
        console.log('All done.');
    });
