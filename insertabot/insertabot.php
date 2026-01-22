<?php
/**
 * Plugin Name: Insertabot - AI Chatbot Solution
 * Plugin URI: https://insertabot.io
 * Description: Add a customizable AI chatbot to your WordPress site. Real-time web search, unlimited conversations. Get your free API key at insertabot.io
 * Version: 1.0.0
 * Author: Mistyk Media
 * Author URI: https://mistykmedia.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: insertabot-ai-chatbot-solution
 * Domain Path: /languages
 * Requires at least: 5.9
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('INSERTABOT_VERSION', '1.0.0');
define('INSERTABOT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('INSERTABOT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('INSERTABOT_API_URL', 'https://api.insertabot.io');
define('INSERTABOT_WEBSITE_URL', 'https://insertabot.io');

// Load required includes
require_once INSERTABOT_PLUGIN_DIR . 'includes/class-security.php';
require_once INSERTABOT_PLUGIN_DIR . 'includes/admin-settings.php';
require_once INSERTABOT_PLUGIN_DIR . 'includes/rest.php';
require_once INSERTABOT_PLUGIN_DIR . 'includes/privacy.php';



/**
 * Main Insertabot Plugin Class
 */
class Insertabot_Plugin {
    
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Initialize admin settings
        if (class_exists('Insertabot_Admin_Settings')) {
            Insertabot_Admin_Settings::register();
        }

        // Enqueue admin styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_styles'));

        // Add widget script to frontend
        add_action('wp_footer', array($this, 'add_widget_script'));

        // Register shortcode
        add_shortcode('insertabot', array($this, 'shortcode_handler'));

        // Add settings link on plugins page
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_settings_link'));
    }
    
    /**
     * Enqueue admin styles
     */
    public function enqueue_admin_styles($hook) {
        // Check for both menu page slugs (top-level menu and settings submenu)
        if ('toplevel_page_insertabot' !== $hook && 'settings_page_insertabot-settings' !== $hook) {
            return;
        }

        wp_enqueue_style(
            'insertabot-admin',
            INSERTABOT_PLUGIN_URL . 'assets/admin.css',
            array(),
            INSERTABOT_VERSION
        );
    }
    
    /**
     * Add widget script to frontend
     *
     * Note: We do NOT expose the raw API key in page markup. A small bridge script
     * fetches a short-lived token from a REST endpoint which avoids leaking secrets.
     */
    public function add_widget_script() {
        // Only add if enabled and API key is set
        if (!get_option('insertabot_enabled', false)) {
            return;
        }

        // Use encrypted storage API (do not read the raw value for output)
        $api_key = class_exists( 'Insertabot_Security' ) ? Insertabot_Security::get_api_key() : '';
        if (empty($api_key)) {
            return;
        }

        $api_base = get_option('insertabot_api_base', INSERTABOT_API_URL);

        // Provide a small local bridge script that will request a short-lived token
        // and then dynamically load the external widget. This prevents raw key leakage.
        $token_endpoint = esc_url_raw(rest_url('insertabot/v1/widget-token'));
        $nonce = wp_create_nonce('wp_rest');
        ?>
        <script
            src="<?php echo esc_url(INSERTABOT_PLUGIN_URL); ?>assets/widget-bridge.js"
            data-api-base="<?php echo esc_attr($api_base); ?>"
            data-token-endpoint="<?php echo esc_attr($token_endpoint); ?>"
            data-nonce="<?php echo esc_attr($nonce); ?>"
            async
        ></script>
        <?php
    }
    
    /**
     * Shortcode handler
     */
    public function shortcode_handler($atts) {
        // This is handled by the widget script, just return empty
        // The widget automatically appears when the script is loaded
        return '';
    }
    
    /**
     * Add settings link on plugins page
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="' . esc_url(admin_url('options-general.php?page=insertabot-settings')) . '">' . esc_html__('Settings', 'insertabot-ai-chatbot-solution') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
}

// Initialize the plugin
function insertabot_init() {
    return Insertabot_Plugin::get_instance();
}
add_action('plugins_loaded', 'insertabot_init');

/**
 * Migrate plaintext API key (if any) to encrypted storage on init
 */
function insertabot_maybe_migrate_plaintext_key() {
    if ( ! class_exists( 'Insertabot_Security' ) ) {
        return;
    }

    $plain = get_option( 'insertabot_api_key', '' );
    $existing = Insertabot_Security::get_api_key();

    if ( is_string( $plain ) && '' !== $plain && '' === $existing ) {
        $validated = Insertabot_Security::validate_api_key( $plain );
        if ( ! is_wp_error( $validated ) ) {
            Insertabot_Security::store_api_key( $plain );
            // Remove plaintext value
            update_option( 'insertabot_api_key', '' );
        }
    }
}
add_action('init', 'insertabot_maybe_migrate_plaintext_key');

// Activation hook
register_activation_hook( __FILE__, 'insertabot_activate' );

/**
 * Plugin activation callback
 */
function insertabot_activate() {
    // Set default options
    add_option( 'insertabot_enabled', false );
    add_option( 'insertabot_api_key', '' );
    add_option( 'insertabot_api_base', INSERTABOT_API_URL );
}

// Deactivation hook
register_deactivation_hook( __FILE__, 'insertabot_deactivate' );

/**
 * Plugin deactivation callback
 */
function insertabot_deactivate() {
    // Nothing to do on deactivation
}
