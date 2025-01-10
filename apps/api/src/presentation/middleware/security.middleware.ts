import { elysiaHelmet } from "elysiajs-helmet";

const isDev = process.env.NODE_ENV !== "production";

export const securityConfig = elysiaHelmet({
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: isDev
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      : ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
  },

  frameOptions: "DENY",
  xssProtection: true,
  referrerPolicy: "strict-origin-when-cross-origin",

  ...(isDev
    ? {}
    : {
        hsts: {
          maxAge: 15552000, // 180 hari
          includeSubDomains: true,
          preload: true,
        },
      }),
});
