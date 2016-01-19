<?php if (!defined('PmWiki')) exit();

/**
* EXPORT - Export page history as a JSON object, with the complete markup
* for each version
*
* @author Ryan Varick <pmwiki@ryanvarick.com>
*
*/

$RecipeInfo['Export']['Version'] = '2016-01-18';

# ?action=export - Returns the version history of the current page
$HandleActions['export'] = 'ExportAction';
$HandleAuth['export'] = 'admin';

# ?action=exportAll - Returns the list of wiki pages to export
$HandleActions['exportAll'] = 'ExportAllAction';
$HandleAuth['exportAll'] = 'admin';

 // mostly taken from `PrintDiff` in `scripts/pagerev.php`
function ExportAction($pagename, $auth) {

    // read the page and sort keys chronologically
    $page = ReadPage($pagename);
    if(!$page || !$page['name']) return;
    krsort($page); reset($page);

    // start with the latest version
    $versions = [];
    $version['author'] = $page['author'];
    $version['timestamp'] = $page['time'];
    $version['source'] = utf8_encode($page['text']);
    array_push($versions, $version);

    // then use page diffs to restore markup for older version
    foreach($page as $key => $value) {
        if(!preg_match("/^diff:(\d+):(\d+):?([^:]*)/", $key, $match)) continue;

        // ignore the original diff tag, which is is not a delta, and some rare dupes
        if($match[1] === $match[2]) continue;
        if(array_search($match[2], array_column($versions, 'timestamp'))) continue;

        $diffgmt = $match[1];
        $diffauthor = @$page["author:$diffgmt"];
        if(!$diffauthor) @$diffauthor=$page["host:$diffgmt"];
        if(!$diffauthor) $diffauthor="unknown";
        $diffchangesum = PHSC(@$page["csum:$diffgmt"]);

        $version = [];
        $version['author'] = $diffauthor;
        $version['timestamp'] = $match[2];
        $version['commit_message'] = $diffchangesum;
        $version['source'] = utf8_encode(RestorePage($pagename, $page, $new, $match[0]));
        array_push($versions, $version);
    }

    // finalize response
    $response['page_name'] = $pagename;
    $response['revisions'] = $versions;
    $response = json_encode($response);
    // debugging
    // error_log($pagename . ' length: ' . strlen($response) . ', last JSON error: ' . json_last_error_msg());
    echo $response;
}

function ExportAllAction($pagename, $auth) {
    global $PageListCacheDir, $PageIndexFile;
    $response = [];
    $index = getcwd() . $PageListCacheDir . '/' . $PageIndexFile;
    $file = fopen($index, 'r');
    if($file) {
        while(!feof($file)) {
            $line = fgets($file);
            $line = explode(':', $line)[0];
            if($line <> '') array_push($response, utf8_encode($line));
        }
        fclose($file);
    }
    else {
        error_log('Error opening $PageIndexFile.');
    }
    $response = json_encode($response);
    // debugging
    // error_log('Response length: ' . strlen($response));
    echo $response;
}