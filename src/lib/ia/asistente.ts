import { buscarActores } from "@/lib/casos/actores";
import { actividadDe } from "@/lib/casos/actividad";
import { listarNecesidades } from "@/lib/casos/necesidades";
import { formatearDistancia } from "@/lib/geo";
import type { PerfilSesion } from "@/lib/sesion";
import { normalizar } from "@/lib/utils";

import { contextoInterprete, interpretar } from "./index";

export type RespuestaAsistente = {
  texto: string;
  detalle: string[];
  acciones: { etiqueta: string; href: string }[];
  interpretacion: string;
  motor: "reglas" | "modelo";
};

/**
 * Asistente principal.
 *
 * Coordina lo que ya sabe hacer la plataforma —buscar, listar oportunidades,
 * revisar actividad— y responde con acciones concretas. No inventa: cada
 * respuesta sale de una consulta real. Los agentes especializados de la Fase 2
 * llamarán exactamente estos mismos casos de uso.
 */
export async function responder(
  mensaje: string,
  perfil: PerfilSesion | null,
): Promise<RespuestaAsistente> {
  const contexto = await contextoInterprete(perfil?.comunaId ?? null);
  const intencion = await interpretar(mensaje, contexto);
  const texto = normalizar(mensaje);

  const base = {
    interpretacion: intencion.explicacion,
    motor: intencion.motor,
  };

  // 1 · Preguntas sobre la propia actividad.
  if (
    perfil &&
    /(mis|mi)\s+(necesidad|cotiza|propuesta|oportunidad|operacion|trabajo|venta)/.test(texto)
  ) {
    const actividad = await actividadDe(perfil.id);
    const abiertas = actividad.misNecesidades.filter(
      (n) => n.necesidad.estado === "publicada" || n.necesidad.estado === "en_cotizacion",
    );
    return {
      ...base,
      texto:
        `Tienes ${abiertas.length} ${abiertas.length === 1 ? "necesidad abierta" : "necesidades abiertas"}, ` +
        `${actividad.misPropuestas.length} ${actividad.misPropuestas.length === 1 ? "propuesta enviada" : "propuestas enviadas"} y ` +
        `${actividad.oportunidadesAbiertas} ${actividad.oportunidadesAbiertas === 1 ? "oportunidad" : "oportunidades"} esperando respuesta.`,
      detalle: abiertas
        .slice(0, 4)
        .map((n) => `${n.necesidad.titulo} — ${n.propuestas} propuesta(s)`),
      acciones: [{ etiqueta: "Ver mi actividad", href: "/actividad" }],
    };
  }

  // 2 · «Consígueme más clientes»: oportunidades abiertas que le calzan.
  if (/(cliente|venta|vender|trabajo|pega|oportunidad)/.test(texto) && perfil) {
    const abiertas = await listarNecesidades({
      comunaId: perfil.comunaId,
      estado: ["publicada", "en_cotizacion"],
      limite: 6,
    });
    const propias = abiertas.filter((n) => n.necesidad.solicitantePerfilId !== perfil.id);
    return {
      ...base,
      texto: propias.length
        ? `Hay ${propias.length} necesidades abiertas en ${perfil.comunaNombre ?? "tu zona"} que puedes cotizar hoy.`
        : "Ahora mismo no hay necesidades abiertas en tu zona. Publicar una oferta en el feed te deja visible cuando aparezcan.",
      detalle: propias
        .slice(0, 5)
        .map((n) => `${n.necesidad.titulo} — ${n.comunaNombre ?? "sin comuna"} · ${n.propuestas} propuesta(s)`),
      acciones: [
        { etiqueta: "Ver oportunidades", href: "/actividad?vista=oportunidades" },
        { etiqueta: "Publicar una oferta", href: "/publicar?tipo=oferta" },
      ],
    };
  }

  // 3 · Búsqueda: el caso más frecuente.
  const actores = await buscarActores(intencion, {
    desde: perfil?.lat && perfil?.lng ? { lat: perfil.lat, lng: perfil.lng } : null,
    limite: 5,
  });

  if (actores.length) {
    return {
      ...base,
      texto: `Encontré ${actores.length} ${actores.length === 1 ? "opción" : "opciones"}${
        intencion.categoriaNombre ? ` en ${intencion.categoriaNombre.toLowerCase()}` : ""
      }${intencion.comunaNombre ? ` en ${intencion.comunaNombre}` : ""}.`,
      detalle: actores.map((a) => {
        const partes = [a.nombre];
        if (a.distanciaKm !== null) partes.push(formatearDistancia(a.distanciaKm));
        if (a.disponibleAhora) partes.push("disponible ahora");
        if (a.reputacionConteo > 0) partes.push(`${Number(a.reputacionPromedio).toFixed(1)}★`);
        return partes.join(" · ");
      }),
      acciones: [
        { etiqueta: "Ver todos los resultados", href: `/buscar?q=${encodeURIComponent(mensaje)}` },
        { etiqueta: "Publicar esto como necesidad", href: `/publicar?q=${encodeURIComponent(mensaje)}` },
      ],
    };
  }

  return {
    ...base,
    texto:
      "No encontré actores que calcen con eso todavía. Publicarlo como necesidad hace que la plataforma avise a quien pueda resolverlo.",
    detalle: [],
    acciones: [
      { etiqueta: "Publicar una necesidad", href: `/publicar?q=${encodeURIComponent(mensaje)}` },
      { etiqueta: "Explorar el mapa", href: "/mapa" },
    ],
  };
}
