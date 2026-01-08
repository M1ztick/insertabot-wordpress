/**
 * Health Monitoring Service
 * Provides comprehensive health checks and system monitoring
 */

import { CircuitBreaker, CircuitState } from './circuit-breaker';
import { StructuredLogger } from './monitoring';

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  timeout: number;
  critical: boolean;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: Record<string, {
    status: 'pass' | 'fail';
    responseTime: number;
    error?: string;
  }>;
  circuitBreakers?: Record<string, {
    state: CircuitState;
    failures: number;
  }>;
}

export class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private logger: StructuredLogger;

  constructor(environment: string, analytics?: any) {
    this.logger = new StructuredLogger('health-monitor', environment, analytics);
  }

  addCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  addCircuitBreaker(name: string, breaker: CircuitBreaker): void {
    this.circuitBreakers.set(name, breaker);
  }

  async runHealthChecks(): Promise<SystemHealth> {
    const results: SystemHealth['checks'] = {};
    let overallHealthy = true;
    let hasCriticalFailure = false;

    // Run all health checks
    for (const [name, check] of this.checks) {
      const startTime = Date.now();
      
      try {
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
        });

        const result = await Promise.race([
          check.check(),
          timeoutPromise
        ]);

        const responseTime = Date.now() - startTime;

        results[name] = {
          status: result ? 'pass' : 'fail',
          responseTime
        };

        if (!result) {
          overallHealthy = false;
          if (check.critical) {
            hasCriticalFailure = true;
          }
        }

      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        results[name] = {
          status: 'fail',
          responseTime,
          error: String(error)
        };

        overallHealthy = false;
        if (check.critical) {
          hasCriticalFailure = true;
        }

        await this.logger.error(`Health check ${name} failed`, {
          error: String(error),
          responseTime
        });
      }
    }

    // Collect circuit breaker states
    const circuitBreakerStates: SystemHealth['circuitBreakers'] = {};
    for (const [name, breaker] of this.circuitBreakers) {
      const stats = breaker.getStats();
      circuitBreakerStates[name] = {
        state: stats.state,
        failures: stats.failures
      };

      // Circuit breaker open indicates degraded service
      if (stats.state === CircuitState.OPEN) {
        overallHealthy = false;
      }
    }

    // Determine overall status
    let status: SystemHealth['status'];
    if (hasCriticalFailure) {
      status = 'unhealthy';
    } else if (!overallHealthy) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const health: SystemHealth = {
      status,
      timestamp: new Date().toISOString(),
      checks: results,
      circuitBreakers: circuitBreakerStates
    };

    // Log health status changes
    if (status !== 'healthy') {
      await this.logger.warn(`System health is ${status}`, {
        failedChecks: Object.entries(results)
          .filter(([_, result]) => result.status === 'fail')
          .map(([name]) => name),
        openCircuitBreakers: Object.entries(circuitBreakerStates)
          .filter(([_, state]) => state.state === CircuitState.OPEN)
          .map(([name]) => name)
      });
    }

    return health;
  }

  // Standard health checks for Insertabot
  static createStandardChecks(env: any): HealthCheck[] {
    return [
      {
        name: 'database',
        check: async () => {
          try {
            const result = await env.DB.prepare('SELECT 1').first();
            return !!result;
          } catch {
            return false;
          }
        },
        timeout: 5000,
        critical: true
      },
      {
        name: 'kv-store',
        check: async () => {
          try {
            const testKey = `health-check-${Date.now()}`;
            await env.RATE_LIMITER.put(testKey, 'test', { expirationTtl: 60 });
            const result = await env.RATE_LIMITER.get(testKey);
            await env.RATE_LIMITER.delete(testKey);
            return result === 'test';
          } catch {
            return false;
          }
        },
        timeout: 3000,
        critical: false
      },
      {
        name: 'ai-service',
        check: async () => {
          try {
            const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 1
            });
            return !!result;
          } catch {
            return false;
          }
        },
        timeout: 10000,
        critical: true
      },
      {
        name: 'vectorize',
        check: async () => {
          try {
            if (!env.VECTORIZE) return false;
            // Simple check - vectorize binding exists
            return true;
          } catch {
            return false;
          }
        },
        timeout: 2000,
        critical: false
      },
      {
        name: 'analytics',
        check: async () => {
          try {
            if (!env.ANALYTICS) return false;
            // Test analytics write
            env.ANALYTICS.writeDataPoint({
              blobs: ['health-check'],
              doubles: [Date.now()],
              indexes: ['health']
            });
            return true;
          } catch {
            return false;
          }
        },
        timeout: 2000,
        critical: false
      }
    ];
  }
}