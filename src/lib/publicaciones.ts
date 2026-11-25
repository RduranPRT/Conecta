/**
 * Vocabulario común de las publicaciones (S23): una palabra dice si alguien
 * ofrece o busca algo, y cada tipo termina en una acción concreta.
 */

export type Sentido = "Ofrece" | "Busca" | null;

export function sentidoDe(tipo: string): Sentido {
  if (tipo === "necesidad") return "Busca";
  if (tipo === "novedad") return null;
  return "Ofrece";
}

export const ETIQUETA_TIPO: Record<string, string> = {
  producto: "Producto",
  servicio: "Servicio",
  oferta: "Oferta",
  oportunidad: "Oportunidad",
  necesidad: "Necesidad",
  novedad: "Novedad",
};

export const TONO_TIPO: Record<string, "marca" | "acento" | "neutro" | "exito"> = {
  necesidad: "acento",
  producto: "marca",
  servicio: "marca",
  oferta: "exito",
  oportunidad: "exito",
  novedad: "neutro",
};

export type AccionPublicacion = {
  etiqueta: string;
  href: string;
  primario: boolean;
  /** Necesita cuenta: el visitante ve el aviso antes de seguir. */
  conCuenta: boolean;
};

export function contactar(slug: string) {
  return `/p/${slug}?accion=contactar#contacto`;
}

export function accionesDe(
  tipo: string,
  necesidadId: number | null,
  autorSlug: string,
): AccionPublicacion[] {
  const ver = { etiqueta: "Ver perfil", href: `/p/${autorSlug}`, primario: false, conCuenta: false };
  const escribir = {
    etiqueta: "Contactar",
    href: contactar(autorSlug),
    primario: false,
    conCuenta: true,
  };
  switch (tipo) {
    case "necesidad":
      return necesidadId
        ? [
            {
              etiqueta: "Enviar propuesta",
              href: `/necesidades/${necesidadId}?accion=proponer#propuesta`,
              primario: true,
              conCuenta: true,
            },
            {
              etiqueta: "Ver detalle",
              href: `/necesidades/${necesidadId}`,
              primario: false,
              conCuenta: false,
            },
          ]
        : [ver];
    case "producto":
      return [
        {
          etiqueta: "Cotizar",
          href: `/publicar?tipo=necesidad&para=${autorSlug}`,
          primario: true,
          conCuenta: true,
        },
        escribir,
      ];
    case "servicio":
      return [
        {
          etiqueta: "Solicitar servicio",
          href: `/publicar?tipo=necesidad&para=${autorSlug}`,
          primario: true,
          conCuenta: true,
        },
        escribir,
      ];
    case "oferta":
    case "oportunidad":
      return [{ etiqueta: "Me interesa", href: contactar(autorSlug), primario: true, conCuenta: true }];
    default:
      return [ver];
  }
}
