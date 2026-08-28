/** Datos de referencia del prototipo: territorio, taxonomía y agentes. */

export const REGIONES = [
  { codigo: "13", nombre: "Región Metropolitana de Santiago", orden: 1 },
  { codigo: "05", nombre: "Región de Valparaíso", orden: 2 },
];

export const COMUNAS: {
  region: string;
  codigo: string;
  nombre: string;
  lat: number;
  lng: number;
  activa?: boolean;
}[] = [
  // Comuna piloto y su entorno inmediato.
  { region: "13", codigo: "13120", nombre: "Ñuñoa", lat: -33.4569, lng: -70.5975, activa: true },
  { region: "13", codigo: "13123", nombre: "Providencia", lat: -33.4314, lng: -70.6093 },
  { region: "13", codigo: "13119", nombre: "Macul", lat: -33.49, lng: -70.5975 },
  { region: "13", codigo: "13113", nombre: "La Reina", lat: -33.445, lng: -70.54 },
  { region: "13", codigo: "13122", nombre: "Peñalolén", lat: -33.487, lng: -70.542 },
  { region: "13", codigo: "13101", nombre: "Santiago", lat: -33.4489, lng: -70.6693 },
  { region: "13", codigo: "13114", nombre: "Las Condes", lat: -33.409, lng: -70.567 },
  { region: "13", codigo: "13110", nombre: "La Florida", lat: -33.533, lng: -70.599 },
  { region: "13", codigo: "13119b", nombre: "Maipú", lat: -33.511, lng: -70.758 },
  { region: "13", codigo: "13201", nombre: "Puente Alto", lat: -33.611, lng: -70.576 },
  // Otra región: existe desde el día 1 para que activar territorio no sea un rediseño.
  { region: "05", codigo: "05101", nombre: "Valparaíso", lat: -33.0472, lng: -71.6127 },
  { region: "05", codigo: "05109", nombre: "Viña del Mar", lat: -33.0245, lng: -71.5518 },
];

export const CATEGORIAS: {
  slug: string;
  nombre: string;
  tipo: "servicio" | "producto" | "ambos";
  sinonimos: string[];
}[] = [
  {
    slug: "gasfiteria",
    nombre: "Gasfitería",
    tipo: "servicio",
    sinonimos: ["gasfiter", "gasfíter", "plomero", "plomeria", "cañeria", "fuga de agua", "wc"],
  },
  {
    slug: "electricidad",
    nombre: "Electricidad",
    tipo: "servicio",
    sinonimos: ["electricista", "enchufe", "corto circuito", "tablero electrico", "automatico"],
  },
  {
    slug: "climatizacion",
    nombre: "Climatización y calefacción",
    tipo: "servicio",
    sinonimos: ["calefaccion", "calefont", "aire acondicionado", "estufa", "termo"],
  },
  {
    slug: "electrodomesticos",
    nombre: "Reparación de electrodomésticos",
    tipo: "servicio",
    sinonimos: ["lavadora", "refrigerador", "linea blanca", "secadora", "microondas"],
  },
  {
    slug: "mecanica",
    nombre: "Mecánica automotriz",
    tipo: "servicio",
    sinonimos: ["mecanico", "taller", "auto", "vehiculo", "frenos", "revision tecnica"],
  },
  {
    slug: "cerrajeria",
    nombre: "Cerrajería",
    tipo: "servicio",
    sinonimos: ["cerrajero", "llave", "chapa", "candado"],
  },
  {
    slug: "carpinteria",
    nombre: "Carpintería y mueblería",
    tipo: "servicio",
    sinonimos: ["carpintero", "mueble", "closet", "madera", "cocina a medida"],
  },
  {
    slug: "pintura",
    nombre: "Pintura y terminaciones",
    tipo: "servicio",
    sinonimos: ["pintor", "pintar", "estuco", "empastar"],
  },
  {
    slug: "construccion",
    nombre: "Construcción y remodelación",
    tipo: "servicio",
    sinonimos: ["maestro", "albañil", "remodelacion", "ampliacion", "obra"],
  },
  {
    slug: "aseo",
    nombre: "Aseo y limpieza",
    tipo: "servicio",
    sinonimos: ["limpieza", "aseo profundo", "sanitizacion", "lavado de alfombras"],
  },
  {
    slug: "jardineria",
    nombre: "Jardinería",
    tipo: "servicio",
    sinonimos: ["jardinero", "pasto", "poda", "riego"],
  },
  {
    slug: "fletes",
    nombre: "Fletes y mudanzas",
    tipo: "servicio",
    sinonimos: ["flete", "mudanza", "camioneta", "traslado", "despacho"],
  },
  {
    slug: "tecnologia",
    nombre: "Tecnología y soporte",
    tipo: "servicio",
    sinonimos: ["computador", "notebook", "soporte", "redes", "wifi", "sistemas"],
  },
  {
    slug: "contabilidad",
    nombre: "Contabilidad y finanzas",
    tipo: "servicio",
    sinonimos: ["contador", "impuestos", "sii", "remuneraciones", "boletas"],
  },
  {
    slug: "marketing",
    nombre: "Marketing y diseño",
    tipo: "servicio",
    sinonimos: ["diseño", "publicidad", "redes sociales", "logo", "grafica"],
  },
  {
    slug: "belleza",
    nombre: "Belleza y peluquería",
    tipo: "servicio",
    sinonimos: ["peluqueria", "manicure", "barberia", "estetica"],
  },
  {
    slug: "veterinaria",
    nombre: "Veterinaria y mascotas",
    tipo: "servicio",
    sinonimos: ["veterinario", "mascota", "perro", "gato", "peluqueria canina"],
  },
  {
    slug: "clases",
    nombre: "Clases y capacitación",
    tipo: "servicio",
    sinonimos: ["profesor", "clases particulares", "curso", "capacitacion"],
  },
  {
    slug: "eventos",
    nombre: "Eventos y banquetería",
    tipo: "servicio",
    sinonimos: ["banqueteria", "catering", "cumpleaños", "matrimonio", "arriendo de toldos"],
  },
  {
    slug: "abarrotes",
    nombre: "Abarrotes y alimentos",
    tipo: "producto",
    sinonimos: ["abarrotes", "almacen", "comestibles", "despensa"],
  },
  {
    slug: "frutas-verduras",
    nombre: "Frutas y verduras",
    tipo: "producto",
    sinonimos: ["verduras", "frutas", "tomates", "papas", "hortalizas", "cajas de tomates"],
  },
  {
    slug: "panaderia",
    nombre: "Panadería y pastelería",
    tipo: "producto",
    sinonimos: ["pan", "pasteleria", "torta", "amasado"],
  },
  {
    slug: "carnes",
    nombre: "Carnes y fiambres",
    tipo: "producto",
    sinonimos: ["carniceria", "carne", "pollo", "cecinas"],
  },
  {
    slug: "insumos-gastronomicos",
    nombre: "Insumos gastronómicos",
    tipo: "producto",
    sinonimos: ["harina", "aceite", "azucar", "levadura", "insumos", "saco de harina"],
  },
  {
    slug: "materiales",
    nombre: "Materiales de construcción",
    tipo: "producto",
    sinonimos: ["cemento", "arena", "fierro", "ladrillo", "aridos"],
  },
  {
    slug: "ferreteria",
    nombre: "Ferretería",
    tipo: "producto",
    sinonimos: ["ferreteria", "herramientas", "tornillos", "pintura latex"],
  },
  {
    slug: "envases",
    nombre: "Envases y packaging",
    tipo: "producto",
    sinonimos: ["envases", "cajas", "bolsas", "etiquetas", "packaging"],
  },
  {
    slug: "textil",
    nombre: "Textil e indumentaria",
    tipo: "producto",
    sinonimos: ["ropa", "uniformes", "costura", "telas", "bordado"],
  },
  {
    slug: "artesania",
    nombre: "Artesanía y regalos",
    tipo: "producto",
    sinonimos: ["artesania", "hecho a mano", "regalos", "greda"],
  },
  {
    slug: "plantas",
    nombre: "Plantas y vivero",
    tipo: "producto",
    sinonimos: ["vivero", "plantas", "macetas", "tierra de hoja"],
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
