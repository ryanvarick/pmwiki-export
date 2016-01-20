'use strict';

const fs = require('fs-extra');
const RSVP = require('rsvp');
const shell = require('shelljs');

var _config;

module.exports.initialize = function(config) {
    _config = config;
    return new RSVP.Promise(function(resolve, reject) {

        // create working directories
        try {
            fs.removeSync(_config.outputDirectory);
            fs.mkdirsSync(_config.outputDirectory);
            fs.removeSync(_config.workingDirectory);
            fs.mkdirsSync(_config.workingDirectory);
        }
        catch(error) {
            reject({
                message: 'Error creating directories.',
                error: error
            });
        }

        // initialize empty Git repository
        shell.cd(_config.outputDirectory);
        var exec = shell.exec('git init', { silent: true });
        if(exec.code !== 0) {
            reject({
                message: 'Error initializing Git repository.',
                error: exec.output
            });
        }
        else resolve();
    });
};

module.exports.commitVersion = function(record, index) {
    return new RSVP.Promise(function(resolve, reject) {
        var filename = record.page_name;
        var timestamp = new Date(record.timestamp * 1000);
        var commitMessage = (record.commit_message || _config.defaultCommitMessage);
        console.log('Commit', index, timestamp, filename, '→', commitMessage);

        // write version to disk
        try {
            fs.writeFileSync(filename, record.source);
        }
        catch(error) {
            reject({
                message: 'Error writing commit to disk.',
                error: error
            });
        }

        // `git add` the version
        var exec;
        shell.env['GIT_AUTHOR_NAME'] = record.author || _config.defaultAuthor;
        shell.env['GIT_AUTHOR_DATE'] = timestamp;
        shell.env['GIT_COMMITTER_DATE'] = timestamp;

        exec = shell.exec('git add ' + filename, { silent: true });
        if(exec.code !== 0) {
            reject({
                message: 'Error executing `git add`.',
                error: exec.output
            });
        }

        // `git commit` the version
        exec = shell.exec("git commit -m '" + commitMessage + "'", { silent: true });
        if(exec.code != 0) {
            reject({
                message: 'Error executing `git commit`.',
                error: exec.output
            });
        }
        
        resolve();
    });
};

module.exports.save = function(record) {
    return new RSVP.Promise(function(resolve, reject) {
        fs.writeFile(
            _config.workingDirectory + record.page_name + '.json',
            JSON.stringify(record),
            function(error) {
                if(error) {
                    reject({
                        message: 'Error saving diff to disk.',
                        error: error
                    });
                }
                else resolve(record);
            }
        );
    });
};
