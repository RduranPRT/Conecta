"use client";

import { useState } from "react";

import { Aviso, Boton } from "@/components/ui";
import { cn } from "@/lib/utils";

export type OpcionComuna = { id: number; nombre: string; regionNombre: string; activa: boolean };
export type OpcionCategoria = { id: number; nombre: string; slug: string };

export const ROLES = [
  {
    valor: "persona",
    titulo: "Persona",
    texto: "Busco y contrato servicios o productos.",
  },
  {
    valor: "prestador",
    titulo: "Prestador de servicios",
    texto: "Ofrezco un oficio o servicio, con o sin local.",
  },
  {
    valor: "negocio",
    titulo: "Negocio o empresa",
    texto: "Tengo un local o una empresa que vende.",
  },
  {
    valor: "proveedor",
    titulo: "Proveedor",
    texto: "Abastezco a otros negocios.",
  },
  {
    valor: "productor",
    titulo: "Productor",
    texto: "Produzco lo que vendo (campo, taller, cocina).",
  },
] as const;

/**
 * Selector de roles: una identidad puede activar varios sin crear otra cuenta.
 * La interfaz después se adapta a los roles activos.
 */
export function CamposFicha({
  comunas,
  categorias,
  inicial,
}: {
  comunas: OpcionComuna[];
  categorias: OpcionCategoria[];
  inicial?: {
    nombre?: string;
    descripcion?: string | null;
    rut?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    comunaId?: number | null;
    radioKm?: number | null;
    roles?: string[];
    categorias?: number[];
    correoPublico?: string | null;
    sitioWeb?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  }) {
  const [roles, setRoles] = useState<string[]>(inicial?.roles ?? ["persona"]);
  const [cats, setCats] = useState<number[]>(inicial?.categorias ?? []);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    inicial?.lat != null && inicial?.lng != null ? { lat: inicial.lat, lng: inicial.lng } : null,
  );
  const [estadoUbicacion, setEstadoUbicacion] = useState<"inicial" | "buscando" | "error">(
    "inicial",
  );
  const ofrece = roles.some((r) => r !== "persona");

  function usarUbicacionActual() {
    if (!("geolocation" in navigator)) {
      setEstadoUbicacion("error");
      return;
    }
    setEstadoUbicacion("buscando");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({ lat: posicion.coords.latitude, lng: posicion.coords.longitude });
        setEstadoUbicacion("inicial");
      },
      () => setEstadoUbicacion("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function alternar<T>(lista: T[], valor: T, set: (v: T[]) => void) {
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="etiqueta" htmlFor="nombre">
          Nombre público
        </label>
        <input
          id="nombre"
          name="nombre"
          className="campo"
          defaultValue={inicial?.nombre ?? ""}
          required
          placeholder="Ferretería El Roble / Juan Pérez"
        />
      </div>

      <fieldset>
        <legend className="etiqueta">¿Qué haces en la plataforma?</legend>
        <p className="ayuda mb-2 mt-0">Puedes marcar más de uno. Una identidad, varios roles.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((rol) => {
            const activo = roles.includes(rol.valor);
            return (
              <label
                key={rol.valor}
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
                  value={rol.valor}
                  checked={activo}
                  onChange={() => alternar(roles, rol.valor, setRoles)}
                  className="mt-0.5 h-4 w-4 accent-teal-700"
                />
                <span>
                  <span className="block text-sm font-medium text-texto">{rol.titulo}</span>
                  <span className="block text-xs text-tenue">{rol.texto}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="comunaId">
            Comuna
          </label>
          <select
            id="comunaId"
            name="comunaId"
            className="campo"
            defaultValue={inicial?.comunaId ?? ""}
          >
            <option value="">Selecciona una comuna</option>
            {comunas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.activa ? " · piloto" : ` · ${c.regionNombre}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="etiqueta" htmlFor="rut">
            RUT o identificador tributario
          </label>
          <input
            id="rut"
            name="rut"
            className="campo"
            defaultValue={inicial?.rut ?? ""}
            placeholder="76.543.210-K"
          />
          <p className="ayuda">En el prototipo no se valida contra el SII.</p>
        </div>

        <div>
          <label className="etiqueta" htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            className="campo"
            defaultValue={inicial?.telefono ?? ""}
            placeholder="+56 9 ..."
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="direccion">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            className="campo"
            defaultValue={inicial?.direccion ?? ""}
            placeholder="Av. Principal 1234"
          />
        </div>
      </div>

      <div>
        <input type="hidden" name="lat" value={ubicacion?.lat ?? ""} />
        <input type="hidden" name="lng" value={ubicacion?.lng ?? ""} />
        <Boton
          type="button"
          variante="secundario"
          onClick={usarUbicacionActual}
          disabled={estadoUbicacion === "buscando"}
        >
          {estadoUbicacion === "buscando" ? "Obteniendo ubicación…" : "📍 Usar mi ubicación actual"}
        </Boton>
        <p className="ayuda">
          Fija tu punto exacto en el mapa (no solo tu comuna) para que te encuentren más cerca.
          Si no la usas, partimos del centro de tu comuna.
        </p>
        {ubicacion ? (
          <p className="ayuda mt-1 text-marca">
            Ubicación capturada: {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
          </p>
        ) : null}
        {estadoUbicacion === "error" ? (
          <Aviso tono="alerta">
            No pudimos acceder a tu ubicación. Revisa el permiso del navegador o deja que se use
            el centro de tu comuna.
          </Aviso>
        ) : null}
      </div>

      {ofrece ? (
        <>
          <fieldset>
            <legend className="etiqueta">¿En qué categorías trabajas?</legend>
            <p className="ayuda mb-2 mt-0">
              Determina en qué búsquedas apareces y qué oportunidades recibes.
            </p>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => {
                const activo = cats.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition",
                      activo
                        ? "border-marca bg-marca text-white"
                        : "border-borde bg-superficie text-tenue hover:bg-superficie2",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="categorias"
                      value={c.id}
                      checked={activo}
                      onChange={() => alternar(cats, c.id, setCats)}
                      className="sr-only"
                    />
                    {c.nombre}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="etiqueta" htmlFor="radioKm">
              Radio de atención a domicilio (km)
            </label>
            <input
              id="radioKm"
              name="radioKm"
              type="number"
              min={0}
              max={200}
              className="campo sm:max-w-[12rem]"
              defaultValue={inicial?.radioKm ?? ""}
              placeholder="10"
            />
            <p className="ayuda">
              Déjalo vacío si solo atiendes en tu local. Es distinto de tu comuna y de tu zona
              de cobertura.
            </p>
          </div>
        </>
      ) : null}

      <div>
        <label className="etiqueta" htmlFor="descripcion">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          className="campo min-h-[6rem]"
          defaultValue={inicial?.descripcion ?? ""}
          placeholder="Qué haces, hace cuánto y qué te distingue."
        />
      </div>
    </div>
  );
}
