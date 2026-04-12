/** Shared Framer Motion presets for dashboard surfaces */
export const dashboardEase = [0.22, 1, 0.36, 1] as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: dashboardEase },
};

export const staggerContainer = {
  initial: "hidden",
  animate: "show",
  variants: {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.07, delayChildren: 0.04 },
    },
  },
};

export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.32, ease: dashboardEase },
    },
  },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: dashboardEase },
};
