/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║             ALPHENIX — CATÁLOGO DE PRODUTOS                 ║
 * ║  Edite este arquivo para gerenciar todos os produtos.       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * COMO ADICIONAR UM PRODUTO:
 *  1. Copie um objeto do array PRODUCTS abaixo.
 *  2. Altere os campos conforme o novo produto.
 *  3. Salve o arquivo — o site atualiza automaticamente.
 *
 * CAMPO "image":
 *  - Salve a foto do produto em: assets/images/products/
 *  - Formatos recomendados: JPG ou WebP, mínimo 600×600px, fundo transparente ou branco.
 *  - Se a imagem não existir, o card exibe um placeholder com a cor da marca.
 *
 * CAMPO "whatsapp":
 *  - Número no formato internacional SEM espaços, parênteses ou +.
 *  - Exemplo: "5531999999999" para o número (31) 99999-9999.
 */

// ================================================================
// ⚠️  ALTERE AQUI O SEU NÚMERO DE WHATSAPP (formato: 55XXXXXXXXXXX)
// ================================================================
var WHATSAPP_NUMBER = "5500000000000";

// ================================================================
//  Categorias — altere os labels se quiser renomear no site
// ================================================================
var CATEGORIES = [
  { id: "all",        label: "Todos",       icon: "fa-grip-vertical"  },
  { id: "proteinas",  label: "Proteínas",   icon: "fa-dumbbell"       },
  { id: "creatinas",  label: "Creatinas",   icon: "fa-flask"          },
  { id: "pre-treino", label: "Pré-Treinos", icon: "fa-bolt"           },
  { id: "combos",     label: "Combos",      icon: "fa-box-open"       },
];

// ================================================================
//  Produtos
// ================================================================
var PRODUCTS = [

  /* ─── PROTEÍNAS ─────────────────────────────────────────── */
  {
    id: 1,
    category: "proteinas",
    name: "Whey 100% Dino",
    brand: "Max Titanium",
    weight: null,
    badge: null,
    description: "Proteína concentrada com 23g de proteína por dose. Alto teor de BCAA e glutamina para máximo ganho de massa e recuperação acelerada.",
    price: 139.90,
    image: "assets/images/products/whey-dino-max-titanium.jpg",
    brandColor: "#6b6b6b",
    brandInitials: "MT"
  },
  {
    id: 2,
    category: "proteinas",
    name: "Whey 100% Pure",
    brand: "IntegralMédica",
    weight: null,
    badge: null,
    description: "Whey protein de alta absorção com perfil completo de aminoácidos essenciais. Ideal para hipertrofia e recuperação no pós-treino.",
    price: 149.90,
    image: "assets/images/products/whey-pure-integralmedica.jpg",
    brandColor: "#cc1100",
    brandInitials: "IM"
  },
  {
    id: 3,
    category: "proteinas",
    name: "Whey 100% Pure",
    brand: "Probiótica",
    weight: null,
    badge: null,
    description: "Fórmula concentrada com alto teor proteico e baixo teor de gordura. Resultados visíveis para quem treina com seriedade.",
    price: 149.90,
    image: "assets/images/products/whey-pure-probiotica.jpg",
    brandColor: "#1a3a8f",
    brandInitials: "PB"
  },
  {
    id: 4,
    category: "proteinas",
    name: "Whey 100% Pure Paçoca",
    brand: "Dark Wolf",
    weight: "900g",
    badge: "🔥 Favorito",
    description: "O whey mais gostoso do mercado! Sabor paçoca exclusivo com 25g de proteína por dose. Qualidade premium Dark Wolf.",
    price: 159.90,
    image: "assets/images/products/whey-pure-dark-wolf.jpg",
    brandColor: "#e65c00",
    brandInitials: "DW"
  },
  {
    id: 5,
    category: "proteinas",
    name: "Whey Concentrado",
    brand: "DUX",
    weight: null,
    badge: "⭐ Premium",
    description: "Linha premium DUX com formulação avançada, alto teor proteico e sabor incomparável. Para quem não abre mão de qualidade.",
    price: 219.90,
    image: "assets/images/products/whey-concentrado-dux.jpg",
    brandColor: "#8b0000",
    brandInitials: "DX"
  },

  /* ─── CREATINAS ──────────────────────────────────────────── */
  {
    id: 6,
    category: "creatinas",
    name: "Creatina Universal",
    brand: "Universal Nutrition",
    weight: "200g",
    badge: "✅ C/ Selo",
    description: "Creatina monohidratada pura com selo de autenticidade garantida. Aumenta força, potência e acelera a recuperação muscular.",
    price: 49.90,
    image: "assets/images/products/creatina-universal.jpg",
    brandColor: "#b8860b",
    brandInitials: "UN"
  },
  {
    id: 7,
    category: "creatinas",
    name: "Creatina",
    brand: "IntegralMédica",
    weight: "300g",
    badge: null,
    description: "Creatina monohidratada de alta pureza com dissolução instantânea. Melhora o desempenho em treinos de força e explosão muscular.",
    price: 59.90,
    image: "assets/images/products/creatina-integralmedica.jpg",
    brandColor: "#cc1100",
    brandInitials: "IM"
  },
  {
    id: 8,
    category: "creatinas",
    name: "Creatina",
    brand: "Max Titanium",
    weight: "300g",
    badge: null,
    description: "Creatina pura e testada para máxima eficiência. Aumenta os níveis de ATP muscular para treinos mais intensos e volumosos.",
    price: 59.90,
    image: "assets/images/products/creatina-max-titanium.jpg",
    brandColor: "#6b6b6b",
    brandInitials: "MT"
  },
  {
    id: 9,
    category: "creatinas",
    name: "Creatina Dark Wolf",
    brand: "Dark Wolf Nutrition",
    weight: "500g",
    badge: "📋 Com Laudo",
    description: "O maior custo-benefício do mercado! 500g de creatina pura com laudo de qualidade certificado. Estoque limitado — garanta o seu.",
    price: 89.90,
    image: "assets/images/products/creatina-dark-wolf.jpg",
    brandColor: "#e65c00",
    brandInitials: "DW"
  },

  /* ─── PRÉ-TREINOS ────────────────────────────────────────── */
  {
    id: 10,
    category: "pre-treino",
    name: "Horus Pré-Treino",
    brand: "Max Titanium",
    weight: "150g",
    badge: null,
    description: "Pré-treino potente com cafeína, beta-alanina e citrulina. Energia explosiva, foco mental e pump muscular intenso desde a primeira dose.",
    price: 49.90,
    image: "assets/images/products/pre-treino-horus.jpg",
    brandColor: "#6b6b6b",
    brandInitials: "MT"
  },
  {
    id: 11,
    category: "pre-treino",
    name: "Alcateia Pré-Workout",
    brand: "Dark Wolf",
    weight: "300g",
    badge: "💪 Mais Vendido",
    description: "O pré-treino mais poderoso da linha Dark Wolf. Fórmula avançada com 8 ativos para performance máxima. Não é pra qualquer um.",
    price: 109.90,
    image: "assets/images/products/pre-treino-alcateia.jpg",
    brandColor: "#e65c00",
    brandInitials: "DW"
  },

  /* ─── COMBOS E ACESSÓRIOS ────────────────────────────────── */
  {
    id: 12,
    category: "combos",
    name: "Combo Dark Wolf",
    brand: "Dark Wolf Nutrition",
    weight: "Whey 900g + Creatina 500g",
    badge: "💥 Melhor Combo",
    description: "A combinação perfeita para hipertrofia! Whey Pure Paçoca 900g + Creatina 500g com laudo. Economia real, resultado máximo.",
    price: 224.90,
    image: "assets/images/products/combo-dark-wolf.jpg",
    brandColor: "#e65c00",
    brandInitials: "DW"
  },
  {
    id: 13,
    category: "combos",
    name: "Coqueteleira Dark Wolf",
    brand: "Dark Wolf",
    weight: "750ml",
    badge: null,
    description: "Coqueteleira oficial Dark Wolf 750ml com compartimento extra e misturador em espiral. Durável, estilosa e funcional.",
    price: 24.90,
    image: "assets/images/products/coqueteleira-dark-wolf.jpg",
    brandColor: "#2a2a2a",
    brandInitials: "DW"
  },

];
