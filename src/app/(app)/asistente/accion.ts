"use server";

import { responder, type RespuestaAsistente } from "@/lib/ia/asistente";
import { obtenerPerfil } from "@/lib/sesion";

export async function preguntarAsistente(mensaje: string): Promise<RespuestaAsistente> {
  const perfil = await obtenerPerfil();
  return responder(mensaje, perfil);
}
