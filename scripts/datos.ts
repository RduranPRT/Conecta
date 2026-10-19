/** Datos de referencia del prototipo: territorio, taxonomía y agentes. */

import { COMUNAS_CL, REGIONES_CL } from "./territorio-cl";

/* ── Territorio ───────────────────────────────────────────────────────────── */

/** Comuna piloto: la plataforma arranca aquí, pero el modelo no lo asume. */
export const CODIGO_COMUNA_PILOTO = "13120"; // Ñuñoa

export const REGIONES = REGIONES_CL;

export const COMUNAS = COMUNAS_CL.map((c) => ({ ...c, activa: c.codigo === CODIGO_COMUNA_PILOTO }));

/* ── Taxonomía ────────────────────────────────────────────────────────────── */

/**
 * Rubros: la primera puerta de entrada. Adaptados del análisis de 2x3 (oct-2026)
 * al alcance de Conecta, que además de servicios incluye productos, negocios y
 * abastecimiento. No se copian rubros amplios como «Bienestar» o «Artesanía»:
 * se separan en áreas que la gente reconoce.
 */
export const RUBROS: {
  slug: string;
  nombre: string;
  icono: string;
  ejemplos: string;
  sinonimos: string[];
}[] = [
  {
    slug: "rubro-hogar",
    nombre: "Hogar y reparaciones",
    icono: "🏠",
    ejemplos: "Gásfiter, electricista, pintura, cerrajería, aseo, jardín",
    sinonimos: ["casa", "hogar", "reparacion", "arreglo"],
  },
  {
    slug: "rubro-vehiculos",
    nombre: "Vehículos",
    icono: "🚗",
    ejemplos: "Mecánica, repuestos, neumáticos, lavado de autos",
    sinonimos: ["auto", "autos", "vehiculo", "automotriz", "camioneta", "moto"],
  },
  {
    slug: "rubro-salud",
    nombre: "Salud",
    icono: "🩺",
    ejemplos: "Kinesiología, psicología, nutrición, dentista, cuidado de adultos mayores",
    sinonimos: ["salud", "medico", "terapia"],
  },
  {
    slug: "rubro-belleza",
    nombre: "Belleza y cuidado personal",
    icono: "💇",
    ejemplos: "Peluquería, barbería, manicure, masajes",
    sinonimos: ["belleza", "estetica", "cuidado personal"],
  },
  {
    slug: "rubro-mascotas",
    nombre: "Mascotas",
    icono: "🐾",
    ejemplos: "Veterinario, peluquería canina, paseo de perros, alimento",
    sinonimos: ["mascota", "mascotas", "perro", "gato"],
  },
  {
    slug: "rubro-clases",
    nombre: "Clases y capacitación",
    icono: "📚",
    ejemplos: "Clases particulares, idiomas, música, deporte, cursos para empresas",
    sinonimos: ["clases", "cursos", "aprender", "profesor"],
  },
  {
    slug: "rubro-eventos",
    nombre: "Eventos y celebraciones",
    icono: "🎉",
    ejemplos: "Banquetería, tortas, decoración, música, fotografía",
    sinonimos: ["evento", "fiesta", "cumpleaños", "matrimonio", "celebracion"],
  },
  {
    slug: "rubro-profesionales",
    nombre: "Asesorías profesionales",
    icono: "⚖️",
    ejemplos: "Abogado, contador, asesoría financiera, consultoría",
    sinonimos: ["asesoria", "asesor", "profesional", "consultor"],
  },
  {
    slug: "rubro-creativo",
    nombre: "Diseño, marketing y audiovisual",
    icono: "🎨",
    ejemplos: "Diseño de logos, redes sociales, fotografía, video, páginas web",
    sinonimos: ["creativo", "diseño", "audiovisual", "publicidad"],
  },
  {
    slug: "rubro-tecnologia",
    nombre: "Tecnología y soporte técnico",
    icono: "💻",
    ejemplos: "Computadores, celulares, wifi, electrodomésticos, cámaras",
    sinonimos: ["tecnologia", "soporte", "tecnico", "computacion"],
  },
  {
    slug: "rubro-transporte",
    nombre: "Transporte y mudanzas",
    icono: "🚚",
    ejemplos: "Fletes, mudanzas, transporte de personas",
    sinonimos: ["transporte", "traslado"],
  },
  {
    slug: "rubro-alimentos",
    nombre: "Alimentos y bebidas",
    icono: "🥖",
    ejemplos: "Almacén, pan, frutas y verduras, carnes, comida preparada",
    sinonimos: ["comida", "alimentos", "alimentacion"],
  },
  {
    slug: "rubro-comercio",
    nombre: "Comercio y abastecimiento",
    icono: "📦",
    ejemplos: "Ferretería, materiales, envases, ropa, insumos para negocios",
    sinonimos: ["tienda", "comercio", "insumos", "mayorista", "abastecimiento"],
  },
];

/**
 * Especialidades: lo que un perfil ofrece y lo que se busca. Los `slug` de las
 * 30 categorías originales se conservan para no romper los perfiles existentes.
 * `rubro` es el rubro principal; `tambienEn`, otros rubros desde donde se
 * descubre la misma especialidad (una sola identidad, varias rutas).
 */
export const ESPECIALIDADES: {
  slug: string;
  nombre: string;
  tipo: "servicio" | "producto" | "ambos";
  rubro: string;
  tambienEn?: string[];
  oficio?: string;
  ejemplos?: string;
  sinonimos: string[];
}[] = [
  /* Hogar y reparaciones */
  {
    slug: "gasfiteria",
    nombre: "Gasfitería",
    tipo: "servicio",
    rubro: "rubro-hogar",
    oficio: "Gásfiter",
    ejemplos: "Fugas de agua, WC, cañerías, instalación de calefont",
    sinonimos: ["gasfiter", "gasfíter", "plomero", "plomeria", "cañeria", "fuga de agua", "wc", "deteccion de fugas"],
  },
  {
    slug: "electricidad",
    nombre: "Electricidad",
    tipo: "servicio",
    rubro: "rubro-hogar",
    oficio: "Electricista",
    ejemplos: "Enchufes, tableros, cortes de luz, certificación",
    sinonimos: ["electricista", "enchufe", "corto circuito", "tablero electrico", "automatico", "luz"],
  },
  {
    slug: "climatizacion",
    nombre: "Climatización y calefacción",
    tipo: "servicio",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-tecnologia"],
    oficio: "Técnico en climatización",
    ejemplos: "Calefont, aire acondicionado, estufas, termos",
    sinonimos: ["calefaccion", "calefont", "calefon", "calefones", "aire acondicionado", "estufa", "termo"],
  },
  {
    slug: "electrodomesticos",
    nombre: "Reparación de electrodomésticos",
    tipo: "servicio",
    rubro: "rubro-tecnologia",
    tambienEn: ["rubro-hogar"],
    oficio: "Técnico en línea blanca",
    ejemplos: "Lavadora, refrigerador, secadora, microondas",
    sinonimos: ["lavadora", "refrigerador", "linea blanca", "secadora", "microondas"],
  },
  {
    slug: "cerrajeria",
    nombre: "Cerrajería",
    tipo: "servicio",
    rubro: "rubro-hogar",
    oficio: "Cerrajero",
    ejemplos: "Apertura de puertas, cambio de chapa, copias de llaves",
    sinonimos: ["cerrajero", "llave", "chapa", "candado", "cerradura"],
  },
  {
    slug: "carpinteria",
    nombre: "Carpintería y muebles",
    tipo: "ambos",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-comercio"],
    oficio: "Carpintero",
    ejemplos: "Muebles a medida, closets, reparación y restauración",
    sinonimos: ["carpintero", "mueble", "muebles", "closet", "madera", "cocina a medida", "tapiceria"],
  },
  {
    slug: "pintura",
    nombre: "Pintura y terminaciones",
    tipo: "servicio",
    rubro: "rubro-hogar",
    oficio: "Pintor",
    ejemplos: "Pintura interior y exterior, estuco, empaste",
    sinonimos: ["pintor", "pintar", "estuco", "empastar"],
  },
  {
    slug: "construccion",
    nombre: "Construcción y remodelación",
    tipo: "servicio",
    rubro: "rubro-hogar",
    oficio: "Maestro constructor",
    ejemplos: "Ampliaciones, remodelaciones, pisos, techos, cerámica",
    sinonimos: ["maestro", "albañil", "remodelacion", "ampliacion", "obra", "techo", "techumbre", "piso", "ceramica"],
  },
  {
    slug: "soldadura",
    nombre: "Soldadura y estructuras metálicas",
    tipo: "servicio",
    rubro: "rubro-hogar",
    oficio: "Soldador",
    ejemplos: "Rejas, portones, protecciones, estructuras",
    sinonimos: ["soldador", "soldadura", "reja", "porton", "protecciones", "metalurgia"],
  },
  {
    slug: "arquitectura",
    nombre: "Arquitectura y planos",
    tipo: "servicio",
    rubro: "rubro-profesionales",
    tambienEn: ["rubro-hogar"],
    oficio: "Arquitecto",
    ejemplos: "Planos, regularización, permisos de edificación",
    sinonimos: ["arquitecto", "planos", "regularizacion", "permiso de edificacion", "ingeniero"],
  },
  {
    slug: "aseo",
    nombre: "Aseo y limpieza",
    tipo: "servicio",
    rubro: "rubro-hogar",
    ejemplos: "Aseo de casas y oficinas, alfombras, sanitización",
    sinonimos: ["limpieza", "aseo profundo", "sanitizacion", "lavado de alfombras", "nana", "asesora del hogar"],
  },
  {
    slug: "control-plagas",
    nombre: "Control de plagas",
    tipo: "servicio",
    rubro: "rubro-hogar",
    ejemplos: "Fumigación, ratones, termitas",
    sinonimos: ["fumigacion", "plagas", "ratones", "termitas", "cucarachas", "desratizacion"],
  },
  {
    slug: "jardineria",
    nombre: "Jardinería y piscinas",
    tipo: "servicio",
    rubro: "rubro-hogar",
    oficio: "Jardinero",
    ejemplos: "Mantención de jardines, poda, riego, limpieza de piscinas",
    sinonimos: ["jardinero", "pasto", "poda", "riego", "piscina"],
  },
  {
    slug: "costura",
    nombre: "Costura y arreglos de ropa",
    tipo: "servicio",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-comercio"],
    oficio: "Costurera",
    ejemplos: "Bastas, cierres, ajustes, ropa a medida",
    sinonimos: ["costurera", "sastre", "arreglo de ropa", "basta", "modista"],
  },

  /* Vehículos */
  {
    slug: "mecanica",
    nombre: "Mecánica automotriz",
    tipo: "servicio",
    rubro: "rubro-vehiculos",
    oficio: "Mecánico",
    ejemplos: "Mantención, frenos, embrague, revisión técnica",
    sinonimos: ["mecanico", "taller", "taller mecanico", "frenos", "revision tecnica", "embrague"],
  },
  {
    slug: "repuestos-automotrices",
    nombre: "Repuestos automotrices",
    tipo: "producto",
    rubro: "rubro-vehiculos",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Filtros, pastillas de freno, baterías, lubricantes",
    sinonimos: [
      "repuesto", "repuestos", "autopartes", "filtro de aceite", "filtro de aire",
      "filtro de combustible", "pastillas de freno", "bateria", "lubricante", "aceite de motor",
    ],
  },
  {
    slug: "neumaticos",
    nombre: "Neumáticos y vulcanización",
    tipo: "ambos",
    rubro: "rubro-vehiculos",
    oficio: "Vulcanizador",
    ejemplos: "Venta de neumáticos, parches, alineación y balanceo",
    sinonimos: ["neumatico", "neumaticos", "vulcanizacion", "vulca", "alineacion", "balanceo"],
  },
  {
    slug: "electricidad-automotriz",
    nombre: "Electricidad automotriz",
    tipo: "servicio",
    rubro: "rubro-vehiculos",
    oficio: "Electromecánico",
    ejemplos: "Alternador, partida, luces, scanner",
    sinonimos: ["electricidad automotriz", "alternador", "motor de partida", "scanner"],
  },
  {
    slug: "lavado-autos",
    nombre: "Lavado y estética automotriz",
    tipo: "servicio",
    rubro: "rubro-vehiculos",
    ejemplos: "Lavado, pulido, limpieza de tapiz",
    sinonimos: ["lavado de autos", "car wash", "pulido", "encerado"],
  },

  /* Salud */
  {
    slug: "kinesiologia",
    nombre: "Kinesiología y rehabilitación",
    tipo: "servicio",
    rubro: "rubro-salud",
    oficio: "Kinesiólogo",
    ejemplos: "Lesiones, rehabilitación, atención a domicilio",
    sinonimos: ["kinesiologo", "kine", "kinesiologia", "rehabilitacion"],
  },
  {
    slug: "psicologia",
    nombre: "Psicología y terapia",
    tipo: "servicio",
    rubro: "rubro-salud",
    oficio: "Psicólogo",
    ejemplos: "Terapia individual, de pareja o familiar",
    sinonimos: ["psicologo", "psicologa", "terapia", "terapeuta"],
  },
  {
    slug: "nutricion",
    nombre: "Nutrición",
    tipo: "servicio",
    rubro: "rubro-salud",
    oficio: "Nutricionista",
    ejemplos: "Planes de alimentación, control de peso",
    sinonimos: ["nutricionista", "dieta"],
  },
  {
    slug: "odontologia",
    nombre: "Odontología",
    tipo: "servicio",
    rubro: "rubro-salud",
    oficio: "Dentista",
    ejemplos: "Limpieza dental, tapaduras, ortodoncia",
    sinonimos: ["dentista", "dental", "ortodoncia", "muela"],
  },
  {
    slug: "cuidados",
    nombre: "Enfermería y cuidado de personas",
    tipo: "servicio",
    rubro: "rubro-salud",
    oficio: "Cuidador",
    ejemplos: "Cuidado de adultos mayores, curaciones, inyecciones",
    sinonimos: ["enfermera", "enfermero", "cuidadora", "adulto mayor", "curaciones", "tens"],
  },

  /* Belleza y cuidado personal */
  {
    slug: "belleza",
    nombre: "Peluquería y barbería",
    tipo: "servicio",
    rubro: "rubro-belleza",
    tambienEn: ["rubro-eventos"],
    oficio: "Peluquero",
    ejemplos: "Corte, color, peinados, barba",
    sinonimos: ["peluqueria", "barberia", "peluquero", "barbero", "corte de pelo"],
  },
  {
    slug: "estetica",
    nombre: "Manicure y estética",
    tipo: "servicio",
    rubro: "rubro-belleza",
    tambienEn: ["rubro-eventos"],
    ejemplos: "Manicure, pestañas, depilación, maquillaje",
    sinonimos: ["manicure", "pedicure", "uñas", "pestañas", "depilacion", "maquillaje", "estetica"],
  },
  {
    slug: "masajes",
    nombre: "Masajes",
    tipo: "servicio",
    rubro: "rubro-belleza",
    tambienEn: ["rubro-salud"],
    ejemplos: "Masaje descontracturante, relajación",
    sinonimos: ["masaje", "masajista", "descontracturante"],
  },

  /* Mascotas */
  {
    slug: "veterinaria",
    nombre: "Veterinaria",
    tipo: "servicio",
    rubro: "rubro-mascotas",
    oficio: "Veterinario",
    ejemplos: "Consultas, vacunas, microchip, atención a domicilio",
    sinonimos: ["veterinario", "vacuna", "microchip", "clinica veterinaria"],
  },
  {
    slug: "peluqueria-mascotas",
    nombre: "Peluquería de mascotas",
    tipo: "servicio",
    rubro: "rubro-mascotas",
    ejemplos: "Baño y corte para perros y gatos",
    sinonimos: ["peluqueria canina", "peluqueria felina", "baño de perro"],
  },
  {
    slug: "cuidado-mascotas",
    nombre: "Paseo y cuidado de mascotas",
    tipo: "servicio",
    rubro: "rubro-mascotas",
    ejemplos: "Paseo de perros, hotel, adiestramiento",
    sinonimos: ["paseador", "paseo de perros", "hotel de mascotas", "adiestramiento", "guarderia"],
  },
  {
    slug: "productos-mascotas",
    nombre: "Alimento y accesorios para mascotas",
    tipo: "producto",
    rubro: "rubro-mascotas",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Alimento, arena, juguetes, camas",
    sinonimos: ["alimento para perros", "comida de gato", "pet shop", "arena sanitaria"],
  },

  /* Clases y capacitación */
  {
    slug: "clases",
    nombre: "Clases particulares",
    tipo: "servicio",
    rubro: "rubro-clases",
    oficio: "Profesor particular",
    ejemplos: "Matemática, lenguaje, preparación de pruebas",
    sinonimos: ["profesor", "clases particulares", "reforzamiento", "paes", "tutor"],
  },
  {
    slug: "idiomas",
    nombre: "Idiomas",
    tipo: "servicio",
    rubro: "rubro-clases",
    ejemplos: "Inglés, portugués, español para extranjeros",
    sinonimos: ["ingles", "idioma", "portugues", "frances", "clases de ingles"],
  },
  {
    slug: "musica-arte",
    nombre: "Música y arte",
    tipo: "servicio",
    rubro: "rubro-clases",
    ejemplos: "Guitarra, piano, canto, dibujo, pintura artística",
    sinonimos: ["guitarra", "piano", "canto", "dibujo", "clases de musica"],
  },
  {
    slug: "deporte",
    nombre: "Deporte y actividad física",
    tipo: "servicio",
    rubro: "rubro-clases",
    oficio: "Entrenador",
    ejemplos: "Personal trainer, yoga, natación, tenis",
    sinonimos: ["personal trainer", "entrenador", "yoga", "pilates", "natacion", "tenis"],
  },
  {
    slug: "capacitacion",
    nombre: "Cursos y capacitación para empresas",
    tipo: "servicio",
    rubro: "rubro-clases",
    tambienEn: ["rubro-profesionales"],
    ejemplos: "Excel, liderazgo, atención al cliente, cursos SENCE",
    sinonimos: ["capacitacion", "curso", "sence", "excel"],
  },

  /* Eventos y celebraciones */
  {
    slug: "eventos",
    nombre: "Banquetería y catering",
    tipo: "servicio",
    rubro: "rubro-eventos",
    tambienEn: ["rubro-alimentos"],
    ejemplos: "Cócteles, matrimonios, cumpleaños, garzones",
    sinonimos: ["banqueteria", "catering", "coctel", "garzon", "barman"],
  },
  {
    slug: "decoracion-eventos",
    nombre: "Decoración y arriendo para eventos",
    tipo: "servicio",
    rubro: "rubro-eventos",
    ejemplos: "Globos, toldos, mesas y sillas, juegos inflables",
    sinonimos: ["decoracion", "globos", "arriendo de toldos", "inflables", "mesas y sillas"],
  },
  {
    slug: "animacion",
    nombre: "Música y animación",
    tipo: "servicio",
    rubro: "rubro-eventos",
    ejemplos: "DJ, músicos, animador infantil, amplificación",
    sinonimos: ["dj", "animador", "musicos", "amplificacion", "show"],
  },

  /* Asesorías profesionales */
  {
    slug: "asesoria-legal",
    nombre: "Asesoría legal",
    tipo: "servicio",
    rubro: "rubro-profesionales",
    oficio: "Abogado",
    ejemplos: "Contratos, temas laborales, herencias, arriendos",
    sinonimos: [
      "abogado", "abogada", "legal", "contrato", "contratos", "laboral", "herencia",
      "posesion efectiva", "demanda", "juicio", "arriendo",
    ],
  },
  {
    slug: "contabilidad",
    nombre: "Contabilidad y tributaria",
    tipo: "servicio",
    rubro: "rubro-profesionales",
    oficio: "Contador",
    ejemplos: "Impuestos, inicio de actividades, remuneraciones",
    sinonimos: ["contador", "contadora", "impuestos", "sii", "remuneraciones", "boletas", "iva", "renta"],
  },
  {
    slug: "asesoria-financiera",
    nombre: "Asesoría financiera",
    tipo: "servicio",
    rubro: "rubro-profesionales",
    ejemplos: "Créditos, inversiones, presupuesto, seguros",
    sinonimos: ["financiero", "finanzas", "credito", "inversion", "seguros", "deudas"],
  },
  {
    slug: "consultoria",
    nombre: "Consultoría y gestión de empresas",
    tipo: "servicio",
    rubro: "rubro-profesionales",
    ejemplos: "Plan de negocios, procesos, formalización",
    sinonimos: ["consultoria", "consultor", "plan de negocios", "gestion", "emprendimiento"],
  },
  {
    slug: "traduccion",
    nombre: "Traducción y redacción",
    tipo: "servicio",
    rubro: "rubro-profesionales",
    tambienEn: ["rubro-creativo"],
    ejemplos: "Traducciones, corrección de textos, redacción",
    sinonimos: ["traductor", "traduccion", "redaccion", "correccion de textos"],
  },

  /* Diseño, marketing y audiovisual */
  {
    slug: "marketing",
    nombre: "Marketing y redes sociales",
    tipo: "servicio",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-profesionales"],
    ejemplos: "Manejo de redes, publicidad digital, posicionamiento",
    sinonimos: ["publicidad", "redes sociales", "community manager", "seo", "instagram", "marketing digital"],
  },
  {
    slug: "diseno-grafico",
    nombre: "Diseño gráfico",
    tipo: "servicio",
    rubro: "rubro-creativo",
    oficio: "Diseñador gráfico",
    ejemplos: "Logos, tarjetas, menús, etiquetas",
    sinonimos: ["diseño", "diseñador", "logo", "grafica", "branding"],
  },
  {
    slug: "fotografia",
    nombre: "Fotografía",
    tipo: "servicio",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-eventos"],
    oficio: "Fotógrafo",
    ejemplos: "Eventos, productos, retratos",
    sinonimos: ["fotografo", "fotografa", "fotos", "sesion de fotos"],
  },
  {
    slug: "audiovisual",
    nombre: "Video y producción audiovisual",
    tipo: "servicio",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-eventos"],
    oficio: "Realizador audiovisual",
    ejemplos: "Grabación, edición de video, dron, transmisión en vivo, sonido",
    sinonimos: [
      "video", "videos", "filmacion", "grabacion", "edicion de video", "dron",
      "streaming", "audiovisual", "productora", "sonido",
    ],
  },
  {
    slug: "desarrollo-web",
    nombre: "Páginas web y aplicaciones",
    tipo: "servicio",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-tecnologia"],
    oficio: "Desarrollador",
    ejemplos: "Sitios web, tiendas en línea, aplicaciones",
    sinonimos: ["pagina web", "sitio web", "programador", "aplicacion", "tienda online", "ecommerce"],
  },
  {
    slug: "imprenta",
    nombre: "Imprenta y letreros",
    tipo: "ambos",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Tarjetas, pendones, letreros, adhesivos",
    sinonimos: ["imprenta", "impresion", "pendon", "letrero", "adhesivos", "señaletica"],
  },

  /* Tecnología y soporte técnico */
  {
    slug: "tecnologia",
    nombre: "Computadores, celulares y redes",
    tipo: "servicio",
    rubro: "rubro-tecnologia",
    oficio: "Técnico en computación",
    ejemplos: "Reparación de notebook y celular, wifi, impresoras",
    sinonimos: ["computador", "notebook", "celular", "soporte", "redes", "wifi", "sistemas", "impresora"],
  },
  {
    slug: "seguridad-electronica",
    nombre: "Cámaras y alarmas",
    tipo: "servicio",
    rubro: "rubro-tecnologia",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Cámaras de seguridad, alarmas, citófonos, portones eléctricos",
    sinonimos: ["camaras de seguridad", "alarma", "citofono", "porton electrico", "cctv"],
  },

  /* Transporte y mudanzas */
  {
    slug: "fletes",
    nombre: "Fletes y mudanzas",
    tipo: "servicio",
    rubro: "rubro-transporte",
    ejemplos: "Mudanzas, fletes, despacho, bodegaje",
    sinonimos: ["flete", "mudanza", "camioneta", "traslado", "despacho", "bodegaje"],
  },
  {
    slug: "transporte-personas",
    nombre: "Transporte de personas",
    tipo: "servicio",
    rubro: "rubro-transporte",
    ejemplos: "Traslados al aeropuerto, transporte escolar, buses",
    sinonimos: ["transfer", "aeropuerto", "furgon escolar", "transporte escolar", "bus", "chofer"],
  },

  /* Alimentos y bebidas */
  {
    slug: "abarrotes",
    nombre: "Almacén y abarrotes",
    tipo: "producto",
    rubro: "rubro-alimentos",
    ejemplos: "Almacén de barrio, despensa, productos básicos",
    sinonimos: ["abarrotes", "almacen", "comestibles", "despensa", "minimarket"],
  },
  {
    slug: "frutas-verduras",
    nombre: "Frutas y verduras",
    tipo: "producto",
    rubro: "rubro-alimentos",
    ejemplos: "Verdulería, cajas de fruta, productos del campo",
    sinonimos: ["verduras", "frutas", "tomates", "papas", "hortalizas", "cajas de tomates", "verduleria"],
  },
  {
    slug: "panaderia",
    nombre: "Panadería y pastelería",
    tipo: "producto",
    rubro: "rubro-alimentos",
    tambienEn: ["rubro-eventos"],
    ejemplos: "Pan amasado, tortas, kuchenes, pasteles",
    sinonimos: ["pan", "pasteleria", "torta", "tortas", "amasado", "kuchen", "panaderia"],
  },
  {
    slug: "carnes",
    nombre: "Carnes y fiambres",
    tipo: "producto",
    rubro: "rubro-alimentos",
    ejemplos: "Carnicería, pollo, cecinas",
    sinonimos: ["carniceria", "carne", "pollo", "cecinas"],
  },
  {
    slug: "comida-preparada",
    nombre: "Comida preparada",
    tipo: "producto",
    rubro: "rubro-alimentos",
    ejemplos: "Colaciones, empanadas, comida casera, delivery",
    sinonimos: ["colaciones", "empanadas", "comida casera", "almuerzo", "delivery", "menu"],
  },
  {
    slug: "insumos-gastronomicos",
    nombre: "Insumos para restaurantes y cocinas",
    tipo: "producto",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-alimentos"],
    ejemplos: "Harina, aceite, azúcar y levadura por mayor",
    sinonimos: ["harina", "aceite", "azucar", "levadura", "insumos", "saco de harina", "gastronomico"],
  },

  /* Comercio y abastecimiento */
  {
    slug: "ferreteria",
    nombre: "Ferretería",
    tipo: "producto",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Herramientas, tornillos, pinturas, gasfitería",
    sinonimos: ["ferreteria", "herramientas", "tornillos", "pintura latex"],
  },
  {
    slug: "materiales",
    nombre: "Materiales de construcción",
    tipo: "producto",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Cemento, arena, fierro, ladrillos, maderas",
    sinonimos: ["cemento", "arena", "fierro", "ladrillo", "aridos", "barraca"],
  },
  {
    slug: "envases",
    nombre: "Envases y embalaje",
    tipo: "producto",
    rubro: "rubro-comercio",
    ejemplos: "Cajas, bolsas, envases para comida, etiquetas",
    sinonimos: ["envases", "cajas", "bolsas", "etiquetas", "packaging", "embalaje"],
  },
  {
    slug: "textil",
    nombre: "Ropa, telas y uniformes",
    tipo: "producto",
    rubro: "rubro-comercio",
    ejemplos: "Ropa, uniformes, telas, bordados",
    sinonimos: ["ropa", "uniformes", "telas", "bordado", "vestuario"],
  },
  {
    slug: "artesania",
    nombre: "Artesanía y regalos",
    tipo: "producto",
    rubro: "rubro-comercio",
    ejemplos: "Hecho a mano, greda, joyería, regalos",
    sinonimos: ["artesania", "hecho a mano", "regalos", "greda", "joyeria"],
  },
  {
    slug: "plantas",
    nombre: "Plantas y vivero",
    tipo: "producto",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Plantas, árboles, macetas, tierra de hoja",
    sinonimos: ["vivero", "plantas", "macetas", "tierra de hoja"],
  },
  {
    slug: "articulos-aseo",
    nombre: "Artículos de aseo",
    tipo: "producto",
    rubro: "rubro-comercio",
    ejemplos: "Detergentes, papel, productos de limpieza por mayor",
    sinonimos: ["articulos de aseo", "detergente", "cloro", "papel higienico", "productos de limpieza"],
  },
];

export const AGENTES: {
  codigo: string;
  nombre: string;
  descripcion: string;
  ambito: "usuario" | "administracion";
  disponible: boolean;
  orden: number;
}[] = [
  {
    codigo: "comercial",
    nombre: "Agente Comercial",
    descripcion: "Detecta oportunidades abiertas que calzan contigo y prepara el acercamiento.",
    ambito: "usuario",
    disponible: false,
    orden: 1,
  },
  {
    codigo: "cotizador",
    nombre: "Agente Cotizador",
    descripcion: "Arma la cotización a partir de tu lista de precios y tu carga de trabajo.",
    ambito: "usuario",
    disponible: false,
    orden: 2,
  },
  {
    codigo: "agenda",
    nombre: "Agente Agenda",
    descripcion: "Ordena visitas y entregas según distancia y disponibilidad real.",
    ambito: "usuario",
    disponible: false,
    orden: 3,
  },
  {
    codigo: "atencion",
    nombre: "Agente Atención al Cliente",
    descripcion: "Responde consultas frecuentes y escala lo que necesita tu decisión.",
    ambito: "usuario",
    disponible: false,
    orden: 4,
  },
  {
    codigo: "marketing",
    nombre: "Agente Marketing",
    descripcion: "Propone publicaciones y promociones territoriales según lo que se mueve.",
    ambito: "usuario",
    disponible: false,
    orden: 5,
  },
  {
    codigo: "crm",
    nombre: "Agente CRM",
    descripcion: "Mantiene el seguimiento de clientes, recompras y contactos dormidos.",
    ambito: "usuario",
    disponible: false,
    orden: 6,
  },
  {
    codigo: "financiero",
    nombre: "Agente Financiero",
    descripcion: "Vigila márgenes, cobros y flujo. Nunca mueve dinero por su cuenta.",
    ambito: "usuario",
    disponible: false,
    orden: 7,
  },
  {
    codigo: "inventario",
    nombre: "Agente Inventario y Compras",
    descripcion: "Anticipa quiebres de stock y arma la lista de reposición.",
    ambito: "usuario",
    disponible: false,
    orden: 8,
  },
  {
    codigo: "proveedores",
    nombre: "Agente Proveedores",
    descripcion: "Compara proveedores por precio, plazo y cumplimiento histórico.",
    ambito: "usuario",
    disponible: false,
    orden: 9,
  },
  {
    codigo: "administrador",
    nombre: "Agente Administrador",
    descripcion: "Coordina a los demás agentes y te reporta en un solo lugar.",
    ambito: "usuario",
    disponible: false,
    orden: 10,
  },
  {
    codigo: "moderador",
    nombre: "Agente Moderador",
    descripcion: "Revisa publicaciones y contenido denunciado.",
    ambito: "administracion",
    disponible: false,
    orden: 11,
  },
  {
    codigo: "antifraude",
    nombre: "Agente Antifraude",
    descripcion: "Detecta patrones anómalos en perfiles y operaciones.",
    ambito: "administracion",
    disponible: false,
    orden: 12,
  },
  {
    codigo: "soporte",
    nombre: "Agente Soporte",
    descripcion: "Atiende consultas de usuarios y arma el caso para el equipo humano.",
    ambito: "administracion",
    disponible: false,
    orden: 13,
  },
  {
    codigo: "verificacion",
    nombre: "Agente Verificación",
    descripcion: "Prepara las verificaciones de identidad y de información comercial.",
    ambito: "administracion",
    disponible: false,
    orden: 14,
  },
  {
    codigo: "territorial",
    nombre: "Agente Territorial",
    descripcion: "Vigila cobertura, huecos de oferta y activación de comunas.",
    ambito: "administracion",
    disponible: false,
    orden: 15,
  },
  {
    codigo: "operaciones",
    nombre: "Agente Operaciones",
    descripcion: "Sigue las operaciones atascadas y las que no se califican.",
    ambito: "administracion",
    disponible: false,
    orden: 16,
  },
  {
    codigo: "analitica",
    nombre: "Agente Analítica",
    descripcion: "Interpreta qué está pasando en el territorio, no solo qué se midió.",
    ambito: "administracion",
    disponible: false,
    orden: 17,
  },
  {
    codigo: "administrador-central",
    nombre: "Agente Administrador Central",
    descripcion: "Coordina a los agentes administrativos y escala lo que requiere decisión humana.",
    ambito: "administracion",
    disponible: false,
    orden: 18,
  },
];
