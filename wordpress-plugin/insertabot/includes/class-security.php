<?php
/**
 * Insertabot Security Class
 * Handles encryption, decryption, and secure storage of sensitive data
 * GDPR Compliant data protection
 */

if (!defined('ABSPATH')) {
    exit;
}

class Insertabot_Security {
    
    /**
     * Encryption method
     */
    private const CIPHER_METHOD = 'AES-256-CBC';
    
    /**
     * Get encryption key derived from WordPress salts
     * 
     * @return string
     */
    private static function get_encryption_key() {
        // Use WordPress salts to create a unique encryption key
        $salt = defined('AUTH_KEY') ? AUTH_KEY : '';
        $salt .= defined('SECURE_AUTH_KEY') ? SECURE_AUTH_KEY : '';
        $salt .= defined('LOGGED_IN_KEY') ? LOGGED_IN_KEY : '';
        
        if (empty($salt)) {
            // Fallback if salts aren't defined (shouldn't happen in production)
            error_log('Insertabot: WordPress security salts not defined. Using fallback.');
            $salt = 'insertabot_fallback_' . DB_NAME . DB_USER;
        }
        
        // Create a 256-bit key
        return hash('sha256', $salt, true);
    }
    
    /**
     * Encrypt sensitive data
     * 
     * @param string $data Data to encrypt
     * @return string|false Encrypted data or false on failure
     */
    public static function encrypt($data) {
        if (empty($data)) {
            return $data;
        }
        
        try {
            $key = self::get_encryption_key();
            $iv_length = openssl_cipher_iv_length(self::CIPHER_METHOD);
            $iv = openssl_random_pseudo_bytes($iv_length);
            
            $encrypted = openssl_encrypt(
                $data,
                self::CIPHER_METHOD,
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($encrypted === false) {
                error_log('Insertabot: Encryption failed');
                return false;
            }
            
            // Combine IV and encrypted data, then base64 encode
            return base64_encode($iv . $encrypted);
            
        } catch (Exception $e) {
            error_log('Insertabot Encryption Error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Decrypt sensitive data
     * 
     * @param string $encrypted_data Encrypted data
     * @return string|false Decrypted data or false on failure
     */
    public static function decrypt($encrypted_data) {
        if (empty($encrypted_data)) {
            return $encrypted_data;
        }
        
        try {
            $key = self::get_encryption_key();
            $data = base64_decode($encrypted_data, true);
            
            if ($data === false) {
                return false;
            }
            
            $iv_length = openssl_cipher_iv_length(self::CIPHER_METHOD);
            $iv = substr($data, 0, $iv_length);
            $encrypted = substr($data, $iv_length);
            
            $decrypted = openssl_decrypt(
                $encrypted,
                self::CIPHER_METHOD,
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($decrypted === false) {
                error_log('Insertabot: Decryption failed');
                return false;
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            error_log('Insertabot Decryption Error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Securely store API key
     * 
     * @param string $api_key The API key to store
     * @return bool Success status
     */
    public static function store_api_key($api_key) {
        if (empty($api_key)) {
            delete_option('insertabot_api_key_encrypted');
            return true;
        }
        
        $encrypted = self::encrypt($api_key);
        
        if ($encrypted === false) {
            return false;
        }
        
        return update_option('insertabot_api_key_encrypted', $encrypted, false);
    }
    
    /**
     * Retrieve and decrypt API key
     * 
     * @return string The decrypted API key
     */
    public static function get_api_key() {
        $encrypted = get_option('insertabot_api_key_encrypted', '');
        
        if (empty($encrypted)) {
            return '';
        }
        
        $decrypted = self::decrypt($encrypted);
        
        return $decrypted !== false ? $decrypted : '';
    }
    
    /**
     * Sanitize and validate API key format
     * 
     * @param string $api_key The API key to validate
     * @return string|WP_Error Sanitized key or WP_Error on failure
     */
    public static function validate_api_key($api_key) {
        $api_key = sanitize_text_field(trim($api_key));
        
        // Check format: should start with ib_sk_
        if (!empty($api_key) && !preg_match('/^ib_sk_[a-zA-Z0-9_]{32,}$/', $api_key)) {
            return new WP_Error(
                'invalid_api_key',
                __('Invalid API key format. Key should start with "ib_sk_" followed by at least 32 characters.', 'insertabot')
            );
        }
        
        return $api_key;
    }
    
    /**
     * Hash API key for logging purposes (never log full key)
     *
     * @param string $api_key The API key
     * @return string Hashed key (first 4 chars + hash of rest)
     */
    public static function hash_api_key_for_log($api_key) {
        if (strlen($api_key) < 8) {
            return '***';
        }

        // Show only first 4 chars to minimize exposure
        $prefix = substr($api_key, 0, 4);
        $hash = substr(hash('sha256', $api_key), 0, 8);

        return $prefix . '...' . $hash;
    }
    
    /**
     * Log security events
     *
     * @param string $event Event description
     * @param array $context Additional context
     */
    public static function log_event($event, $context = array()) {
        // Allow developers to disable logging via filter
        if (!apply_filters('insertabot_enable_security_logging', true)) {
            return;
        }

        $log_entry = array(
            'timestamp' => current_time('mysql'),
            'event' => $event,
            'user_id' => get_current_user_id(),
            'ip' => self::get_client_ip(),
            'context' => $context
        );

        $logs = get_option('insertabot_security_logs', array());

        // Keep only last 100 entries
        if (count($logs) >= 100) {
            array_shift($logs);
        }

        $logs[] = $log_entry;
        update_option('insertabot_security_logs', $logs, false);
    }
    
    /**
     * Get client IP address (GDPR: anonymize last octet)
     * 
     * @param bool $anonymize Whether to anonymize the IP
     * @return string IP address
     */
    public static function get_client_ip($anonymize = true) {
        $ip = '';
        
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        
        $ip = filter_var($ip, FILTER_VALIDATE_IP);
        
        if ($anonymize && $ip) {
            // Anonymize IP for GDPR compliance
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                // IPv4: set last octet to 0
                $parts = explode('.', $ip);
                $parts[3] = '0';
                $ip = implode('.', $parts);
            } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
                // IPv6: set last 80 bits to 0
                $parts = explode(':', $ip);
                for ($i = 5; $i < 8; $i++) {
                    if (isset($parts[$i])) {
                        $parts[$i] = '0';
                    }
                }
                $ip = implode(':', $parts);
            }
        }
        
        return $ip ?: '0.0.0.0';
    }
    
    /**
     * Verify nonce for AJAX requests
     * 
     * @param string $nonce The nonce to verify
     * @param string $action The action name
     * @return bool Whether nonce is valid
     */
    public static function verify_nonce($nonce, $action = 'insertabot_action') {
        return wp_verify_nonce($nonce, $action) !== false;
    }
    
    /**
     * Generate nonce for AJAX requests
     * 
     * @param string $action The action name
     * @return string The nonce
     */
    public static function create_nonce($action = 'insertabot_action') {
        return wp_create_nonce($action);
    }
    
    /**
     * Check if user has permission to manage plugin
     * 
     * @return bool
     */
    public static function current_user_can_manage() {
        return current_user_can('manage_options');
    }
    
    /**
     * Sanitize widget configuration data
     *
     * @param array $config Configuration array
     * @return array Sanitized configuration
     */
    public static function sanitize_widget_config($config) {
        $sanitized = array();

        if (isset($config['primary_color'])) {
            $color = sanitize_text_field($config['primary_color']);
            // Validate hex color format (#RRGGBB)
            if (preg_match('/^#[a-fA-F0-9]{6}$/', $color)) {
                $sanitized['primary_color'] = $color;
            }
        }

        if (isset($config['position'])) {
            $allowed_positions = array('bottom-right', 'bottom-left', 'top-right', 'top-left');
            $sanitized['position'] = in_array($config['position'], $allowed_positions, true)
                ? $config['position']
                : 'bottom-right';
        }

        if (isset($config['bot_name'])) {
            $sanitized['bot_name'] = sanitize_text_field($config['bot_name']);
        }

        if (isset($config['bot_avatar_url'])) {
            // Sanitize URL and validate it's a valid image URL
            $url = esc_url_raw($config['bot_avatar_url']);
            if (!empty($url) && filter_var($url, FILTER_VALIDATE_URL)) {
                $sanitized['bot_avatar_url'] = $url;
            }
        }

        if (isset($config['greeting_message'])) {
            $sanitized['greeting_message'] = sanitize_textarea_field($config['greeting_message']);
        }

        if (isset($config['placeholder_text'])) {
            $sanitized['placeholder_text'] = sanitize_text_field($config['placeholder_text']);
        }

        if (isset($config['system_prompt'])) {
            $sanitized['system_prompt'] = sanitize_textarea_field($config['system_prompt']);
        }

        return $sanitized;
    }
}
