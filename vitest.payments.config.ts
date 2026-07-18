import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["payments-worker/src/**/*.test.ts"],
  },
});
