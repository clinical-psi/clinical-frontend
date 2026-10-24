import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@mantine")) {
              return "mantine";
            }
            if (id.includes("@tabler/icons-react")) {
              return "icons";
            }
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            return "vendor"; // El resto de librerías de node_modules
          }
        },
      },
    },
  },
});
