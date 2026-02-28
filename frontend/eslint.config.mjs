import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Project-level rule relaxations to keep the current code structure
  {
    rules: {
      // Allow flexible typing where external libraries / globals are involved
      "@typescript-eslint/no-explicit-any": "off",
      // Our AR setup intentionally calls setState inside effects; allow this
      "react-hooks/set-state-in-effect": "off",
      // Allow apostrophes in text content without escaping
      "react/no-unescaped-entities": "off",
      // We intentionally use raw <img> in our image wrapper in some cases
      "@next/next/no-img-element": "off",
      // Accessibility warnings around alt text are relaxed for now
      "jsx-a11y/alt-text": "off",
    },
  },
]);

export default eslintConfig;
