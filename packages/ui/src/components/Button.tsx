import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = ({ variant = 'primary', className = '', children, ...props }: ButtonProps) => {
  const baseStyles = 'px-8 py-3 text-sm font-medium tracking-[0.15em] uppercase transition-all duration-300 relative overflow-hidden';
  
  const variants = {
    primary: 'bg-[#111111] text-[#FDFBF7] hover:bg-[#1A1A1A] border border-transparent',
    secondary: 'bg-[#FDFBF7] text-[#111111] hover:bg-[#E5E5E5] border border-transparent',
    outline: 'bg-transparent text-[#111111] hover:bg-[#111111] hover:text-[#FDFBF7] border border-[#111111]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
