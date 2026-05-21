const STORAGE_KEY = "gamepanel_login_bg";

export type LoginBgPreset =
  | "default"
  | "nebula"
  | "ocean"
  | "forest"
  | "fire"
  | "aurora"
  | "midnight"
  | "sunset"
  | "matrix"
  | "custom";

export interface LoginBgConfig {
  preset: LoginBgPreset;
  customUrl?: string;
  videoUrl?: string;
  opacity?: number;
}

const DEFAULT: LoginBgConfig = { preset: "default", opacity: 60 };

// Synchronous read (cache for instant first paint)
export function getLoginBg(): LoginBgConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT;
}

// Apply locally (cache + dispatch)
function applyLocal(config: LoginBgConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("loginbgchange", { detail: config }));
}

// Fetch the global (admin-set) branding from server. Public endpoint.
export async function fetchLoginBgFromServer(): Promise<LoginBgConfig> {
  try {
    const res = await fetch("/api/branding");
    if (!res.ok) return getLoginBg();
    const data = await res.json();
    const cfg: LoginBgConfig = data?.loginBg ?? DEFAULT;
    applyLocal(cfg);
    return cfg;
  } catch {
    return getLoginBg();
  }
}

// Admin saves: writes to server then mirrors locally so UI updates instantly
export async function setLoginBg(config: LoginBgConfig): Promise<boolean> {
  applyLocal(config);
  try {
    const token = localStorage.getItem("gamepanel_token");
    const res = await fetch("/api/branding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ loginBg: config }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const PRESETS: Record<LoginBgPreset, { label: string; gradient?: string; description: string }> = {
  default: {
    label: "Default",
    gradient: "radial-gradient(ellipse at 20% 20%, rgba(0,149,255,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0,255,180,0.15) 0%, transparent 60%)",
    description: "Electric blue & cyan glow",
  },
  nebula: {
    label: "Nebula",
    gradient: "radial-gradient(ellipse at 30% 30%, rgba(139,92,246,0.4) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(236,72,153,0.3) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.15) 0%, transparent 50%)",
    description: "Deep space purple & pink",
  },
  ocean: {
    label: "Ocean Depth",
    gradient: "radial-gradient(ellipse at 10% 80%, rgba(6,182,212,0.4) 0%, transparent 60%), radial-gradient(ellipse at 90% 10%, rgba(14,165,233,0.3) 0%, transparent 60%)",
    description: "Teal & deep blue waves",
  },
  forest: {
    label: "Dark Forest",
    gradient: "radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.25) 0%, transparent 55%)",
    description: "Neon green on black",
  },
  fire: {
    label: "Inferno",
    gradient: "radial-gradient(ellipse at 50% 80%, rgba(249,115,22,0.4) 0%, transparent 55%), radial-gradient(ellipse at 20% 20%, rgba(239,68,68,0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 10%, rgba(234,179,8,0.2) 0%, transparent 40%)",
    description: "Red, orange & gold flames",
  },
  aurora: {
    label: "Aurora",
    gradient: "radial-gradient(ellipse at 0% 50%, rgba(16,185,129,0.4) 0%, transparent 50%), radial-gradient(ellipse at 100% 50%, rgba(139,92,246,0.35) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.25) 0%, transparent 55%)",
    description: "Northern lights green & violet",
  },
  midnight: {
    label: "Midnight",
    gradient: "radial-gradient(ellipse at 50% 100%, rgba(30,58,138,0.6) 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, rgba(15,23,42,0.8) 0%, transparent 50%)",
    description: "Deep navy blue & indigo",
  },
  sunset: {
    label: "Sunset",
    gradient: "radial-gradient(ellipse at 50% 100%, rgba(251,146,60,0.45) 0%, transparent 55%), radial-gradient(ellipse at 20% 0%, rgba(236,72,153,0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 0%, rgba(139,92,246,0.3) 0%, transparent 50%)",
    description: "Orange, pink & violet dusk",
  },
  matrix: {
    label: "Matrix",
    gradient: "radial-gradient(ellipse at 50% 50%, rgba(0,255,65,0.2) 0%, transparent 70%), radial-gradient(ellipse at 20% 80%, rgba(0,200,50,0.25) 0%, transparent 50%)",
    description: "Deep green terminal",
  },
  custom: {
    label: "Custom Image",
    description: "Use your own background image URL",
  },
};
