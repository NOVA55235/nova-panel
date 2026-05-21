import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getPanelBg, applyPanelBg } from "@/hooks/use-panel-bg";

// Apply saved panel background immediately on load
applyPanelBg(getPanelBg());

createRoot(document.getElementById("root")!).render(<App />);
