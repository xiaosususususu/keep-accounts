import React, { InputHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg', icon?: LucideIcon }> = 
({ children, variant = 'primary', size = 'md', className = '', icon: Icon, ...props }) => {
  const baseStyle = "flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
};

export const Input: React.FC<InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</label>}
    <input 
      className={`bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${className}`}
      {...props}
    />
  </div>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { title?: string, action?: React.ReactNode }> = ({ children, className = '', title, action, ...props }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 ${className}`} {...props}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
        {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const StatBadge: React.FC<{ value: number, label?: string, large?: boolean }> = ({ value, label, large }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const colorClass = isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400';
  
  return (
    <div className="flex flex-col items-end">
      {label && <span className="text-xs text-slate-500 mb-0.5">{label}</span>}
      <span className={`font-mono font-bold ${large ? 'text-xl' : 'text-base'} ${colorClass}`}>
        {value > 0 ? '+' : ''}{value.toLocaleString()}
      </span>
    </div>
  );
};