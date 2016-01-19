'use strict';

module.exports = {

    serverBaseUrl: 'http://localhost:8080/pmwiki.php',

    outputDirectory: 'pmwiki/',
    workingDirectory: 'pmwiki.tmp/',

    defaultAuthor: 'Unknown',
    defaultCommitMessage: 'Minor update',

    excludedWikiPages: [

        // files marked for deletion
        ',',

        // auto-generated PmWiki files
        'Category.',
        'GroupAttributes',
        'GroupHeader',
        'PmWiki',
        'RecentChanges',
        'RecentPages',
        'RecentUploads',
        'SiteAdmin.',
    ],
};
