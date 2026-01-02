<?php

class Insertabot_Privacy_Test extends WP_UnitTestCase {

    public function test_exporter_and_eraser() {
        // Create a user to attach logs to
        $user_id = $this->factory->user->create( array('user_email' => 'test@example.com') );

        $logs = array(
            array('timestamp' => '2025-01-01', 'event' => 'login', 'user_id' => $user_id, 'ip' => '127.0.0.1', 'context' => array('foo'=>'bar')),
            array('timestamp' => '2025-01-02', 'event' => 'other', 'user_id' => 9999, 'ip' => '0.0.0.0', 'context' => array())
        );

        update_option('insertabot_security_logs', $logs, false);

        $export = insertabot_personal_data_exporter('test@example.com');
        $this->assertNotEmpty($export['data']);
        $this->assertEquals('insertabot-logs', $export['data'][0]['group_id']);

        // Erase personal data for this user
        $eraser = insertabot_personal_data_eraser('test@example.com');
        $this->assertNotEmpty($eraser['items_removed']);

        $remaining = get_option('insertabot_security_logs', array());
        $this->assertCount(1, $remaining);
        $this->assertEquals(9999, $remaining[0]['user_id']);
    }
}
