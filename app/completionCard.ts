import type { GardenState, LifeDimension } from "./domain";
import type { Locale } from "./i18n";

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
})[character] ?? character);

const dimensionOrder: LifeDimension[] = ["mind", "body", "spirit", "vocation"];

export const createCompletionCardSvg = ({
  startDate,
  endDate,
  garden,
  locale,
}: {
  startDate: string;
  endDate: string;
  garden: GardenState;
  locale: Locale;
}) => {
  const title = locale === "zh-HK" ? "7／14 生命花園完成" : "7 / 14 Life Garden Complete";
  const subtitle = locale === "zh-HK" ? "七次真實行動，慢慢養好人生。" : "Seven real actions, growing a life over time.";
  const plants = dimensionOrder.map((dimension, index) => {
    const value = garden.growth[dimension];
    const height = Math.min(170, 58 + value * 10);
    const x = 710 + index * 122;
    const top = 505 - height;
    return `<g aria-hidden="true"><path d="M${x} 515 Q${x - 8} ${top + 45} ${x} ${top}" fill="none" stroke="#143C2D" stroke-width="10" stroke-linecap="round"/><ellipse cx="${x - 24}" cy="${top + 48}" rx="28" ry="14" transform="rotate(-28 ${x - 24} ${top + 48})" fill="${index % 2 === 0 ? "#DA8134" : "#D6AE5E"}"/><ellipse cx="${x + 25}" cy="${top + 79}" rx="28" ry="14" transform="rotate(28 ${x + 25} ${top + 79})" fill="${index % 2 === 0 ? "#D6AE5E" : "#DA8134"}"/><circle cx="${x}" cy="${top}" r="18" fill="#FFFFFF" stroke="#D6AE5E" stroke-width="6"/></g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${escapeXml(title)}">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F7F1E5"/><stop offset="1" stop-color="#F1D6AE"/></linearGradient></defs>
  <rect width="1200" height="675" rx="42" fill="url(#sky)"/>
  <path d="M0 490 C180 420 340 520 520 455 C690 395 850 480 1200 400 V675 H0Z" fill="#143C2D"/>
  <circle cx="275" cy="280" r="86" fill="#FFFFFF" opacity=".72"/><circle cx="275" cy="266" r="38" fill="#D6AE5E"/><path d="M210 405 Q275 300 340 405" fill="#DA8134"/><circle cx="275" cy="282" r="112" fill="none" stroke="#D6AE5E" stroke-width="6" opacity=".8"/>
  <g fill="#FFFFFF" opacity=".85"><circle cx="150" cy="470" r="18"/><circle cx="205" cy="445" r="24"/><circle cx="340" cy="460" r="22"/><circle cx="395" cy="438" r="15"/></g>
  <text x="92" y="105" fill="#9A3D1A" font-size="20" font-weight="800" letter-spacing="4">CHANGE-LIFE OS · BETA V2</text>
  <text x="92" y="170" fill="#143C2D" font-size="54" font-family="Georgia, serif" font-weight="700">${escapeXml(title)}</text>
  <text x="92" y="215" fill="#59675F" font-size="24">${escapeXml(subtitle)}</text>
  <text x="700" y="242" fill="#9A3D1A" font-size="18" font-weight="800" letter-spacing="3">${escapeXml(startDate)} — ${escapeXml(endDate)}</text>
  <text x="700" y="300" fill="#143C2D" font-size="42" font-family="Georgia, serif" font-weight="700">7 / 14</text>
  ${plants}
  <text x="92" y="612" fill="#FFFFFF" font-size="20">7 / 14 · ${escapeXml(locale === "zh-HK" ? "只記錄完成，不包含私人內容" : "Completion only · No private content")}</text>
  </svg>`;
};

export const downloadCompletionCard = (svg: string, filename: string) => {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
