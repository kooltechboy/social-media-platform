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
    primary: "bg-brand-azure hover:bg-sky-500 text-brand-limestone",
    secondary: "bg-brand-volcanic hover:bg-brand-raised text-brand-limestone border border-slate-700",
    danger: "bg-rose-600 hover:bg-rose-500 text-brand-limestone",
    ghost: "bg-transparent hover:bg-brand-volcanic text-slate-300",
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
    <div className={`bg-brand-abyss/80 border border-brand-volcanic rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  color?: 'azure' | 'emerald' | 'rose' | 'volcanic';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'azure' }: BadgeProps) => {
  const colorStyles: Record<'azure' | 'emerald' | 'rose' | 'volcanic', string> = {
    azure: 'bg-brand-azure/20 text-sky-400 border-brand-azure/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    volcanic: 'bg-brand-volcanic text-slate-300 border-slate-700',
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
        className={`${sizeStyles[size]} rounded-full object-cover border border-brand-volcanic`}
      />
    );
  }

  return (
    <div className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-brand-ocean to-brand-azure p-0.5 flex-shrink-0`}>
      <div className="w-full h-full bg-brand-abyss rounded-full flex items-center justify-center font-extrabold text-brand-limestone">
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
      {label && <label className="block text-xs font-bold text-slate-300">{label}</label>}
      <input
        className={`w-full bg-brand-abyss border ${error ? 'border-rose-500' : 'border-brand-volcanic'} rounded-xl px-4 py-2.5 text-sm text-brand-limestone placeholder-slate-500 focus:outline-none focus:border-brand-azure transition-colors ${className}`}
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
      {label && <label className="block text-xs font-bold text-slate-300">{label}</label>}
      <textarea
        className={`w-full bg-brand-abyss border ${error ? 'border-rose-500' : 'border-brand-volcanic'} rounded-xl px-4 py-2.5 text-sm text-brand-limestone placeholder-slate-500 focus:outline-none focus:border-brand-azure transition-colors resize-none ${className}`}
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
  return <div className={`animate-pulse bg-brand-volcanic/60 rounded-xl ${className}`} />;
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
    <div className="bg-brand-ocean/40 border border-dashed border-brand-volcanic rounded-3xl p-10 text-center space-y-3">
      {icon && <div className="mx-auto text-brand-azure flex justify-center">{icon}</div>}
      <h3 className="text-base font-bold text-brand-limestone">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
