import React from 'react';
import { motion } from 'framer-motion';

export interface AnimatedRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const AnimatedReveal: React.FC<AnimatedRevealProps> = ({
  children,
  delay = 0,
  duration = 0.8,
  direction = 'up',
  className = '',
}) => {
  const getDirections = () => {
    switch (direction) {
      case 'up':
        return { initial: { y: 40, x: 0 }, animate: { y: 0, x: 0 } };
      case 'down':
        return { initial: { y: -40, x: 0 }, animate: { y: 0, x: 0 } };
      case 'left':
        return { initial: { x: 40, y: 0 }, animate: { x: 0, y: 0 } };
      case 'right':
        return { initial: { x: -40, y: 0 }, animate: { x: 0, y: 0 } };
      default:
        return { initial: { y: 40, x: 0 }, animate: { y: 0, x: 0 } };
    }
  };

  const { initial, animate } = getDirections();

  return (
    <motion.div
      initial={{ opacity: 0, ...initial }}
      whileInView={{ opacity: 1, ...animate }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{
        duration,
        delay,
        ease: [0.215, 0.61, 0.355, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
