=== Insertabot - AI Chatbot Solution ===
Contributors: mistykmedia
Tags: chatbot, ai, chat, support, customer service
Requires at least: 5.9
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add a customizable AI chatbot to your WordPress site. Real-time web search, unlimited conversations. Get started free!

== Description ==

**Insertabot** brings the power of AI chat to your WordPress website in just minutes. No coding required!

### 🚀 What Makes Insertabot Different?

* **Real-Time Web Search** - Unlike ChatGPT, Insertabot searches the web for current information
* **Lightning Fast Setup** - Install plugin, add API key, done! Takes under 5 minutes
* **Fully Customizable** - Match your brand colors, greeting message, and bot personality
* **Mobile Optimized** - Beautiful chat experience on all devices
* **Free to Start** - 50 messages per day, no credit card required

### ✨ Key Features

* 🤖 **AI-Powered Conversations** - Smart, natural responses to visitor questions
* 🌐 **Real-Time Web Search** - Always up-to-date answers (not outdated training data)
* 🎨 **Full Customization** - Colors, branding, greeting messages
* 📱 **Mobile-Friendly Widget** - Works perfectly on phones and tablets
* ⚡ **Zero Code Required** - Simple settings page, no technical skills needed
* 🔒 **Privacy Focused** - Your data is secure and never sold

### 💰 Pricing

**Free Plan**
* 50 messages per day
* Real-time web search
* Basic customization
* Mobile-optimized widget

**Pro Plan - $9.99/month**
* Unlimited playground messages
* 500 embedded messages/month
* Remove "Powered by Insertabot" branding
* Priority support
* Advanced analytics

[Get Your Free API Key →](https://insertabot.io/signup)

### 🎯 Perfect For:

* E-commerce stores (product questions, support)
* Blogs (engaging with readers)
* Service businesses (answering FAQs)
* SaaS products (onboarding help)
* Educational sites (tutoring, Q&A)

### 📚 How It Works

1. **Install Plugin** - Download and activate from WordPress.org
2. **Get API Key** - Sign up free at insertabot.io
3. **Paste & Enable** - Enter your API key and toggle on
4. **Done!** - Your AI chatbot is now live on your site

### 🌟 Why Users Love It

> "Set up in 3 minutes. Visitors are actually using it. Best $10/month I spend." - Sarah, blogger

> "The real-time web search is a game changer. Answers are always current." - Mike, e-commerce owner

> "Free tier is perfect for testing. Upgraded after seeing how well it works." - Jessica, startup founder

### 🔧 Technical Details

* Async script loading (won't slow down your site)
* GDPR compliant
* Works with all WordPress themes
* Compatible with page builders (Elementor, Divi, etc.)
* CDN-hosted for blazing fast performance

== External Services ==

This plugin connects to the Insertabot API service to provide AI chatbot functionality.

**Service URL:** https://api.insertabot.io

**When the chatbot is enabled, the following data is transmitted:**
* User chat messages and questions
* Your website URL (for context)
* API key (for authentication)

**Third-Party Service Information:**
* Service Provider: Insertabot (https://insertabot.io)
* Privacy Policy: https://insertabot.io/privacy
* Terms of Service: https://insertabot.io/terms

The plugin requires an API key from Insertabot to function. You can obtain a free API key by signing up at https://insertabot.io/signup

**Backend Services Used by Insertabot API:**
* Cloudflare Workers AI (for AI processing)
* Tavily API (for real-time web search)

== Privacy ==

**Local Data Storage:**
Insertabot stores minimal data locally in your WordPress database:
* Encrypted API key (option: `insertabot_api_key_encrypted`)
* Plugin settings (enabled/disabled state, API base URL)
* Optional security logs (option: `insertabot_security_logs`) - anonymized with IP addresses masked

**Data Transmission:**
When users interact with the chatbot, their messages are sent to the Insertabot API service for processing. The plugin does **not** expose your API key to client browsers (uses short-lived tokens instead).

**GDPR Compliance:**
The plugin implements WordPress personal data exporters and erasers. Site administrators can export or remove personal data associated with a user via Tools → Export Personal Data / Erase Personal Data in WordPress admin.

**Security:**
* API keys are stored using AES-256-CBC encryption
* IP addresses in logs are anonymized (last octet/80 bits zeroed)
* No personal data is sent to third parties beyond what is necessary for chatbot functionality

### 🆘 Support

Need help? We're here for you:

* [Documentation](https://insertabot.io/docs)
* [Dashboard](https://insertabot.io/dashboard)
* Email: support@insertabot.io

### 🎁 Get Started Free

No credit card required. 50 messages per day included.

[Sign up now →](https://insertabot.io/signup)

== Installation ==

### Automatic Installation

1. Log in to your WordPress admin panel
2. Go to **Plugins** > **Add New**
3. Search for "Insertabot"
4. Click **Install Now**, then **Activate**
5. Go to **Insertabot** in your admin menu
6. Get your free API key from [insertabot.io](https://insertabot.io/signup)
7. Paste your API key and enable the chatbot
8. Done!

### Manual Installation

1. Download the plugin zip file
2. Log in to your WordPress admin panel
3. Go to **Plugins** > **Add New** > **Upload Plugin**
4. Choose the zip file and click **Install Now**
5. Click **Activate Plugin**
6. Follow steps 5-8 from automatic installation above

== Frequently Asked Questions ==

= Do I need a credit card to start? =

No! The free plan includes 50 messages per day with no credit card required.

= How do I get an API key? =

Sign up free at [insertabot.io/signup](https://insertabot.io/signup). You'll receive your API key instantly.

= Can I customize the chatbot appearance? =

Yes! Customize colors, greeting message, bot name, and more in your [dashboard](https://insertabot.io/dashboard).

= Does it slow down my website? =

No. The script loads asynchronously and is hosted on a fast CDN. Your site speed won't be affected.

= What if I exceed 50 messages per day? =

The free plan resets daily at midnight. For unlimited messages, upgrade to Pro for $9.99/month.

= Can I use it with page builders? =

Yes! Insertabot works with Elementor, Divi, Beaver Builder, and all other page builders.

= Is it mobile-friendly? =

Absolutely! The chat widget is fully responsive and looks great on all devices.

= What makes the web search special? =

Unlike ChatGPT which has a knowledge cutoff, Insertabot searches the web in real-time for current information. Your visitors get up-to-date answers.

= Can I remove the branding? =

Yes, with the Pro plan ($9.99/month) you can remove the "Powered by Insertabot" branding.

= How do I upgrade to Pro? =

Visit your [dashboard](https://insertabot.io/dashboard) or click the upgrade link in plugin settings.

== Screenshots ==

1. Beautiful chat widget on your website
2. Simple WordPress settings page
3. Customization dashboard
4. Mobile-optimized experience
5. Real-time web search in action

== Changelog ==

= 1.0.0 =
* Initial release
* Free plan: 50 messages/day
* Pro plan: Unlimited playground + 500 embedded messages
* Real-time web search capability
* Full WordPress integration
* Mobile-optimized widget
* Customizable appearance

== Upgrade Notice ==

= 1.0.0 =
Initial release of Insertabot for WordPress. Get started free today!
