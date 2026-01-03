<?php

class Insertabot_REST_Test extends WP_UnitTestCase
{

    public function setUp(): void
    {
        parent::setUp();

        // Ensure a deterministic AUTH_KEY for signature verification in tests
        if (!defined('AUTH_KEY')) {
            define('AUTH_KEY', 'test_auth_key');
        }

        // Clear any stored API key before each test
        Insertabot_Security::store_api_key('');
    }

    public function test_widget_token_returns_error_without_api_key()
    {
        $request = new WP_REST_Request('GET', '/insertabot/v1/widget-token');
        $result = rest_do_request($request);

        $this->assertTrue(is_wp_error($result));
        $this->assertEquals('no_api_key', $result->get_error_code());
        $this->assertEquals(400, $result->get_error_data()['status']);
    }

    public function test_widget_token_success_and_signature()
    {
        $api_key = 'ib_sk_test_' . str_repeat('a', 32);
        $this->assertTrue(Insertabot_Security::store_api_key($api_key));

        $request = new WP_REST_Request('GET', '/insertabot/v1/widget-token');
        $response = rest_do_request($request);

        $this->assertInstanceOf('WP_REST_Response', $response);

        $data = $response->get_data();
        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('expires', $data);
        $this->assertIsInt($data['expires']);
        $this->assertGreaterThan(time() - 5, $data['expires']);

        $token = $data['token'];
        $decoded = base64_decode($token, true);
        $this->assertNotFalse($decoded);

        $parts = explode('|', $decoded);
        $this->assertGreaterThanOrEqual(4, count($parts));

        $sig = array_pop($parts);
        $payload = implode('|', $parts);

        $secret = defined('AUTH_KEY') ? AUTH_KEY : 'insertabot_fallback_secret';
        $expected = hash_hmac('sha256', $payload, $secret);

        $this->assertEquals($expected, $sig);
    }
}
