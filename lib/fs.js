'use strict';

const fs = require('fs-extra');
const RSVP = require('rsvp');
const shell = require('shelljs');

var _config;

module.exports.initialize = function(config) {
    _config = config;
    return new RSVP.Promise(function(resolve, reject) {
        try {
            fs.removeSync(_config.outputDirectory);
            fs.mkdirsSync(_config.outputDirectory);
            fs.removeSync(_config.workingDirectory);
            fs.mkdirsSync(_config.workingDirectory);
            resolve();
        }
        catch(error) {
            reject({
                message: 'Error creating directories.',
                error: error
            });
        }
    });
};

module.exports.initializeRepo = function() {
    return new RSVP.Promise(function(resolve, reject) {
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
}

module.exports.save = function(record) {
    return new RSVP.Promise(function(resolve, reject) {
        fs.writeFile(
            _config.workingDirectory + record.page_name + '.json',
            JSON.stringify(record),
            function(error) {
                if(error) {
                    reject({
                        message: 'Error saving diffs to disk.',
                        error: error
                    });
                }
                else resolve(record);
            }
        );
    });
};
