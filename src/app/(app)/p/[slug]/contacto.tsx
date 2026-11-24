"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Globe, Mail, Phone } from "lucide-react";

import { accionContactar, accionVerContacto, type EstadoAccion } from "@/app/acciones";
import { Aviso, Boton } from "@/components/ui";
import type { Contacto } from "@/lib/casos/ficha";
import { formatearTelefono } from "@/lib/telefono";

export function FormularioContacto({
  perfilId,
  nombre,
  enfocar = false,
}: {
  perfilId: number;
  nombre: string;
  /** true cuando la persona venía a contactar y acaba de ingresar. */
  enfocar?: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(accionContactar, {});

  return (
    <form action={enviar} className="space-y-3">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      <input type="hidden" name="perfilId" value={perfilId} />

      <textarea
        name="cuerpo"
        required
        autoFocus={enfocar}
        aria-label={`Mensaje para ${nombre}`}
        className="campo min-h-[5rem]"
        placeholder={`Hola ${nombre.split(" ")[0]}, quería consultarte por…`}
      />

      <Boton type="submit" disabled={pendiente}>
        {pendiente ? "Enviando…" : "Enviar mensaje"}
      </Boton>
    </form>
  );
}

/**
 * Teléfono, correo y web: se piden al servidor al tocar el botón, con sesión.
 * No viajan con la página.
 */
export function DatosContacto({
  perfilId,
  abrir = false,
}: {
  perfilId: number;
  abrir?: boolean;
}) {
  const [contacto, setContacto] = useState<Contacto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function cargar() {
    iniciar(async () => {
      const r = await accionVerContacto(perfilId);
      setError(r.error ?? null);
      setContacto(r.contacto ?? null);
    });
  }

  useEffect(() => {
    if (abrir) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <Aviso tono="peligro">{error}</Aviso>;
  if (!contacto) {
    return (
      <Boton type="button" variante="secundario" tamano="sm" onClick={cargar} disabled={pendiente}>
        {pendiente ? "Cargando…" : "Ver teléfono y correo"}
      </Boton>
    );
  }

  const web =
    contacto.sitioWeb && /^https?:\/\//i.test(contacto.sitioWeb)
      ? contacto.sitioWeb
      : contacto.sitioWeb
        ? `https://${contacto.sitioWeb}`
        : null;
  const redes = Object.entries(contacto.redes ?? {}).filter(([, v]) => v);

  if (!contacto.telefono && !contacto.correoPublico && !web && !redes.length) {
    return (
      <p className="text-sm text-tenue">
        No publicó teléfono ni correo. Escríbele por aquí y le llega a sus mensajes.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-texto" data-testid="datos-contacto">
      {contacto.telefono ? (
        <li>
          <a
            href={`tel:${contacto.telefono}`}
            className="inline-flex items-center gap-1.5 hover:text-marca"
          >
            <Phone size={14} className="text-marca" />
            {formatearTelefono(contacto.telefono)}
          </a>
        </li>
      ) : null}
      {contacto.correoPublico ? (
        <li>
          <a
            href={`mailto:${contacto.correoPublico}`}
            className="inline-flex items-center gap-1.5 hover:text-marca"
          >
            <Mail size={14} className="text-marca" />
            {contacto.correoPublico}
          </a>
        </li>
      ) : null}
      {web ? (
        <li>
          <a
            href={web}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 hover:text-marca"
          >
            <Globe size={14} className="text-marca" />
            Sitio web
          </a>
        </li>
      ) : null}
      {redes.map(([red, valor]) => (
        <li key={red} className="text-tenue">
          {red}: <span className="text-texto">{valor}</span>
        </li>
      ))}
    </ul>
  );
}
