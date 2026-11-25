/**
 * Fotos de ejemplo del seed: ilustraciones generadas aquí mismo, sin personas
 * ni material de terceros. Pasan por los mismos casos de uso que la interfaz.
 */
import sharp from "sharp";

type Dibujo = "pan" | "torta" | "tomate" | "gota" | "herramienta" | "camara";

const FORMAS: Record<Dibujo, { fondo: [string, string]; svg: string }> = {
  pan: {
    fondo: ["#f6e3c5", "#e7c590"],
    svg: `<ellipse cx="600" cy="520" rx="360" ry="200" fill="#b9743a"/>
      <ellipse cx="600" cy="490" rx="345" ry="180" fill="#d99a56"/>
      <path d="M430 400 q60 90 20 190 M590 350 q60 110 20 250 M750 400 q60 90 20 190" stroke="#8f5525" stroke-width="22" fill="none" stroke-linecap="round"/>`,
  },
  torta: {
    fondo: ["#fde7ef", "#f7c8d8"],
    svg: `<rect x="330" y="420" width="540" height="260" rx="30" fill="#f2b5c7"/>
      <rect x="330" y="420" width="540" height="90" rx="30" fill="#fff5f8"/>
      <circle cx="450" cy="390" r="36" fill="#c2334f"/><circle cx="600" cy="375" r="36" fill="#c2334f"/><circle cx="750" cy="390" r="36" fill="#c2334f"/>`,
  },
  tomate: {
    fondo: ["#e8f5e0", "#c7e5b5"],
    svg: `<circle cx="480" cy="500" r="170" fill="#d9412f"/><circle cx="730" cy="540" r="150" fill="#c93525"/>
      <path d="M430 350 l50 40 l50 -40 l-20 60 h-60 z M690 400 l40 36 l40 -36 l-16 50 h-48 z" fill="#3f7d2c"/>`,
  },
  gota: {
    fondo: ["#e1f1fb", "#b5dbf2"],
    svg: `<path d="M600 220 C700 380 790 470 790 580 A190 190 0 0 1 410 580 C410 470 500 380 600 220 Z" fill="#2b7fb8"/>
      <path d="M500 590 A100 100 0 0 0 590 680" stroke="#ffffff" stroke-width="26" fill="none" stroke-linecap="round" opacity="0.75"/>`,
  },
  herramienta: {
    fondo: ["#eceff3", "#cdd5df"],
    svg: `<g transform="rotate(-40 600 450)"><rect x="560" y="380" width="80" height="380" rx="40" fill="#4a5568"/>
      <path d="M600 200 a120 120 0 1 0 1 0 M560 190 h80 v120 h-80 z" fill="#718096"/><rect x="565" y="170" width="70" height="120" fill="#dbe1e9"/></g>`,
  },
  camara: {
    fondo: ["#efe9fb", "#d4c6f2"],
    svg: `<rect x="320" y="340" width="560" height="340" rx="50" fill="#41366b"/><rect x="500" y="290" width="200" height="80" rx="24" fill="#41366b"/>
      <circle cx="600" cy="510" r="130" fill="#8b78c9"/><circle cx="600" cy="510" r="80" fill="#2a2247"/><circle cx="800" cy="410" r="24" fill="#f4c94b"/>`,
  },
};

export function ilustracion(dibujo: Dibujo): Promise<Buffer> {
  const { fondo, svg } = FORMAS[dibujo];
  return sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
      <defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fondo[0]}"/><stop offset="1" stop-color="${fondo[1]}"/></linearGradient></defs>
      <rect width="1200" height="900" fill="url(#f)"/>${svg}</svg>`),
  )
    .jpeg({ quality: 90 })
    .toBuffer();
}

/** Qué perfiles y productos del seed llevan foto. */
export const FOTOS_PERFIL: [slug: string, dibujo: Dibujo][] = [
  ["gasfiteria-aguasur", "gota"],
  ["panaderia-dona-rosa", "pan"],
  ["verduras-del-valle", "tomate"],
  ["ferreteria-el-roble", "herramienta"],
  ["lumen-audiovisual", "camara"],
];

export const FOTOS_ITEM: [slug: string, item: string, dibujos: Dibujo[]][] = [
  ["panaderia-dona-rosa", "Pan amasado", ["pan", "torta"]],
  ["panaderia-dona-rosa", "Torta de mil hojas", ["torta"]],
  ["verduras-del-valle", "Caja de tomates 15 kg", ["tomate"]],
];
