/**
 * Actores semilla de la comuna piloto. Todos tienen cuenta real
 * (correo + contraseña) para poder recorrer la plataforma desde cualquiera.
 */

export type ActorSemilla = {
  slug: string;
  nombre: string;
  comuna: string;
  roles: ("persona" | "prestador" | "negocio" | "proveedor" | "productor")[];
  categorias: string[];
  descripcion: string;
  telefono?: string;
  disponible?: boolean;
  radioKm?: number | null;
  verificado?: boolean;
  cobertura?: string[];
  catalogo?: { nombre: string; precio?: number; unidad?: string; descripcion?: string }[];
};

export const CLAVE_DEMO = "conecta2026";

export const ACTORES: ActorSemilla[] = [
  {
    slug: "rodrigo-fuentes",
    nombre: "Rodrigo Fuentes",
    comuna: "Ñuñoa",
    roles: ["persona"],
    categorias: [],
    descripcion: "Vecino de Ñuñoa. Uso la plataforma para resolver cosas de la casa.",
    telefono: "+56 9 5555 1001",
  },
  {
    slug: "alvaro-medina",
    nombre: "Álvaro Medina",
    comuna: "Providencia",
    roles: ["persona"],
    categorias: [],
    descripcion: "Trabajo cerca y vivo en el barrio. Contrato servicios por acá.",
  },
  {
    slug: "gasfiteria-aguasur",
    nombre: "Gasfitería Aguasur",
    comuna: "Ñuñoa",
    roles: ["prestador"],
    categorias: ["gasfiteria"],
    descripcion:
      "Gasfitería domiciliaria: filtraciones, WC, calefont y cambios de cañería. 14 años en el barrio.",
    telefono: "+56 9 5555 1010",
    disponible: true,
    radioKm: 12,
    verificado: true,
    cobertura: ["Ñuñoa", "Macul", "Providencia"],
  },
  {
    slug: "salinas-gasfiteria-24h",
    nombre: "Salinas Gasfitería 24h",
    comuna: "Macul",
    roles: ["prestador"],
    categorias: ["gasfiteria", "climatizacion"],
    descripcion: "Urgencias de agua y gas a cualquier hora. Boleta y garantía por escrito.",
    telefono: "+56 9 5555 1011",
    disponible: true,
    radioKm: 20,
    cobertura: ["Macul", "Ñuñoa", "La Florida", "Peñalolén"],
  },
  {
    slug: "electricistas-nunoa",
    nombre: "Electricistas Ñuñoa SpA",
    comuna: "Ñuñoa",
    roles: ["prestador", "negocio"],
    categorias: ["electricidad"],
    descripcion: "Instalaciones, tableros y certificación SEC para casas y locales comerciales.",
    telefono: "+56 9 5555 1012",
    radioKm: 15,
    verificado: true,
    cobertura: ["Ñuñoa", "Providencia", "La Reina"],
  },
  {
    slug: "clima-center",
    nombre: "Clima Center",
    comuna: "Providencia",
    roles: ["prestador", "negocio"],
    categorias: ["climatizacion"],
    descripcion: "Instalación y mantención de aire acondicionado, calefont y calefacción central.",
    disponible: true,
    radioKm: 25,
    cobertura: ["Providencia", "Ñuñoa", "Las Condes", "La Reina"],
  },
  {
    slug: "servitec-linea-blanca",
    nombre: "Servitec Línea Blanca",
    comuna: "La Florida",
    roles: ["prestador"],
    categorias: ["electrodomesticos"],
    descripcion:
      "Reparación de lavadoras, secadoras y refrigeradores a domicilio. Diagnóstico sin costo si acepta la reparación.",
    telefono: "+56 9 5555 1014",
    disponible: true,
    radioKm: 25,
    verificado: true,
    cobertura: ["La Florida", "Ñuñoa", "Macul", "Peñalolén", "Puente Alto"],
  },
  {
    slug: "electro-hogar-vega",
    nombre: "Electro Hogar Vega",
    comuna: "Macul",
    roles: ["prestador"],
    categorias: ["electrodomesticos"],
    descripcion: "Servicio técnico de línea blanca con repuestos originales.",
    radioKm: 18,
    cobertura: ["Macul", "Ñuñoa"],
  },
  {
    slug: "taller-los-alamos",
    nombre: "Taller Mecánico Los Álamos",
    comuna: "Macul",
    roles: ["negocio"],
    categorias: ["mecanica"],
    descripcion: "Mecánica general, frenos y preparación para revisión técnica.",
    verificado: true,
  },
  {
    slug: "autofix-penalolen",
    nombre: "AutoFix Peñalolén",
    comuna: "Peñalolén",
    roles: ["negocio"],
    categorias: ["mecanica"],
    descripcion: "Scanner, suspensión y mantención programada. Atención el mismo día.",
    disponible: true,
  },
  {
    slug: "cerrajeria-express",
    nombre: "Cerrajería Express",
    comuna: "Ñuñoa",
    roles: ["prestador"],
    categorias: ["cerrajeria"],
    descripcion: "Apertura de puertas, cambio de chapas y copias de llave a domicilio.",
    disponible: true,
    radioKm: 15,
  },
  {
    slug: "muebles-barros",
    nombre: "Muebles Barros",
    comuna: "Peñalolén",
    roles: ["prestador", "productor"],
    categorias: ["carpinteria"],
    descripcion: "Closets, cocinas y muebles a medida en madera sólida.",
    catalogo: [
      { nombre: "Closet a medida", precio: 380000, unidad: "m²", descripcion: "Melamina 18 mm" },
      { nombre: "Mesa de comedor en raulí", precio: 520000, unidad: "unidad" },
    ],
  },
  {
    slug: "pinturas-jm",
    nombre: "Pinturas y Terminaciones JM",
    comuna: "La Reina",
    roles: ["prestador"],
    categorias: ["pintura"],
    descripcion: "Pintura de interiores y exteriores, empaste y reparación de muros.",
    radioKm: 20,
    cobertura: ["La Reina", "Ñuñoa", "Providencia", "Peñalolén"],
  },
  {
    slug: "constructora-vecina",
    nombre: "Constructora Vecina",
    comuna: "Macul",
    roles: ["negocio"],
    categorias: ["construccion"],
    descripcion: "Ampliaciones y remodelaciones para casas de barrio, con boleta de garantía.",
    verificado: true,
  },
  {
    slug: "aseo-integral-sur",
    nombre: "Aseo Integral Sur",
    comuna: "La Florida",
    roles: ["negocio"],
    categorias: ["aseo"],
    descripcion: "Aseo profundo, post obra y mantención de oficinas.",
    radioKm: 30,
  },
  {
    slug: "jardines-del-este",
    nombre: "Jardines del Este",
    comuna: "La Reina",
    roles: ["prestador"],
    categorias: ["jardineria"],
    descripcion: "Mantención de jardines, poda y sistemas de riego.",
    radioKm: 18,
  },
  {
    slug: "fletes-don-nano",
    nombre: "Fletes Don Nano",
    comuna: "Ñuñoa",
    roles: ["prestador"],
    categorias: ["fletes"],
    descripcion: "Camioneta 3/4 con ayudante. Mudanzas chicas y repartos diarios.",
    disponible: true,
    radioKm: 40,
    cobertura: ["Ñuñoa", "Santiago", "Macul", "Providencia", "La Florida"],
  },
  {
    slug: "soporteti-barrio",
    nombre: "SoporteTI Barrio",
    comuna: "Providencia",
    roles: ["prestador"],
    categorias: ["tecnologia"],
    descripcion: "Soporte de computadores, redes y respaldo para pymes.",
    radioKm: 20,
  },
  {
    slug: "contable-nunoa",
    nombre: "Contable Ñuñoa",
    comuna: "Ñuñoa",
    roles: ["negocio"],
    categorias: ["contabilidad"],
    descripcion: "Contabilidad mensual, IVA y remuneraciones para pymes y emprendedores.",
    verificado: true,
  },
  {
    slug: "estudio-marca",
    nombre: "Estudio Marca",
    comuna: "Providencia",
    roles: ["negocio"],
    categorias: ["marketing"],
    descripcion: "Identidad visual, redes sociales y fotografía de producto.",
    cobertura: ["Providencia", "Ñuñoa", "Macul", "Las Condes", "La Reina"],
  },
  {
    slug: "panaderia-dona-rosa",
    nombre: "Panadería Doña Rosa",
    comuna: "Ñuñoa",
    roles: ["negocio", "productor"],
    categorias: ["panaderia"],
    descripcion: "Pan amasado, marraqueta y pastelería por encargo. Vendemos desde 1998.",
    verificado: true,
    catalogo: [
      { nombre: "Pan amasado", precio: 2800, unidad: "kg" },
      { nombre: "Torta de mil hojas", precio: 22000, unidad: "unidad" },
    ],
  },
  {
    slug: "distribuidora-el-molino",
    nombre: "Distribuidora El Molino",
    comuna: "Santiago",
    roles: ["proveedor"],
    categorias: ["insumos-gastronomicos", "abarrotes"],
    descripcion: "Harina, aceite y azúcar por saco para panaderías y cocinas. Reparto propio.",
    verificado: true,
    cobertura: ["Santiago", "Ñuñoa", "Macul", "Providencia", "La Florida", "Maipú"],
    catalogo: [
      { nombre: "Harina panadera saco 25 kg", precio: 24500, unidad: "saco" },
      { nombre: "Aceite vegetal 10 L", precio: 18900, unidad: "bidón" },
    ],
  },
  {
    slug: "verduras-del-valle",
    nombre: "Verduras del Valle",
    comuna: "Maipú",
    roles: ["productor", "proveedor"],
    categorias: ["frutas-verduras"],
    descripcion: "Producción propia de tomate, lechuga y zapallo. Despacho por caja o pallet.",
    cobertura: ["Maipú", "Santiago", "Ñuñoa", "Providencia"],
    catalogo: [
      { nombre: "Caja de tomates 15 kg", precio: 12000, unidad: "caja" },
      { nombre: "Lechuga costina", precio: 700, unidad: "unidad" },
    ],
  },
  {
    slug: "carniceria-san-pedro",
    nombre: "Carnicería San Pedro",
    comuna: "Ñuñoa",
    roles: ["negocio"],
    categorias: ["carnes"],
    descripcion: "Carnes seleccionadas, cecinas artesanales y pedidos para eventos.",
  },
  {
    slug: "envases-packgo",
    nombre: "Envases Pack&Go",
    comuna: "Santiago",
    roles: ["proveedor"],
    categorias: ["envases"],
    descripcion: "Cajas, bolsas y etiquetas para delivery y retail. Mínimo 500 unidades.",
    cobertura: ["Santiago", "Ñuñoa", "Providencia", "Maipú"],
  },
  {
    slug: "ferreteria-el-roble",
    nombre: "Ferretería El Roble",
    comuna: "Ñuñoa",
    roles: ["negocio", "proveedor"],
    categorias: ["ferreteria", "materiales"],
    descripcion: "Ferretería de barrio con despacho: herramientas, fijaciones y pintura.",
    verificado: true,
  },
  {
    slug: "aridos-macul",
    nombre: "Áridos y Materiales Macul",
    comuna: "Macul",
    roles: ["proveedor"],
    categorias: ["materiales"],
    descripcion: "Cemento, arena, gravilla y fierro con despacho en camión tolva.",
    cobertura: ["Macul", "Ñuñoa", "Peñalolén", "La Florida"],
  },
  {
    slug: "vivero-las-encinas",
    nombre: "Vivero Las Encinas",
    comuna: "Peñalolén",
    roles: ["productor", "negocio"],
    categorias: ["plantas"],
    descripcion: "Plantas de interior y exterior, tierra de hoja y macetas de greda.",
  },
  {
    slug: "textil-andes",
    nombre: "Textil Andes",
    comuna: "Santiago",
    roles: ["productor", "proveedor"],
    categorias: ["textil"],
    descripcion: "Confección de uniformes y bordado corporativo. Desde 20 unidades.",
    cobertura: ["Santiago", "Ñuñoa", "Providencia"],
  },
  {
    slug: "banqueteria-tres-fuegos",
    nombre: "Banquetería Tres Fuegos",
    comuna: "Providencia",
    roles: ["negocio"],
    categorias: ["eventos"],
    descripcion: "Banquetería para eventos de 20 a 300 personas, con montaje y servicio.",
  },
  {
    slug: "veterinaria-patas",
    nombre: "Veterinaria Patas",
    comuna: "Ñuñoa",
    roles: ["negocio"],
    categorias: ["veterinaria"],
    descripcion: "Consulta general, vacunas y peluquería canina.",
  },
  {
    slug: "clases-ana-rojas",
    nombre: "Ana Rojas · Clases de Matemática",
    comuna: "Macul",
    roles: ["persona", "prestador"],
    categorias: ["clases"],
    descripcion: "Reforzamiento de matemática para enseñanza media y PAES. Online o a domicilio.",
    disponible: true,
    radioKm: 10,
  },
  {
    slug: "peluqueria-estilo",
    nombre: "Peluquería Estilo",
    comuna: "Ñuñoa",
    roles: ["negocio"],
    categorias: ["belleza"],
    descripcion: "Corte, color y barbería con reserva previa.",
    disponible: true,
  },
];

/**
 * Perfiles de prueba de las solicitudes de octubre (Álvaro, 08-oct; Paloma,
 * 18-oct). A diferencia de los anteriores, se crean con los mismos casos de
 * uso que el registro: si una regla del alta se rompe, el seed falla.
 */
export type PerfilPrueba = {
  slug: string;
  nombre: string;
  tipoIdentidad: "persona" | "empresa";
  comuna: string;
  roles: ("persona" | "prestador" | "negocio" | "proveedor" | "productor")[];
  especialidades: string[];
  otrasActividades?: string[];
  descripcion?: string;
  telefono?: string;
  radioKm?: number;
  catalogo?: {
    tipo: "producto" | "servicio";
    nombre: string;
    descripcion?: string;
    precio?: number;
    unidad?: string;
    especialidad?: string;
  }[];
};

export const PERFILES_PRUEBA: PerfilPrueba[] = [
  {
    slug: "ana-rojas-abogada",
    nombre: "Ana Rojas · Abogada",
    tipoIdentidad: "persona",
    comuna: "Providencia",
    roles: ["persona", "prestador"],
    especialidades: ["asesoria-legal"],
    descripcion: "Abogada. Contratos de arriendo y compraventa, temas laborales y herencias.",
    telefono: "9 6100 2001",
    catalogo: [
      { tipo: "servicio", nombre: "Revisión de contrato de arriendo", precio: 35000, unidad: "contrato" },
      { tipo: "servicio", nombre: "Asesoría laboral", precio: 30000, unidad: "hora" },
    ],
  },
  {
    slug: "pedro-soto-electricista",
    nombre: "Pedro Soto · Electricista",
    tipoIdentidad: "persona",
    comuna: "Ñuñoa",
    roles: ["prestador"],
    especialidades: ["electricidad", "seguridad-electronica"],
    otrasActividades: ["Instalación de paneles solares"],
    descripcion: "Electricista autorizado SEC. Reparaciones, tableros y cámaras.",
    telefono: "9 6100 2002",
    radioKm: 15,
    catalogo: [
      { tipo: "servicio", nombre: "Cambio de enchufes e interruptores", precio: 15000, unidad: "visita" },
      { tipo: "servicio", nombre: "Instalación de tablero eléctrico", precio: 120000 },
      { tipo: "servicio", nombre: "Certificación eléctrica TE1", precio: 90000 },
    ],
  },
  {
    slug: "panaderia-la-espiga",
    nombre: "Panadería La Espiga",
    tipoIdentidad: "empresa",
    comuna: "Macul",
    roles: ["negocio", "productor"],
    especialidades: ["panaderia"],
    descripcion: "Pan amasado y tortas hechas en el local.",
    telefono: "9 6100 2003",
    catalogo: [
      { tipo: "producto", nombre: "Pan amasado", precio: 2600, unidad: "kilo" },
      { tipo: "producto", nombre: "Torta de mil hojas", precio: 18990, unidad: "unidad" },
    ],
  },
  {
    slug: "lumen-audiovisual",
    nombre: "Lumen Audiovisual",
    tipoIdentidad: "empresa",
    comuna: "Ñuñoa",
    roles: ["prestador"],
    especialidades: ["audiovisual", "fotografia"],
    descripcion: "Video para marcas y eventos: grabación, edición, dron y transmisión en vivo.",
    telefono: "9 6100 2004",
    catalogo: [
      { tipo: "servicio", nombre: "Video para redes sociales", precio: 180000, unidad: "pieza" },
      { tipo: "servicio", nombre: "Cobertura de evento con dron", precio: 350000, especialidad: "audiovisual" },
    ],
  },
  {
    slug: "repuestos-del-sur",
    nombre: "Repuestos del Sur",
    tipoIdentidad: "empresa",
    comuna: "Rancagua",
    roles: ["negocio", "proveedor"],
    especialidades: ["repuestos-automotrices"],
    descripcion: "Repuestos para autos y camionetas. Venta a público y a talleres.",
    telefono: "9 6100 2005",
    catalogo: [
      { tipo: "producto", nombre: "Filtro de aceite", descripcion: "Para Toyota, Hyundai, Kia y Chevrolet.", precio: 6990, unidad: "unidad" },
      { tipo: "producto", nombre: "Filtro de aire", precio: 8990, unidad: "unidad" },
      { tipo: "producto", nombre: "Filtro de combustible", precio: 9990, unidad: "unidad" },
    ],
  },
  {
    slug: "luis-munoz-calefones",
    nombre: "Luis Muñoz · Técnico en calefones",
    tipoIdentidad: "persona",
    comuna: "Puente Alto",
    roles: ["prestador"],
    especialidades: ["climatizacion", "gasfiteria"],
    descripcion: "Mantención e instalación de calefones. Técnico independiente.",
    telefono: "9 6100 2006",
    radioKm: 10,
  },
  {
    slug: "camila-torres",
    nombre: "Camila Torres",
    tipoIdentidad: "persona",
    comuna: "Maipú",
    roles: ["persona"],
    especialidades: [],
  },
];
