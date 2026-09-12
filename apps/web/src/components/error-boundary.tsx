'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

/**
 * TUKUBI Enterprise Component Error Boundary
 * Catches unhandled component crashes and displays graceful Caribbean Futurism recovery UI
 * without crashing the parent layout or feed stream.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    let eventId: string | null = null;
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        eventId = Sentry.captureException(error, {
          extra: {
            sectionName: this.props.sectionName || 'unnamed_section',
            componentStack: errorInfo.componentStack,
          },
        });
      } catch {
        // Sentry capture failure should not cause secondary crash
      }
    }
    this.setState({ eventId });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, eventId: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const sectionTitle = this.props.sectionName
        ? `Unable to load ${this.props.sectionName}`
        : 'Something went wrong';

      return (
        <div className="w-full p-4 sm:p-6 rounded-2xl bg-brand-dusk/70 border border-slate-800 text-brand-sandstone my-2">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-white tracking-wide">{sectionTitle}</h3>
              <p className="text-xs text-brand-sandstone/70 max-w-md">
                {this.state.error?.message || 'A temporary issue occurred while rendering this section.'}
              </p>
              {this.state.eventId && (
                <p className="text-[10px] text-brand-sandstone/40 font-mono pt-1">
                  Incident Ref: {this.state.eventId}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors flex-shrink-0 border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
