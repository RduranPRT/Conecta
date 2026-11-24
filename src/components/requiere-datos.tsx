import { FormularioCompletar } from "@/components/completar-datos";
import { Tarjeta } from "@/components/ui";
import { arbolDeRubros } from "@/lib/casos/categorias";
import { datosParaRequisitos } from "@/lib/casos/perfil";
import {
  requisitosPara,
  type AccionConRequisitos,
  type CampoRequerido,
} from "@/lib/casos/requisitos";
import { opcionesTerritorio, prefijoTelefonico } from "@/lib/casos/territorio";

/**
 * Si a la acción le falta algo, lo pide aquí mismo y explica para qué; si no,
 * muestra la pantalla normal. La regla es `requisitosPara`, no esta pantalla.
 */
export async function RequiereDatos({
  accion,
  perfilId,
  next,
  titulo,
  boton,
  /** Campos que la propia pantalla ya pregunta. */
  yaLoPide = [],
  children,
}: {
  accion: AccionConRequisitos;
  perfilId: number;
  next: string;
  titulo: string;
  boton?: string;
  yaLoPide?: CampoRequerido[];
  children?: React.ReactNode;
}) {
  const datos = await datosParaRequisitos(perfilId);
  const faltan = requisitosPara(accion, datos).filter((f) => !yaLoPide.includes(f.campo));
  if (!faltan.length) return <>{children}</>;

  const [territorio, rubros, prefijo] = await Promise.all([
    opcionesTerritorio(),
    faltan.some((f) => f.campo === "actividad") ? arbolDeRubros() : [],
    prefijoTelefonico(datos.comunaId),
  ]);

  return (
    <Tarjeta className="space-y-4 p-5 sm:p-6" data-testid="completar-datos">
      <div>
        <h2 className="text-base font-semibold text-texto">{titulo}</h2>
        <p className="mt-0.5 text-sm text-tenue">
          {faltan.length === 1
            ? "Solo falta un dato. Queda guardado y no te lo volvemos a pedir."
            : `Faltan ${faltan.length} datos. Quedan guardados y no te los volvemos a pedir.`}
        </p>
      </div>
      <FormularioCompletar
        accion={accion}
        faltan={faltan}
        next={next}
        territorio={territorio}
        rubros={rubros}
        prefijo={prefijo}
        boton={boton}
      />
    </Tarjeta>
  );
}
