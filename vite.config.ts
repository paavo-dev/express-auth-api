import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    host: "0.0.0.0", // Allow access from any network
    port: 5173, // Ensure port consistency
    strictPort: true, // Prevent Vite from switching ports
    allowedHosts: ["qzft4n-5173.csb.app"], // Allow all external hosts
  },
});
