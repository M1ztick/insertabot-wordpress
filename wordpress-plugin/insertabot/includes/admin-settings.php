<?php
/**
 * Insertabot Admin Settings (Settings API)
 *
 * Drop-in file. Include from main plugin bootstrap.
 */

if (!defined('ABSPATH')) {
	exit;
}

final class Insertabot_Admin_Settings {
	public const PAGE_SLUG   = 'insertabot-settings';
	public const OPTION_KEY  = 'insertabot_api_key';
	public const OPTION_EN   = 'insertabot_enabled';
	public const OPTION_BASE = 'insertabot_api_base';

	public static function register(): void {
		add_action('admin_menu', [__CLASS__, 'add_menu']);
		add_action('admin_init', [__CLASS__, 'register_settings']);
	}

	public static function add_menu(): void {
		add_options_page(
			esc_html__('Insertabot Settings', 'insertabot'),
			esc_html__('Insertabot', 'insertabot'),
			'manage_options',
			self::PAGE_SLUG,
			[__CLASS__, 'render_page']
		);
	}

	public static function register_settings(): void {
		register_setting('insertabot_settings_group', self::OPTION_KEY, [
			'type'              => 'string',
			'sanitize_callback' => [__CLASS__, 'sanitize_api_key'],
			'default'           => '',
		]);

		register_setting('insertabot_settings_group', self::OPTION_BASE, [
			'type'              => 'string',
			'sanitize_callback' => [__CLASS__, 'sanitize_api_base'],
			'default'           => defined('INSERTABOT_API_URL') ? INSERTABOT_API_URL : '',
		]);

		register_setting('insertabot_settings_group', self::OPTION_EN, [
			'type'              => 'boolean',
			'sanitize_callback' => [__CLASS__, 'sanitize_enabled'],
			'default'           => false,
		]);

		add_settings_section(
			'insertabot_main_section',
			'',
			'__return_null',
			self::PAGE_SLUG
		);

		add_settings_field(
			self::OPTION_KEY,
			esc_html__('API Key', 'insertabot'),
			[__CLASS__, 'field_api_key'],
			self::PAGE_SLUG,
			'insertabot_main_section'
		);

		add_settings_field(
			self::OPTION_EN,
			esc_html__('Enable Chatbot', 'insertabot'),
			[__CLASS__, 'field_enabled'],
			self::PAGE_SLUG,
			'insertabot_main_section'
		);

		add_settings_field(
			self::OPTION_BASE,
			esc_html__('API Base URL', 'insertabot'),
			[__CLASS__, 'field_api_base'],
			self::PAGE_SLUG,
			'insertabot_main_section'
		);
	}

	public static function sanitize_api_key($value): string {
		$value = is_string($value) ? sanitize_text_field($value) : '';

		// Clear API key
		if ($value === '') {
			// Store cleared value via secure storage
			if (class_exists('Insertabot_Security')) {
				Insertabot_Security::store_api_key('');
			}
			// Force disable when API key is cleared.
			update_option(self::OPTION_EN, false);
			return '';
		}

		// Validate format
		$validated = null;
		if (class_exists('Insertabot_Security')) {
			$validated = Insertabot_Security::validate_api_key($value);
		}

		if (is_wp_error($validated)) {
			add_settings_error(
				'insertabot_settings_messages',
				'insertabot_invalid_key',
				esc_html__('Invalid API key format.', 'insertabot'),
				'error'
			);
			return '';
		}

		// Store encrypted key and avoid persisting plaintext option
		if (class_exists('Insertabot_Security')) {
			$stored = Insertabot_Security::store_api_key($value);
			if ($stored === false) {
				add_settings_error(
					'insertabot_settings_messages',
					'insertabot_store_failed',
					esc_html__('Failed to securely store API key.', 'insertabot'),
					'error'
				);
				return '';
			}
		}

		// Return empty to avoid saving plaintext in options
		return '';
	}

	public static function sanitize_enabled($value): bool {
		$enabled = !empty($value);

		$api_key = (string) get_option(self::OPTION_KEY, '');
		$has_key = ($api_key !== '');

		// Prevent enabling without API key.
		if ($enabled && !$has_key) {
			add_settings_error(
				'insertabot_settings_messages',
				'insertabot_enabled_no_key',
				esc_html__('API key required before enabling chatbot.', 'insertabot'),
				'error'
			);
			return false;
		}

		return $enabled;
	}

	private static function get_api_key(): string {
		if (class_exists('Insertabot_Security')) {
			return (string) Insertabot_Security::get_api_key();
		}
		return (string) get_option(self::OPTION_KEY, '');
	}

	private static function get_enabled(): bool {
		return (bool) get_option(self::OPTION_EN, false);
	}

	private static function get_api_base(): string {
		$default = defined('INSERTABOT_API_URL') ? INSERTABOT_API_URL : '';
		$val = (string) get_option(self::OPTION_BASE, $default);
		return $val !== '' ? $val : $default;
	}

	private static function has_api_key(): bool {
		return self::get_api_key() !== '';
	}

	public static function field_api_key(): void {
		$api_key = self::get_api_key();
		$has_key = self::has_api_key();

		$site_url = defined('INSERTABOT_WEBSITE_URL') ? INSERTABOT_WEBSITE_URL : '';
		$signup   = $site_url ? $site_url . '/signup' : '';
		$dash     = $site_url ? $site_url . '/dashboard' : '';

		// For security, do NOT pre-fill the field with the raw key. Let users paste a new key.
		$masked = '';
		if ($has_key && is_string($api_key) && $api_key !== '') {
			$masked = substr($api_key, 0, 8) . '...' . substr($api_key, -4);
		}

		?>
		<input
			type="text"
			id="insertabot_api_key"
			name="<?php echo esc_attr(self::OPTION_KEY); ?>"
			value=""
			class="regular-text code"
			placeholder="ib_sk_your_api_key_here"
			autocomplete="off"
			spellcheck="false"
			inputmode="text"
		/>
		<?php if (!$has_key) : ?>
			<p class="description">
				<?php if ($signup) : ?>
					<a href="<?php echo esc_url($signup); ?>" target="_blank" rel="noopener noreferrer">
						<strong><?php esc_html_e('Get a free API key →', 'insertabot'); ?></strong>
					</a>
				<?php else : ?>
					<strong><?php esc_html_e('Insertabot website URL not configured.', 'insertabot'); ?></strong>
				<?php endif; ?>
			</p>
		<?php else : ?>
			<p class="description">
				<?php esc_html_e('API key connected.', 'insertabot'); ?> <code><?php echo esc_html($masked); ?></code>
				<?php if ($dash) : ?>
					<a href="<?php echo esc_url($dash); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('View dashboard →', 'insertabot'); ?></a>
				<?php endif; ?>
			</p>
		<?php endif; ?>
	<?php
	}

	public static function field_enabled(): void {
		$enabled = self::get_enabled();
		$has_key = self::has_api_key();
		?>
		<label class="insertabot-toggle">
			<input
				type="checkbox"
				id="insertabot_enabled"
				name="<?php echo esc_attr(self::OPTION_EN); ?>"
				value="1"
				<?php checked($enabled, true); ?>
				<?php disabled(!$has_key); ?>
			/>
			<span class="insertabot-toggle-slider" aria-hidden="true"></span>
		</label>
		<p class="description">
			<?php echo $has_key
				? esc_html__('Toggle to show/hide the chatbot on the website.', 'insertabot')
				: esc_html__('Enter API key above to enable the chatbot.', 'insertabot'); ?>
		</p>
		<?php
	}

	public static function field_api_base(): void {
		$api_base = self::get_api_base();
		?>
		<input
			type="url"
			id="insertabot_api_base"
			name="<?php echo esc_attr(self::OPTION_BASE); ?>"
			value="<?php echo esc_attr($api_base); ?>"
			class="regular-text code"
			placeholder="https://api.example.com"
		/>
		<p class="description"><?php esc_html_e('Advanced: Change only when using a custom API endpoint.', 'insertabot'); ?></p>
		<?php
	}

	public static function render_page(): void {
		if (!current_user_can('manage_options')) {
			wp_die(esc_html__('Insufficient permissions.', 'insertabot'));
		}

		$api_key = self::get_api_key();
		$has_key = ($api_key !== '');

		$plugin_url = defined('INSERTABOT_PLUGIN_URL') ? INSERTABOT_PLUGIN_URL : '';
		$welcome_svg = $plugin_url ? $plugin_url . 'assets/welcome-illustration.svg' : '';

		$site_url = defined('INSERTABOT_WEBSITE_URL') ? INSERTABOT_WEBSITE_URL : '';
		$signup   = $site_url ? $site_url . '/signup' : '';
		$pricing  = $site_url ? $site_url . '/?pricing=true' : '';
		$docs     = $site_url ? $site_url . '/docs' : '';
		$dash     = $site_url ? $site_url . '/dashboard' : '';

		?>
		<div class="wrap insertabot-admin-wrap">
			<h1>
				<span class="dashicons dashicons-format-chat" style="font-size: 32px; margin-inline-end: 8px; vertical-align: middle;"></span>
				<?php echo esc_html__('Insertabot Settings', 'insertabot'); ?>
			</h1>

			<?php settings_errors('insertabot_settings_messages'); ?>

			<?php if (!$has_key) : ?>
				<div class="insertabot-welcome-card">
					<div class="insertabot-welcome-content">
						<h2>🚀 Welcome to Insertabot!</h2>
						<p class="insertabot-subtitle">Add AI chat to a WordPress site in 3 simple steps:</p>

						<div class="insertabot-steps">
							<div class="insertabot-step">
								<div class="insertabot-step-number">1</div>
								<div class="insertabot-step-content">
									<h3>Get Free API Key</h3>
									<p>Sign up and get <strong>50 free messages per day</strong></p>
									<?php if ($signup) : ?>
										<a href="<?php echo esc_url($signup); ?>" class="button button-primary button-hero" target="_blank" rel="noopener noreferrer">
											Get Free API Key →
										</a>
									<?php endif; ?>
								</div>
							</div>

							<div class="insertabot-step">
								<div class="insertabot-step-number">2</div>
								<div class="insertabot-step-content">
									<h3>Paste API Key Below</h3>
									<p>Copy API key from dashboard and paste here</p>
								</div>
							</div>

							<div class="insertabot-step">
								<div class="insertabot-step-number">3</div>
								<div class="insertabot-step-content">
									<h3>Enable Chatbot</h3>
									<p>Toggle “Enable Chatbot” and save.</p>
								</div>
							</div>
						</div>

						<div class="insertabot-features">
							<h3>✨ What Free Tier Includes:</h3>
							<ul>
								<li>🤖 <strong>50 AI conversations per day</strong></li>
								<li>🌐 <strong>Real-time web search</strong></li>
								<li>🎨 Customizable colors and branding</li>
								<li>📱 Mobile-friendly chat widget</li>
								<li>⚡ Setup in minutes</li>
							</ul>
						</div>
					</div>

					<div class="insertabot-welcome-image">
						<?php if ($welcome_svg) : ?>
							<img src="<?php echo esc_url($welcome_svg); ?>" alt="<?php echo esc_attr__('Insertabot', 'insertabot'); ?>" />
						<?php endif; ?>
					</div>
				</div>
			<?php endif; ?>

			<div class="insertabot-settings-card <?php echo $has_key ? 'insertabot-has-key' : ''; ?>">
				<form method="post" action="options.php">
					<?php
						settings_fields('insertabot_settings_group');
						do_settings_sections(self::PAGE_SLUG);
						submit_button('💾 Save Settings', 'primary', 'submit', true, ['class' => 'button-large']);
					?>
				</form>
			</div>

			<?php if ($has_key) : ?>
				<div class="insertabot-upgrade-card">
					<div class="insertabot-upgrade-content">
						<div class="insertabot-upgrade-icon">⚡</div>
						<h2>Upgrade to Pro - $9.99/month</h2>
						<p class="insertabot-upgrade-subtitle">Get unlimited AI conversations + real-time web search</p>

						<div class="insertabot-upgrade-features">
							<div class="insertabot-upgrade-col">
								<h3>Free (Current)</h3>
								<ul>
									<li>✅ 50 messages/day</li>
									<li>✅ Basic customization</li>
									<li>⚠️ “Powered by Insertabot” branding</li>
								</ul>
							</div>

							<div class="insertabot-upgrade-col insertabot-upgrade-col-pro">
								<h3>Pro ($9.99/mo)</h3>
								<ul>
									<li>🚀 <strong>Unlimited</strong> playground messages</li>
									<li>🚀 <strong>500</strong> embedded messages/month</li>
									<li>🚀 <strong>Remove branding</strong></li>
							</ul>
						</div>
					</div>

					<?php if ($pricing) : ?>
						<a href="<?php echo esc_url($pricing); ?>" class="button button-primary button-large" target="_blank" rel="noopener noreferrer">
							🚀 Upgrade to Pro
						</a>
					<?php endif; ?>
				</div>
			</div>
		<?php endif; ?>

		<?php if ($docs) : ?>
			<div class="insertabot-help-card">
				<h3>📚 Need Help?</h3>
				<p>Check out our documentation for setup guides and troubleshooting.</p>
				<a href="<?php echo esc_url($docs); ?>" class="button" target="_blank" rel="noopener noreferrer">
					View Documentation →
				</a>
			</div>
		<?php endif; ?>
	</div>
	<?php
	}

	public static function sanitize_api_base($value): string {
		$value = is_string($value) ? trim($value) : '';
		$value = esc_url_raw($value);

		if ($value === '') {
			$value = defined('INSERTABOT_API_URL') ? INSERTABOT_API_URL : '';
		}

		return $value;
	}

}