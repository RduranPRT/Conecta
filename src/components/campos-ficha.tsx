"use client";

import { useState } from "react";

import { SelectorComuna, type Territorio } from "@/components/selector-comuna";
import { SelectorActividades, type RubroOpcion } from "@/components/selector-actividades";
import { Aviso, Boton } from "@/components/ui";
import { separarTelefono } from "@/lib/telefono";
import { cn } from "@/lib/utils";

/**
 * Lo que una persona puede hacer en Conecta, dicho en sus palabras. Cada
 * opción activa un rol; se pueden marcar varias en la misma cuenta (S22).
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

export const ROLES_QUE_OFRECEN = ["prestador", "negocio", "proveedor", "productor"];

export type InicialFicha = {
  nombre?: string;
  tipoIdentidad?: "persona" | "empresa";
  descripcion?: string | null;
  rut?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  comunaId?: number | null;
  radioKm?: number | null;
  roles?: string[];
  categorias?: number[];
  otrasActividades?: string[];
  correoPublico?: string | null;
  sitioWeb?: string | null;
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

export function SeccionIdentidad({ inicial }: { inicial?: InicialFicha }) {
  const [tipo, setTipo] = useState<"persona" | "empresa">(inicial?.tipoIdentidad ?? "persona");

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="etiqueta">¿Quién usa esta cuenta?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { valor: "persona", titulo: "Una persona", texto: "Tú, con tu nombre." },
              { valor: "empresa", titulo: "Una empresa o negocio", texto: "Con su nombre comercial." },
            ] as const
          ).map((o) => (
            <label
              key={o.valor}
              className={cn(
                "flex cursor-pointer flex-col rounded-xl border p-3 transition",
                tipo === o.valor
                  ? "border-marca bg-marca/10"
                  : "border-borde bg-superficie hover:bg-superficie2",
              )}
            >
              <input
                type="radio"
                name="tipoIdentidad"
                value={o.valor}
                checked={tipo === o.valor}
                onChange={() => setTipo(o.valor)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-texto">{o.titulo}</span>
              <span className="text-xs text-tenue">{o.texto}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="etiqueta" htmlFor="nombre">
          {tipo === "empresa" ? "Nombre del negocio" : "Tu nombre"}
        </label>
        <input
          id="nombre"
          name="nombre"
          className="campo"
          defaultValue={inicial?.nombre ?? ""}
          required
          minLength={2}
          autoComplete={tipo === "empresa" ? "organization" : "name"}
          placeholder={tipo === "empresa" ? "Repuestos del Sur" : "Juana Pérez"}
        />
        <p className="ayuda">Así te verán en el buscador y en el mapa.</p>
      </div>
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
}: {
  territorio: Territorio;
  inicial?: InicialFicha;
}) {
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    inicial?.lat != null && inicial?.lng != null ? { lat: inicial.lat, lng: inicial.lng } : null,
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
      <SelectorComuna territorio={territorio} inicial={inicial?.comunaId} requerido />
      <p className="ayuda mt-0">
        Están todas las comunas de Chile. La usamos para mostrarte lo que está cerca y para que
        te encuentren.
      </p>

      <div>
        <input type="hidden" name="lat" value={ubicacion?.lat ?? ""} />
        <input type="hidden" name="lng" value={ubicacion?.lng ?? ""} />
        <Boton
          type="button"
          variante="secundario"
          tamano="sm"
          onClick={usarUbicacionActual}
          disabled={estado === "buscando"}
        >
          {estado === "buscando" ? "Obteniendo ubicación…" : "📍 Usar mi ubicación exacta (opcional)"}
        </Boton>
        <p className="ayuda">
          Si no la usas, partimos del centro de tu comuna. Puedes cambiarla después.
        </p>
        {ubicacion ? (
          <p className="ayuda mt-1 text-marca">
            Ubicación capturada: {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
          </p>
        ) : null}
        {estado === "error" ? (
          <Aviso tono="alerta">
            No pudimos acceder a tu ubicación. Revisa el permiso del navegador o usa el centro de
            tu comuna.
          </Aviso>
        ) : null}
      </div>
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
          Elige una o varias: así apareces en las búsquedas correctas. El oficio es opcional y lo
          que marques aquí no limita lo que puedes buscar.
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
          placeholder="Qué haces, hace cuánto y qué te distingue."
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
 * número. Si la persona igual escribe «+56», el caso de uso no lo duplica.
 */
export function CampoTelefono({
  inicial,
  prefijo = "+56",
  requerido = false,
  id = "telefono",
}: {
  inicial?: string | null;
  prefijo?: string;
  requerido?: boolean;
  id?: string;
}) {
  const { numero } = separarTelefono(inicial, prefijo);
  return (
    <div>
      <label className="etiqueta" htmlFor={id}>
        Teléfono
      </label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-borde bg-superficie2 px-3 text-sm text-tenue">
          {prefijo}
        </span>
        <input
          id={id}
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="campo rounded-l-none"
          defaultValue={numero}
          required={requerido}
          placeholder="9 1234 5678"
        />
      </div>
      <p className="ayuda">Escribe solo el número, sin {prefijo}. Ejemplo: 9 1234 5678.</p>
    </div>
  );
}

/* ── Contacto y datos comerciales ─────────────────────────────────────── */

export function SeccionContacto({
  inicial,
  prefijo,
}: {
  inicial?: InicialFicha;
  prefijo?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoTelefono inicial={inicial?.telefono} prefijo={prefijo} />
      <div>
        <label className="etiqueta" htmlFor="correoPublico">
          Correo de contacto público
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
        <label className="etiqueta" htmlFor="direccion">
          Dirección (si atiendes en un local)
        </label>
        <input
          id="direccion"
          name="direccion"
          className="campo"
          defaultValue={inicial?.direccion ?? ""}
          placeholder="Av. Principal 1234"
        />
      </div>
      <div>
        <label className="etiqueta" htmlFor="sitioWeb">
          Sitio web o red social
        </label>
        <input
          id="sitioWeb"
          name="sitioWeb"
          className="campo"
          defaultValue={inicial?.sitioWeb ?? ""}
          placeholder="https://"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="etiqueta" htmlFor="rut">
          RUT (opcional)
        </label>
        <input
          id="rut"
          name="rut"
          className="campo sm:max-w-xs"
          defaultValue={inicial?.rut ?? ""}
          placeholder="76.543.210-K"
        />
        <p className="ayuda">Solo se usa si pides verificar tu identidad o tu empresa.</p>
      </div>
    </div>
  );
}
