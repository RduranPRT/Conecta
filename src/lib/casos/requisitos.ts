/**
 * Datos que exige cada acción (S05). El registro pide lo mínimo; lo demás se
 * solicita en el momento en que una acción lo necesita, explicando para qué.
 * La misma tabla la consultan el botón y, en la Fase 2, el agente: ninguno
 * puede saltarse un requisito.
 */

export const ACCIONES = [
  "buscar",
  "ver",
  "guardar",
  "contactar",
  "publicar_necesidad",
  "ofrecer",
  "enviar_propuesta",
  "publicar_catalogo",
  "publicar_oferta",
  "solicitar_verificacion",
] as const;

export type AccionConRequisitos = (typeof ACCIONES)[number];

export type CampoRequerido = "comunaId" | "telefono" | "identificadorFiscal" | "actividad";

export type Requisito = { campo: CampoRequerido; etiqueta: string; motivo: string };

/** Solo le falta a cuentas anteriores a nov-2026: el alta ya lo pide. */
const RUT: Requisito = {
  campo: "identificadorFiscal",
  etiqueta: "RUT",
  motivo: "Para que todos sepan que detrás de cada cuenta hay una persona o empresa real.",
};

const comuna = (motivo: string): Requisito => ({ campo: "comunaId", etiqueta: "Comuna", motivo });

const ACTIVIDAD: Requisito = {
  campo: "actividad",
  etiqueta: "Qué ofreces",
  motivo: "Para que aparezcas cuando alguien busque lo que haces o vendes.",
};

const TELEFONO: Requisito = {
  campo: "telefono",
  etiqueta: "Teléfono",
  motivo: "Para que quien te contrate pueda coordinar contigo. Solo lo ven personas con cuenta.",
};

const OFRECER = [
  RUT,
  comuna("Para mostrarte a quienes están cerca."),
  ACTIVIDAD,
  TELEFONO,
];

const REQUISITOS: Record<AccionConRequisitos, Requisito[]> = {
  buscar: [],
  ver: [],
  guardar: [],
  contactar: [RUT],
  publicar_necesidad: [RUT, comuna("Para avisar a quienes pueden atenderte cerca.")],
  ofrecer: OFRECER,
  enviar_propuesta: OFRECER,
  publicar_catalogo: OFRECER,
  publicar_oferta: OFRECER,
  solicitar_verificacion: [RUT],
};

export type DatosPerfilRequisitos = {
  comunaId: number | null;
  telefono: string | null;
  /** RUT validado y normalizado; uno heredado que no es válido cuenta como que falta. */
  identificadorFiscalNorm: string | null;
  /** Actividades declaradas más las escritas en «Otro». */
  actividades: number;
};

export function esAccion(valor: string): valor is AccionConRequisitos {
  return (ACCIONES as readonly string[]).includes(valor);
}

/** Lo que le falta a un perfil para hacer una acción. Vacío = puede hacerla. */
export function requisitosPara(
  accion: AccionConRequisitos,
  perfil: DatosPerfilRequisitos,
): Requisito[] {
  return REQUISITOS[accion].filter((r) => {
    switch (r.campo) {
      case "comunaId":
        return !perfil.comunaId;
      case "telefono":
        return !perfil.telefono?.trim();
      case "identificadorFiscal":
        return !perfil.identificadorFiscalNorm;
      case "actividad":
        return perfil.actividades === 0;
    }
  });
}

/** Lanza un error legible si falta algo: lo usan los casos de uso. */
export function exigirRequisitos(accion: AccionConRequisitos, perfil: DatosPerfilRequisitos) {
  const faltan = requisitosPara(accion, perfil);
  if (faltan.length) {
    const detalle = faltan.map((f) => `${f.etiqueta} (${f.motivo.replace(/\.$/, "")})`);
    throw new Error(`Antes de continuar falta: ${detalle.join("; ")}.`);
  }
}
