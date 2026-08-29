// Financial Provider Connection State Machine

import type { ConnectionState } from './types';

export class ConnectionStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
    NOT_CONNECTED: ['CONNECTING', 'AUTHORIZATION_REQUIRED'],
    CONNECTING: ['AUTHORIZATION_REQUIRED', 'VERIFYING', 'ERROR', 'NOT_CONNECTED'],
    AUTHORIZATION_REQUIRED: ['AUTHORIZED', 'ERROR', 'NOT_CONNECTED'],
    AUTHORIZED: ['VERIFYING', 'CONNECTED', 'ERROR'],
    VERIFYING: ['CONNECTED', 'ERROR', 'REAUTH_REQUIRED'],
    CONNECTED: ['REAUTH_REQUIRED', 'SUSPENDED', 'DISCONNECTED', 'ERROR'],
    REAUTH_REQUIRED: ['CONNECTING', 'AUTHORIZATION_REQUIRED', 'DISCONNECTED'],
    SUSPENDED: ['VERIFYING', 'DISCONNECTED', 'NOT_CONNECTED'],
    ERROR: ['NOT_CONNECTED', 'CONNECTING', 'DISCONNECTED'],
    DISCONNECTED: ['CONNECTING', 'NOT_CONNECTED'],
  };

  public static canTransition(from: ConnectionState, to: ConnectionState): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static transition(from: ConnectionState, to: ConnectionState): ConnectionState {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid provider connection transition: ${from} → ${to}`);
    }
    return to;
  }

  public static isUsable(state: ConnectionState): boolean {
    return state === 'CONNECTED';
  }

  public static requiresAction(state: ConnectionState): boolean {
    return state === 'AUTHORIZATION_REQUIRED' || state === 'REAUTH_REQUIRED' || state === 'ERROR';
  }
}
