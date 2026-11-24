"use client";

import { useState } from "react";

import { SelectorComuna, type Territorio } from "@/components/selector-comuna";
import { SelectorActividades, type RubroOpcion } from "@/components/selector-actividades";
import { Aviso, Boton } from "@/components/ui";
import { separarTelefono } from "@/lib/telefono";
import { cn } from "@/lib/utils";

/**
 * Lo que alguien puede hacer en Conecta, dicho en sus palabras. Cada opción
 * activa un rol; se pueden marcar varias en la misma cuenta (S22, P06).
 */
export const ACTIVIDADES = [
  {
    valor: "persona",
    titulo: "Buscar y contratar",
    texto: "Encontrar servicios, productos y proveedores cerca de ti.",
  },
  {
    valor: "prestador",
    titulo: "Ofrecer servicios",
    texto: "Un oficio o un servicio profesional, con o sin local.",
  },
  {
    valor: "negocio",
    titulo: "Vender productos",
    texto: "Tienda, local, emprendimiento o venta por internet.",
  },
  {
    valor: "proveedor",
    titulo: "Abastecer a otros negocios",
    texto: "Vendes por mayor o suministras insumos a empresas.",
  },
  {
    valor: "productor",
    titulo: "Producir lo que vendo",
    texto: "Campo, taller, cocina o fabricación propia.",
  },
  {
    valor: "partner",
    titulo: "Colaborar como partner",
    texto: "Alianzas, derivar clientes o trabajar en conjunto.",
  },
] as const;

export type InicialFicha = {
  nombre?: string;
  tipoIdentidad?: "persona" | "empresa";
  descripcion?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  comunaId?: number | null;
  radioKm?: number | null;
  roles?: string[];
  categorias?: number[];
  otrasActividades?: string[];
  correoPublico?: string | null;
  sitioWeb?: string | null;
  /** Solo si la persona fijó su punto: el centro de la comuna no cuenta. */
  lat?: number | null;
  lng?: number | null;
};

/** Tipos de actividad que corresponden a los roles marcados (S16). */
export function tiposParaRoles(roles: string[]): ("servicio" | "producto")[] {
  const tipos = new Set<"servicio" | "producto">();
  if (roles.includes("prestador")) tipos.add("servicio");
  if (roles.some((r) => ["negocio", "proveedor", "productor"].includes(r))) tipos.add("producto");
  return [...tipos];
}

/* ── Quién eres ───────────────────────────────────────────────────────── */

export function SeccionIdentidad({
  inicial,
  rut,
}: {
  inicial?: InicialFicha;
  rut?: string | null;
}) {
  const empresa = inicial?.tipoIdentidad === "empresa";
  return (
    <div>
      <label className="etiqueta" htmlFor="nombre">
        {empresa ? "Nombre de fantasía" : "Tu nombre"}
      </label>
      <input
        id="nombre"
        name="nombre"
        className="campo"
        defaultValue={inicial?.nombre ?? ""}
        required
        minLength={2}
        autoComplete={empresa ? "organization" : "name"}
      />
      <p className="ayuda">
        Así te verán en el buscador y en el mapa.
        {rut ? ` RUT ${rut}: no se muestra y no se puede cambiar aquí.` : ""}
      </p>
    </div>
  );
}

/* ── Qué quieres hacer ────────────────────────────────────────────────── */

export function SeccionActividades({
  roles,
  setRoles,
}: {
  roles: string[];
  setRoles: (roles: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="etiqueta">¿Qué quieres hacer en Conecta?</legend>
      <p className="ayuda mb-2 mt-0">
        Marca todo lo que corresponda: buscar y ofrecer no son excluyentes y usan la misma
        cuenta.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ACTIVIDADES.map((a) => {
          const activo = roles.includes(a.valor);
          return (
            <label
              key={a.valor}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                activo
                  ? "border-marca bg-marca/10"
                  : "border-borde bg-superficie hover:bg-superficie2",
              )}
            >
              <input
                type="checkbox"
                name="roles"
                value={a.valor}
                checked={activo}
                onChange={() =>
                  setRoles(activo ? roles.filter((r) => r !== a.valor) : [...roles, a.valor])
                }
                className="mt-0.5 h-4 w-4 accent-teal-700"
              />
              <span>
                <span className="block text-sm font-medium text-texto">{a.titulo}</span>
                <span className="block text-xs text-tenue">{a.texto}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── Dónde estás ──────────────────────────────────────────────────────── */

export function SeccionUbicacion({
  territorio,
  inicial,
  ofrece = false,
}: {
  territorio: Territorio;
  inicial?: InicialFicha;
  /** Quien ofrece algo necesita comuna y puede fijar su punto en el mapa. */
  ofrece?: boolean;
}) {
  const tenia = inicial?.lat != null && inicial?.lng != null;
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    tenia ? { lat: inicial!.lat!, lng: inicial!.lng! } : null,
  );
  const [estado, setEstado] = useState<"inicial" | "buscando" | "error">("inicial");

  function usarUbicacionActual() {
    if (!("geolocation" in navigator)) {
      setEstado("error");
      return;
    }
    setEstado("buscando");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({ lat: posicion.coords.latitude, lng: posicion.coords.longitude });
        setEstado("inicial");
      },
      () => setEstado("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-4">
      <SelectorComuna
        territorio={territorio}
        inicial={inicial?.comunaId}
        requerido={ofrece}
        etiqueta={ofrece ? "Comuna" : "Comuna (opcional)"}
      />
      <p className="ayuda mt-0">
        Están todas las comunas de Chile. La usamos para mostrarte lo que está cerca
        {ofrece ? " y para que te encuentren" : ""}.
      </p>

      <input type="hidden" name="lat" value={ubicacion?.lat ?? ""} />
      <input type="hidden" name="lng" value={ubicacion?.lng ?? ""} />
      {tenia && !ubicacion ? <input type="hidden" name="quitarUbicacion" value="1" /> : null}

      {ofrece ? (
        <div>
          <div className="flex flex-wrap gap-2">
            <Boton
              type="button"
              variante="secundario"
              tamano="sm"
              onClick={usarUbicacionActual}
              disabled={estado === "buscando"}
            >
              {estado === "buscando" ? "Obteniendo ubicación…" : "📍 Usar mi ubicación exacta (opcional)"}
            </Boton>
            {ubicacion ? (
              <Boton type="button" variante="fantasma" tamano="sm" onClick={() => setUbicacion(null)}>
                Quitar ubicación exacta
              </Boton>
            ) : null}
          </div>
          <p className="ayuda">
            {ubicacion
              ? "Tu punto exacto se mostrará a todos en el mapa y en tu ficha, también a quien no tiene cuenta."
              : "Si no la usas, apareces en el centro de tu comuna. Si la usas, tu punto exacto será público."}
          </p>
          {estado === "error" ? (
            <Aviso tono="alerta">
              No pudimos acceder a tu ubicación. Revisa el permiso del navegador o usa el centro de
              tu comuna.
            </Aviso>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ── Qué ofreces ──────────────────────────────────────────────────────── */

export function SeccionOferta({
  rubros,
  roles,
  inicial,
}: {
  rubros: RubroOpcion[];
  roles: string[];
  inicial?: InicialFicha;
}) {
  const tipos = tiposParaRoles(roles);
  return (
    <div className="space-y-5">
      <div>
        <p className="etiqueta">Tus actividades</p>
        <p className="ayuda mb-3 mt-0">
          Elige una o varias: así apareces en las búsquedas correctas.
          {roles.includes("prestador") ? " El oficio es opcional." : ""} Lo que marques aquí no
          limita lo que puedes buscar.
        </p>
        <SelectorActividades
          rubros={rubros}
          inicial={inicial?.categorias}
          otrasIniciales={inicial?.otrasActividades}
          tipos={tipos.length === 1 ? tipos : undefined}
        />
      </div>

      {roles.includes("prestador") ? (
        <div>
          <label className="etiqueta" htmlFor="radioKm">
            ¿Atiendes a domicilio? ¿Hasta cuántos km?
          </label>
          <input
            id="radioKm"
            name="radioKm"
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            className="campo sm:max-w-[12rem]"
            defaultValue={inicial?.radioKm ?? ""}
            placeholder="10"
          />
          <p className="ayuda">Déjalo vacío si solo atiendes en tu local.</p>
        </div>
      ) : null}

      <div>
        <label className="etiqueta" htmlFor="descripcion">
          Cuéntalo en una frase (opcional)
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          className="campo min-h-[5rem]"
          defaultValue={inicial?.descripcion ?? ""}
          placeholder={
            roles.includes("prestador")
              ? "Qué haces, hace cuánto y qué te distingue."
              : "Qué vendes, desde cuándo y qué te distingue."
          }
        />
      </div>
    </div>
  );
}

/* ── Intereses ────────────────────────────────────────────────────────── */

/** Preferencias para el feed (S19). No son oferta ni limitan búsquedas. */
export function SeccionIntereses({
  rubros,
  inicial = [],
}: {
  rubros: RubroOpcion[];
  inicial?: number[];
}) {
  return (
    <fieldset>
      <legend className="sr-only">Rubros que te interesan</legend>
      <div className="flex flex-wrap gap-2">
        {rubros.map((r) => (
          <label
            key={r.id}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1.5 text-xs text-texto transition hover:bg-superficie2 has-[:checked]:border-marca has-[:checked]:bg-marca/10 has-[:checked]:text-marca"
          >
            <input
              type="checkbox"
              name="intereses"
              value={r.id}
              defaultChecked={inicial.includes(r.id)}
              className="sr-only"
            />
            <span aria-hidden>{r.icono}</span>
            {r.nombre}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ── Teléfono ─────────────────────────────────────────────────────────── */

/**
 * El prefijo del país va fijo al lado y no se edita (S07): solo se escribe el
 * número. El campo no reformatea mientras se escribe, para no mover el cursor;
 * si alguien pega «+56 9…», el caso de uso no lo duplica.
 */
export function CampoTelefono({
  inicial,
  prefijo = "+56",
  requerido = false,
  etiqueta = "Teléfono",
  id = "telefono",
}: {
  inicial?: string | null;
  prefijo?: string;
  requerido?: boolean;
  etiqueta?: string;
  id?: string;
}) {
  const { numero } = separarTelefono(inicial, prefijo);
  return (
    <div>
      <label className="etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="flex">
        <span
          aria-hidden
          className="inline-flex select-none items-center rounded-l-xl border border-r-0 border-borde bg-superficie2 px-3 text-sm text-tenue"
        >
          {prefijo}
        </span>
        <input
          id={id}
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="campo rounded-l-none"
          defaultValue={numero.replace(/^(9)(\d{4})(\d{4})$/, "$1 $2 $3")}
          required={requerido}
          placeholder="9 1234 5678"
          aria-describedby={`${id}-ayuda`}
        />
      </div>
      <p className="ayuda" id={`${id}-ayuda`}>
        9 dígitos, sin {prefijo}. Ejemplo: 9 1234 5678.
      </p>
    </div>
  );
}

/* ── Contacto y datos comerciales ─────────────────────────────────────── */

/** Un particular que solo busca no ve campos empresariales (P05, S16). */
export function SeccionContacto({
  inicial,
  prefijo,
  ofrece,
}: {
  inicial?: InicialFicha;
  prefijo?: string;
  ofrece: boolean;
}) {
  if (!ofrece) {
    return (
      <>
        <CampoTelefono inicial={inicial?.telefono} prefijo={prefijo} etiqueta="Teléfono (opcional)" />
        <input type="hidden" name="correoPublico" value={inicial?.correoPublico ?? ""} />
        <input type="hidden" name="direccion" value={inicial?.direccion ?? ""} />
        <input type="hidden" name="sitioWeb" value={inicial?.sitioWeb ?? ""} />
      </>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoTelefono inicial={inicial?.telefono} prefijo={prefijo} requerido />
      <div>
        <label className="etiqueta" htmlFor="correoPublico">
          Correo de contacto (opcional)
        </label>
        <input
          id="correoPublico"
          name="correoPublico"
          type="email"
          className="campo"
          defaultValue={inicial?.correoPublico ?? ""}
        />
      </div>
      <div>
        <label className="etiqueta" htmlFor="sitioWeb">
          Sitio web o red social (opcional)
        </label>
        <input
          id="sitioWeb"
          name="sitioWeb"
          className="campo"
          defaultValue={inicial?.sitioWeb ?? ""}
          placeholder="https://"
        />
      </div>
      <div>
        <label className="etiqueta" htmlFor="direccion">
          Dirección de atención (opcional)
        </label>
        <input
          id="direccion"
          name="direccion"
          className="campo"
          defaultValue={inicial?.direccion ?? ""}
          placeholder="Av. Principal 1234"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <p className="ayuda mt-0">
          Tu teléfono, correo y sitio web solo los ven personas con cuenta.
        </p>
        <Aviso tono="alerta">
          <strong>La dirección es pública:</strong> la verá cualquiera, también sin cuenta. Es
          opcional; si trabajas desde tu casa, puedes dejarla vacía.
        </Aviso>
      </div>
    </div>
  );
}
