'use strict';

const fs = require('fs-extra');
const RSVP = require('rsvp');
const shell = require('shelljs');
const sqlite3 = require('sqlite3').verbose();

const CREATE_QUERY =
    'CREATE TABLE revisions (' +
    '  page_name       TEXT,' +
    '  author          TEXT,' +
    '  timestamp       INTEGER,' +
    '  commit_message  TEXT,' +
    '  source          TEXT' +
    ');';

const INSERT_QUERY =
    'INSERT INTO revisions ' +
    'VALUES ($page_name, $author, $timestamp, $commit_message, $source);';

const SELECT_QUERY =
    'SELECT * FROM revisions ORDER BY timestamp ASC';

var _config;
var db;

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

module.exports.store = function(record) {
    return new RSVP.Promise(function(resolve, reject) {
        var statement = db.prepare(INSERT_QUERY);
        record.revisions.forEach(function(revision) {
            statement.run({
                $page_name: record.page_name,
                $author: revision.author,
                $timestamp: revision.timestamp,
                $commit_message: revision.commit_message,
                $source: revision.source
            },
            // TODO: test rejection
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

module.exports.size = function() {
    db.get('SELECT count(*) FROM revisions', function(error, row) {
        console.log('TOTAL revisions:', row);
    });
    db.get('SELECT count(*) FROM revisions WHERE source = ""', function(error, row) {
        console.log('EMPTY revisions:', row);
    });
}

// TODO: Move out of DB / decompose
module.exports.lineUp = function() {
    var i = 1;
    db.each(SELECT_QUERY, function(err, row) {
        if(err) {
            throw new Error('Database error:' + err);
        }

        var filename = row.page_name;
        var timestamp = new Date(row.timestamp * 1000);
        var msg = (row.commit_message || _config.defaultCommitMessage);
        console.log('Committing revision', i++, timestamp, row.page_name);

        try {
            fs.writeFileSync(filename, row.source);
        }
        catch(error) {
            throw new Error('Filesystem error:' + error);
        }

        var exec;
        shell.env['GIT_AUTHOR_NAME'] = row.author || _config.defaultAuthor;
        shell.env['GIT_AUTHOR_DATE'] = timestamp;
        shell.env['GIT_COMMITTER_DATE'] = timestamp;

        exec = shell.exec('git add ' + filename, { silent: true });
        if(exec.code !== 0) {
            console.error('git add error:', exec.output);
        }

        exec = shell.exec("git commit -m '" + msg + "'", { silent: true });
        if(exec.code != 0) {
            console.error('COMMIT FAILED:', exec.output);
        }
    });
};
