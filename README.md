# PmWiki Export

Exports PmWiki pages to a Git-based repository.

PmWiki Export works by using a Node script to communicate with a PmWiki cookbook recipe. The recipe exports PmWiki page history as a JSON object. The Node script retrieves the complete history for all pages, stores the history in a SQLite database, and "replays" each version chronologically in a new Git repository.

# Installation

First add `cookbook/export.php` to the `cookbook/` directory. Then add the following to `local.php`:

    include_once('cookbook/export.php');

Next, clone the repository locally and install dependencies:

    npm install

Finally, in `config.js`, specify what server to use and where to store the exported data. I recommend copying `wiki.d/` to a clean installation of PmWiki and running locally.

Run:

    node index.js
