import type { Transition, Variants } from 'framer-motion'

/** Framer-style tween curve (smooth deceleration, similar to Motion’s “out” presets). */
export const CAREERS_EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const careerListContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.052,
      delayChildren: 0.1,
    },
  },
}

export const careerListContainerVariantsReduced: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0,
      delayChildren: 0,
    },
  },
}

const jobCardTween: Transition = {
  type: 'tween',
  duration: 0.48,
  ease: CAREERS_EASE_OUT,
}

export const careerJobCardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: jobCardTween,
  },
  /** Used when `prefers-reduced-motion: reduce` */
  static: {
    opacity: 1,
    y: 0,
    transition: { duration: 0 },
  },
}

/** Micro-interaction on row hover (Motion spring reference feel). */
export const careerCardHoverTransition: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 36,
  mass: 0.42,
}

export const careerCardTapTransition: Transition = {
  type: 'spring',
  stiffness: 680,
  damping: 38,
  mass: 0.35,
}
