/**
 * Circuit Breaker Pattern Implementation
 * Provides automatic failure detection and recovery for external services
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  recoveryTimeout: number;     // Time to wait before trying again (ms)
  monitoringWindow: number;    // Time window for failure counting (ms)
  successThreshold: number;    // Successes needed to close from half-open
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private failureTimes: number[] = [];

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.config.recoveryTimeout) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state = CircuitState.HALF_OPEN;
      this.successes = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.failureTimes = [];

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log(`Circuit breaker ${this.name} closed after recovery`);
      }
    }
  }

  private onFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureTimes.push(now);

    // Clean old failures outside monitoring window
    this.failureTimes = this.failureTimes.filter(
      time => now - time <= this.config.monitoringWindow
    );

    this.failures = this.failureTimes.length;

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.warn(`Circuit breaker ${this.name} opened due to ${this.failures} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.failureTimes = [];
    console.log(`Circuit breaker ${this.name} manually reset`);
  }
}

// Pre-configured circuit breakers for common services
export const createAICircuitBreaker = () => new CircuitBreaker('AI-Service', {
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30 seconds
  monitoringWindow: 60000, // 1 minute
  successThreshold: 2
});

export const createSearchCircuitBreaker = () => new CircuitBreaker('Search-Service', {
  failureThreshold: 3,
  recoveryTimeout: 15000, // 15 seconds
  monitoringWindow: 30000, // 30 seconds
  successThreshold: 1
});

export const createStripeCircuitBreaker = () => new CircuitBreaker('Stripe-Service', {
  failureThreshold: 3,
  recoveryTimeout: 60000, // 1 minute
  monitoringWindow: 120000, // 2 minutes
  successThreshold: 2
});