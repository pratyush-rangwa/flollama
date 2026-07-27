/**
 * __DEV__-gated logger. The web app leaves a raw console.log(response) in
 * ollamaApi.js — don't repeat that in the mobile client.
 */
export const logger = {
  debug(...args: unknown[]) {
    if (__DEV__) console.debug("[flollama]", ...args);
  },
  warn(...args: unknown[]) {
    if (__DEV__) console.warn("[flollama]", ...args);
  },
  error(...args: unknown[]) {
    if (__DEV__) console.error("[flollama]", ...args);
  },
};
