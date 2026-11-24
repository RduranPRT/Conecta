"use client";

import { useActionState, useState, useTransition } from "react";

import {
  accionCambiarDisponibilidadItem,
  accionEliminarItem,
  accionGuardarItem,
  type EstadoAccion,
} from "@/app/acciones";
import { SelectorCategoria, type OpcionCategoria } from "@/components/selector-categoria";
import { Aviso, Boton } from "@/components/ui";
import { sinReiniciar } from "@/lib/envio";
import { cn } from "@/lib/utils";

export type ItemInicial = {
  id: number;
  tipo: "producto" | "servicio" | "ambos";
  nombre: string;
  descripcion: string | null;
  categoriaId: number | null;
  precio: string | null;
  unidad: string | null;
};

/** Alta y edición de un producto o servicio del catálogo (P07). */
export function FormularioItem({
  opciones,
  inicial,
  tipoPorDefecto = "producto",
}: {
  opciones: OpcionCategoria[];
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

  return (
    <form action={enviar} onSubmit={sinReiniciar(enviar)} className="space-y-5">
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
        <SelectorCategoria
          opciones={opciones}
          inicial={inicial?.categoriaId}
          placeholder={tipo === "producto" ? "Ej.: marraqueta" : "Ej.: asesoría en contratos"}
        />
        <p className="ayuda">Ayuda a que te encuentren quienes buscan por rubro.</p>
      </div>

      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Guardando…" : inicial ? "Guardar cambios" : "Guardar y agregar fotos"}
      </Boton>
    </form>
  );
}

/** Elimina de verdad, con sus fotos. Pide confirmación en la misma pantalla. */
export function BotonEliminarItem({ itemId, nombre }: { itemId: number; nombre: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <Boton type="button" variante="fantasma" tamano="sm" onClick={() => setConfirmando(true)}>
        Eliminar de mi catálogo
      </Boton>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-peligro/30 bg-peligro/5 p-3">
      <p className="text-sm text-texto">
        Se eliminará «{nombre}» con sus fotos. No se puede deshacer. Si solo quieres que no se vea,
        usa «Retirar».
      </p>
      <div className="flex gap-2">
        <Boton
          type="button"
          variante="peligro"
          tamano="sm"
          disabled={pendiente}
          onClick={() =>
            iniciar(async () => {
              const r = await accionEliminarItem(itemId);
              setError(r?.error ?? null);
            })
          }
        >
          {pendiente ? "Eliminando…" : "Sí, eliminar"}
        </Boton>
        <Boton
          type="button"
          variante="secundario"
          tamano="sm"
          disabled={pendiente}
          onClick={() => setConfirmando(false)}
        >
          Cancelar
        </Boton>
      </div>
      {error ? <Aviso tono="peligro">{error}</Aviso> : null}
    </div>
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
