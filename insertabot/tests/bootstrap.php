<?php
// Basic bootstrap for WP test environment used by actions like 10up/action-phpunit

$_tests_dir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';

if (!file_exists($_tests_dir . '/includes/bootstrap.php')) {
    echo "Could not find WP test bootstrap at $_tests_dir/includes/bootstrap.php\n";
    exit(1);
}

require_once $_tests_dir . '/includes/bootstrap.php';

// Load plugin main file
require_once dirname(__DIR__) . '/insertabot.php';
