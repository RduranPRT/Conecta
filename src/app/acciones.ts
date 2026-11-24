"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { agentesContratados, necesidades, verificaciones } from "@/db/schema";
import { auth } from "@/lib/auth";
import { adjudicar, calificar, enviarPropuesta, registrarEntrega } from "@/lib/casos/propuestas";
import { alternarReaccion, alternarSeguimiento, crearPublicacion } from "@/lib/casos/feed";
import { alternarGuardado } from "@/lib/casos/guardados";
import { enviarMensaje, iniciarConversacion } from "@/lib/casos/mensajes";
import { invitarACotizar, publicarNecesidad } from "@/lib/casos/necesidades";
import {
  cambiarDisponibilidadItem,
  crearItem,
  editarItem,
  type EntradaItem,
} from "@/lib/casos/catalogo";
import { resolverSolicitudCategoria } from "@/lib/casos/categorias";
import { contactoDe, type Contacto } from "@/lib/casos/ficha";
import {
  completarTelefono,
  crearPerfil,
  fijarDisponibilidad,
  guardarFicha,
} from "@/lib/casos/perfil";
import { conParametros, destinoSeguro, INICIO } from "@/lib/destino";
import { obtenerPerfil, obtenerSesion } from "@/lib/sesion";
import type { RolActor, TipoIdentidad } from "@/db/schema";

export type EstadoAccion = { ok?: boolean; error?: string; mensaje?: string; id?: number };

const VACIO: EstadoAccion = {};

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function numero(formData: FormData, campo: string): number | null {
  const valor = texto(formData, campo).replace(/[^\d.-]/g, "");
  if (!valor) return null;
  const n = Number(valor);
  return Number.isNaN(n) ? null : n;
}

function enteros(formData: FormData, campo: string) {
  return formData
    .getAll(campo)
    .map((c) => Number(c))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function textos(formData: FormData, campo: string) {
  return formData
    .getAll(campo)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

function tipoIdentidad(formData: FormData): TipoIdentidad {
  return texto(formData, "tipoIdentidad") === "empresa" ? "empresa" : "persona";
}

function esAdministrador(email: string | null | undefined) {
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return Boolean(email && admins.includes(email.toLowerCase()));
}

async function perfilOFalla() {
  const perfil = await obtenerPerfil();
  if (!perfil) throw new Error("Necesitas iniciar sesión.");
  return perfil;
}

/* ── Identidad ─────────────────────────────────────────────────────────── */

export async function accionRegistro(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const nombre = texto(formData, "nombre");
  const email = texto(formData, "email").toLowerCase();
  const clave = texto(formData, "clave");

  if (!nombre || !email || !clave) return { error: "Completa nombre, correo y contraseña." };
  if (clave.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };

  try {
    await auth.api.signUpEmail({
      body: { name: nombre, email, password: clave },
      headers: await headers(),
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo crear la cuenta.";
    return { error: mensaje.includes("exist") ? "Ya existe una cuenta con ese correo." : mensaje };
  }

  const destino = destinoSeguro(texto(formData, "next"));
  redirect(destino === INICIO ? "/onboarding" : conParametros("/onboarding", { next: destino }));
}

export async function accionIngreso(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const email = texto(formData, "email").toLowerCase();
  const clave = texto(formData, "clave");
  const destino = destinoSeguro(texto(formData, "next"));

  if (!email || !clave) return { error: "Escribe tu correo y tu contraseña." };

  try {
    await auth.api.signInEmail({
      body: { email, password: clave },
      headers: await headers(),
    });
  } catch {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(destino);
}

export async function accionSalir() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function accionCrearPerfil(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const sesion = await obtenerSesion();
  if (!sesion?.user?.id) return { error: "Tu sesión expiró. Vuelve a ingresar." };

  const roles = formData.getAll("roles").map(String) as RolActor[];

  try {
    await crearPerfil({
      usuarioId: sesion.user.id,
      nombre: texto(formData, "nombre"),
      tipoIdentidad: tipoIdentidad(formData),
      roles: roles.length ? roles : ["persona"],
      comunaId: numero(formData, "comunaId"),
      identificadorFiscal: texto(formData, "rut") || null,
      telefono: texto(formData, "telefono") || null,
      descripcion: texto(formData, "descripcion") || null,
      direccion: texto(formData, "direccion") || null,
      radioKm: numero(formData, "radioKm"),
      categoriaIds: enteros(formData, "categorias"),
      otrasActividades: textos(formData, "otrasActividades"),
      lat: numero(formData, "lat"),
      lng: numero(formData, "lng"),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo crear el perfil." };
  }

  const destino = destinoSeguro(texto(formData, "next"));
  redirect(destino === INICIO ? "/bienvenida" : conParametros(destino, { cuenta: "lista" }));
}

export async function accionActualizarPerfil(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();

  const roles = formData.getAll("roles").map(String) as RolActor[];

  try {
    await guardarFicha(perfil.id, {
      nombre: texto(formData, "nombre") || perfil.nombre,
      tipoIdentidad: tipoIdentidad(formData),
      roles: roles.length ? roles : ["persona"],
      descripcion: texto(formData, "descripcion") || null,
      telefono: texto(formData, "telefono") || null,
      correoPublico: texto(formData, "correoPublico") || null,
      sitioWeb: texto(formData, "sitioWeb") || null,
      direccion: texto(formData, "direccion") || null,
      identificadorFiscal: texto(formData, "rut") || null,
      comunaId: numero(formData, "comunaId"),
      radioKm: numero(formData, "radioKm"),
      lat: numero(formData, "lat"),
      lng: numero(formData, "lng"),
      categoriaIds: enteros(formData, "categorias"),
      otrasActividades: textos(formData, "otrasActividades"),
      coberturaIds: enteros(formData, "cobertura"),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar." };
  }

  revalidatePath("/mi-perfil");
  revalidatePath(`/p/${perfil.slug}`);
  return { ok: true, mensaje: "Listo: tu perfil quedó actualizado." };
}

export async function accionDisponibilidad(disponible: boolean) {
  const perfil = await perfilOFalla();
  await fijarDisponibilidad(perfil.id, disponible);
  revalidatePath("/", "layout");
}

/* ── Necesidades y matching ────────────────────────────────────────────── */

export async function accionPublicarNecesidad(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();
  const titulo = texto(formData, "titulo");
  const descripcion = texto(formData, "descripcion");

  if (!titulo) return { error: "Ponle un título a lo que necesitas." };
  if (descripcion.length < 10) return { error: "Describe un poco más lo que necesitas." };

  let id: number;
  try {
    const { necesidad } = await publicarNecesidad({
      solicitantePerfilId: perfil.id,
      titulo,
      descripcion,
      categoriaId: numero(formData, "categoriaId"),
      comunaId: numero(formData, "comunaId"),
      presupuestoMin: numero(formData, "presupuestoMin"),
      presupuestoMax: numero(formData, "presupuestoMax"),
      urgencia: (texto(formData, "urgencia") || "flexible") as "hoy" | "semana" | "mes" | "flexible",
    });
    id = necesidad.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo publicar." };
  }

  revalidatePath("/descubrir");
  revalidatePath("/actividad");
  redirect(`/necesidades/${id}`);
}

export async function accionCrearPublicacion(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();
  const titulo = texto(formData, "titulo");
  if (!titulo) return { error: "Escribe un título." };

  try {
    await crearPublicacion({
      autorPerfilId: perfil.id,
      tipo: (texto(formData, "tipo") || "novedad") as "producto" | "servicio" | "oferta" | "novedad",
      titulo,
      cuerpo: texto(formData, "cuerpo"),
      categoriaId: numero(formData, "categoriaId"),
      comunaId: numero(formData, "comunaId") ?? perfil.comunaId,
      precio: numero(formData, "precio"),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo publicar." };
  }

  revalidatePath("/descubrir");
  redirect("/descubrir");
}

export async function accionInvitar(necesidadId: number, perfilId: number) {
  const perfil = await perfilOFalla();
  await invitarACotizar({ necesidadId, perfilId, actorPerfilId: perfil.id });
  revalidatePath(`/necesidades/${necesidadId}`);
}

export async function accionEnviarPropuesta(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();
  const necesidadId = numero(formData, "necesidadId");
  const monto = numero(formData, "monto");
  const plazoDias = numero(formData, "plazoDias") ?? 1;

  if (!necesidadId) return { error: "Falta la necesidad." };
  if (!monto || monto <= 0) return { error: "Indica un monto." };

  try {
    const telefono = texto(formData, "telefono");
    if (telefono) await completarTelefono(perfil.id, telefono);
    await enviarPropuesta({
      necesidadId,
      perfilId: perfil.id,
      monto,
      plazoDias,
      mensaje: texto(formData, "mensaje") || null,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar la propuesta." };
  }

  revalidatePath(`/necesidades/${necesidadId}`);
  revalidatePath("/actividad");
  return { ok: true, mensaje: "Propuesta enviada." };
}

export async function accionAdjudicar(necesidadId: number, propuestaId: number) {
  const perfil = await perfilOFalla();
  await adjudicar({ necesidadId, propuestaId, actorPerfilId: perfil.id });
  revalidatePath(`/necesidades/${necesidadId}`);
  revalidatePath("/actividad");
  revalidatePath("/mensajes");
}

export async function accionRegistrarEntrega(operacionId: number) {
  const perfil = await perfilOFalla();
  await registrarEntrega({ operacionId, actorPerfilId: perfil.id });
  revalidatePath("/actividad");
}

export async function accionCalificar(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();
  const operacionId = numero(formData, "operacionId");
  const puntaje = numero(formData, "puntaje");

  if (!operacionId || !puntaje) return { error: "Falta la calificación." };

  try {
    await calificar({
      operacionId,
      autorPerfilId: perfil.id,
      puntaje,
      comentario: texto(formData, "comentario") || null,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo calificar." };
  }

  revalidatePath("/actividad");
  return { ok: true, mensaje: "Calificación registrada." };
}

/* ── Feed y red ────────────────────────────────────────────────────────── */

export async function accionReaccionar(publicacionId: number) {
  const perfil = await perfilOFalla();
  await alternarReaccion(publicacionId, perfil.id);
  revalidatePath("/descubrir");
}

export async function accionSeguir(perfilId: number) {
  const perfil = await perfilOFalla();
  await alternarSeguimiento(perfilId, perfil.id);
  revalidatePath("/descubrir");
}

export async function accionAlternarGuardado(publicacionId: number) {
  const perfil = await perfilOFalla();
  await alternarGuardado(publicacionId, perfil.id);
  revalidatePath("/descubrir");
  revalidatePath("/guardados");
  revalidatePath("/mi-conecta");
}

/* ── Mensajes ──────────────────────────────────────────────────────────── */

export async function accionEnviarMensaje(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();
  const conversacionId = numero(formData, "conversacionId");
  const cuerpo = texto(formData, "cuerpo");
  if (!conversacionId || !cuerpo) return { error: "Escribe un mensaje." };

  try {
    await enviarMensaje({ conversacionId, autorPerfilId: perfil.id, cuerpo });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar." };
  }

  revalidatePath(`/mensajes/${conversacionId}`);
  return { ok: true };
}

export async function accionContactar(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();
  const aPerfilId = numero(formData, "perfilId");
  const cuerpo = texto(formData, "cuerpo");
  if (!aPerfilId || !cuerpo) return { error: "Escribe un mensaje." };

  let conversacionId: number;
  try {
    conversacionId = await iniciarConversacion({
      dePerfilId: perfil.id,
      aPerfilId,
      cuerpo,
      asunto: texto(formData, "asunto") || null,
      publicacionId: numero(formData, "publicacionId"),
      necesidadId: numero(formData, "necesidadId"),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo iniciar la conversación." };
  }

  redirect(`/mensajes/${conversacionId}`);
}

/**
 * Datos de contacto: solo con sesión. El visitante nunca los recibe, ni
 * ocultos: la ficha pública no los consulta.
 */
export async function accionVerContacto(
  perfilId: number,
): Promise<{ contacto?: Contacto; error?: string }> {
  const perfil = await obtenerPerfil();
  if (!perfil) return { error: "Inicia sesión o crea tu cuenta para continuar." };
  try {
    return { contacto: await contactoDe({ perfilId, solicitantePerfilId: perfil.id }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo cargar el contacto." };
  }
}

/* ── Agentes IA (Fase 2: se contratan y configuran, no ejecutan aún) ───── */

export async function accionContratarAgente(agenteCodigo: string, nivelAutonomia: number) {
  const perfil = await perfilOFalla();

  await db
    .insert(agentesContratados)
    .values({ perfilId: perfil.id, agenteCodigo, nivelAutonomia })
    .onConflictDoUpdate({
      target: [agentesContratados.perfilId, agentesContratados.agenteCodigo],
      set: { nivelAutonomia, activo: true },
    });

  revalidatePath("/agentes");
}

export async function accionDesactivarAgente(agenteCodigo: string) {
  const perfil = await perfilOFalla();
  await db
    .update(agentesContratados)
    .set({ activo: false })
    .where(
      and(
        eq(agentesContratados.perfilId, perfil.id),
        eq(agentesContratados.agenteCodigo, agenteCodigo),
      ),
    );
  revalidatePath("/agentes");
}

/* ── Centro de control ─────────────────────────────────────────────────── */

export async function accionResolverVerificacion(
  verificacionId: number,
  estado: "verificado" | "rechazado",
) {
  const sesion = await obtenerSesion();
  if (!esAdministrador(sesion?.user?.email)) {
    throw new Error("Solo el equipo del Centro de Control puede resolver verificaciones.");
  }

  await db
    .update(verificaciones)
    .set({ estado, resueltoEn: new Date() })
    .where(eq(verificaciones.id, verificacionId));

  revalidatePath("/centro-de-control");
}

export async function accionResolverSolicitudCategoria(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const sesion = await obtenerSesion();
  if (!esAdministrador(sesion?.user?.email)) {
    return { error: "Solo el equipo del Centro de Control puede resolver solicitudes." };
  }
  const solicitudId = numero(formData, "solicitudId");
  if (!solicitudId) return { error: "Falta la solicitud." };
  const descartar = texto(formData, "decision") === "descartar";
  const categoriaId = descartar ? null : numero(formData, "categoriaId");
  if (!descartar && !categoriaId) return { error: "Elige la especialidad que corresponde." };

  try {
    await resolverSolicitudCategoria({ solicitudId, categoriaId });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo resolver." };
  }

  revalidatePath("/centro-de-control");
  return { ok: true, mensaje: descartar ? "Solicitud descartada." : "Actividad asignada." };
}

export async function accionCancelarNecesidad(necesidadId: number) {
  const perfil = await perfilOFalla();
  const necesidad = await db.query.necesidades.findFirst({
    where: eq(necesidades.id, necesidadId),
  });
  if (!necesidad || necesidad.solicitantePerfilId !== perfil.id) {
    throw new Error("No puedes cancelar esta necesidad.");
  }
  await db
    .update(necesidades)
    .set({ estado: "cancelada", cerradaEn: new Date() })
    .where(eq(necesidades.id, necesidadId));

  revalidatePath("/actividad");
  revalidatePath(`/necesidades/${necesidadId}`);
}

/* ── Catálogo de productos y servicios ─────────────────────────────────── */

function entradaItem(formData: FormData): EntradaItem {
  return {
    tipo: texto(formData, "tipo") === "servicio" ? "servicio" : "producto",
    nombre: texto(formData, "nombre"),
    descripcion: texto(formData, "descripcion") || null,
    categoriaId: numero(formData, "categoriaId"),
    precio: numero(formData, "precio"),
    unidad: texto(formData, "unidad") || null,
    imagenUrl: texto(formData, "imagenUrl") || null,
  };
}

export async function accionGuardarItem(
  _estado: EstadoAccion = VACIO,
  formData: FormData,
): Promise<EstadoAccion> {
  const perfil = await perfilOFalla();
  const itemId = numero(formData, "itemId");

  try {
    if (itemId) await editarItem(perfil.id, itemId, entradaItem(formData));
    else await crearItem(perfil.id, entradaItem(formData));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar." };
  }

  revalidatePath("/mi-catalogo");
  revalidatePath(`/p/${perfil.slug}`);
  redirect("/mi-catalogo");
}

export async function accionCambiarDisponibilidadItem(itemId: number, activo: boolean) {
  const perfil = await perfilOFalla();
  await cambiarDisponibilidadItem(perfil.id, itemId, activo);
  revalidatePath("/mi-catalogo");
  revalidatePath(`/p/${perfil.slug}`);
}
