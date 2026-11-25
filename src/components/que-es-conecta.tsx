/**
 * Qué es Conecta, solo para visitantes (S01). Compacto a propósito: va debajo
 * del buscador y no debe empujarlo fuera de la primera pantalla.
 */
const EJEMPLOS = [
  { icono: "🔧", texto: "«Un gásfiter que pueda venir hoy»" },
  { icono: "🚗", texto: "«Pastillas de freno para mi auto»" },
  { icono: "🥖", texto: "«20 sacos de harina para mi panadería»" },
];

export function QueEsConecta() {
  return (
    <section
      aria-labelledby="que-es-conecta"
      className="rounded-2xl border border-marca/20 bg-marca/5 px-4 py-3.5"
    >
      <h2 id="que-es-conecta" className="text-sm font-semibold text-texto">
        ¿Qué es Conecta?
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-tenue">
        El lugar donde <strong className="font-medium text-texto">personas, negocios,
        prestadores y proveedores</strong> de tu comuna se encuentran: busca lo que necesitas, pide
        cotizaciones o muestra lo que ofreces. Mirar es gratis y sin cuenta.
      </p>
      <ul className="mt-2 grid gap-1 text-xs text-texto sm:grid-cols-3">
        {EJEMPLOS.map((e) => (
          <li key={e.texto} className="flex items-start gap-1.5">
            <span aria-hidden>{e.icono}</span>
            {e.texto}
          </li>
        ))}
      </ul>
    </section>
  );
}
