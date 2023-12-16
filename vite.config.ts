import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://stackoverflow.com/questions/75832641/how-to-compile-svelte-3-components-into-iifes-that-can-be-used-in-vanilla-js

const format = "iife"; // , "es"];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const production = mode === "production";

  return {
    plugins: [
      svelte({
        emitCss: false,
        compilerOptions: { dev: !production },
      }),
    ],

    build: {
      minify: true,
      rollupOptions: {
        input: `src/tweakpane-css.ts`,
        output: {
          dir: "dist",
          entryFileNames: `[name].js`,
          chunkFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
          format: "iife",
        },
        // Additional Rollup-specific configurations can be placed here if needed
      },
      // Further build-specific configurations can be placed here
    },
    // Additional Vite-specific configurations can be added here
  };
});
