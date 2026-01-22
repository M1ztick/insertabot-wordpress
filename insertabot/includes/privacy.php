<?php
/**
 * Insertabot Privacy handlers
 * Registers personal data exporter and eraser callbacks for WP privacy tools
 *
 * @package Insertabot
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_filter( 'wp_privacy_personal_data_exporters', 'insertabot_register_personal_data_exporter' );
add_filter( 'wp_privacy_personal_data_erasers', 'insertabot_register_personal_data_eraser' );

/**
 * Register exporter with WP privacy tools
 *
 * @param array $exporters Array of exporters.
 * @return array Modified array of exporters.
 */
function insertabot_register_personal_data_exporter( array $exporters ) {
    $exporters['insertabot-logs'] = array(
        'exporter_friendly_name' => __( 'Insertabot security logs', 'insertabot' ),
        'callback'               => 'insertabot_personal_data_exporter',
    );
    return $exporters;
}

/**
 * Export personal data tied to an email address (security logs)
 *
 * @param string $email_address Email address to export data for.
 * @param int    $page          Page number.
 * @return array Export data array.
 */
function insertabot_personal_data_exporter( $email_address, $page = 1 ) {
    $user = get_user_by( 'email', $email_address );
    if ( ! $user ) {
        return array(
            'data' => array(),
            'done' => true,
        );
    }

    $user_id = $user->ID;
    $logs    = (array) get_option( 'insertabot_security_logs', array() );

    $data = array();
    foreach ( $logs as $index => $log ) {
        if ( isset( $log['user_id'] ) && intval( $log['user_id'] ) === $user_id ) {
            $item_id = 'insertabot-log-' . $index;
            $entries = array(
                array(
                    'name'  => 'timestamp',
                    'value' => $log['timestamp'] ?? '',
                ),
                array(
                    'name'  => 'event',
                    'value' => $log['event'] ?? '',
                ),
                array(
                    'name'  => 'ip',
                    'value' => $log['ip'] ?? '',
                ),
                array(
                    'name'  => 'context',
                    'value' => isset( $log['context'] ) ? wp_json_encode( $log['context'] ) : '',
                ),
            );

            $data[] = array(
                'group_id'    => 'insertabot-logs',
                'group_label' => __( 'Insertabot security logs', 'insertabot' ),
                'item_id'     => $item_id,
                'data'        => $entries,
            );
        }
    }

    return array(
        'data' => $data,
        'done' => true,
    );
}

/**
 * Register eraser with WP privacy tools
 *
 * @param array $erasers Array of erasers.
 * @return array Modified array of erasers.
 */
function insertabot_register_personal_data_eraser( array $erasers ) {
    $erasers['insertabot-logs'] = array(
        'eraser_friendly_name' => __( 'Insertabot security logs', 'insertabot' ),
        'callback'             => 'insertabot_personal_data_eraser',
    );
    return $erasers;
}

/**
 * Erase personal data tied to an email address (security logs)
 *
 * @param string $email_address Email address to erase data for.
 * @param int    $page          Page number.
 * @return array Erase result array.
 */
function insertabot_personal_data_eraser( $email_address, $page = 1 ) {
    $result = array(
        'items_removed'    => array(),
        'items_retained'   => array(),
        'items_erased'     => array(),
        'items_unverified' => array(),
        'done'             => true,
    );

    $user = get_user_by( 'email', $email_address );
    if ( ! $user ) {
        return $result;
    }

    $user_id = $user->ID;

    $logs     = (array) get_option( 'insertabot_security_logs', array() );
    $new_logs = array();
    $removed  = 0;

    foreach ( $logs as $log ) {
        if ( isset( $log['user_id'] ) && intval( $log['user_id'] ) === $user_id ) {
            // Remove entire log entry that contains personal data for the user
            $removed++;
            continue;
        }
        $new_logs[] = $log;
    }

    if ( $removed > 0 ) {
        update_option( 'insertabot_security_logs', $new_logs, false );
        $result['items_removed'][] = array(
            'group_id'    => 'insertabot-logs',
            'item_id'     => 'insertabot-logs',
            'description' => sprintf(
                /* translators: %d: number of log entries removed */
                _n( '%d security log entry removed', '%d security log entries removed', $removed, 'insertabot' ),
                $removed
            ),
        );
    }

    return $result;
}
