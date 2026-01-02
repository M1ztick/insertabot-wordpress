<?php

class Insertabot_Security_Test extends WP_UnitTestCase {

    public function test_encrypt_store_and_get_api_key() {
        $original = 'ib_sk_demo_' . str_repeat('a', 32);

        // store
        $this->assertTrue( Insertabot_Security::store_api_key($original) );

        // encrypted option present
        $encrypted = get_option('insertabot_api_key_encrypted', '');
        $this->assertNotEmpty($encrypted);

        // retrieve
        $retrieved = Insertabot_Security::get_api_key();
        $this->assertEquals($original, $retrieved);

        // clear
        $this->assertTrue( Insertabot_Security::store_api_key('') );
        $this->assertEquals('', get_option('insertabot_api_key_encrypted', ''));
    }

    public function test_validate_api_key() {
        $good = 'ib_sk_' . str_repeat('b', 32);
        $res = Insertabot_Security::validate_api_key($good);
        $this->assertEquals($good, $res);

        $bad = 'not_a_key';
        $res2 = Insertabot_Security::validate_api_key($bad);
        $this->assertWPError($res2);
    }

    public function test_hash_api_key_for_log() {
        $key = 'ib_sk_' . str_repeat('x', 32);
        $hash = Insertabot_Security::hash_api_key_for_log($key);
        $this->assertMatchesRegularExpression('/^.{8}\.\.\..{8}$/', $hash);
    }
}
