"use client";

import { useActionState, useState, useTransition } from "react";

import {
  accionCambiarDisponibilidadItem,
  accionGuardarItem,
  type EstadoAccion,
} from "@/app/acciones";
import { SelectCategoria, type RubroOpcion } from "@/components/selector-especialidades";
import { Aviso, Boton } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ItemInicial = {
  id: number;
  tipo: "producto" | "servicio" | "ambos";
  nombre: string;
  descripcion: string | null;
  categoriaId: number | null;
  precio: string | null;
  unidad: string | null;
  imagenUrl: string | null;
};

/** Alta y edición de un producto o servicio del catálogo (P07). */
export function FormularioItem({
  rubros,
  inicial,
  tipoPorDefecto = "producto",
}: {
  rubros: RubroOpcion[];
  inicial?: ItemInicial | null;
  tipoPorDefecto?: "producto" | "servicio";
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionGuardarItem,
    {},
  );
  const [tipo, setTipo] = useState<"producto" | "servicio">(
    inicial?.tipo === "servicio" ? "servicio" : inicial ? "producto" : tipoPorDefecto,
  );
  const [imagen, setImagen] = useState(inicial?.imagenUrl ?? "");

  return (
    <form action={enviar} className="space-y-5">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}
      {inicial ? <input type="hidden" name="itemId" value={inicial.id} /> : null}

      <fieldset>
        <legend className="etiqueta">¿Qué vas a agregar?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["producto", "servicio"] as const).map((t) => (
            <label
              key={t}
              className={cn(
                "cursor-pointer rounded-xl border p-3 text-center text-sm transition",
                tipo === t
                  ? "border-marca bg-marca/10 font-medium text-marca"
                  : "border-borde bg-superficie text-texto hover:bg-superficie2",
              )}
            >
              <input
                type="radio"
                name="tipo"
                value={t}
                checked={tipo === t}
                onChange={() => setTipo(t)}
                className="sr-only"
              />
              {t === "producto" ? "Un producto" : "Un servicio"}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="etiqueta" htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          className="campo"
          required
          minLength={2}
          defaultValue={inicial?.nombre ?? ""}
          placeholder={tipo === "producto" ? "Filtro de aceite Toyota Yaris" : "Mantención de calefont"}
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="descripcion">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          className="campo min-h-[5rem]"
          defaultValue={inicial?.descripcion ?? ""}
          placeholder={
            tipo === "producto"
              ? "Marca, referencia o código, compatibilidad, stock."
              : "Qué incluye, cuánto demora, dónde lo haces."
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="precio">
            Precio (CLP, opcional)
          </label>
          <input
            id="precio"
            name="precio"
            inputMode="numeric"
            className="campo"
            defaultValue={inicial?.precio ? String(Math.round(Number(inicial.precio))) : ""}
            placeholder="8990"
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="unidad">
            Por (opcional)
          </label>
          <input
            id="unidad"
            name="unidad"
            className="campo"
            defaultValue={inicial?.unidad ?? ""}
            placeholder={tipo === "producto" ? "unidad, kilo, caja" : "visita, hora, proyecto"}
          />
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="categoriaId">
          Categoría
        </label>
        <SelectCategoria rubros={rubros} inicial={inicial?.categoriaId} vacia="Elige una categoría" />
        <p className="ayuda">Ayuda a que te encuentren quienes navegan por rubro.</p>
      </div>

      <div>
        <label className="etiqueta" htmlFor="imagenUrl">
          Foto (enlace, opcional)
        </label>
        <input
          id="imagenUrl"
          name="imagenUrl"
          type="url"
          className="campo"
          value={imagen}
          onChange={(e) => setImagen(e.target.value)}
          placeholder="https://…"
        />
        <p className="ayuda">
          Pega el enlace de una foto publicada (por ejemplo, de tu Instagram o tu sitio). Pronto
          podrás subirla directamente.
        </p>
        {/^https?:\/\//.test(imagen) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagen}
            alt="Vista previa"
            className="mt-2 h-28 w-28 rounded-xl border border-borde object-cover"
          />
        ) : null}
      </div>

      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Guardando…" : inicial ? "Guardar cambios" : "Agregar a mi catálogo"}
      </Boton>
    </form>
  );
}

/** Retirar o volver a publicar un ítem: nunca se borra, queda en el historial. */
export function BotonDisponibilidadItem({ itemId, activo }: { itemId: number; activo: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <Boton
      type="button"
      variante={activo ? "secundario" : "suave"}
      tamano="sm"
      disabled={pendiente}
      onClick={() => iniciar(() => accionCambiarDisponibilidadItem(itemId, !activo))}
    >
      {pendiente ? "…" : activo ? "Retirar" : "Volver a publicar"}
    </Boton>
  );
}
