import React from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Info, Lightbulb, ExternalLink, ArrowRight } from 'lucide-react';

export interface ArticleStep {
  number: number;
  title: string;
  content: string;
  tip?: string;
}

export interface ArticleFAQ {
  question: string;
  answer: string;
}

export interface ArticleSection {
  type: 'intro' | 'steps' | 'tips' | 'faqs' | 'troubleshooting' | 'cta' | 'note' | 'warning';
  title?: string;
  content?: string;
  items?: string[];
  steps?: ArticleStep[];
  faqs?: ArticleFAQ[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
}

export interface ArticleContentProps {
  sections: ArticleSection[];
}

function StepCard({ step }: { step: ArticleStep }) {
  return (
    <div className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/15 transition-all">
      <div className="w-8 h-8 rounded-full bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-brand-caribbeanSea text-sm font-black flex items-center justify-center flex-shrink-0">
        {step.number}
      </div>
      <div className="space-y-2 min-w-0">
        <h3 className="text-sm font-bold text-white">{step.title}</h3>
        <p className="text-sm text-brand-sandstone/80 leading-relaxed">{step.content}</p>
        {step.tip && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-brand-goldenHour/10 border border-brand-goldenHour/20 text-xs text-brand-goldenHour mt-2">
            <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{step.tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: ArticleFAQ }) {
  return (
    <details className="group border border-white/10 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/5 transition-colors">
        <span className="text-sm font-semibold text-white pr-4">{faq.question}</span>
        <svg className="w-4 h-4 text-brand-sandstone/50 flex-shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="px-5 pb-4 text-sm text-brand-sandstone/80 leading-relaxed border-t border-white/5 pt-3">
        {faq.answer}
      </div>
    </details>
  );
}

export default function ArticleContent({ sections }: ArticleContentProps) {
  return (
    <div className="space-y-8">
      {sections.map((section, i) => {
        switch (section.type) {
          case 'intro':
            return (
              <div key={i} className="text-base text-brand-sandstone/85 leading-relaxed">
                {section.content}
              </div>
            );

          case 'steps':
            return (
              <div key={i} className="space-y-4">
                {section.title && (
                  <h2 className="text-lg font-black text-white">{section.title}</h2>
                )}
                <div className="space-y-3">
                  {(section.steps || []).map((step) => (
                    <StepCard key={step.number} step={step} />
                  ))}
                </div>
              </div>
            );

          case 'tips':
            return (
              <div key={i} className="p-5 rounded-2xl bg-brand-goldenHour/10 border border-brand-goldenHour/20 space-y-3">
                {section.title && (
                  <h2 className="text-sm font-black text-brand-goldenHour flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> {section.title}
                  </h2>
                )}
                <ul className="space-y-2">
                  {(section.items || []).map((tip, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-brand-sandstone/85">
                      <CheckCircle className="w-4 h-4 text-brand-goldenHour flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'faqs':
            return (
              <div key={i} className="space-y-3">
                {section.title && (
                  <h2 className="text-lg font-black text-white">{section.title}</h2>
                )}
                <div className="space-y-2">
                  {(section.faqs || []).map((faq, j) => (
                    <FAQItem key={j} faq={faq} />
                  ))}
                </div>
              </div>
            );

          case 'troubleshooting':
            return (
              <div key={i} className="space-y-4">
                {section.title && (
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" /> {section.title}
                  </h2>
                )}
                <div className="space-y-2">
                  {(section.faqs || []).map((item, j) => (
                    <div key={j} className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-1">
                      <p className="text-sm font-semibold text-orange-300">{item.question}</p>
                      <p className="text-sm text-brand-sandstone/80">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            );

          case 'note':
            return (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20">
                <Info className="w-4 h-4 text-brand-caribbeanSea flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-sandstone/85 leading-relaxed">{section.content}</p>
              </div>
            );

          case 'warning':
            return (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-sandstone/85 leading-relaxed">{section.content}</p>
              </div>
            );

          case 'cta':
            return (
              <div key={i} className="flex flex-wrap gap-3">
                {section.ctaHref && (
                  section.ctaExternal ? (
                    <a
                      href={section.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-sm transition-all min-h-[44px]"
                    >
                      {section.ctaLabel || 'Try It Now'} <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      href={section.ctaHref}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-sm transition-all min-h-[44px]"
                    >
                      {section.ctaLabel || 'Try It Now'} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
