/**
 * Taxonomía de Conecta · fuente de verdad (estado: PROPUESTA, la valida Álvaro).
 *
 * Rubro → Subgrupo → Ítem (servicio o producto), más el oficio como otra vía
 * de entrada. Es la referencia 2x3 adaptada (C06): se separan salud, estética y
 * experiencias en vez de «Bienestar»; «Artesanía» se reparte según lo que se
 * hace; y se agregan productos y abastecimiento a negocios, que 2x3 no tiene.
 *
 * Cómo se escribe un ítem o un oficio:
 *   "Nombre | sinónimo, sinónimo | +otro-subgrupo +otro-mas"
 * Un ítem se escribe UNA sola vez, bajo su subgrupo principal. Si también debe
 * encontrarse desde otro, se agrega con «+slug»: es el mismo ítem (C02).
 *
 * Los `slug` de los subgrupos no se cambian: los perfiles existentes los usan.
 * Después de editar: `npm run taxonomia:exportar` y `npm test`.
 */

import { slugificar } from "../../src/lib/utils";

export type TipoCategoria = "servicio" | "producto" | "ambos";

export type RubroSemilla = {
  slug: string;
  nombre: string;
  icono: string;
  ejemplos: string;
  sinonimos: string[];
};

type SubgrupoEscrito = {
  slug: string;
  nombre: string;
  rubro: string;
  /** Otros rubros desde donde se descubre el mismo subgrupo. */
  tambienEn?: string[];
  ejemplos: string;
  sinonimos: string[];
  oficios?: string[];
  servicios?: string[];
  productos?: string[];
};

export const RUBROS: RubroSemilla[] = [
  {
    slug: "rubro-hogar",
    nombre: "Hogar y oficina",
    icono: "🏠",
    ejemplos: "Gásfiter, electricista, pintura, cerrajería, aseo, jardín",
    sinonimos: ["casa", "hogar", "oficina", "reparacion", "arreglo"],
  },
  {
    slug: "rubro-vehiculos",
    nombre: "Automotriz",
    icono: "🚗",
    ejemplos: "Mecánica, repuestos, neumáticos, lavado de autos",
    sinonimos: ["auto", "vehiculo", "automotriz", "camioneta", "moto"],
  },
  {
    slug: "rubro-salud",
    nombre: "Salud",
    icono: "🩺",
    ejemplos: "Kinesiología, psicología, nutrición, dentista, cuidado de adultos mayores",
    sinonimos: ["salud"],
  },
  {
    slug: "rubro-belleza",
    nombre: "Belleza y cuidado personal",
    icono: "💇",
    ejemplos: "Peluquería, barbería, manicure, masajes",
    sinonimos: ["belleza", "cuidado personal"],
  },
  {
    slug: "rubro-experiencias",
    nombre: "Experiencias y tiempo libre",
    icono: "🎈",
    ejemplos: "Paseos, turismo, talleres, tarot",
    sinonimos: ["experiencia", "tiempo libre", "panorama"],
  },
  {
    slug: "rubro-mascotas",
    nombre: "Mascotas",
    icono: "🐾",
    ejemplos: "Veterinario, peluquería canina, paseo de perros, alimento",
    sinonimos: ["mascota", "perro", "gato"],
  },
  {
    slug: "rubro-clases",
    nombre: "Clases y capacitación",
    icono: "📚",
    ejemplos: "Clases particulares, idiomas, música, deporte, cursos para empresas",
    sinonimos: ["clases", "cursos", "aprender"],
  },
  {
    slug: "rubro-eventos",
    nombre: "Eventos y celebraciones",
    icono: "🎉",
    ejemplos: "Banquetería, tortas, decoración, música, fotografía",
    sinonimos: ["evento", "fiesta", "celebracion"],
  },
  {
    slug: "rubro-profesionales",
    nombre: "Empresa y legal",
    icono: "⚖️",
    ejemplos: "Abogado, contador, asesoría financiera, consultoría",
    sinonimos: ["asesoria", "asesor", "servicios profesionales", "servicios para empresas"],
  },
  {
    slug: "rubro-creativo",
    nombre: "Digital y creativo",
    icono: "🎨",
    ejemplos: "Diseño de logos, redes sociales, fotografía, video, páginas web",
    sinonimos: ["creativo", "digital"],
  },
  {
    slug: "rubro-tecnologia",
    nombre: "Soporte técnico",
    icono: "💻",
    ejemplos: "Computadores, celulares, wifi, electrodomésticos, cámaras",
    sinonimos: ["tecnologia", "soporte tecnico", "computacion"],
  },
  {
    slug: "rubro-transporte",
    nombre: "Transporte y fletes",
    icono: "🚚",
    ejemplos: "Fletes, mudanzas, transporte de personas",
    sinonimos: ["transporte"],
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
    nombre: "Tiendas y productos",
    icono: "🛍️",
    ejemplos: "Ferretería, ropa, muebles, plantas, regalos",
    sinonimos: ["tienda", "comercio", "productos"],
  },
  {
    slug: "rubro-abastecimiento",
    nombre: "Abastecimiento para negocios",
    icono: "📦",
    ejemplos: "Insumos, envases, equipamiento y productos por mayor",
    sinonimos: ["abastecimiento", "por mayor", "mayorista", "insumos para negocios"],
  },
];

const SUBGRUPOS_ESCRITOS: SubgrupoEscrito[] = [
  /* ── Hogar y oficina ─────────────────────────────────────────────────── */
  {
    slug: "gasfiteria",
    nombre: "Gasfitería",
    rubro: "rubro-hogar",
    ejemplos: "Fugas de agua, WC, cañerías, instalación de calefont",
    sinonimos: ["gasfiteria", "plomeria", "cañeria", "filtracion", "wc"],
    oficios: ["Gásfiter | gasfiter, gasfíter, plomero, plomera"],
    servicios: [
      "Reparación de fugas de agua | fuga de agua, deteccion de fugas, filtraciones",
      "Reparación de WC y llaves | llave que gotea, estanque, sanitario",
      "Destape de cañerías | alcantarillado, desague tapado, destape",
      "Instalación de calefont | instalar calefont, instalar calefon | +climatizacion",
      "Cambio de cañerías | cambio de tuberias",
    ],
  },
  {
    slug: "electricidad",
    nombre: "Electricidad",
    rubro: "rubro-hogar",
    ejemplos: "Enchufes, tableros, cortes de luz, certificación",
    sinonimos: ["electricidad", "corto circuito", "automatico", "luz"],
    oficios: ["Electricista | electricista certificado, electrico sec"],
    servicios: [
      "Reparación de enchufes e interruptores | enchufe, interruptor",
      "Instalación de tablero eléctrico | tablero electrico",
      "Certificación eléctrica TE1 | certificado sec, te1",
      "Instalación de lámparas | lampara, foco, iluminacion",
      "Reparación de cortes de luz | corte de luz, cortocircuito",
      "Paneles solares | panel solar, energia solar, instalacion de paneles solares",
    ],
  },
  {
    slug: "climatizacion",
    nombre: "Climatización y calefacción",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-tecnologia"],
    ejemplos: "Calefont, aire acondicionado, estufas, termos",
    sinonimos: ["calefaccion", "climatizacion", "estufa", "termo"],
    oficios: ["Técnico en climatización | tecnico de calefones, tecnico en calefones, tecnico de calefont"],
    servicios: [
      "Reparación de calefont | calefont, calefon, calefones, mantencion de calefont",
      "Mantención de aire acondicionado | aire acondicionado, split | +tecnologia",
      "Instalación de aire acondicionado | instalar aire acondicionado, instalar split",
      "Mantención de calefacción central | caldera, radiadores",
      "Mantención de estufas | estufa a parafina, estufa a gas, pellet",
    ],
  },
  {
    slug: "cerrajeria",
    nombre: "Cerrajería",
    rubro: "rubro-hogar",
    ejemplos: "Apertura de puertas, cambio de chapa, copias de llaves",
    sinonimos: ["cerrajeria", "candado", "cerradura"],
    oficios: ["Cerrajero | cerrajera"],
    servicios: [
      "Apertura de puertas | puerta cerrada, abrir puerta",
      "Cambio de chapa | chapa, cambio de cerradura",
      "Copia de llaves | llave, duplicado de llaves",
      "Cerrajería automotriz | llave de auto, chip de auto",
    ],
  },
  {
    slug: "carpinteria",
    nombre: "Carpintería y muebles",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Muebles a medida, closets, reparación y restauración",
    sinonimos: ["carpinteria", "madera"],
    oficios: ["Carpintero | carpintera, mueblista", "Tapicero | tapicera"],
    servicios: [
      "Muebles a medida | mueble a medida, cocina a medida, closet a medida, closet | +muebles-decoracion",
      "Restauración de muebles | restaurar mueble, barnizado",
      "Tapicería de muebles | tapiceria, tapizado",
      "Armado de muebles | armar mueble",
      "Puertas y ventanas de madera | puerta de madera, ventana de madera",
    ],
  },
  {
    slug: "pintura",
    nombre: "Pintura y terminaciones",
    rubro: "rubro-hogar",
    ejemplos: "Pintura interior y exterior, estuco, empaste",
    sinonimos: ["pintar", "terminaciones"],
    oficios: ["Pintor | pintora, pintor de casas"],
    servicios: [
      "Pintura interior | pintar departamento, pintar living, pintar pieza",
      "Pintura exterior | pintar fachada, pintar casa",
      "Estuco y empaste | estuco, empastar, yeso",
      "Papel mural | instalar papel mural",
    ],
  },
  {
    slug: "construccion",
    nombre: "Construcción y remodelación",
    rubro: "rubro-hogar",
    ejemplos: "Ampliaciones, remodelaciones, pisos, techos, cerámica",
    sinonimos: ["construccion", "obra", "remodelacion"],
    oficios: ["Maestro constructor | maestro, albañil, constructor", "Ceramista de pisos | instalador de pisos"],
    servicios: [
      "Ampliaciones | ampliacion, segundo piso",
      "Remodelación de baños y cocinas | remodelar cocina, remodelar baño",
      "Instalación de pisos y cerámica | piso, piso flotante, ceramica, porcelanato",
      "Reparación de techos | techo, techumbre, gotera",
      "Quinchos y terrazas | quincho, terraza, deck",
    ],
  },
  {
    slug: "soldadura",
    nombre: "Soldadura y estructuras metálicas",
    rubro: "rubro-hogar",
    ejemplos: "Rejas, portones, protecciones, estructuras",
    sinonimos: ["soldadura", "metalurgia"],
    oficios: ["Soldador | soldadora, herrero"],
    servicios: [
      "Rejas y protecciones | reja, protecciones",
      "Portones | porton, porton metalico",
      "Estructuras metálicas | estructura metalica, galpon",
      "Soldadura a domicilio | soldar",
    ],
  },
  {
    slug: "arquitectura",
    nombre: "Arquitectura y planos",
    rubro: "rubro-profesionales",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Planos, regularización, permisos de edificación",
    sinonimos: ["arquitectura"],
    oficios: ["Arquitecto | arquitecta", "Ingeniero civil | calculista, ingeniero estructural"],
    servicios: [
      "Planos de arquitectura | planos",
      "Regularización de propiedades | regularizacion, ley del mono",
      "Permisos de edificación | permiso de edificacion",
      "Cálculo estructural | calculo estructural",
      "Diseño de interiores | interiorismo, diseño interior",
    ],
  },
  {
    slug: "aseo",
    nombre: "Aseo y limpieza",
    rubro: "rubro-hogar",
    ejemplos: "Aseo de casas y oficinas, alfombras, sanitización",
    sinonimos: ["limpieza", "aseo"],
    oficios: ["Asesora del hogar | nana, aseadora, asesor del hogar"],
    servicios: [
      "Aseo de casas | aseo domiciliario, limpieza de casa",
      "Aseo de oficinas | limpieza de oficinas",
      "Aseo profundo y post obra | aseo profundo, post obra",
      "Lavado de alfombras y tapices | lavado de alfombras, lavado de sillones",
      "Limpieza de vidrios | lavado de vidrios",
      "Sanitización | desinfeccion",
    ],
  },
  {
    slug: "control-plagas",
    nombre: "Control de plagas",
    rubro: "rubro-hogar",
    ejemplos: "Fumigación, ratones, termitas",
    sinonimos: ["plagas"],
    servicios: [
      "Fumigación | fumigar, cucarachas, hormigas",
      "Desratización | ratones, ratas",
      "Control de termitas | termitas",
      "Control de palomas y avispas | palomas, avispas, chaqueta amarilla",
    ],
  },
  {
    slug: "jardineria",
    nombre: "Jardinería y piscinas",
    rubro: "rubro-hogar",
    ejemplos: "Mantención de jardines, poda, riego, limpieza de piscinas",
    sinonimos: ["jardin", "jardineria", "piscina"],
    oficios: ["Jardinero | jardinera", "Paisajista"],
    servicios: [
      "Mantención de jardines | cortar pasto, pasto",
      "Poda de árboles | poda",
      "Riego automático | riego, sistema de riego",
      "Mantención de piscinas | limpieza de piscinas",
      "Diseño de jardines | paisajismo",
    ],
  },
  {
    slug: "costura",
    nombre: "Costura y arreglos de ropa",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Bastas, cierres, ajustes, ropa a medida",
    sinonimos: ["costura"],
    oficios: ["Costurera | modista, costurero", "Sastre"],
    servicios: [
      "Arreglos de ropa | arreglo de ropa, basta, cambio de cierre, ajuste de ropa",
      "Ropa a medida | vestido a medida, traje a medida",
      "Confección de cortinas | cortinas",
    ],
  },
  {
    slug: "escombros",
    nombre: "Demolición y retiro de escombros",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-transporte"],
    ejemplos: "Retiro de escombros, demolición, limpieza de terrenos",
    sinonimos: ["escombros", "demolicion"],
    servicios: [
      "Retiro de escombros | escombro",
      "Demoliciones | demoler",
      "Limpieza de terrenos | desmalezado",
      "Retiro de cachureos | retiro de muebles, botar muebles",
    ],
  },
  {
    slug: "propiedades",
    nombre: "Propiedades",
    rubro: "rubro-hogar",
    tambienEn: ["rubro-profesionales"],
    ejemplos: "Corretaje, tasación, administración de edificios",
    sinonimos: ["propiedades", "inmobiliaria"],
    oficios: ["Corredor de propiedades | corredora de propiedades", "Tasador"],
    servicios: [
      "Corretaje de propiedades | vender casa, arrendar departamento",
      "Tasación de propiedades | tasacion",
      "Administración de edificios | administracion de condominios",
    ],
  },

  /* ── Automotriz ──────────────────────────────────────────────────────── */
  {
    slug: "mecanica",
    nombre: "Mecánica automotriz",
    rubro: "rubro-vehiculos",
    ejemplos: "Mantención, frenos, embrague, revisión técnica",
    sinonimos: ["mecanica", "taller", "taller mecanico"],
    oficios: ["Mecánico | mecanica a domicilio, mecanico automotriz"],
    servicios: [
      "Mantención por kilometraje | mantencion de auto, cambio de aceite",
      "Reparación de frenos | frenos, balatas",
      "Reparación de embrague | embrague",
      "Preparación para revisión técnica | revision tecnica",
      "Revisión precompra | revision de auto usado",
      "Reparación de motor y caja | motor, caja de cambios",
      "Suspensión y dirección | suspension, amortiguadores",
    ],
  },
  {
    slug: "repuestos-automotrices",
    nombre: "Repuestos automotrices",
    rubro: "rubro-vehiculos",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Filtros, frenos, baterías, lubricantes, motor, carrocería",
    sinonimos: ["repuesto", "autopartes", "repuestos de auto"],
    productos: [
      "Filtros de aceite, aire y combustible | filtro de aceite, filtro de aire, filtro de combustible, filtro de polen",
      "Pastillas y discos de freno | pastillas de freno, pastilla de freno, disco de freno, liquido de frenos",
      "Baterías de auto | bateria de auto, bateria",
      "Lubricantes y aceite de motor | lubricante, aceite de motor",
      "Repuestos de motor | correa de distribucion, bujia, empaquetadura",
      "Repuestos de suspensión y dirección | amortiguador, rotula, bandeja",
      "Repuestos de embrague y transmisión | kit de embrague, homocinetica",
      "Repuestos eléctricos de auto | alternador, motor de partida, sensor",
      "Focos y ampolletas de auto | foco de auto, ampolleta de auto, faro",
      "Repuestos de carrocería | parachoques, espejo de auto, tapabarro",
      "Accesorios para autos | alfombra de auto, cubre asientos, portaequipaje",
    ],
  },
  {
    slug: "neumaticos",
    nombre: "Neumáticos y vulcanización",
    rubro: "rubro-vehiculos",
    ejemplos: "Venta de neumáticos, parches, alineación y balanceo",
    sinonimos: ["vulca", "llantas"],
    oficios: ["Vulcanizador | vulcanizadora"],
    servicios: [
      "Vulcanización | vulcanizacion, parche de neumatico, pinchazo",
      "Alineación y balanceo | alineacion, balanceo",
    ],
    productos: ["Neumáticos | neumatico"],
  },
  {
    slug: "electricidad-automotriz",
    nombre: "Electricidad automotriz",
    rubro: "rubro-vehiculos",
    ejemplos: "Alternador, partida, luces, scanner",
    sinonimos: ["electricidad automotriz"],
    oficios: ["Eléctrico automotriz | electromecanico, electrico de autos"],
    servicios: [
      "Scanner automotriz | scanner, escaner de auto",
      "Reparación de alternador y partida | reparar alternador",
      "Alarmas y radios de auto | alarma de auto, radio de auto",
      "Aire acondicionado automotriz | aire acondicionado de auto, carga de gas auto",
    ],
  },
  {
    slug: "desabolladura",
    nombre: "Desabolladura, pintura y vidrios",
    rubro: "rubro-vehiculos",
    ejemplos: "Choques, pintura de autos, parabrisas",
    sinonimos: ["desabolladura"],
    oficios: ["Desabollador | pintor de autos"],
    servicios: [
      "Desabolladura y pintura de autos | pintar auto, choque, abolladura",
      "Cambio de parabrisas | parabrisas, vidrio de auto",
    ],
  },
  {
    slug: "lavado-autos",
    nombre: "Lavado y estética automotriz",
    rubro: "rubro-vehiculos",
    ejemplos: "Lavado, pulido, limpieza de tapiz",
    sinonimos: ["car wash"],
    servicios: [
      "Lavado de autos | lavar auto, lavado de vehiculos",
      "Pulido y encerado | pulido, encerado",
      "Limpieza de tapiz de auto | tapiz de auto",
    ],
  },
  {
    slug: "motos-bicicletas",
    nombre: "Motos y bicicletas",
    rubro: "rubro-vehiculos",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Reparación de motos y bicicletas, repuestos y accesorios",
    sinonimos: ["motos", "bicicleta", "ciclismo"],
    oficios: ["Mecánico de bicicletas", "Mecánico de motos"],
    servicios: ["Reparación de bicicletas | arreglar bicicleta", "Reparación de motos | arreglar moto"],
    productos: ["Repuestos de moto | repuesto de moto", "Bicicletas y accesorios | casco de bicicleta, accesorios de bicicleta"],
  },

  /* ── Salud ───────────────────────────────────────────────────────────── */
  {
    slug: "salud-general",
    nombre: "Medicina y salud general",
    rubro: "rubro-salud",
    ejemplos: "Médico a domicilio, pediatría, matrona, exámenes",
    sinonimos: ["medicina", "consulta medica"],
    oficios: ["Médico | doctor, doctora, medica", "Pediatra", "Matrona | matron"],
    servicios: [
      "Médico a domicilio | doctor a domicilio",
      "Pediatría | niño sano",
      "Salud de la mujer | ginecologia, control matrona",
      "Toma de exámenes a domicilio | examen de sangre",
    ],
  },
  {
    slug: "kinesiologia",
    nombre: "Kinesiología y rehabilitación",
    rubro: "rubro-salud",
    ejemplos: "Lesiones, rehabilitación, atención a domicilio",
    sinonimos: ["kinesiologia", "rehabilitacion"],
    oficios: ["Kinesiólogo | kinesiologa, kine", "Terapeuta ocupacional"],
    servicios: [
      "Kinesiología a domicilio | kine a domicilio",
      "Rehabilitación de lesiones | lesion",
      "Terapia ocupacional",
    ],
  },
  {
    slug: "psicologia",
    nombre: "Psicología y terapia",
    rubro: "rubro-salud",
    ejemplos: "Terapia individual, de pareja o familiar",
    sinonimos: ["psicologia", "terapia"],
    oficios: ["Psicólogo | psicologa, terapeuta", "Psicopedagogo | psicopedagoga", "Fonoaudiólogo | fonoaudiologa"],
    servicios: [
      "Terapia psicológica individual | terapia individual",
      "Terapia de pareja | terapia de parejas",
      "Psicología infantil | psicologo infantil",
      "Psicopedagogía | apoyo psicopedagogico",
      "Fonoaudiología",
    ],
  },
  {
    slug: "nutricion",
    nombre: "Nutrición",
    rubro: "rubro-salud",
    ejemplos: "Planes de alimentación, control de peso",
    sinonimos: ["nutricion", "dieta"],
    oficios: ["Nutricionista"],
    servicios: ["Plan de alimentación | plan nutricional", "Nutrición deportiva"],
  },
  {
    slug: "odontologia",
    nombre: "Odontología",
    rubro: "rubro-salud",
    ejemplos: "Limpieza dental, tapaduras, ortodoncia",
    sinonimos: ["dental", "odontologia"],
    oficios: ["Dentista | odontologo, odontologa"],
    servicios: [
      "Limpieza dental | destartraje",
      "Tapaduras y tratamiento de conducto | tapadura, caries, muela",
      "Ortodoncia | frenillos",
      "Prótesis e implantes dentales | implante dental",
    ],
  },
  {
    slug: "cuidados",
    nombre: "Enfermería y cuidado de personas",
    rubro: "rubro-salud",
    ejemplos: "Cuidado de adultos mayores, curaciones, inyecciones",
    sinonimos: ["enfermeria"],
    oficios: ["Enfermero | enfermera, tens", "Cuidador | cuidadora", "Niñera | babysitter"],
    servicios: [
      "Cuidado de adultos mayores | adulto mayor, cuidado de ancianos",
      "Curaciones e inyecciones | curaciones, inyeccion",
      "Cuidado de niños | cuidar niños",
      "Podología | podologo, podologa, cuidado de pies",
    ],
  },
  {
    slug: "terapias-complementarias",
    nombre: "Terapias complementarias",
    rubro: "rubro-salud",
    ejemplos: "Reiki, flores de Bach, acupuntura",
    sinonimos: ["terapia alternativa"],
    servicios: ["Reiki", "Acupuntura", "Flores de Bach"],
  },

  /* ── Belleza y cuidado personal ──────────────────────────────────────── */
  {
    slug: "belleza",
    nombre: "Peluquería y barbería",
    rubro: "rubro-belleza",
    tambienEn: ["rubro-eventos"],
    ejemplos: "Corte, color, peinados, barba",
    sinonimos: ["peluqueria", "barberia"],
    oficios: ["Peluquero | peluquera, estilista", "Barbero | barbera"],
    servicios: [
      "Corte de pelo | cortar pelo",
      "Color y mechas | tintura, mechas, balayage",
      "Peinados | peinado de novia",
      "Corte de barba | afeitado",
    ],
  },
  {
    slug: "estetica",
    nombre: "Manicure y estética",
    rubro: "rubro-belleza",
    tambienEn: ["rubro-eventos"],
    ejemplos: "Manicure, pestañas, depilación, maquillaje",
    sinonimos: ["estetica"],
    oficios: ["Manicurista", "Maquillador | maquilladora", "Cosmetóloga | cosmetologo"],
    servicios: [
      "Manicure y pedicure | manicure, pedicure, uñas",
      "Pestañas y cejas | pestañas, cejas",
      "Depilación | depilacion laser, cera",
      "Maquillaje | maquillaje social, maquillaje de novia",
      "Limpieza facial | tratamiento facial",
    ],
  },
  {
    slug: "masajes",
    nombre: "Masajes",
    rubro: "rubro-belleza",
    tambienEn: ["rubro-salud"],
    ejemplos: "Masaje descontracturante, relajación",
    sinonimos: ["masaje"],
    oficios: ["Masajista"],
    servicios: ["Masaje descontracturante | descontracturante", "Masaje de relajación", "Drenaje linfático"],
  },
  {
    slug: "tatuajes",
    nombre: "Tatuajes y piercing",
    rubro: "rubro-belleza",
    ejemplos: "Tatuajes, piercing, micropigmentación",
    sinonimos: ["tattoo"],
    oficios: ["Tatuador | tatuadora"],
    servicios: ["Tatuajes | tatuaje", "Piercing", "Micropigmentación | microblading"],
  },

  /* ── Experiencias y tiempo libre ─────────────────────────────────────── */
  {
    slug: "turismo",
    nombre: "Turismo y paseos",
    rubro: "rubro-experiencias",
    ejemplos: "Tours, trekking, cabalgatas, alojamiento",
    sinonimos: ["turismo", "paseo", "tour"],
    oficios: ["Guía turístico | guia de turismo"],
    servicios: [
      "Tours y paseos guiados | tour guiado",
      "Trekking y montaña | montañismo",
      "Cabalgatas | paseo a caballo",
      "Alojamiento y cabañas | cabaña, hostal",
    ],
  },
  {
    slug: "actividades",
    nombre: "Talleres y actividades",
    rubro: "rubro-experiencias",
    tambienEn: ["rubro-clases"],
    ejemplos: "Talleres de cocina, cerámica, degustaciones, juegos",
    sinonimos: ["taller recreativo", "actividad recreativa"],
    servicios: ["Taller de cocina | clase de cocina", "Taller de cerámica | taller de greda", "Cata y degustación | cata de vinos"],
  },
  {
    slug: "tarot",
    nombre: "Tarot y astrología",
    rubro: "rubro-experiencias",
    ejemplos: "Lectura de tarot, carta astral",
    sinonimos: ["tarot", "astrologia"],
    servicios: ["Lectura de tarot | tarotista", "Carta astral"],
  },

  /* ── Mascotas ────────────────────────────────────────────────────────── */
  {
    slug: "veterinaria",
    nombre: "Veterinaria",
    rubro: "rubro-mascotas",
    ejemplos: "Consultas, vacunas, microchip, atención a domicilio",
    sinonimos: ["veterinaria", "clinica veterinaria"],
    oficios: ["Veterinario | veterinario a domicilio"],
    servicios: [
      "Consulta veterinaria",
      "Vacunas y microchip | microchip, vacuna, vacuna de perro",
      "Esterilización de mascotas | esterilizar perro, esterilizar gato",
    ],
  },
  {
    slug: "peluqueria-mascotas",
    nombre: "Peluquería de mascotas",
    rubro: "rubro-mascotas",
    ejemplos: "Baño y corte para perros y gatos",
    sinonimos: ["peluqueria canina", "peluqueria felina"],
    oficios: ["Peluquero canino | groomer"],
    servicios: ["Baño y corte de mascotas | baño de perro"],
  },
  {
    slug: "cuidado-mascotas",
    nombre: "Paseo y cuidado de mascotas",
    rubro: "rubro-mascotas",
    ejemplos: "Paseo de perros, hotel, adiestramiento",
    sinonimos: ["cuidado de mascotas"],
    oficios: ["Paseador de perros | paseador", "Adiestrador canino | adiestrador"],
    servicios: ["Paseo de perros", "Hotel de mascotas | guarderia de mascotas", "Adiestramiento canino | adiestramiento"],
  },
  {
    slug: "productos-mascotas",
    nombre: "Alimento y accesorios para mascotas",
    rubro: "rubro-mascotas",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Alimento, arena, juguetes, camas",
    sinonimos: ["pet shop", "tienda de mascotas"],
    productos: [
      "Alimento para perros y gatos | alimento para perros, comida de gato",
      "Arena sanitaria | arena de gato",
      "Accesorios para mascotas | correa, cama de perro, juguete de perro",
    ],
  },

  /* ── Clases y capacitación ───────────────────────────────────────────── */
  {
    slug: "clases",
    nombre: "Clases particulares",
    rubro: "rubro-clases",
    ejemplos: "Matemática, lenguaje, preparación de pruebas",
    sinonimos: ["clases particulares", "reforzamiento", "tutor"],
    oficios: ["Profesor particular | profesor, profesora"],
    servicios: [
      "Clases de matemática | matematica",
      "Clases de lenguaje | comprension lectora",
      "Clases de ciencias | fisica, quimica, biologia",
      "Preparación PAES | paes, preuniversitario",
      "Apoyo escolar | ayuda con tareas",
    ],
  },
  {
    slug: "idiomas",
    nombre: "Idiomas",
    rubro: "rubro-clases",
    ejemplos: "Inglés, portugués, español para extranjeros",
    sinonimos: ["idioma"],
    servicios: ["Clases de inglés | ingles", "Clases de portugués | portugues", "Español para extranjeros", "Clases de francés | frances"],
  },
  {
    slug: "musica-arte",
    nombre: "Música y arte",
    rubro: "rubro-clases",
    ejemplos: "Guitarra, piano, canto, dibujo, pintura artística",
    sinonimos: ["clases de musica", "clases de arte"],
    oficios: ["Profesor de música | profesora de musica"],
    servicios: ["Clases de guitarra | guitarra", "Clases de piano | piano", "Clases de canto | canto", "Clases de dibujo y pintura | dibujo"],
  },
  {
    slug: "baile",
    nombre: "Baile",
    rubro: "rubro-clases",
    ejemplos: "Salsa, cueca, danza, urbano",
    sinonimos: ["danza", "bailar"],
    servicios: ["Clases de salsa y bachata | salsa, bachata", "Clases de cueca | cueca", "Danza para niños | ballet"],
  },
  {
    slug: "deporte",
    nombre: "Deporte y actividad física",
    rubro: "rubro-clases",
    ejemplos: "Personal trainer, yoga, natación, tenis",
    sinonimos: ["deporte", "gimnasio"],
    oficios: ["Entrenador personal | personal trainer, entrenador", "Instructor de yoga | profesora de yoga"],
    servicios: ["Entrenamiento personal", "Clases de yoga y pilates | yoga, pilates", "Clases de natación | natacion", "Clases de tenis y pádel | tenis, padel"],
  },
  {
    slug: "conduccion",
    nombre: "Clases de conducir",
    rubro: "rubro-clases",
    tambienEn: ["rubro-vehiculos"],
    ejemplos: "Licencia clase B y profesional",
    sinonimos: ["escuela de conductores", "aprender a manejar"],
    servicios: ["Clases de conducir clase B | clases de manejo", "Licencia profesional | clase a"],
  },
  {
    slug: "capacitacion",
    nombre: "Cursos y capacitación para empresas",
    rubro: "rubro-clases",
    tambienEn: ["rubro-profesionales"],
    ejemplos: "Excel, liderazgo, atención al cliente, cursos SENCE",
    sinonimos: ["capacitacion", "sence"],
    oficios: ["Relator | relatora, capacitador"],
    servicios: ["Curso de Excel | excel", "Liderazgo y equipos | liderazgo", "Prevención de riesgos | prevencionista", "Curso de primeros auxilios | primeros auxilios"],
  },

  /* ── Eventos y celebraciones ─────────────────────────────────────────── */
  {
    slug: "eventos",
    nombre: "Banquetería y catering",
    rubro: "rubro-eventos",
    tambienEn: ["rubro-alimentos"],
    ejemplos: "Cócteles, matrimonios, cumpleaños, garzones",
    sinonimos: ["catering", "banqueteria"],
    oficios: ["Banquetero | banquetera, chef a domicilio"],
    servicios: ["Banquetería para matrimonios | matrimonio", "Cóctel para empresas | coctel", "Coffee break", "Parrilla a domicilio | asador"],
  },
  {
    slug: "decoracion-eventos",
    nombre: "Decoración y arriendo para eventos",
    rubro: "rubro-eventos",
    ejemplos: "Globos, toldos, mesas y sillas, juegos inflables",
    sinonimos: ["decoracion de eventos"],
    servicios: ["Decoración con globos | globos", "Arriendo de toldos, mesas y sillas | toldos, mesas y sillas", "Arriendo de juegos inflables | inflables", "Arreglos florales | flores, florista"],
  },
  {
    slug: "animacion",
    nombre: "Música y animación",
    rubro: "rubro-eventos",
    ejemplos: "DJ, músicos, animador infantil, amplificación",
    sinonimos: ["animacion", "show"],
    oficios: ["DJ", "Animador | animadora infantil, payaso", "Músico | musicos, banda"],
    servicios: ["DJ para fiestas", "Música en vivo | grupo musical", "Animación infantil | cumpleaños infantil", "Arriendo de amplificación | amplificacion, parlantes"],
  },
  {
    slug: "personal-eventos",
    nombre: "Personal y seguridad para eventos",
    rubro: "rubro-eventos",
    ejemplos: "Garzones, barman, guardias",
    sinonimos: ["personal para eventos"],
    oficios: ["Garzón | garzona", "Barman | bartender, bartman", "Guardia de seguridad | guardia"],
    servicios: ["Garzones para eventos", "Barman a domicilio", "Guardias para eventos | seguridad para eventos"],
  },

  /* ── Empresa y legal ─────────────────────────────────────────────────── */
  {
    slug: "asesoria-legal",
    nombre: "Asesoría legal",
    rubro: "rubro-profesionales",
    ejemplos: "Contratos, temas laborales, herencias, arriendos",
    sinonimos: ["legal", "demanda", "juicio"],
    oficios: ["Abogado | abogada"],
    servicios: [
      "Asesoría en contratos | contrato, revisar contrato, revisar un contrato",
      "Asesoría laboral | despido, finiquito, laboral",
      "Herencias y posesión efectiva | herencia, posesion efectiva",
      "Derecho de familia | divorcio, pension de alimentos",
      "Asesoría en arriendos | desalojo, arriendo",
      "Constitución de sociedades | crear empresa, spa",
      "Defensa del consumidor | sernac",
    ],
  },
  {
    slug: "contabilidad",
    nombre: "Contabilidad y tributaria",
    rubro: "rubro-profesionales",
    ejemplos: "Impuestos, inicio de actividades, remuneraciones",
    sinonimos: ["contabilidad", "sii"],
    oficios: ["Contador | contadora, contador auditor"],
    servicios: [
      "Contabilidad mensual | contabilidad para pymes",
      "Declaración de impuestos | impuestos, iva, operacion renta, boletas",
      "Inicio de actividades | formalizar negocio",
      "Remuneraciones | liquidaciones de sueldo",
      "Auditoría contable | auditoria",
    ],
  },
  {
    slug: "asesoria-financiera",
    nombre: "Asesoría financiera y seguros",
    rubro: "rubro-profesionales",
    ejemplos: "Créditos, presupuesto, seguros, deudas",
    sinonimos: ["financiero", "finanzas"],
    oficios: ["Asesor financiero | asesora financiera", "Corredor de seguros | corredora de seguros"],
    servicios: ["Finanzas personales | presupuesto familiar", "Asesoría en créditos | credito, hipotecario", "Renegociación de deudas | deudas", "Seguros | seguro de auto, seguro de vida", "Postulación a fondos | capital semilla, sercotec, corfo"],
  },
  {
    slug: "consultoria",
    nombre: "Consultoría y gestión de empresas",
    rubro: "rubro-profesionales",
    ejemplos: "Plan de negocios, procesos, formalización",
    sinonimos: ["consultoria", "emprendimiento"],
    oficios: ["Consultor de empresas | consultora"],
    servicios: ["Plan de negocios", "Mejora de procesos | gestion de procesos", "Trámites y permisos municipales | patente comercial, resolucion sanitaria"],
  },
  {
    slug: "recursos-humanos",
    nombre: "Personas y selección",
    rubro: "rubro-profesionales",
    ejemplos: "Selección de personal, currículum, clima laboral",
    sinonimos: ["recursos humanos", "rrhh"],
    servicios: ["Selección de personal | reclutamiento", "Asesoría de currículum | curriculum, cv"],
  },
  {
    slug: "traduccion",
    nombre: "Traducción y redacción",
    rubro: "rubro-profesionales",
    tambienEn: ["rubro-creativo"],
    ejemplos: "Traducciones, corrección de textos, redacción",
    sinonimos: ["traduccion", "redaccion"],
    oficios: ["Traductor | traductora", "Redactor | redactora"],
    servicios: ["Traducción de documentos", "Corrección de textos", "Redacción de contenidos"],
  },

  /* ── Digital y creativo ──────────────────────────────────────────────── */
  {
    slug: "marketing",
    nombre: "Marketing y redes sociales",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-profesionales"],
    ejemplos: "Manejo de redes, publicidad digital, posicionamiento",
    sinonimos: ["marketing", "publicidad"],
    oficios: ["Community manager", "Publicista"],
    servicios: ["Manejo de redes sociales | redes sociales, instagram", "Publicidad digital | google ads, marketing digital", "Posicionamiento web | seo", "Campañas y promociones | campaña publicitaria", "Relaciones públicas y prensa | relaciones publicas"],
  },
  {
    slug: "diseno-grafico",
    nombre: "Diseño gráfico",
    rubro: "rubro-creativo",
    ejemplos: "Logos, tarjetas, menús, etiquetas",
    sinonimos: ["diseño", "grafica"],
    oficios: ["Diseñador gráfico | diseñadora grafica, diseñador", "Ilustrador | ilustradora"],
    servicios: ["Diseño de logo | logo, logotipo", "Identidad de marca | branding, imagen corporativa", "Diseño de menús y folletos | menu, folleto", "Diseño de etiquetas y envases | diseño de packaging", "Ilustración"],
  },
  {
    slug: "fotografia",
    nombre: "Fotografía",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-eventos"],
    ejemplos: "Eventos, productos, retratos",
    sinonimos: ["fotografia", "fotos"],
    oficios: ["Fotógrafo | fotografa"],
    servicios: ["Fotografía de eventos | fotos de matrimonio, fotos de cumpleaños", "Fotografía de productos | fotos de productos", "Retratos y sesiones | sesion de fotos, retrato", "Fotografía de propiedades"],
  },
  {
    slug: "audiovisual",
    nombre: "Video y producción audiovisual",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-eventos"],
    ejemplos: "Grabación, edición de video, dron, transmisión en vivo, sonido",
    sinonimos: ["audiovisual", "productora"],
    oficios: ["Realizador audiovisual | camarografo, videografo", "Editor de video", "Operador de dron | piloto de dron"],
    servicios: [
      "Video para redes sociales | video, videos, reels",
      "Grabación de eventos | grabacion, filmacion, video de matrimonio",
      "Edición de video | editar video",
      "Grabación con dron | dron, drone, tomas aereas | +fotografia",
      "Transmisión en vivo | streaming",
      "Producción de audio y podcast | podcast, sonido, locucion",
      "Animación digital | motion graphics",
    ],
  },
  {
    slug: "desarrollo-web",
    nombre: "Páginas web y aplicaciones",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-tecnologia"],
    ejemplos: "Sitios web, tiendas en línea, aplicaciones",
    sinonimos: ["desarrollo web", "software"],
    oficios: ["Desarrollador | programador, programadora"],
    servicios: ["Sitio web | pagina web", "Tienda en línea | tienda online, ecommerce", "Aplicación móvil | app, aplicacion", "Automatización y sistemas a medida | sistema a medida"],
  },
  {
    slug: "imprenta",
    nombre: "Imprenta y letreros",
    rubro: "rubro-creativo",
    tambienEn: ["rubro-abastecimiento"],
    ejemplos: "Tarjetas, pendones, letreros, adhesivos",
    sinonimos: ["imprenta", "impresion"],
    servicios: ["Impresión digital | impresion de tarjetas"],
    productos: ["Letreros y señalética | letrero, señaletica", "Pendones y gigantografías | pendon", "Adhesivos y etiquetas impresas | adhesivo", "Poleras estampadas | estampado, sublimacion"],
  },

  /* ── Soporte técnico ─────────────────────────────────────────────────── */
  {
    slug: "tecnologia",
    nombre: "Computadores, celulares y redes",
    rubro: "rubro-tecnologia",
    ejemplos: "Reparación de notebook y celular, wifi, impresoras",
    sinonimos: ["soporte informatico", "informatico"],
    oficios: ["Técnico en computación | tecnico informatico, informatico"],
    servicios: ["Reparación de computadores | computador, notebook, formatear", "Reparación de celulares | celular, pantalla de celular", "Redes y wifi | wifi, internet, redes", "Reparación de impresoras | impresora, fotocopiadora", "Respaldo y recuperación de datos | recuperar datos"],
  },
  {
    slug: "electrodomesticos",
    nombre: "Reparación de electrodomésticos",
    rubro: "rubro-tecnologia",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Lavadora, refrigerador, secadora, microondas",
    sinonimos: ["linea blanca", "reparacion de electrodomesticos"],
    oficios: ["Técnico en línea blanca | tecnico de lavadoras, tecnico de refrigeradores"],
    servicios: ["Reparación de lavadoras | lavadora, secadora", "Reparación de refrigeradores | refrigerador, freezer", "Reparación de cocinas y hornos | cocina a gas, horno electrico", "Reparación de microondas y pequeños equipos | microondas", "Reparación de televisores | televisor"],
  },
  {
    slug: "seguridad-electronica",
    nombre: "Cámaras y alarmas",
    rubro: "rubro-tecnologia",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Cámaras de seguridad, alarmas, citófonos, portones eléctricos",
    sinonimos: ["seguridad electronica"],
    oficios: ["Instalador de cámaras | instalador de alarmas"],
    servicios: ["Instalación de cámaras de seguridad | camaras de seguridad, cctv", "Instalación de alarmas | alarma, alarma de casa", "Citófonos y control de acceso | citofono", "Portones eléctricos | porton electrico, motor de porton"],
  },

  /* ── Transporte y fletes ─────────────────────────────────────────────── */
  {
    slug: "fletes",
    nombre: "Fletes y mudanzas",
    rubro: "rubro-transporte",
    ejemplos: "Mudanzas, fletes, despacho, bodegaje",
    sinonimos: ["traslado", "camioneta con chofer"],
    oficios: ["Fletero | transportista"],
    servicios: ["Fletes | flete", "Mudanzas | mudanza", "Despacho y reparto | despacho, reparto", "Bodegaje | bodega, guardamuebles", "Transporte de carga | camion"],
  },
  {
    slug: "transporte-personas",
    nombre: "Transporte de personas",
    rubro: "rubro-transporte",
    ejemplos: "Traslados al aeropuerto, transporte escolar, buses",
    sinonimos: ["transporte de personas"],
    oficios: ["Chofer | conductor"],
    servicios: ["Transfer al aeropuerto | transfer, aeropuerto", "Transporte escolar | furgon escolar", "Arriendo de buses y van | bus, van"],
  },

  /* ── Alimentos y bebidas ─────────────────────────────────────────────── */
  {
    slug: "panaderia",
    nombre: "Panadería y pastelería",
    rubro: "rubro-alimentos",
    tambienEn: ["rubro-eventos"],
    ejemplos: "Pan amasado, marraqueta, tortas, kuchenes, pasteles",
    sinonimos: ["panaderia", "pasteleria", "pan"],
    oficios: ["Panadero | panadera", "Pastelero | pastelera, repostera"],
    productos: [
      "Marraqueta | pan batido, pan frances",
      "Hallulla",
      "Pan amasado | amasado",
      "Hogaza y pan de masa madre | hogaza, masa madre",
      "Tortas | torta, torta de cumpleaños",
      "Kuchen y tartas | kuchen, tarta",
      "Pasteles y dulces | pastel, dulces, galletas",
      "Pan sin gluten | sin gluten, celiaco",
    ],
  },
  {
    slug: "abarrotes",
    nombre: "Almacén y abarrotes",
    rubro: "rubro-alimentos",
    ejemplos: "Almacén de barrio, despensa, productos básicos",
    sinonimos: ["almacen", "abarrotes", "minimarket"],
    productos: ["Abarrotes y despensa | despensa, comestibles", "Frutos secos y legumbres | frutos secos, legumbres", "Productos naturales y a granel | granel, saludable"],
  },
  {
    slug: "frutas-verduras",
    nombre: "Frutas y verduras",
    rubro: "rubro-alimentos",
    tambienEn: ["rubro-abastecimiento"],
    ejemplos: "Verdulería, cajas de fruta, productos del campo",
    sinonimos: ["verduleria", "hortalizas"],
    oficios: ["Agricultor | agricultora"],
    productos: ["Frutas | fruta", "Verduras | verdura, lechuga", "Tomates | tomate, cajas de tomates", "Papas y cebollas | papas, cebolla", "Canasta de frutas y verduras | canasta de verduras"],
  },
  {
    slug: "carnes",
    nombre: "Carnes y fiambres",
    rubro: "rubro-alimentos",
    ejemplos: "Carnicería, pollo, cecinas",
    sinonimos: ["carniceria", "carne"],
    oficios: ["Carnicero | carnicera"],
    productos: ["Carne de vacuno y cerdo | vacuno, cerdo, asado", "Pollo y pavo | pollo", "Cecinas y embutidos | cecinas, longaniza, choricillo"],
  },
  {
    slug: "pescados",
    nombre: "Pescados y mariscos",
    rubro: "rubro-alimentos",
    ejemplos: "Pescadería, mariscos frescos y congelados",
    sinonimos: ["pescaderia"],
    productos: ["Pescados y mariscos frescos | pescado, mariscos, reineta, salmon"],
  },
  {
    slug: "lacteos",
    nombre: "Huevos, quesos y lácteos",
    rubro: "rubro-alimentos",
    ejemplos: "Huevos de campo, quesos, mantequilla",
    sinonimos: ["lacteos"],
    productos: ["Huevos | huevos de campo", "Quesos | queso de cabra, queso", "Miel y mermeladas | miel, mermelada"],
  },
  {
    slug: "bebidas",
    nombre: "Bebidas y licores",
    rubro: "rubro-alimentos",
    ejemplos: "Botillería, vinos, cerveza artesanal, jugos, café",
    sinonimos: ["botilleria", "bebidas"],
    productos: ["Vinos y licores | vino, licor", "Cerveza artesanal | cerveza", "Jugos y bebidas | jugo natural", "Café y té | cafe de grano, te", "Agua purificada | bidon de agua"],
  },
  {
    slug: "comida-preparada",
    nombre: "Comida preparada",
    rubro: "rubro-alimentos",
    ejemplos: "Colaciones, empanadas, comida casera, delivery",
    sinonimos: ["comida casera", "delivery", "restaurante"],
    oficios: ["Cocinero | cocinera, chef"],
    productos: ["Colaciones | almuerzo, menu del dia", "Empanadas | empanada", "Sushi", "Pizza y sándwich | pizza, sandwich", "Comida congelada | congelados", "Comida vegetariana y vegana | vegana, vegetariana"],
  },

  /* ── Tiendas y productos ─────────────────────────────────────────────── */
  {
    slug: "ferreteria",
    nombre: "Ferretería",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Herramientas, tornillos, pinturas, gasfitería",
    sinonimos: ["ferreteria"],
    productos: ["Herramientas | herramienta, taladro", "Tornillos y fijaciones | tornillo, clavos", "Pinturas y barnices | pintura latex, barniz", "Artículos de gasfitería | fitting, tuberia pvc", "Artículos eléctricos | cable electrico, ampolleta"],
  },
  {
    slug: "textil",
    nombre: "Ropa, telas y uniformes",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-abastecimiento"],
    ejemplos: "Ropa, uniformes, telas, bordados",
    sinonimos: ["vestuario", "tienda de ropa"],
    servicios: ["Bordado corporativo | bordado"],
    productos: ["Ropa de mujer y hombre | ropa", "Ropa infantil | ropa de niño, ropa de bebe", "Uniformes | uniforme, ropa de trabajo", "Telas y lanas | telas, lana", "Zapatos y zapatillas | zapato, zapatillas"],
  },
  {
    slug: "muebles-decoracion",
    nombre: "Muebles y decoración",
    rubro: "rubro-comercio",
    ejemplos: "Muebles, colchones, cuadros, menaje",
    sinonimos: ["muebleria", "decoracion"],
    productos: ["Muebles para el hogar | mueble, muebles, mesa de comedor, sillon", "Colchones y camas | colchon", "Adornos y cuadros | cuadro, adorno", "Menaje y cocina | menaje, ollas"],
  },
  {
    slug: "electronica",
    nombre: "Electrónica y electrodomésticos",
    rubro: "rubro-comercio",
    ejemplos: "Celulares, computadores, accesorios, línea blanca nueva",
    sinonimos: ["tienda de electronica"],
    productos: ["Celulares y accesorios | funda de celular, cargador", "Computadores y accesorios | teclado, mouse", "Electrodomésticos nuevos y usados | venta de lavadoras, venta de refrigeradores"],
  },
  {
    slug: "libreria",
    nombre: "Librería, juguetes y libros",
    rubro: "rubro-comercio",
    ejemplos: "Útiles escolares, juguetes, libros",
    sinonimos: ["libreria", "jugueteria"],
    productos: ["Útiles escolares y de oficina | utiles escolares, articulos de oficina", "Juguetes | juguete", "Libros | libro"],
  },
  {
    slug: "cuidado-personal",
    nombre: "Farmacia, perfumería y cosmética",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-belleza"],
    ejemplos: "Perfumes, cosmética natural, productos de belleza",
    sinonimos: ["perfumeria", "cosmetica"],
    productos: ["Perfumes | perfume", "Cosmética natural | jabon artesanal, cremas", "Productos de peluquería | shampoo, tinturas"],
  },
  {
    slug: "artesania",
    nombre: "Regalos, joyas y hecho a mano",
    rubro: "rubro-comercio",
    ejemplos: "Hecho a mano, greda, joyería, regalos",
    sinonimos: ["artesania", "hecho a mano"],
    oficios: ["Artesano | artesana", "Joyero | joyera", "Relojero"],
    servicios: ["Reparación de joyas y relojes | relojeria, arreglo de joyas"],
    productos: ["Joyas | joyeria, aros, anillos", "Greda y cerámica | greda", "Regalos personalizados | regalo", "Tejidos y lanas artesanales | tejido a mano", "Velas y aromas | velas"],
  },
  {
    slug: "plantas",
    nombre: "Plantas y vivero",
    rubro: "rubro-comercio",
    tambienEn: ["rubro-hogar"],
    ejemplos: "Plantas, árboles, macetas, tierra de hoja",
    sinonimos: ["vivero"],
    oficios: ["Viverista"],
    productos: ["Plantas de interior y exterior | planta, plantas", "Árboles frutales | limonero, naranjo", "Macetas | macetero", "Tierra de hoja y abono | tierra de hoja, compost"],
  },

  /* ── Abastecimiento para negocios ────────────────────────────────────── */
  {
    slug: "insumos-gastronomicos",
    nombre: "Insumos para restaurantes y cocinas",
    rubro: "rubro-abastecimiento",
    tambienEn: ["rubro-alimentos"],
    ejemplos: "Harina, aceite, azúcar y levadura por mayor",
    sinonimos: ["insumos gastronomicos", "insumos para panaderia"],
    productos: ["Harina por saco | harina, saco de harina, harina panadera", "Aceite por mayor | aceite vegetal, aceite", "Azúcar y levadura por mayor | azucar, levadura", "Café e insumos para cafetería | insumos de cafeteria"],
  },
  {
    slug: "alimentos-mayor",
    nombre: "Alimentos por mayor",
    rubro: "rubro-abastecimiento",
    tambienEn: ["rubro-alimentos"],
    ejemplos: "Distribución a almacenes, cafeterías y colegios",
    sinonimos: ["distribuidora de alimentos"],
    productos: ["Abarrotes por mayor", "Verduras por mayor | verdura por caja", "Carnes por mayor", "Congelados por mayor"],
  },
  {
    slug: "envases",
    nombre: "Envases y embalaje",
    rubro: "rubro-abastecimiento",
    ejemplos: "Cajas, bolsas, envases para comida, etiquetas",
    sinonimos: ["embalaje", "packaging"],
    productos: ["Cajas de cartón | caja de carton", "Bolsas | bolsas de papel, bolsas kraft", "Envases para comida | envases, potes", "Rollos de etiquetas | etiquetas", "Material de embalaje | film, plastico burbuja"],
  },
  {
    slug: "materiales",
    nombre: "Materiales de construcción",
    rubro: "rubro-abastecimiento",
    tambienEn: ["rubro-hogar", "rubro-comercio"],
    ejemplos: "Cemento, arena, fierro, ladrillos, maderas",
    sinonimos: ["materiales de construccion", "barraca"],
    productos: ["Cemento | sacos de cemento", "Arena y áridos | arena, ripio, gravilla, aridos", "Fierro y acero | fierro, enfierradura", "Ladrillos y bloques | ladrillo", "Maderas y tableros | terciado, osb, pino"],
  },
  {
    slug: "articulos-aseo",
    nombre: "Artículos de aseo",
    rubro: "rubro-abastecimiento",
    tambienEn: ["rubro-comercio"],
    ejemplos: "Detergentes, papel, productos de limpieza por mayor",
    sinonimos: ["articulos de aseo", "productos de limpieza"],
    productos: ["Detergentes y desinfectantes | detergente, cloro", "Papel higiénico y toallas | papel higienico, toalla nova", "Utensilios de aseo | escoba, mopa"],
  },
  {
    slug: "equipamiento",
    nombre: "Equipamiento para negocios",
    rubro: "rubro-abastecimiento",
    ejemplos: "Hornos, vitrinas, refrigeración, mobiliario comercial",
    sinonimos: ["equipamiento comercial"],
    servicios: ["Mantención de equipos gastronómicos | reparacion de hornos industriales", "Refrigeración comercial | camara de frio"],
    productos: ["Hornos y cocinas industriales | horno industrial", "Vitrinas y mobiliario comercial | vitrina, estanteria", "Sistemas de punto de venta | caja registradora, pos"],
  },
];

/* ── De la forma escrita a filas ───────────────────────────────────────── */

export type SubgrupoSemilla = {
  slug: string;
  nombre: string;
  tipo: TipoCategoria;
  rubro: string;
  tambienEn: string[];
  ejemplos: string;
  sinonimos: string[];
};

export type HojaSemilla = {
  nivel: "item" | "oficio";
  slug: string;
  nombre: string;
  tipo: TipoCategoria;
  sinonimos: string[];
  /** El primero es el principal. */
  subgrupos: string[];
};

/** El slug sale del nombre normalizado: dos ítems iguales no pueden convivir. */
export function slugDeHoja(nivel: "item" | "oficio", nombre: string) {
  return `${nivel}-${slugificar(nombre)}`;
}

function leerHoja(
  nivel: "item" | "oficio",
  tipo: TipoCategoria,
  subgrupo: string,
  linea: string,
): HojaSemilla {
  const [nombre, sinonimos = "", extras = ""] = linea.split("|").map((p) => p.trim());
  return {
    nivel,
    slug: slugDeHoja(nivel, nombre),
    nombre,
    tipo,
    sinonimos: sinonimos.split(",").map((s) => s.trim()).filter(Boolean),
    subgrupos: [
      subgrupo,
      ...extras.split(/\s+/).filter(Boolean).map((e) => e.replace(/^\+/, "")),
    ],
  };
}

export const SUBGRUPOS: SubgrupoSemilla[] = SUBGRUPOS_ESCRITOS.map((s) => ({
  slug: s.slug,
  nombre: s.nombre,
  tipo: s.servicios?.length && s.productos?.length ? "ambos" : s.productos?.length ? "producto" : "servicio",
  rubro: s.rubro,
  tambienEn: s.tambienEn ?? [],
  ejemplos: s.ejemplos,
  sinonimos: s.sinonimos,
}));

export const HOJAS: HojaSemilla[] = SUBGRUPOS_ESCRITOS.flatMap((s) => [
  ...(s.servicios ?? []).map((l) => leerHoja("item", "servicio", s.slug, l)),
  ...(s.productos ?? []).map((l) => leerHoja("item", "producto", s.slug, l)),
  // Un oficio es de quien trabaja; su tipo sigue al subgrupo (un panadero vende pan).
  ...(s.oficios ?? []).map((l) =>
    leerHoja("oficio", s.productos?.length && !s.servicios?.length ? "producto" : "servicio", s.slug, l),
  ),
]);

export const ITEMS = HOJAS.filter((h) => h.nivel === "item");
export const OFICIOS = HOJAS.filter((h) => h.nivel === "oficio");
