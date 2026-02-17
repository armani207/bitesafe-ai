/**
 * Shared animation variants – subtle, pleasing micro-animations
 * Easing: soft deceleration for a premium feel
 */

export const easeOut = [0.32, 0.72, 0, 1] as const;
export const easeOutExpo = [0.19, 1, 0.22, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

export const slideInOut = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 12 : -12,
    filter: 'blur(2px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -12 : 12,
    filter: 'blur(2px)',
  }),
};

/** Smooth slide – softer easing */
export const slideTransition = {
  type: 'tween' as const,
  duration: 0.4,
  ease: easeOut,
};

/** Page/content fade-in */
export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.35, ease: easeOut },
};

/** Gentle spring for UI elements */
export const springGentle = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 28,
};

/** Micro spring – snappy but soft */
export const springMicro = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 26,
};

/** Glide – tween for layout (indicator, tabs). No bounce, smooth slide. */
export const layoutGlide = {
  type: 'tween' as const,
  duration: 0.35,
  ease: easeOut,
};

/** Tap feedback – for buttons/icons */
export const tapScale = { scale: 0.96 };
export const tapScaleLight = { scale: 0.98 };

/** Fade up – content entrance */
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: easeOut },
};

/** Fade in only – minimal */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: easeOut },
};

/** Stagger children with micro delay */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.035,
      staggerDirection: 1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 5 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springMicro,
  },
};

/** Scale-in for icons/avatars */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springGentle,
  },
};

/** Card/item entrance – subtle lift */
export const cardEnter = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: easeOut },
  },
};

/** Button hover: subtle lift */
export const hoverLift = { y: -1, scale: 1.01 };
export const hoverLiftTransition = { type: 'tween' as const, duration: 0.2, ease: easeOut };

/** Card hover: gentle elevation */
export const cardHover = { y: -2, scale: 1.005 };
export const cardHoverTransition = { type: 'tween' as const, duration: 0.25, ease: easeOut };

/** Stagger for lists with slightly more delay (onboarding options) */
export const staggerList = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerListItem = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
};
