/**
 * Shared animation variants – subtle, distinct micro-animations
 */

export const slideInOut = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 16 : -16,
    filter: 'blur(2px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -16 : 16,
    filter: 'blur(2px)',
  }),
};

/** Smooth slide – softer easing */
export const slideTransition = {
  type: 'tween' as const,
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94],
};

/** Gentle spring for UI elements */
export const springGentle = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

/** Micro spring – snappy but soft */
export const springMicro = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28,
};

/** Fade up – content entrance */
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

/** Stagger children with micro delay */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: 1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springMicro,
  },
};

/** Scale-in for icons/avatars */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springGentle,
  },
};
