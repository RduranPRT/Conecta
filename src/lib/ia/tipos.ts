import type { RolActor } from "@/db/schema";

/**
 * Lo que la plataforma entiende de una frase escrita por una persona.
 * Es el contrato entre el intérprete (reglas o modelo) y todo lo demás:
 * buscador, mapa, feed, matching y asistente consumen esta misma forma.
 */
export type Intencion = {
  consulta: string;
  /** Palabras útiles, sin conectores ni referencias de tiempo o lugar. */
  terminos: string[];
  categoriaId: number | null;
  categoriaNombre: string | null;
  comunaId: number | null;
  comunaNombre: string | null;
  /** «cerca de mí» → ordenar por distancia desde la ubicación del usuario. */
  cerca: boolean;
  disponibilidad: "hoy" | "semana" | "cualquiera";
  tipo: "servicio" | "producto" | "cualquiera";
  roles: RolActor[];
  presupuestoMax: number | null;
  /** Cómo se interpretó: queda registrado para poder auditar a la IA. */
  motor: "reglas" | "modelo";
  explicacion: string;
};

export type ContextoInterprete = {
  categorias: { id: number; slug: string; nombre: string; tipo: string; sinonimos: string[] }[];
  comunas: { id: number; nombre: string }[];
  comunaUsuarioId?: number | null;
};

export const intencionVacia = (consulta: string): Intencion => ({
  consulta,
  terminos: [],
  categoriaId: null,
  categoriaNombre: null,
  comunaId: null,
  comunaNombre: null,
  cerca: false,
  disponibilidad: "cualquiera",
  tipo: "cualquiera",
  roles: [],
  presupuestoMax: null,
  motor: "reglas",
  explicacion: "",
});
