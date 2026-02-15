import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      safeAreaInsets: {
        top: "env(safe-area-inset-top)",
        right: "env(safe-area-inset-right)",
        bottom: "env(safe-area-inset-bottom)",
        left: "env(safe-area-inset-left)",
      },
    },
  },
  plugins: [],
};
export default config;
