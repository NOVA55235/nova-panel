const STORAGE_KEY = "nova_animated_bg";
const API_BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const token = () => localStorage.getItem("gamepanel_token") || "";

export type AnimBgType = "none" | "particles" | "matrix" | "aurora" | "stars" | "hexgrid" | "nebula";

export interface AnimBgConfig {
  type: AnimBgType;
  opacity: number;
  speed: number;
}

const DEFAULT: AnimBgConfig = { type: "none", opacity: 60, speed: 3 };

export function getAnimBg(): AnimBgConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT };
}

export function applyAnimBg(config: AnimBgConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("nova-anim-bg-change", { detail: config }));
}

export async function saveAnimBgToServer(config: AnimBgConfig): Promise<boolean> {
  applyAnimBg(config);
  try {
    const res = await fetch(`${API_BASE()}/api/branding`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ animated_bg: config }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadAnimBgFromServer(): Promise<AnimBgConfig | null> {
  try {
    const res = await fetch(`${API_BASE()}/api/branding`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.animated_bg) return { ...DEFAULT, ...data.animated_bg };
  } catch {}
  return null;
}

export const ANIM_BG_META: Record<AnimBgType, { label: string; description: string; color: string }> = {
  none:      { label: "None",      description: "No animated background",              color: "#1e293b" },
  particles: { label: "Particles", description: "Floating connected particle network",  color: "#0e7490" },
  matrix:    { label: "Matrix",    description: "Digital rain falling characters",      color: "#065f46" },
  aurora:    { label: "Aurora",    description: "Northern lights color waves",          color: "#4c1d95" },
  stars:     { label: "Stars",     description: "Twinkling starfield with shooting stars", color: "#1e3a5f" },
  hexgrid:   { label: "Hex Grid",  description: "Pulsing cyber hex network",            color: "#1e293b" },
  nebula:    { label: "Nebula",    description: "Slow swirling cosmic color blobs",     color: "#3b0764" },
};
