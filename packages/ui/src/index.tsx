import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyle = "font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-2";
  
  const variantStyles: Record<'primary' | 'secondary' | 'danger' | 'ghost', string> = {
    primary: "bg-brand-sunriseCoral hover:opacity-90 text-brand-twilight shadow-[0_0_15px_rgba(255,122,89,0.4)]",
    secondary: "bg-brand-dusk hover:bg-brand-sunsetPurple text-brand-sandstone border border-brand-sunsetPurple/50",
    danger: "bg-rose-600 hover:bg-rose-500 text-brand-sandstone",
    ghost: "bg-transparent hover:bg-brand-dusk text-brand-goldenHour",
  };

  const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-[#161022]/94 border border-white/12 backdrop-blur-md rounded-2xl p-5 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  color?: 'sunrise' | 'sea' | 'rose' | 'dusk';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'sunrise' }: BadgeProps) => {
  const colorStyles: Record<'sunrise' | 'sea' | 'rose' | 'dusk', string> = {
    sunrise: 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border-brand-sunriseCoral/30',
    sea: 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border-brand-caribbeanSea/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    dusk: 'bg-brand-dusk text-brand-sandstone border-brand-sunsetPurple/50',
  };

  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${colorStyles[color]}`}>
      {children}
    </span>
  );
};

export interface AvatarProps {
  src?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ src, fallback, size = 'md' }: AvatarProps) => {
  const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={fallback}
        className={`${sizeStyles[size]} rounded-full object-cover border-2 border-brand-goldenHour`}
      />
    );
  }

  return (
    <div className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-brand-sunriseCoral to-brand-sunsetPurple p-0.5 flex-shrink-0`}>
      <div className="w-full h-full bg-brand-twilight rounded-full flex items-center justify-center font-extrabold text-brand-sandstone">
        {fallback.slice(0, 2).toUpperCase()}
      </div>
    </div>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-bold text-brand-sandstone/70">{label}</label>}
      <input
        className={`w-full bg-brand-twilight border ${error ? 'border-rose-500' : 'border-brand-dusk'} rounded-xl px-4 py-2.5 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-sunriseCoral transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }: TextareaProps) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-bold text-brand-sandstone/70">{label}</label>}
      <textarea
        className={`w-full bg-brand-twilight border ${error ? 'border-rose-500' : 'border-brand-dusk'} rounded-xl px-4 py-2.5 text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-sunriseCoral transition-colors resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
};

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }: SkeletonProps) => {
  return <div className={`animate-pulse bg-brand-dusk rounded-xl ${className}`} />;
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="bg-[#181126]/95 border border-dashed border-brand-sunsetPurple/40 rounded-3xl p-8 sm:p-12 text-center space-y-3.5 shadow-xl max-w-xl mx-auto">
      {icon && <div className="mx-auto text-brand-goldenHour flex justify-center text-3xl sm:text-4xl">{icon}</div>}
      <h3 className="text-base sm:text-lg font-black text-white">{title}</h3>
      <p className="text-xs sm:text-sm text-brand-sandstone/80 max-w-md mx-auto leading-relaxed">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  searchSlot?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  backHref,
  backLabel = 'Back',
  badge,
  actions,
  searchSlot,
  className = '',
}) => {
  return (
    <header className={`space-y-4 ${className}`} role="region" aria-label={title}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {backHref && (
            <a
              href={backHref}
              className="mt-1 sm:mt-0 p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-brand-sandstone/80 hover:text-white border border-white/10 transition-colors inline-flex items-center gap-1.5 text-xs font-bold shrink-0 min-h-[38px]"
              aria-label={backLabel}
            >
              <span>←</span>
              <span className="hidden sm:inline">{backLabel}</span>
            </a>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                {title}
              </h1>
              {badge && <span className="shrink-0">{badge}</span>}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-1 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>

      {searchSlot && (
        <div className="w-full">
          {searchSlot}
        </div>
      )}
    </header>
  );
};

export interface ContentSurfaceProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'card' | 'opaque' | 'elevated' | 'empty';
}

export const ContentSurface: React.FC<ContentSurfaceProps> = ({
  children,
  className = '',
  variant = 'card',
}) => {
  const variantStyles = {
    card: 'bg-[#161022]/94 backdrop-blur-xl border border-white/12 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.65)]',
    opaque: 'bg-[#181126] border border-white/12 shadow-xl',
    elevated: 'bg-[#1D1429] border border-white/14 shadow-2xl',
    empty: 'bg-[#181126]/95 border border-dashed border-brand-sunsetPurple/40 shadow-xl',
  };

  return (
    <div className={`rounded-3xl p-4 sm:p-6 ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: string;
  icon?: React.ReactNode;
}

export interface ResponsiveTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`flex gap-1.5 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
              isActive
                ? 'bg-white/15 text-brand-caribbeanSea border border-brand-caribbeanSea/40 shadow-sm'
                : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30' : 'bg-white/10 text-brand-sandstone/60'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-brand-sunriseCoral text-slate-950">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface BrandLogoProps {
  variant?: 'horizontal' | 'emblem' | 'full' | 'footer-dark';
  className?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  className = '',
  alt = 'TUKUBI — The Caribbean Connected.',
}) => {
  if (variant === 'emblem') {
    return (
      <img
        src="/brand/tukubi-emblem.png"
        alt={alt}
        className={`w-10 h-10 object-contain drop-shadow-md ${className}`}
      />
    );
  }
  if (variant === 'footer-dark') {
    return (
      <img
        src="/brand/tukubi-footer-dark.png"
        alt={alt}
        className={`h-12 w-auto object-contain rounded-lg border border-white/10 ${className}`}
      />
    );
  }
  if (variant === 'full') {
    return (
      <img
        src="/brand/tukubi-logo-transparent.png"
        alt={alt}
        className={`w-48 h-auto object-contain ${className}`}
      />
    );
  }
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/brand/tukubi-emblem.png"
        alt=""
        aria-hidden="true"
        className="w-9 h-9 object-contain drop-shadow-md"
      />
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-black bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral bg-clip-text text-transparent tracking-wider">
          TUKUBI
        </span>
        <span className="text-[10px] font-bold text-brand-sandstone/80 tracking-wide">
          The Caribbean Connected.
        </span>
      </div>
    </div>
  );
};

