<?php
require_once 'src/config/config.php';

$triggers = [
    'before_sho_appoint',
    'before_superintendent_appoint'
];

foreach ($triggers as $trigger) {
    $sql = "DROP TRIGGER IF EXISTS $trigger";
    if ($conn->query($sql)) {
        echo "✓ Dropped trigger: $trigger\n";
    } else {
        echo "✗ Failed to drop $trigger: " . $conn->error . "\n";
    }
}

echo "\nDone! Triggers removed. SHO/Superintendent appointments should now work.\n";
?>
