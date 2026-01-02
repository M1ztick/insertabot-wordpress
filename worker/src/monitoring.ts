/**
 * Monitoring and Alerting Utilities
 * Integrates with Cloudflare Analytics and external services
 */

// Import Cloudflare Workers types
type AnalyticsEngineDataset = {
  writeDataPoint: (data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }) => void;
};

export interface MonitoringConfig {
  webhookUrl?: string;
  slackWebhook?: string;
  discordWebhook?: string;
  emailEndpoint?: string;
  environment: string;
}

export interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface Metric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: number;
}

export class MonitoringService {
  constructor(private config: MonitoringConfig) {}

  /**
   * Send alert to configured channels
   */
  async sendAlert(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Slack notification
    if (this.config.slackWebhook) {
      promises.push(this.sendSlackAlert(alert));
    }

    // Discord notification
    if (this.config.discordWebhook) {
      promises.push(this.sendDiscordAlert(alert));
    }

    // Generic webhook
    if (this.config.webhookUrl) {
      promises.push(this.sendWebhookAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send metric to analytics
   */
  async sendMetric(analytics: AnalyticsEngineDataset, metric: Metric): Promise<void> {
    try {
      analytics.writeDataPoint({
        blobs: [metric.name, this.config.environment],
        doubles: [metric.value, metric.timestamp],
        indexes: [metric.name],
      });
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  /**
   * Track API request metrics
   */
  async trackRequest(
    analytics: AnalyticsEngineDataset,
    customerId: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    tokenCount?: number
  ): Promise<void> {
    const metrics: Metric[] = [
      {
        name: 'api_requests_total',
        value: 1,
        tags: { customer_id: customerId, endpoint, status: statusCode.toString() },
        timestamp: Date.now()
      },
      {
        name: 'api_response_time',
        value: responseTime,
        unit: 'ms',
        tags: { customer_id: customerId, endpoint },
        timestamp: Date.now()
      }
    ];

    if (tokenCount) {
      metrics.push({
        name: 'ai_tokens_used',
        value: tokenCount,
        tags: { customer_id: customerId },
        timestamp: Date.now()
      });
    }

    for (const metric of metrics) {
      await this.sendMetric(analytics, metric);
    }

    // Send alerts for error conditions
    if (statusCode >= 500) {
      await this.sendAlert({
        level: 'error',
        title: 'API Error',
        message: `${endpoint} returning ${statusCode} for customer ${customerId}`,
        metadata: { customerId, endpoint, statusCode, responseTime },
        timestamp: Date.now()
      });
    }

    // Alert on slow responses
    if (responseTime > 5000) {
      await this.sendAlert({
        level: 'warning',
        title: 'Slow API Response',
        message: `${endpoint} took ${responseTime}ms to respond`,
        metadata: { customerId, endpoint, responseTime },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Track rate limit hits
   */
  async trackRateLimit(
    analytics: AnalyticsEngineDataset,
    customerId: string,
    limitType: 'hourly' | 'daily'
  ): Promise<void> {
    await this.sendMetric(analytics, {
      name: 'rate_limit_hits',
      value: 1,
      tags: { customer_id: customerId, limit_type: limitType },
      timestamp: Date.now()
    });

    // Alert on rate limit abuse
    await this.sendAlert({
      level: 'warning',
      title: 'Rate Limit Hit',
      message: `Customer ${customerId} hit ${limitType} rate limit`,
      metadata: { customerId, limitType },
      timestamp: Date.now()
    });
  }

  /**
   * Track AI model usage and costs
   */
  async trackAIUsage(
    analytics: AnalyticsEngineDataset,
    customerId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    estimatedCost: number
  ): Promise<void> {
    const metrics: Metric[] = [
      {
        name: 'ai_prompt_tokens',
        value: promptTokens,
        tags: { customer_id: customerId, model },
        timestamp: Date.now()
      },
      {
        name: 'ai_completion_tokens',
        value: completionTokens,
        tags: { customer_id: customerId, model },
        timestamp: Date.now()
      },
      {
        name: 'ai_estimated_cost',
        value: estimatedCost,
        unit: 'usd',
        tags: { customer_id: customerId, model },
        timestamp: Date.now()
      }
    ];

    for (const metric of metrics) {
      await this.sendMetric(analytics, metric);
    }
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!this.config.slackWebhook) return;

    const color = {
      info: '#36a3f7',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#dc2626'
    }[alert.level];

    const payload = {
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: alert.metadata ? Object.entries(alert.metadata).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true
          })) : [],
          footer: `Insertabot ${this.config.environment}`,
          ts: Math.floor(alert.timestamp / 1000)
        }
      ]
    };

    try {
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private async sendDiscordAlert(alert: Alert): Promise<void> {
    if (!this.config.discordWebhook) return;

    const color = {
      info: 0x36a3f7,
      warning: 0xf59e0b,
      error: 0xef4444,
      critical: 0xdc2626
    }[alert.level];

    const embed = {
      title: alert.title,
      description: alert.message,
      color,
      fields: alert.metadata ? Object.entries(alert.metadata).map(([name, value]) => ({
        name,
        value: String(value),
        inline: true
      })) : [],
      footer: { text: `Insertabot ${this.config.environment}` },
      timestamp: new Date(alert.timestamp).toISOString()
    };

    try {
      await fetch(this.config.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (error) {
      console.error('Failed to send Discord alert:', error);
    }
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          service: 'insertabot',
          environment: this.config.environment
        })
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }
}

/**
 * Health check utility
 */
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  addCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  async runHealthChecks(): Promise<{ healthy: boolean; checks: Record<string, boolean> }> {
    const results: Record<string, boolean> = {};
    let healthy = true;

    for (const [name, check] of this.checks) {
      try {
        results[name] = await check();
        if (!results[name]) healthy = false;
      } catch (error) {
        results[name] = false;
        healthy = false;
        console.error(`Health check ${name} failed:`, error);
      }
    }

    return { healthy, checks: results };
  }
}

/**
 * Performance profiler
 */
export class PerformanceProfiler {
  private timers: Map<string, number> = new Map();

  start(name: string): void {
    this.timers.set(name, Date.now());
  }

  end(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    return duration;
  }

  measure<T>(name: string, fn: () => T): T;
  measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
  measure<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(name);
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = this.end(name);
        console.log(`Performance: ${name} took ${duration}ms`);
      });
    } else {
      const duration = this.end(name);
      console.log(`Performance: ${name} took ${duration}ms`);
      return result;
    }
  }
}

/**
 * Logger with structured logging
 */
export class StructuredLogger {
  constructor(
    private service: string,
    private environment: string,
    private analytics?: AnalyticsEngineDataset
  ) {}

  private async log(level: string, message: string, metadata?: Record<string, any>): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      environment: this.environment,
      message,
      metadata
    };

    // Console log
    console.log(JSON.stringify(logEntry));

    // Send to analytics if available
    if (this.analytics) {
      try {
        this.analytics.writeDataPoint({
          blobs: [level, this.service, message],
          doubles: [Date.now()],
          indexes: [level, this.service]
        });
      } catch (error) {
        console.error('Failed to send log to analytics:', error);
      }
    }
  }

  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('info', message, metadata);
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('warn', message, metadata);
  }

  async error(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('error', message, metadata);
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    if (this.environment === 'development') {
      await this.log('debug', message, metadata);
    }
  }
}