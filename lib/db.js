'use strict';

const RSVP = require('rsvp');
const sqlite3 = require('sqlite3').verbose();

const CREATE_QUERY =
    'CREATE TABLE versions (' +
    '  page_name       TEXT,' +
    '  author          TEXT,' +
    '  timestamp       INTEGER,' +
    '  commit_message  TEXT,' +
    '  source          TEXT' +
    ');';

const INSERT_QUERY =
    'INSERT INTO versions ' +
    'VALUES ($page_name, $author, $timestamp, $commit_message, $source);';

const SELECT_QUERY =
    'SELECT * FROM versions ORDER BY timestamp ASC';

const SUMMARIZE_QUERY =
    'SELECT count(*) FROM versions';

var _config;
var db;

// create empty DB
module.exports.initialize = function(config) {
    _config = config;
    return new RSVP.Promise(function(resolve, reject) {
        db = new sqlite3.Database(
            _config.workingDirectory + 'wiki.db',
            function(error) {
                if(error) reject({
                    message: 'Error creating database.',
                    error: error
                });
                else {
                    db.run(CREATE_QUERY);
                    resolve();
                }
            }
        );
    });
};

// store a record's versions in the DB
module.exports.store = function(record) {
    return new RSVP.Promise(function(resolve, reject) {
        var statement = db.prepare(INSERT_QUERY);
        record.versions.forEach(function(version) {
            statement.run({
                $page_name: record.page_name,
                $author: version.author,
                $timestamp: version.timestamp,
                $commit_message: version.commit_message,
                $source: version.source
            },
            function(error) {
                if(error) reject({
                    message: 'Error inserting record.',
                    error: error
                });
            });
        });
        statement.finalize();
        resolve(record);
    });
};

// retrieve all versions, passing each one off to the specified queryHandler
module.exports.selectVersions = function(queryHandler) {
    return new RSVP.Promise(function(resolve, reject) {
        var index = 1;
        db.each(
            SELECT_QUERY,
            function(error, row) {
                queryHandler(row, index++)
                    .catch(function(error) {
                        console.error(error.message);
                        console.error(error.error);
                    });
            },
            function(error) {
                if(error) reject({
                    message: 'Error retrieving versions.',
                    error: error
                })
                else resolve();
            }
        );
    });
};

// print the number of records in the DB
module.exports.summarize = function() {
    return new RSVP.Promise(function(resolve, reject) {
        db.get(SUMMARIZE_QUERY, function(error, row) {
            if(error) {
                reject({
                    message: 'Error summarizing DB status.',
                    error: error
                });
            }
            console.log('---------------');
            console.log('TOTAL versions:', row);
            console.log('---------------');
            resolve();
        });
    });
}
