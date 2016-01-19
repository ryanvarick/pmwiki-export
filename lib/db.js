'use strict';

const fs = require('fs-extra');
const RSVP = require('rsvp');
const shell = require('shelljs');
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
        record.versions.forEach(function(version) {
            statement.run({
                $page_name: record.page_name,
                $author: version.author,
                $timestamp: version.timestamp,
                $commit_message: version.commit_message,
                $source: version.source
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
            console.log('TOTAL versions retrieved from PmWiki:', row);
            console.log('---------------');
            resolve();
        });
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
        console.log('Committing version', i++, timestamp, row.page_name);

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
