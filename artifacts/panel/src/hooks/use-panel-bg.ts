const PANEL_BG_KEY = "nova_panel_bg";

export type PanelBgPreset =
  | "none"
  | "everest"
  | "aurora"
  | "nebula"
  | "ocean"
  | "matrix"
  | "sunset"
  | "custom";

export interface PanelBgConfig {
  preset: PanelBgPreset;
  customUrl?: string;
  videoUrl?: string;
  opacity?: number;
}

export const PANEL_PRESETS: Record<PanelBgPreset, { label: string; gradient?: string; description: string }> = {
  none: {
    label: "None (Default)",
    description: "Clean dark Everest background",
  },
  everest: {
    label: "Everest Glow",
    gradient: "radial-gradient(ellipse at 15% 20%, rgba(6,182,212,0.15) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(99,102,241,0.12) 0%, transparent 50%)",
    description: "Subtle cyan & violet glacier glow",
  },
  aurora: {
    label: "Aurora",
    gradient: "radial-gradient(ellipse at 0% 50%, rgba(16,185,129,0.12) 0%, transparent 50%), radial-gradient(ellipse at 100% 50%, rgba(139,92,246,0.10) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 55%)",
    description: "Northern lights green & violet",
  },
  nebula: {
    label: "Nebula",
    gradient: "radial-gradient(ellipse at 30% 30%, rgba(139,92,246,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(236,72,153,0.08) 0%, transparent 55%)",
    description: "Deep space purple & pink",
  },
  ocean: {
    label: "Ocean",
    gradient: "radial-gradient(ellipse at 10% 80%, rgba(6,182,212,0.14) 0%, transparent 60%), radial-gradient(ellipse at 90% 10%, rgba(14,165,233,0.10) 0%, transparent 60%)",
    description: "Teal & blue depth",
  },
  matrix: {
    label: "Matrix",
    gradient: "radial-gradient(ellipse at 50% 50%, rgba(0,200,65,0.10) 0%, transparent 65%)",
    description: "Deep green terminal",
  },
  sunset: {
    label: "Sunset",
    gradient: "radial-gradient(ellipse at 50% 100%, rgba(251,146,60,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 0%, rgba(139,92,246,0.08) 0%, transparent 50%)",
    description: "Warm orange & violet",
  },
  custom: {
    label: "Custom Image",
    description: "Use your own background image",
  },
};

export function getPanelBg(): PanelBgConfig {
  try {
    const stored = localStorage.getItem(PANEL_BG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { preset: "everest", opacity: 100 };
}

function applyLocalPanel(config: PanelBgConfig) {
  localStorage.setItem(PANEL_BG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("panelbgchange", { detail: config }));
  applyPanelBg(config);
}

// Admin saves: persists to server then mirrors locally
export async function setPanelBg(config: PanelBgConfig): Promise<boolean> {
  applyLocalPanel(config);
  try {
    const token = localStorage.getItem("gamepanel_token");
    const res = await fetch("/api/branding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ panelBg: config }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Public fetch — applies server-side branding for everyone
export async function fetchPanelBgFromServer(): Promise<PanelBgConfig> {
  try {
    const res = await fetch("/api/branding");
    if (!res.ok) return getPanelBg();
    const data = await res.json();
    const cfg: PanelBgConfig = data?.panelBg ?? { preset: "everest", opacity: 100 };
    applyLocalPanel(cfg);
    return cfg;
  } catch {
    return getPanelBg();
  }
}

export function applyPanelBg(config: PanelBgConfig) {
  let el = document.getElementById("nova-panel-bg");
  if (!el) {
    el = document.createElement("div");
    el.id = "nova-panel-bg";
    document.body.prepend(el);
  }

  // Clear any existing video child
  el.innerHTML = "";
  el.style.backgroundImage = "";
  el.style.background = "";
  el.style.backgroundSize = "";
  el.style.backgroundPosition = "";
  el.style.backgroundRepeat = "";

  if (config.preset === "none" && !config.videoUrl) {
    el.style.opacity = "0";
    return;
  }

  const opacity = (config.opacity ?? 100) / 100;
  el.style.opacity = String(opacity);

  if (config.videoUrl) {
    const video = document.createElement("video");
    video.src = config.videoUrl;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;";
    el.style.cssText += ";overflow:hidden;";
    el.appendChild(video);
    video.play().catch(() => {});
  } else if (config.preset === "custom" && config.customUrl) {
    el.style.backgroundImage = `url(${config.customUrl})`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.style.backgroundRepeat = "no-repeat";
  } else {
    const preset = PANEL_PRESETS[config.preset];
    el.style.backgroundImage = preset?.gradient ?? "";
  }
}
