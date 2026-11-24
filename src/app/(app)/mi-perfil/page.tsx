import type { Metadata } from "next";

import { FotoPerfil } from "@/components/cargador-fotos";
import { BotonEnlace, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { arbolDeRubros, interesesDe } from "@/lib/casos/categorias";
import { fichaPropia } from "@/lib/casos/ficha";
import { opcionesTerritorio, prefijoTelefonico } from "@/lib/casos/territorio";
import { formatearRut } from "@/lib/rut";
import { requerirPerfil } from "@/lib/sesion";

import { FormularioEdicion } from "./formulario";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

export default async function PaginaMiPerfil() {
  const sesion = await requerirPerfil("/mi-perfil");
  const [ficha, territorio, rubros, prefijo, intereses] = await Promise.all([
    fichaPropia(sesion.id),
    opcionesTerritorio(),
    arbolDeRubros(),
    prefijoTelefonico(sesion.comunaId),
    interesesDe(sesion.id),
  ]);

  if (!ficha) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Encabezado
        titulo="Mi perfil"
        bajada="Así te ven en el buscador, en el mapa y en el feed. Una sola cuenta para buscar y ofrecer."
        acciones={
          <BotonEnlace href={`/p/${ficha.slug}`} variante="secundario" tamano="sm">
            Ver ficha pública
          </BotonEnlace>
        }
      />

      <Tarjeta className="flex flex-wrap items-center gap-3 p-4">
        <Insignia tono={ficha.disponibleAhora ? "exito" : "contorno"}>
          {ficha.disponibleAhora ? "Disponible ahora" : "No disponible"}
        </Insignia>
        <Insignia tono="contorno">Plan {ficha.plan}</Insignia>
        <Insignia tono="contorno">{ficha.reputacionConteo} calificación(es)</Insignia>
        <Insignia tono="contorno">
          {ficha.operacionesCompletadas} operación(es) como proveedor
        </Insignia>
      </Tarjeta>

      <Tarjeta className="p-5">
        <FotoPerfil nombre={ficha.nombre} url={ficha.avatarUrl} />
      </Tarjeta>

      <Tarjeta className="p-5 sm:p-6">
        <FormularioEdicion
          territorio={territorio}
          rubros={rubros}
          prefijo={prefijo}
          intereses={intereses}
          rut={ficha.identificadorFiscalNorm ? formatearRut(ficha.identificadorFiscalNorm) : null}
          inicial={{
            nombre: ficha.nombre,
            tipoIdentidad: ficha.tipoIdentidad,
            descripcion: ficha.descripcion,
            telefono: ficha.telefono,
            direccion: ficha.direccion,
            comunaId: ficha.comunaId,
            radioKm: ficha.radioKm,
            roles: ficha.roles,
            categorias: ficha.categoriaIds,
            otrasActividades: ficha.otrasActividades,
            correoPublico: ficha.correoPublico,
            sitioWeb: ficha.sitioWeb,
            lat: ficha.ubicacionExacta ? ficha.lat : null,
            lng: ficha.ubicacionExacta ? ficha.lng : null,
          }}
          coberturaInicial={ficha.coberturaIds.filter((id) => id !== ficha.comunaId)}
        />
      </Tarjeta>
    </div>
  );
}
