import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/page.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/**", "@/lib/**"],
              message:
                "Route pages compose feature public APIs only. Move UI and logic into features.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["features/**/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db/repositories/**"],
              message:
                "Feature components must call feature services instead of repositories.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/finance/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/**",
                "@/components/**",
                "@/features/**",
                "@/lib/db/**",
              ],
              message:
                "Financial domain modules must remain pure and independent of React and persistence.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/db/repositories/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/**",
                "@/components/**",
                "@/features/**",
                "@/lib/finance/**",
              ],
              message:
                "Repositories are persistence-only and cannot depend on UI, features, or financial rules.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
