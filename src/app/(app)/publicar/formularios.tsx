"use client";

import { useActionState } from "react";

import {
  accionCrearPublicacion,
  accionPublicarNecesidad,
  type EstadoAccion,
} from "@/app/acciones";
import type { OpcionCategoria, OpcionComuna } from "@/components/campos-ficha";
import { Aviso, Boton } from "@/components/ui";

type Props = {
  comunas: OpcionComuna[];
  categorias: OpcionCategoria[];
  comunaPorDefecto: number | null;
};

export function FormularioNecesidad({
  comunas,
  categorias,
  comunaPorDefecto,
  textoInicial,
}: Props & { textoInicial?: string }) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionPublicarNecesidad,
    {},
  );

  return (
    <form action={enviar} className="space-y-5">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}

      <div>
        <label className="etiqueta" htmlFor="titulo">
          ¿Qué necesitas?
        </label>
        <input
          id="titulo"
          name="titulo"
          className="campo"
          required
          defaultValue={textoInicial}
          placeholder="Reparar una lavadora que no centrifuga"
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="descripcion">
          Cuéntalo con tus palabras
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          className="campo min-h-[7rem]"
          required
          minLength={10}
          defaultValue={textoInicial}
          placeholder="Marca y modelo, desde cuándo pasa, si necesitas que vayan a domicilio, para cuándo lo necesitas…"
        />
        <p className="ayuda">
          No hace falta que elijas filtros: la plataforma deduce categoría, urgencia y zona a
          partir de este texto. Puedes corregirla abajo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="categoriaId">
            Categoría (opcional)
          </label>
          <select id="categoriaId" name="categoriaId" className="campo" defaultValue="">
            <option value="">Que la deduzca la plataforma</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="etiqueta" htmlFor="comunaId">
            Comuna
          </label>
          <select
            id="comunaId"
            name="comunaId"
            className="campo"
            defaultValue={comunaPorDefecto ?? ""}
          >
            <option value="">Sin comuna</option>
            {comunas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="etiqueta" htmlFor="urgencia">
            ¿Para cuándo?
          </label>
          <select id="urgencia" name="urgencia" className="campo" defaultValue="flexible">
            <option value="hoy">Hoy mismo</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="flexible">Sin apuro</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="etiqueta" htmlFor="presupuestoMin">
              Presupuesto desde
            </label>
            <input
              id="presupuestoMin"
              name="presupuestoMin"
              inputMode="numeric"
              className="campo"
              placeholder="20000"
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="presupuestoMax">
              hasta
            </label>
            <input
              id="presupuestoMax"
              name="presupuestoMax"
              inputMode="numeric"
              className="campo"
              placeholder="60000"
            />
          </div>
        </div>
      </div>

      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Publicando y buscando…" : "Publicar y buscar quién puede"}
      </Boton>
    </form>
  );
}

export function FormularioPublicacion({
  comunas,
  categorias,
  comunaPorDefecto,
  tipoInicial = "oferta",
}: Props & { tipoInicial?: string }) {
  const [estado, enviar, pendiente] = useActionState<EstadoAccion, FormData>(
    accionCrearPublicacion,
    {},
  );

  return (
    <form action={enviar} className="space-y-5">
      {estado?.error ? <Aviso tono="peligro">{estado.error}</Aviso> : null}

      <div>
        <label className="etiqueta" htmlFor="tipo">
          ¿Qué estás publicando?
        </label>
        <select id="tipo" name="tipo" className="campo" defaultValue={tipoInicial}>
          <option value="producto">Un producto</option>
          <option value="servicio">Un servicio</option>
          <option value="oferta">Una oferta o promoción</option>
          <option value="novedad">Una novedad</option>
        </select>
      </div>

      <div>
        <label className="etiqueta" htmlFor="titulo">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          className="campo"
          required
          placeholder="Pan amasado por kilo · entrega en el día"
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="cuerpo">
          Descripción
        </label>
        <textarea id="cuerpo" name="cuerpo" className="campo min-h-[6rem]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="etiqueta" htmlFor="precio">
            Precio (opcional)
          </label>
          <input id="precio" name="precio" inputMode="numeric" className="campo" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="categoriaId">
            Categoría
          </label>
          <select id="categoriaId" name="categoriaId" className="campo" defaultValue="">
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="comunaId">
            Comuna
          </label>
          <select
            id="comunaId"
            name="comunaId"
            className="campo"
            defaultValue={comunaPorDefecto ?? ""}
          >
            <option value="">Sin comuna</option>
            {comunas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Boton type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Publicando…" : "Publicar en el feed"}
      </Boton>
    </form>
  );
}
