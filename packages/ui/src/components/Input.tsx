import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const id = useId();

    return (
      <div className="relative w-full mb-6">
        <input
          id={id}
          ref={ref}
          placeholder=" "
          className={`peer w-full bg-transparent text-luxury-dark border-b border-luxury-silver focus:border-luxury-gold py-2.5 px-0.5 outline-none transition-all duration-300 text-sm placeholder-transparent ${
            error ? 'border-red-500 focus:border-red-500' : ''
          } ${className}`}
          {...props}
        />
        <label
          htmlFor={id}
          className={`absolute left-0.5 top-2.5 text-sm text-neutral-500 pointer-events-none transition-all duration-300 transform origin-left 
            peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
            peer-focus:-translate-y-5 peer-focus:scale-75 peer-focus:text-luxury-gold
            peer-[:not(:placeholder-shown)]:-translate-y-5 peer-[:not(:placeholder-shown)]:scale-75 ${
              error ? 'peer-focus:text-red-500' : ''
            }`}
        >
          {label}
        </label>
        
        {/* Animated focus underline */}
        <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-luxury-gold transform scale-x-0 transition-transform duration-300 origin-center peer-focus:scale-x-100 ${
          error ? 'bg-red-500' : ''
        }`} />

        {error && (
          <p className="mt-1 text-xs text-red-500 font-medium tracking-[0.05em] transition-all duration-300">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
