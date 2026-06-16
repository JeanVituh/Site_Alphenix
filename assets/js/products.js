/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║             ALPHENIX — CATÁLOGO DE PRODUTOS                 ║
 * ║  Edite este arquivo para gerenciar todos os produtos.       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * CAMPOS DO PRODUTO:
 *  id            — Identificador único (número)
 *  category      — Categoria do produto
 *  name          — Nome do produto
 *  brand         — Marca
 *  weight        — Gramagem (ex: "900g") ou null
 *  badge         — Selo de destaque (ex: "🔥 Favorito") ou null
 *  description   — Descrição curta para o card da página inicial
 *  price         — Preço (número)
 *  image         — Caminho da imagem principal
 *  images        — Array de imagens para galeria (opcional)
 *  brandColor    — Cor da marca (hex) para fallback de imagem
 *  brandInitials — Iniciais da marca para fallback de imagem
 *  benefits      — Array de benefícios para a página do produto
 *  howToUse      — Array de passos de uso para a página do produto
 *  nutrition     — Tabela nutricional (objeto) ou null
 *
 * CAMPO "image":
 *  Salve a foto em: assets/images/products/
 *  Formatos recomendados: JPG ou WebP, mínimo 600×600px.
 *
 * CAMPO "nutrition" (opcional):
 *  Campos suportados: porcao, calorias, proteinas, carboidratos,
 *  gorduras, sodio, creatina, cafeina, betaAlanina, citrulina.
 *  Use null para produtos sem tabela nutricional (combos, acessórios).
 */

// ================================================================
// ⚠️  ALTERE AQUI O SEU NÚMERO DE WHATSAPP (formato: 55XXXXXXXXXXX)
// ================================================================
var WHATSAPP_NUMBER = "5538998926729";

// ================================================================
//  Categorias — altere os labels para renomear no site
// ================================================================
var CATEGORIES = [
  { id: "all",        label: "Todos",       icon: "fa-grip-vertical"  },
  { id: "proteinas",  label: "Proteínas",   icon: "fa-dumbbell"       },
  { id: "creatinas",  label: "Creatinas",   icon: "fa-flask"          },
  { id: "pre-treino", label: "Pré-Treinos", icon: "fa-bolt"           },
  { id: "combos e outros",     label: "Combos e outros",      icon: "fa-box-open"       },
];

// ================================================================
//  Produtos
// ================================================================
var PRODUCTS = /* ─── PROTEÍNAS ─────────────────────────────────────────── */
[
  {
    id: 1,
    category: "proteinas",
    name: "Whey 100% Dino",
    brand: "Max Titanium",
    weight: null,
    badge: null,
    description: "Proteína concentrada com 20g de proteína por dose. Alto teor de BCAA e glutamina para máximo ganho de massa e recuperação acelerada.",
    price: 139.90,
    image: "assets/images/products/Max/whey-dino-max-titanium-caramelo-macchiato.jpg",
    images: [
      "assets/images/products/Max/whey-dino-max-titanium-caramelo-macchiato.jpg",
      "assets/images/products/Max/whey-dino-max-titanium-2.jpg",
      "assets/images/products/Max/whey-dino-max-titanium-3.jpg",
      "assets/images/products/Max/whey-dino-max-titanium-4.jpg",
    ],
    flavors: [
      { label: "Caramelo Macchiato", available: true, image: "assets/images/products/Max/whey-dino-max-titanium-caramelo-macchiato.jpg" },
      { label: "Capuccino",          available: true, image: "assets/images/products/Max/whey-dino-max-titanium-capuccino.jpg" },
    ],
    sizes: [
      { label: "900g",  available: true  },
      { label: "1,8kg", available: false },
    ],
    formats: [
      { label: "Pote",  available: true },
      { label: "Refil", available: true },
    ],
    brandColor: "#6b6b6b",
    brandInitials: "MT",
    benefits: [
      "20g de proteína por dose",
      "Rico em BCAAs e Glutamina",
      "Recuperação muscular acelerada",
      "Suporte ao ganho de massa magra",
      "Fácil dissolução e ótima digestibilidade"
    ],
    howToUse: [
      "Adicione 2 scoops (40g) em 200–300ml de água gelada ou leite.",
      "Agite na coqueteleira por 20 segundos até dissolver completamente.",
      "Consuma preferencialmente logo após o treino ou entre as refeições."
    ],
    nutrition: {
      porcao: "40g (2 scoops)",
      calorias: "152 kcal",
      proteinas: "20g",
      carboidratos: "14g",
      gorduras: "1,8g",
      sodio: "107mg"
    }
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
    image: "assets/images/products/Integral_medica/whey-pure-integralmedica-baunilha.jpg",
    images: [
      "assets/images/products/Integral_medica/whey-pure-integralmedica-baunilha.jpg",
      "assets/images/products/Integral_medica/whey-pure-integralmedica-2.jpg",
      "assets/images/products/Integral_medica/whey-pure-integralmedica-3.jpg",
      "assets/images/products/Integral_medica/whey-pure-integralmedica-4.jpg",
      "assets/images/products/Integral_medica/whey-pure-integralmedica-5.jpg",
      "assets/images/products/Integral_medica/whey-pure-integralmedica-6.jpg"
    ],
    flavors: [
      { label: "Chocolate",       available: true, image: "assets/images/products/Integral_medica/whey-pure-integralmedica-chocolate.jpg" },
      { label: "Baunilha",        available: true, image: "assets/images/products/Integral_medica/whey-pure-integralmedica-baunilha.jpg" },
      { label: "Morango",         available: true, image: "assets/images/products/Integral_medica/whey-pure-integralmedica-morango.jpg" },
      { label: "Cookies & Cream", available: true, image: "assets/images/products/Integral_medica/whey-pure-integralmedica-cookies.jpg" },
      { label: "Gelato Di Latte", available: true, image: "assets/images/products/Integral_medica/whey-pure-integralmedica-Gelato-Di-Latte.jpg" },
    ],
    sizes: [
      { label: "900g",  available: true  },
      { label: "1,8kg", available: false },
    ],
    formats: [
      { label: "Pote",  available: true },
      { label: "Refil", available: true },
    ],
    brandColor: "#cc1100",
    brandInitials: "IM",
    benefits: [
      "Perfil completo de aminoácidos essenciais",
      "Absorção ultrarrápida no pós-treino",
      "Suporte direto à hipertrofia muscular",
      "Baixo teor de gordura e lactose",
      "Alta biodisponibilidade proteica"
    ],
    howToUse: [
      "Dissolva 2 scoops (30g) em 250ml de água gelada ou leite desnatado.",
      "Misture bem na coqueteleira até obter consistência homogênea.",
      "Consuma após o treino ou como lanche proteico entre as refeições."
    ],
    nutrition: {
      porcao: "30g (2 scoops)",
      calorias: "121 kcal",
      proteinas: "20g",
      carboidratos: "6g",
      gorduras: "2g",
      sodio: "62mg"
    }
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
    image: "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg",
    images: [
      "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg",
      "assets/images/products/Probiotica/whey-pure-probiotica-2.jpg",
      "assets/images/products/Probiotica/whey-pure-probiotica-3.jpg",
      "assets/images/products/Probiotica/whey-pure-probiotica-4.jpg",
      "assets/images/products/Probiotica/whey-pure-probiotica-5.jpg",
    ],
    flavors: [
      { label: "Chocolate",           available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-chocolate.jpg" },
      { label: "Chocolate branco",    available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-chocolate.jpg" },
      { label: "Baunilha",            available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-baunilha.jpg" },
      { label: "Morango",             available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-morango.jpg" },
      { label: "Cookies & Cream",     available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg" },
      { label: "Caramelo Salgado",    available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-chocolate.jpg" },
      { label: "Capuccino",           available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-baunilha.jpg" },
      { label: "Doce de Leite",       available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-morango.jpg" },
      { label: "Chocolate com Avelã", available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg" },
      { label: "Leite",               available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg" },
      { label: "Iogurte com Morango", available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg" },
      { label: "Iogurte com limão",   available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg" },
      { label: "Iogurte com coco",    available: true, image: "assets/images/products/Probiotica/whey-pure-probiotica-cookies.jpg" },
    ],
    sizes: [
      { label: "900g",  available: true  },
      { label: "1,8kg", available: false },
    ],
    formats: [
      { label: "Pote",  available: true },
      { label: "Refil", available: true },
    ],
    brandColor: "#1a3a8f",
    brandInitials: "PB",
    benefits: [
      "Alto teor proteico por dose",
      "Baixíssimo teor de gorduras",
      "Manutenção e crescimento da massa muscular",
      "Absorção rápida e eficiente",
      "Disponível em sabores premium"
    ],
    howToUse: [
      "Misture 2 scoops (40g) em 250ml de água gelada.",
      "Agite ou bata no liquidificador por 20 segundos.",
      "Tome após o treino para melhor síntese proteica."
    ],
    nutrition: {
      porcao: "40g (2 scoops)",
      calorias: "159 kcal",
      proteinas: "24g",
      carboidratos: "9,1g",
      gorduras: "3g",
      sodio: "334mg"
    }
  },
  {
    id: 4,
    category: "proteinas",
    name: "Whey 100% Pure Paçoca",
    brand: "Dark Wolf",
    weight: "900g",
    badge: "🔥 Favorito",
    description: "O whey mais gostoso do mercado! Sabor paçoca exclusivo com 26g de proteína por dose. Qualidade premium Dark Wolf.",
    price: 159.90,
    image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-pacoca.jpg",
    images: [
      "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-pacoca.jpg",
      "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-2.jpg",
      "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-3.jpg"
    ],
    flavors: [
      { label: "Paçoca",           available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-pacoca.jpg" },
      { label: "Chocolate",        available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-chocolate.jpg" },
      { label: "Baunilha",         available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-baunilha.jpg" },
      { label: "Morango",          available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-morango.jpg" },
      { label: "Leitinho",         available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-baunilha.jpg" },
      { label: "cookies",          available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-morango.jpg" },
      { label: "Doce de Leite",    available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-morango.jpg" },
      { label: "Chocolate branco", available: true, image: "assets/images/products/Dark_Wolf/whey-pure-dark-wolf-morango.jpg" },
    ],
    sizes: [
      { label: "900g",  available: true  },
      { label: "1,8kg", available: false },
    ],
    formats: [
      { label: "Pote",  available: true },
      { label: "Refil", available: true },
    ],
    brandColor: "#e65c00",
    brandInitials: "DW",
    benefits: [
      "26g de proteína por dose",
      "Sabor paçoca exclusivo Dark Wolf",
      "Recuperação muscular intensa e rápida",
      "Ideal para pós-treino imediato",
      "Qualidade premium com laudo garantido"
    ],
    howToUse: [
      "Adicione 2 scoops (40g) em 250–300ml de água gelada ou leite.",
      "Bata no liquidificador ou agite bem na coqueteleira por 20 segundos.",
      "Consuma imediatamente após o treino para máxima recuperação."
    ],
    nutrition: {
      porcao: "40g (2 scoops)",
      calorias: "154 kcal",
      proteinas: "26g",
      carboidratos: "7,9g",
      gorduras: "3,5g",
      sodio: "92mg"
    }
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
    image: "assets/images/products/Dux/whey-concentrado-dux.jpg",
    images: [
      "assets/images/products/Dux/whey-concentrado-dux-cookies.jpg",
      "assets/images/products/Dux/whey-concentrado-dux-2.jpg",
      "assets/images/products/Dux/whey-concentrado-dux-3.jpg",
      "assets/images/products/Dux/whey-concentrado-dux-4.jpg",
      "assets/images/products/Dux/whey-concentrado-dux-5.jpg",
      "assets/images/products/Dux/whey-concentrado-dux-6.jpg"
    ],
    flavors: [
      { label: "Chocolate Branco", available: true, image: "assets/images/products/Dux/whey-concentrado-dux-chocolate.jpg" },
      { label: "Chocolate",        available: true, image: "assets/images/products/Dux/whey-concentrado-dux-chocolate.jpg" },
      { label: "Baunilha",         available: true, image: "assets/images/products/Dux/whey-concentrado-dux-baunilha.jpg" },
      { label: "Morango",          available: true, image: "assets/images/products/Dux/whey-concentrado-dux-morango.jpg" },
      { label: "Butter cookies",   available: true, image: "assets/images/products/Dux/whey-concentrado-dux-cookies.jpg" },
      { label: "Torta de Limão",   available: true, image: "assets/images/products/Dux/whey-concentrado-dux-doce-de-leite.jpg" },
      { label: "Caramelo Salgado", available: true, image: "assets/images/products/Dux/whey-concentrado-dux-doce-de-leite.jpg" },
      { label: "Coco",             available: true, image: "assets/images/products/Dux/whey-concentrado-dux-doce-de-leite.jpg" },
      { label: "Neutro",           available: true, image: "assets/images/products/Dux/whey-concentrado-dux-doce-de-leite.jpg" },
      { label: "Capuccino",        available: true, image: "assets/images/products/Dux/whey-concentrado-dux-doce-de-leite.jpg" },
    ],
    sizes: [
      { label: "900g",  available: true  },
      { label: "1,8kg", available: false },
    ],
    formats: [
      { label: "Pote",  available: true },
      { label: "Refil", available: true },
    ],
    brandColor: "#8b0000",
    brandInitials: "DX",
    benefits: [
      "Formulação avançada linha premium DUX",
      "20g de proteína por dose",
      "Enriquecido com enzimas digestivas",
      "Sabor incomparável sem deixar resíduos",
      "Livre de glúten e corantes artificiais"
    ],
    howToUse: [
      "Dissolva 1 dose (30g) em 250ml de água or leite desnatado.",
      "Misture bem em coqueteleira ou liquidificador por 20 segundos.",
      "Consuma após o treino ou antes de dormir para recuperação noturna."
    ],
    nutrition: {
      porcao: "30g (1 scoop)",
      calorias: "126 kcal",
      proteinas: "20g",
      carboidratos: "6,4g",
      gorduras: "2,1g",
      sodio: "107mg"
    }
  },

  /* ─── CREATINAS ──────────────────────────────────────────── */
  {
    id: 6,
    category: "creatinas",
    name: "Creatina Universal Monohidratada",
    brand: "Universal Nutrition",
    weight: "200g",
    badge: "✅ C/ Selo",
    description: "Creatina monohidratada pura com selo de autenticidade garantida. Aumenta força, potência e acelera a recuperação muscular.",
    price: 49.90,
    image: "assets/images/products/Universal/creatina-universal.jpg",
    images: [
  "assets/images/products/Universal/creatina-universal.jpg",
  "assets/images/products/Universal/creatina-universal-2.jpg",
  "assets/images/products/Universal/creatina-universal-3.jpg",
  "assets/images/products/Universal/creatina-universal-4.jpg"
],
    sizes: [
      { label: "200g",  available: true  },
      { label: "300g",  available: false },
      { label: "400g", available: false },
    ],
    brandColor: "#b8860b",
    brandInitials: "UN",
    benefits: [
      "Aumenta força e potência muscular",
      "Regeneração acelerada do ATP",
      "Volumização celular muscular",
      "Redução da fadiga em treinos intensos",
      "Selo de autenticidade Universal garantido"
    ],
    howToUse: [
      "Dissolva 1 medida (3g) em 200ml de água, suco ou no seu shake proteico.",
      "Consuma 1 porção diária",
      "Fase de saturação (opcional): 10-15g/dia divididos em 4 doses por 5 dias consecutivos."
    ],
    nutrition: {
      porcao: "3g (1 medida)",
      calorias: "0 kcal",
      proteinas: "0g",
      carboidratos: "0g",
      gorduras: "0g",
      sodio: "0mg",
      creatina: "3g"
    }
  },
  /* ─── CREATINAS ─────────────────────────────────────────── */
  {
    id: 7,
    category: "creatinas",
    name: "Creatina",
    brand: "IntegralMédica",
    weight: "300g",
    badge: null,
    description: "Creatina monohidratada de alta pureza com dissolução instantânea. Melhora o desempenho em treinos de força e explosão muscular.",
    price: 59.90,
    image: "assets/images/products/Integral_medica/creatina-integralmedica.jpg",
    images: [
      "assets/images/products/Integral_medica/creatina-integralmedica.jpg",
      "assets/images/products/Integral_medica/creatina-integralmedica-2.jpg",
      "assets/images/products/Integral_medica/creatina-integralmedica-3.jpg",
      "assets/images/products/Integral_medica/creatina-integralmedica-4.jpg",
      "assets/images/products/Integral_medica/creatina-integralmedica-5.jpg"
    ],
    // ── Tamanhos: imagem dedicada para cada tamanho de creatina
    sizes: [
      { label: "150g", available: false, image: "assets/images/products/Integral_medica/creatina-integralmedica-150g.jpg" },
      { label: "300g", available: true,  image: "assets/images/products/Integral_medica/creatina-integralmedica-300g.jpg" },
      { label: "500g", available: false, image: "assets/images/products/Integral_medica/creatina-integralmedica-500g.jpg" },
    ],
    brandColor: "#cc1100",
    brandInitials: "IM",
    benefits: [
      "Alta pureza monohidratada micronizada",
      "Dissolução instantânea sem resíduos",
      "Melhora o desempenho em treinos de força",
      "Suporte ao ganho de força e explosão",
      "Sem sabor — mistura com qualquer bebida"
    ],
    howToUse: [
      "Misture 5g (1 medida) em 200ml de água, suco ou shake proteico.",
      "Consuma 1 dose diária, de preferência no pós-treino.",
      "Mantenha hidratação adequada durante o dia para melhores resultados."
    ],
    nutrition: {
      porcao: "5g (1 medida)",
      calorias: "0 kcal",
      proteinas: "0g",
      carboidratos: "0g",
      gorduras: "0g",
      sodio: "0mg",
      creatina: "5g"
    }
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
    image: "assets/images/products/Max/creatina-max-titanium.jpg",
    images: [
      "assets/images/products/Max/creatina-max-titanium.jpg",
      "assets/images/products/Max/creatina-max-titanium-2.jpg",
      "assets/images/products/Max/creatina-max-titanium-3.jpg",
      "assets/images/products/Max/creatina-max-titanium-4.jpg",
    ],
    // ── Tamanhos: imagem dedicada para cada tamanho de creatina
    sizes: [
      { label: "150g", available: false, image: "assets/images/products/Max/creatina-max-titanium-150g.jpg" },
      { label: "300g", available: true,  image: "assets/images/products/Max/creatina-max-titanium-300g.jpg" },
      { label: "500g", available: false, image: "assets/images/products/Max/creatina-max-titanium-500g.jpg" },
    ],
    brandColor: "#6b6b6b",
    brandInitials: "MT",
    benefits: [
      "Creatina pura e testada Max Titanium",
      "Aumenta os níveis de ATP muscular",
      "Treinos mais intensos e volumosos",
      "Excelente custo-benefício",
      "Absorção rápida e eficiente"
    ],
    howToUse: [
      "Dissolva 5g em 200ml de água, suco ou shake proteico.",
      "Tome 1 dose diária, antes ou após o treino.",
      "Hidrate-se adequadamente ao longo do dia para potencializar os efeitos."
    ],
    nutrition: {
      porcao: "5g (1 medida)",
      calorias: "0 kcal",
      proteinas: "0g",
      carboidratos: "0g",
      gorduras: "0g",
      sodio: "0mg",
      creatina: "5g"
    }
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
    image: "assets/images/products/Dark_Wolf/creatina-dark-wolf.jpg",
    // ── Tamanhos: imagem dedicada para cada tamanho de creatina
    sizes: [
      { label: "300g", available: false, image: "assets/images/products/Dark_Wolf/creatina-dark-wolf-300g.jpg" },
      { label: "500g", available: true,  image: "assets/images/products/Dark_Wolf/creatina-dark-wolf-500g.jpg" },
    ],

    formats: [
      { label: "Pote",  available: true },
      { label: "Refil", available: true },
    ],
    
    brandColor: "#e65c00",
    brandInitials: "DW",
    benefits: [
      "500g de creatina 100% pura",
      "Laudo analítico de pureza certificado",
      "Melhor custo-benefício do mercado",
      "Absorção rápida e máxima eficácia",
      "Suporte máximo à força e potência muscular"
    ],
    howToUse: [
      "Dissolva 1 medida (6g) em 200ml de água ou misture ao seu shake.",
      "Consuma 1 vez ao dia — antes ou após o treino.",
      "Para acelerar a saturação: 20g/dia em 4 doses por 5 dias (fase de carga)."
    ],
    nutrition: {
      porcao: "6g (1 medida)",
      calorias: "0 kcal",
      proteinas: "0g",
      carboidratos: "0g",
      gorduras: "0g",
      sodio: "0mg",
      creatina: "6g"
    }
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
    image: "assets/images/products/Max/pre-treino-horus.jpg",
    images: [
      "assets/images/products/Max/pre-treino-horus.jpg",
      "assets/images/products/Max/pre-treino-horus-2.jpg",
      "assets/images/products/Max/pre-treino-horus-3.jpg",
      "assets/images/products/Max/pre-treino-horus-4.jpg",
    ],
    // ── Sabores: adicione a imagem de cada sabor em assets/images/products/Max/
    flavors: [
      { label: "Frutas Vermelhas", available: true, image: "assets/images/products/Max/pre-treino-horus-frutas-vermelhas.jpg" },
      { label: "Amora",            available: true, image: "assets/images/products/Max/pre-treino-horus-amora.jpg" },
      { label: "Citrus",           available: true, image: "assets/images/products/Max/pre-treino-horus-citrus.jpg" },
      { label: "Maçã verde",       available: true, image: "assets/images/products/Max/pre-treino-horus-maca-verde.jpg" },
      { label: "Limão Yuzu",       available: true, image: "assets/images/products/Max/pre-treino-horus-limao-yuzu.jpg" },
      { label: "Blue Ice",         available: true, image: "assets/images/products/Max/pre-treino-horus-blue-ice.jpg" },
    ],
    sizes: [
      { label: "150g", available: true  },
      { label: "300g", available: false },
    ],
    brandColor: "#6b6b6b",
    brandInitials: "MT",
    benefits: [
      "Energia explosiva imediata",
      "Foco mental aprimorado",
      "Pump muscular intenso",
      "Redução da fadiga durante o treino",
      "Fórmula com Cafeína + Beta-Alanina + Citrulina"
    ],
    howToUse: [
      "Misture 1 + 1/2 scoop (8,4g) em 200ml de água gelada.",
      "Consuma 30 minutos antes do treino para absorção ideal.",
      "Não exceder 1 dose por dia. Não recomendado após as 18h."
    ],
    nutrition: {
      porcao: "8,4g (1 scoop)",
      calorias: "14 kcal",
      proteinas: "0g",
      carboidratos: "3,6g",
      gorduras: "0g",
      arginina: "1000mg",
      cafeina: "150mg",
      betaAlanina: "2000mg",
      taurina: "1000mg"
    }
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
    image: "assets/images/products/Dark_Wolf/pre-treino-alcateia.jpg",
    images: [
      "assets/images/products/Dark_Wolf/pre-treino-alcateia.jpg",
      "assets/images/products/Dark_Wolf/pre-treino-alcateia-2.jpg",
      "assets/images/products/Dark_Wolf/pre-treino-alcateia-3.jpg",
      "assets/images/products/Dark_Wolf/pre-treino-alcateia-4.jpg",
    ],
    // ── Sabores: adicione a imagem de cada sabor em assets/images/products/Dark_Wolf/
    flavors: [
      { label: "Cola",             available: true, image: "assets/images/products/Dark_Wolf/pre-treino-alcateia-cola.jpg" },
      { label: "Energético",       available: true, image: "assets/images/products/Dark_Wolf/pre-treino-alcateia-energetico.jpg" },
      { label: "Açaí com guaraná", available: true, image: "assets/images/products/Dark_Wolf/pre-treino-alcateia-acai-guarana.jpg" },
    ],
    sizes: [
      { label: "300g", available: true },
    ],
    brandColor: "#e65c00",
    brandInitials: "DW",
    benefits: [
      "Fórmula com 8 ativos de alta performance",
      "Energia sustentada por horas de treino",
      "Pump e vascularização extremos",
      "Foco total e sem crash pós-treino",
      "Dosagens terapêuticas eficazes por dose"
    ],
    howToUse: [
      "Misture 1 + 1/2 dose (10g) em 300ml de água gelada.",
      "Consuma 30–45 minutos antes do treino.",
      "Não exceder 1 porção ao dia. Contraindicado para menores de 18 anos e gestantes."
    ],
    nutrition: {
      porcao: "10g (1 + 1/2 dose)",
      calorias: "7,2 kcal",
      proteinas: "0g",
      carboidratos: "1,8g",
      gorduras: "0g",
      sodio: "49mg",
      cafeina: "400mg",
      citrulina: "6g",
      betaAlanina: "2000mg",
      taurina: "2000mg"
    }
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
    image: "assets/images/products/Dark_Wolf/combo-dark-wolf.jpg",
    
    brandColor: "#e65c00",
    brandInitials: "DW",
    benefits: [
      "Combinação perfeita Whey + Creatina",
      "Hipertrofia e força ao mesmo tempo",
      "Máxima recuperação muscular pós-treino",
      "Economia real em relação à compra separada",
      "Ambos os produtos com laudo de qualidade"
    ],
    howToUse: [
      "Whey: 2 scoops pós-treino com 250ml de água ou leite.",
      "Creatina: dissolva 1 medida (6g) em 200ml de água ou misture ao seu shake.",
      "Consuma diariamente para resultados consistentes e progressivos."
    ],
    nutrition: null
  },
  {
    id: 13,
    category: "combos",
    name: "Coqueteleira Dark Wolf",
    brand: "Dark Wolf",
    weight: "700ml",
    badge: null,
    description: "Coqueteleira 700ml com compartimento extra e misturador em espiral. Durável, estilosa e funcional.",
    price: 24.90,
    image: "assets/images/products/Dark_Wolf/coqueteleira.jpg",
    images: [
  "assets/images/products/Dark_Wolf/coqueteleira.jpg",
  "assets/images/products/Dark_Wolf/coqueteleira-2.jpg",
  "assets/images/products/Dark_Wolf/coqueteleira-3.jpg",
  "assets/images/products/Dark_Wolf/coqueteleira-4.jpg",
  "assets/images/products/Dark_Wolf/coqueteleira-5.jpg",
  "assets/images/products/Dark_Wolf/coqueteleira-6.jpg",
  "assets/images/products/Dark_Wolf/coqueteleira-7.jpg",
  "assets/images/products/Dark_Wolf/coqueteleira-8.jpg",
],
    brandColor: "#2a2a2a",
    brandInitials: "DW",
    benefits: [
      "Capacidade de 700ml",
      "Compartimento extra para suplementos em pó",
      "Misturador espiral de inox de alta qualidade",
      "Material livre de BPA e livre de odores",
      "Design exclusivo Dark Wolf"
    ],
    howToUse: [
      "Adicione sempre o líquido primeiro, depois os pós suplementares.",
      "Feche bem a tampa e agite vigorosamente por 20 segundos.",
      "Lave com água e detergente neutro após cada uso para conservar a coqueteleira."
    ],
    nutrition: null
  },

];
