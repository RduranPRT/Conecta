/** Datos de referencia del prototipo: territorio y agentes. */

import { COMUNAS_CL, REGIONES_CL } from "./territorio-cl";

/* ── Territorio ───────────────────────────────────────────────────────────── */

/** Comuna piloto: la plataforma arranca aquí, pero el modelo no lo asume. */
export const CODIGO_COMUNA_PILOTO = "13120"; // Ñuñoa

export const REGIONES = REGIONES_CL;

export const COMUNAS = COMUNAS_CL.map((c) => ({ ...c, activa: c.codigo === CODIGO_COMUNA_PILOTO }));

/* La taxonomía vive en `seed/taxonomia.ts`. */

/* ── Agentes ──────────────────────────────────────────────────────────────── */

export const AGENTES: {
  codigo: string;
  nombre: string;
  descripcion: string;
  ambito: "usuario" | "administracion";
  disponible: boolean;
  orden: number;
}[] = [
  {
    codigo: "comercial",
    nombre: "Agente Comercial",
    descripcion: "Detecta oportunidades abiertas que calzan contigo y prepara el acercamiento.",
    ambito: "usuario",
    disponible: false,
    orden: 1,
  },
  {
    codigo: "cotizador",
    nombre: "Agente Cotizador",
    descripcion: "Arma la cotización a partir de tu lista de precios y tu carga de trabajo.",
    ambito: "usuario",
    disponible: false,
    orden: 2,
  },
  {
    codigo: "agenda",
    nombre: "Agente Agenda",
    descripcion: "Ordena visitas y entregas según distancia y disponibilidad real.",
    ambito: "usuario",
    disponible: false,
    orden: 3,
  },
  {
    codigo: "atencion",
    nombre: "Agente Atención al Cliente",
    descripcion: "Responde consultas frecuentes y escala lo que necesita tu decisión.",
    ambito: "usuario",
    disponible: false,
    orden: 4,
  },
  {
    codigo: "marketing",
    nombre: "Agente Marketing",
    descripcion: "Propone publicaciones y promociones territoriales según lo que se mueve.",
    ambito: "usuario",
    disponible: false,
    orden: 5,
  },
  {
    codigo: "crm",
    nombre: "Agente CRM",
    descripcion: "Mantiene el seguimiento de clientes, recompras y contactos dormidos.",
    ambito: "usuario",
    disponible: false,
    orden: 6,
  },
  {
    codigo: "financiero",
    nombre: "Agente Financiero",
    descripcion: "Vigila márgenes, cobros y flujo. Nunca mueve dinero por su cuenta.",
    ambito: "usuario",
    disponible: false,
    orden: 7,
  },
  {
    codigo: "inventario",
    nombre: "Agente Inventario y Compras",
    descripcion: "Anticipa quiebres de stock y arma la lista de reposición.",
    ambito: "usuario",
    disponible: false,
    orden: 8,
  },
  {
    codigo: "proveedores",
    nombre: "Agente Proveedores",
    descripcion: "Compara proveedores por precio, plazo y cumplimiento histórico.",
    ambito: "usuario",
    disponible: false,
    orden: 9,
  },
  {
    codigo: "administrador",
    nombre: "Agente Administrador",
    descripcion: "Coordina a los demás agentes y te reporta en un solo lugar.",
    ambito: "usuario",
    disponible: false,
    orden: 10,
  },
  {
    codigo: "moderador",
    nombre: "Agente Moderador",
    descripcion: "Revisa publicaciones y contenido denunciado.",
    ambito: "administracion",
    disponible: false,
    orden: 11,
  },
  {
    codigo: "antifraude",
    nombre: "Agente Antifraude",
    descripcion: "Detecta patrones anómalos en perfiles y operaciones.",
    ambito: "administracion",
    disponible: false,
    orden: 12,
  },
  {
    codigo: "soporte",
    nombre: "Agente Soporte",
    descripcion: "Atiende consultas de usuarios y arma el caso para el equipo humano.",
    ambito: "administracion",
    disponible: false,
    orden: 13,
  },
  {
    codigo: "verificacion",
    nombre: "Agente Verificación",
    descripcion: "Prepara las verificaciones de identidad y de información comercial.",
    ambito: "administracion",
    disponible: false,
    orden: 14,
  },
  {
    codigo: "territorial",
    nombre: "Agente Territorial",
    descripcion: "Vigila cobertura, huecos de oferta y activación de comunas.",
    ambito: "administracion",
    disponible: false,
    orden: 15,
  },
  {
    codigo: "operaciones",
    nombre: "Agente Operaciones",
    descripcion: "Sigue las operaciones atascadas y las que no se califican.",
    ambito: "administracion",
    disponible: false,
    orden: 16,
  },
  {
    codigo: "analitica",
    nombre: "Agente Analítica",
    descripcion: "Interpreta qué está pasando en el territorio, no solo qué se midió.",
    ambito: "administracion",
    disponible: false,
    orden: 17,
  },
  {
    codigo: "administrador-central",
    nombre: "Agente Administrador Central",
    descripcion: "Coordina a los agentes administrativos y escala lo que requiere decisión humana.",
    ambito: "administracion",
    disponible: false,
    orden: 18,
  },
];
