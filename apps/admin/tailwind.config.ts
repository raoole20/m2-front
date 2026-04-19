import type { Config } from "tailwindcss";

import preset from "@m2/config/tailwind";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [preset as Config],
  theme: {
    extend: {},
  },
};

export default config;
