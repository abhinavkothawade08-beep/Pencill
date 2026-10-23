/**
 * Circuit Breaker for Resource Engine 2.0 Provider Adapters.
 * 
 * Protects against cascading failures, API throttling, and repeated requests
 * during provider outages or quota exhaustion.
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number;     // Number of consecutive failures before opening (default: 3)
  cooldownMs?: number;           // Standard cooldown in ms (default: 30,000ms = 30s)
  quotaCooldownMs?: number;      // Extended cooldown on 429 quota exhaustion (default: 300,000ms = 5 min)
}

export class CircuitBreaker {
  readonly providerName: string;
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures: number = 0;
  private openUntilTimestamp: number = 0;
  private lastErrorReason?: string;

  private readonly failureThreshold: number;
  private readonly standardCooldownMs: number;
  private readonly quotaCooldownMs: number;

  constructor(providerName: string, config: CircuitBreakerConfig = {}) {
    this.providerName = providerName;
    this.failureThreshold = config.failureThreshold ?? 3;
    this.standardCooldownMs = config.cooldownMs ?? 30_000;
    this.quotaCooldownMs = config.quotaCooldownMs ?? 300_000;
  }

  /**
   * Checks whether a request is permitted to proceed.
   */
  public canExecute(): { allowed: boolean; state: CircuitBreakerState; cooldownRemainingMs: number; reason?: string } {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now >= this.openUntilTimestamp) {
        // Cooldown expired; transition to HALF_OPEN to probe provider health
        this.state = 'HALF_OPEN';
        return { allowed: true, state: 'HALF_OPEN', cooldownRemainingMs: 0 };
      }

      const cooldownRemainingMs = Math.max(0, this.openUntilTimestamp - now);
      return {
        allowed: false,
        state: 'OPEN',
        cooldownRemainingMs,
        reason: this.lastErrorReason || `${this.providerName} circuit breaker is OPEN (cooldown: ${Math.round(cooldownRemainingMs / 1000)}s remaining)`,
      };
    }

    if (this.state === 'HALF_OPEN') {
      // Allow single probe request
      return { allowed: true, state: 'HALF_OPEN', cooldownRemainingMs: 0 };
    }

    return { allowed: true, state: 'CLOSED', cooldownRemainingMs: 0 };
  }

  /**
   * Records a successful execution. Resets failure count and closes circuit.
   */
  public recordSuccess(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.openUntilTimestamp = 0;
    this.lastErrorReason = undefined;
  }

  /**
   * Records a failed execution.
   * If isQuotaExhaustion is true, trips circuit immediately into OPEN state with extended cooldown.
   */
  public recordFailure(isQuotaExhaustion: boolean = false, reason?: string, customCooldownMs?: number): void {
    this.consecutiveFailures++;
    this.lastErrorReason = reason;

    if (isQuotaExhaustion) {
      // Immediate trip on quota exhaustion
      const cooldown = customCooldownMs ?? this.quotaCooldownMs;
      this.state = 'OPEN';
      this.openUntilTimestamp = Date.now() + cooldown;
      return;
    }

    if (this.state === 'HALF_OPEN' || this.consecutiveFailures >= this.failureThreshold) {
      const cooldown = customCooldownMs ?? this.standardCooldownMs;
      this.state = 'OPEN';
      this.openUntilTimestamp = Date.now() + cooldown;
    }
  }

  /**
   * Force trips the breaker (useful for manual cooldown or tests).
   */
  public trip(cooldownMs?: number, reason?: string): void {
    this.state = 'OPEN';
    this.openUntilTimestamp = Date.now() + (cooldownMs ?? this.standardCooldownMs);
    this.lastErrorReason = reason || 'Manually tripped';
  }

  /**
   * Resets breaker to CLOSED state.
   */
  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.openUntilTimestamp = 0;
    this.lastErrorReason = undefined;
  }

  public getState(): CircuitBreakerState {
    const now = Date.now();
    if (this.state === 'OPEN' && now >= this.openUntilTimestamp) {
      return 'HALF_OPEN';
    }
    return this.state;
  }

  public getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  public getCooldownRemainingMs(): number {
    return Math.max(0, this.openUntilTimestamp - Date.now());
  }
}
