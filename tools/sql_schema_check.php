<?php
declare(strict_types=1);

/**
 * Lightweight MySQL schema sanity checker.
 *
 * Checks:
 * - Can we discover CREATE TABLE names?
 * - Do all REFERENCES <table> targets exist in the schema?
 * - Basic statement termination check for CREATE TABLE blocks (ends with ';')
 *
 * Usage:
 *   php tools/sql_schema_check.php database/schema.sql
 */

$path = $argv[1] ?? 'database/schema.sql';
if (!is_file($path)) {
    fwrite(STDERR, "Schema not found: {$path}\n");
    exit(2);
}

$tables = [];
$refs = []; // [ ['line'=>int,'table'=>string,'raw'=>string], ... ]
$createTableStartLines = []; // table => line

$fh = fopen($path, 'rb');
if ($fh === false) {
    fwrite(STDERR, "Unable to open: {$path}\n");
    exit(2);
}

$lineNo = 0;
$inCreate = false;
$currentCreateTable = null;
$createHasSemicolon = false;

while (($line = fgets($fh)) !== false) {
    $lineNo++;
    $trim = trim($line);

    // Start CREATE TABLE
    if (!$inCreate) {
        if (preg_match('/^CREATE\s+TABLE\s+`?([A-Za-z0-9_]+)`?/i', $trim, $m)) {
            $inCreate = true;
            $currentCreateTable = $m[1];
            $createHasSemicolon = false;
            $tables[$currentCreateTable] = true;
            $createTableStartLines[$currentCreateTable] = $lineNo;
        }
    } else {
        // Track end of CREATE TABLE statement.
        if (str_contains($trim, ';')) {
            $createHasSemicolon = true;
        }
        // Typical MySQL CREATE TABLE ends with ");"
        if (preg_match('/\)\s*;/', $trim)) {
            $inCreate = false;
            $currentCreateTable = null;
            $createHasSemicolon = false;
        }
    }

    // Capture REFERENCES targets (works anywhere in file)
    if (preg_match_all('/\bREFERENCES\s+`?([A-Za-z0-9_]+)`?/i', $line, $mm, PREG_SET_ORDER)) {
        foreach ($mm as $m) {
            $refs[] = ['line' => $lineNo, 'table' => $m[1], 'raw' => rtrim($line)];
        }
    }
}
fclose($fh);

// Detect unterminated trailing CREATE TABLE (missing ");")
if ($inCreate && $currentCreateTable !== null) {
    fwrite(STDOUT, "ERROR: CREATE TABLE for `{$currentCreateTable}` (started line {$createTableStartLines[$currentCreateTable]}) does not appear to terminate with \");\".\n");
}

$tables = array_keys($tables);
sort($tables);

$missing = [];
foreach ($refs as $r) {
    if (!isset($tables[array_search($r['table'], $tables, true)])) {
        // faster: use associative set
    }
}

// Use associative set for missing resolution
$tableSet = array_fill_keys($tables, true);
foreach ($refs as $r) {
    if (!isset($tableSet[$r['table']])) {
        $missing[] = $r;
    }
}

fwrite(STDOUT, "Tables discovered: " . count($tables) . "\n");
fwrite(STDOUT, "REFERENCES discovered: " . count($refs) . "\n");
fwrite(STDOUT, "Missing referenced tables: " . count($missing) . "\n");

if ($missing) {
    // show first 50
    $limit = 50;
    $shown = 0;
    foreach ($missing as $m) {
        $shown++;
        fwrite(STDOUT, "- line {$m['line']}: references `{$m['table']}` in: {$m['raw']}\n");
        if ($shown >= $limit) {
            $more = count($missing) - $shown;
            if ($more > 0) {
                fwrite(STDOUT, "... and {$more} more\n");
            }
            break;
        }
    }
}

exit($missing ? 1 : 0);

