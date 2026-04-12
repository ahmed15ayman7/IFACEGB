/** Framer Motion presets for public marketing pages */
export const publicEase = [0.22, 1, 0.36, 1] as const;

export function publicTransition(delay = 0) {
  return { duration: 0.52, delay, ease: publicEase };
}

export const publicViewport = { once: true, margin: "-60px" as const };
