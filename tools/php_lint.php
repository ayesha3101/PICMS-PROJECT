<?php
declare(strict_types=1);

/**
 * Simple PHP syntax lint runner.
 *
 * Usage:
 *   php tools/php_lint.php [glob...]
 *
 * Defaults to: src/php/*.php src/config/*.php
 */

$globs = array_slice($argv, 1);
if (!$globs) {
    $globs = ['src/php/*.php', 'src/config/*.php'];
}

$files = [];
foreach ($globs as $g) {
    foreach (glob($g) ?: [] as $f) {
        if (is_file($f)) {
            $files[$f] = true;
        }
    }
}

ksort($files);
$files = array_keys($files);

$errors = 0;
foreach ($files as $f) {
    $cmd = 'php -l ' . escapeshellarg($f) . ' 2>&1';
    $out = shell_exec($cmd) ?? '';
    if (strpos($out, 'No syntax errors detected') === false) {
        $errors++;
        fwrite(STDOUT, "\n### {$f}\n{$out}\n");
    }
}

fwrite(STDOUT, "\nChecked " . count($files) . " files; syntax errors: {$errors}\n");
exit($errors > 0 ? 1 : 0);

