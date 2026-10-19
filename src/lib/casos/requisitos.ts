/**
 * Datos que exige cada acción (S05). El registro pide lo mínimo; lo demás se
 * solicita en el momento en que una acción lo necesita, explicando para qué.
 * La misma tabla la consultan el botón y, en la Fase 2, el agente: ninguno
 * puede saltarse un requisito.
 */

export type AccionConRequisitos =
  | "publicar_necesidad"
  | "publicar_oferta"
  | "enviar_propuesta"
  | "solicitar_verificacion";

export type CampoRequerido = "comunaId" | "telefono" | "identificadorFiscal" | "actividad";

export type Requisito = { campo: CampoRequerido; etiqueta: string; motivo: string };

const REQUISITOS: Record<AccionConRequisitos, Requisito[]> = {
  publicar_necesidad: [
    {
      campo: "comunaId",
      etiqueta: "Tu comuna",
      motivo: "Para avisar a quienes pueden atenderte cerca.",
    },
  ],
  publicar_oferta: [
    {
      campo: "comunaId",
      etiqueta: "Tu comuna",
      motivo: "Para mostrar tu oferta a quienes están cerca.",
    },
    {
      campo: "actividad",
      etiqueta: "Qué ofreces",
      motivo: "Para que tu publicación aparezca en las búsquedas de tu rubro.",
    },
  ],
  enviar_propuesta: [
    {
      campo: "telefono",
      etiqueta: "Teléfono",
      motivo: "Para que quien te adjudique pueda coordinar el trabajo contigo.",
    },
  ],
  solicitar_verificacion: [
    {
      campo: "identificadorFiscal",
      etiqueta: "RUT",
      motivo: "Para comprobar tu identidad o la de tu empresa.",
    },
  ],
};

export type DatosPerfilRequisitos = {
  comunaId: number | null;
  telefono: string | null;
  identificadorFiscal: string | null;
  /** Especialidades declaradas más actividades «Otro» pendientes. */
  actividades: number;
};

export function requisitosDe(accion: AccionConRequisitos) {
  return REQUISITOS[accion];
}

/** Lo que le falta a un perfil para hacer una acción. Vacío = puede hacerla. */
export function faltantesPara(accion: AccionConRequisitos, perfil: DatosPerfilRequisitos) {
  return REQUISITOS[accion].filter((r) => {
    switch (r.campo) {
      case "comunaId":
        return !perfil.comunaId;
      case "telefono":
        return !perfil.telefono?.trim();
      case "identificadorFiscal":
        return !perfil.identificadorFiscal?.trim();
      case "actividad":
        return perfil.actividades === 0;
    }
  });
}

/** Lanza un error legible si falta algo: lo usan los casos de uso. */
export function exigirRequisitos(accion: AccionConRequisitos, perfil: DatosPerfilRequisitos) {
  const faltan = faltantesPara(accion, perfil);
  if (faltan.length) {
    const detalle = faltan.map((f) => `${f.etiqueta.toLowerCase()} (${f.motivo.toLowerCase()})`);
    throw new Error(`Antes de continuar falta: ${detalle.join("; ")}`);
  }
}
