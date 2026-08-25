'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface StepProgressProps {
  currentStep: number; // 1 to 5
  totalSteps?: number;
  backHref?: string;
}

const STEP_TITLES = [
  'Intent',
  'Your Caribbean',
  'Identity',
  'Interests',
  'Ready',
];

export function StepProgress({ currentStep, totalSteps = 5, backHref }: StepProgressProps) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs text-brand-sandstone/60 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        ) : (
          <span className="text-xs text-brand-sandstone/40 font-medium">Join ANTILIA</span>
        )}

        <span className="text-[11px] font-bold text-brand-caribbeanSea uppercase tracking-wider">
          Step {currentStep} of {totalSteps} — {STEP_TITLES[currentStep - 1]}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum <= currentStep;
          return (
            <div
              key={stepNum}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isActive
                  ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral shadow-sm shadow-brand-caribbeanSea/30'
                  : 'bg-white/10'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
