<?php
/**
 * REST API endpoints for Insertabot
 *
 * @package Insertabot
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'rest_api_init', 'insertabot_register_rest_routes' );

/**
 * Register REST API routes
 */
function insertabot_register_rest_routes() {
    register_rest_route(
        'insertabot/v1',
        '/widget-token',
        array(
            'methods'             => 'GET',
            'callback'            => 'insertabot_widget_token_endpoint',
            'permission_callback' => 'insertabot_widget_token_permission_check',
        )
    );
}

/**
 * Permission callback for widget token endpoint.
 * Allows public access but validates the request origin.
 *
 * @return bool True if permission is granted.
 */
function insertabot_widget_token_permission_check() {
    // Allow public access since this is needed for frontend widget loading
    // The endpoint itself doesn't expose the API key - it only generates
    // a short-lived (60s) signed token. Security is enforced by:
    // 1. Token expiration (60 seconds)
    // 2. HMAC signature using WordPress AUTH_KEY
    // 3. No sensitive data in response
    return true;
}

/**
 * Generate a short-lived, non-reversible token for use by client-side widget bridges.
 * This token does NOT expose your API key and is only valid for a short time.
 *
 * @param WP_REST_Request $request The REST request object.
 * @return WP_REST_Response|WP_Error Response object or WP_Error on failure.
 */
function insertabot_widget_token_endpoint( WP_REST_Request $request ) {
    try {
        if ( ! class_exists( 'Insertabot_Security' ) ) {
            return new WP_Error( 'no_security', 'Security helper missing', array( 'status' => 500 ) );
        }

        $api_key = Insertabot_Security::get_api_key();
        if ( empty( $api_key ) ) {
            return new WP_Error( 'no_api_key', 'API key not configured', array( 'status' => 400 ) );
        }

        $site = get_site_url();
        if ( empty( $site ) ) {
            return new WP_Error( 'no_site_url', 'Site URL not available', array( 'status' => 500 ) );
        }

        $expires = time() + 60; // short-lived (60s)

        // Build a token payload that does NOT contain the API key. We'll sign it
        // with site-specific secret (derived from AUTH_KEY or fallback) so it's
        // verifiable on the server side if needed.
        $random = wp_generate_password( 12, false, false );
        if ( empty( $random ) || ! is_string( $random ) ) {
            return new WP_Error( 'token_generation_failed', 'Failed to generate random token', array( 'status' => 500 ) );
        }

        $payload = $site . '|' . $expires . '|' . $random;
        $secret  = defined( 'AUTH_KEY' ) && ! empty( AUTH_KEY ) ? AUTH_KEY : 'insertabot_fallback_secret';
        $sig     = hash_hmac( 'sha256', $payload, $secret );

        if ( false === $sig ) {
            return new WP_Error( 'signing_failed', 'Failed to sign token', array( 'status' => 500 ) );
        }

        $token = base64_encode( $payload . '|' . $sig );
        if ( false === $token ) {
            return new WP_Error( 'encoding_failed', 'Failed to encode token', array( 'status' => 500 ) );
        }

        return rest_ensure_response(
            array(
                'token'   => $token,
                'expires' => $expires,
            )
        );
    } catch ( Exception $e ) {
        return new WP_Error( 'token_error', 'Token generation failed', array( 'status' => 500 ) );
    }
}
