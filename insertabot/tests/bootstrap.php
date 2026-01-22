<?php
// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Basic bootstrap for WP test environment used by actions like 10up/action-phpunit

$insertabot_tests_dir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';

if (!file_exists($insertabot_tests_dir . '/includes/bootstrap.php')) {
    echo esc_html("Could not find WP test bootstrap at {$insertabot_tests_dir}/includes/bootstrap.php\n");
    exit(1);
}

require_once $insertabot_tests_dir . '/includes/bootstrap.php';

// Load plugin main file
require_once dirname(__DIR__) . '/insertabot.php';
