import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'ghost';
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
  
  const variantStyles: Record<'primary' | 'secondary' | 'emerald' | 'amber' | 'ghost', string> = {
    primary: "bg-sky-500 hover:bg-sky-400 text-slate-950",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    emerald: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    amber: "bg-amber-500 hover:bg-amber-400 text-slate-950",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-300",
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
    <div className={`bg-slate-900/70 border border-slate-800 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  color?: 'sky' | 'emerald' | 'amber' | 'slate';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'sky' }: BadgeProps) => {
  const colorStyles: Record<'sky' | 'emerald' | 'amber' | 'slate', string> = {
    sky: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
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
        className={`${sizeStyles[size]} rounded-full object-cover border border-slate-700`}
      />
    );
  }

  return (
    <div className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-sky-500 to-amber-500 p-0.5 flex-shrink-0`}>
      <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-extrabold text-slate-100">
        {fallback.slice(0, 2).toUpperCase()}
      </div>
    </div>
  );
};
