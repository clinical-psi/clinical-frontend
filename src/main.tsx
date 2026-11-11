import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, Modal } from "@mantine/core";
import type { MantineThemeOverride } from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import App from "./App.tsx";
import { FeedbackProvider } from "./components/feedback/FeedbackProvider";

const theme: MantineThemeOverride = {
  primaryColor: "blue",
  colors: {
    blue: [
      "#E8F0F7", // 0 - accent-soft
      "#8CB7D7", // 1 - accent-light
      "#5D90BD", // 2 - accent (primary)
      "#4A7BA8", // 3
      "#3D5F8F", // 4 - accent-dark
      "#2E4A6E", // 5
      "#20324D", // 6
      "#151D2E", // 7
      "#0F1620", // 8
      "#0A0D15", // 9
    ] as unknown as any,
    gray: [
      "#FAF8F4", // 0 - canvas-alt
      "#F1EEE7", // 1 - canvas
      "#E0DDD4", // 2 - line
      "#A8B3BA", // 3 - ink-disabled
      "#6B7A86", // 4 - ink-secondary
      "#2C3E50", // 5 - ink
      "#1F2937", // 6
      "#111827", // 7
      "#030712", // 8
      "#000000", // 9
    ] as unknown as any,
    green: [
      "#E8F3E9", // 0 - success-soft
      "#B8D9BB", // 1
      "#6FA785", // 2 - success
      "#5A9468", // 3
      "#45814B", // 4
      "#2E622E", // 5
      "#17451F", // 6
      "#0F2E14", // 7
      "#07160A", // 8
      "#000000", // 9
    ] as unknown as any,
    red: [
      "#F5E8E5", // 0 - danger-soft
      "#E8B8B0", // 1
      "#C85A54", // 2 - danger
      "#B54D45", // 3
      "#A24036", // 4
      "#8F3327", // 5
      "#7C2618", // 6
      "#691909", // 7
      "#560C00", // 8
      "#000000", // 9
    ] as unknown as any,
    yellow: [
      "#F7EEDB", // 0 - warm-soft
      "#F0E0B8", // 1
      "#EBC88A", // 2 - warning
      "#E8BD77", // 3
      "#D4A75C", // 4 - warm-dark
      "#C09247", // 5
      "#A07D32", // 6
      "#80681D", // 7
      "#605308", // 8
      "#000000", // 9
    ] as unknown as any,
  },
  components: {
    // Every modal in the app shares the same placement, shape, overlay and title style.
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        radius: "md",
        padding: "lg",
        overlayProps: { backgroundOpacity: 0.45, blur: 2 },
      },
      styles: {
        title: { fontWeight: 600, fontSize: "var(--mantine-font-size-lg)" },
      },
    }),
  },
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </MantineProvider>
  </StrictMode>,
);
