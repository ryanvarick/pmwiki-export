# PmWiki Export

[PmWiki Export](http://www.pmwiki.org/wiki/Cookbook/PmWikiExport) works by using a Node script to communicate with a PmWiki cookbook recipe. The cookbook recipe exports PmWiki page history as a JSON object. The Node script retrieves the complete history for all pages, stores the history in a SQLite database, and "replays" each version chronologically in a new Git repository.

# Usage

First add `cookbook/export.php` to Pmwiki's `cookbook/` directory. Then add the following to `local.php`:

    include_once('cookbook/export.php');

Next, clone the repository locally and install dependencies:

    npm install

Finally, in `config.js`, specify what server to use and where to store the exported data. I recommend copying `wiki.d/` to a clean installation of PmWiki and running locally.

Run:

    node index.js

# Merging Repos

If you're like me and you have some other Git-based repo that you have been using, you can merge two repos into a single, chronologically ordered repo by [following these steps](http://stackoverflow.com/a/34861819/3135601) on Stack Overflow.
