export interface DarkWolfCatalogKnowledge {
 sourcePage: number;
 description: string;
 benefits: string[];
 facts: string[];
 tags: string[];
 stimulant?: boolean;
}

/**
 * Conhecimento curado a partir do catálogo oficial Dark Wolf Nutrition
 * fornecido pelo lojista (29 páginas, versão analisada em ago/2026).
 *
 * IMPORTANTE:
 * - Mantemos dados objetivos e alegações de suporte compatíveis com atendimento
 * comercial de suplementos.
 * - Alegações de diagnóstico, tratamento, cura ou prevenção de doenças presentes
 * no material de marketing NÃO são expostas ao assistente.
 * - O preço, estoque e variações continuam vindo exclusivamente do Supabase.
 */
export const DARK_WOLF_CATALOG_KNOWLEDGE: Record<string, DarkWolfCatalogKnowledge> = {
 'whey-100-pure-dark-wolf': {
 sourcePage: 3,
 description:
 'Whey 100% Pure Dark Wolf de 900g, formulado exclusivamente com proteínas do soro do leite. O produto oferece 26g de proteína, 2g de glutamina e 5,8g de BCAA por dose e declara ausência de amino spiking.',
 benefits: [
 '26g de proteína por dose',
 'Suporte à recuperação muscular',
 'Fonte de proteína do soro do leite',
 '2g de glutamina por dose',
 '5,8g de BCAA por dose',
 ],
 facts: ['900g', '26g proteína/dose', '2g glutamina/dose', '5,8g BCAA/dose'],
 tags: ['whey', 'proteina', 'recuperacao muscular', 'ganho de massa', 'massa magra', 'pos treino'],
 },
 'beef-protein-juice-dark-wolf': {
 sourcePage: 4,
 description:
 'Beef Protein Juice Dark Wolf de 900g, proteína em perfil refrescante. O produto oferece 32g de proteína por porção, zero açúcar, zero glúten e zero lactose.',
 benefits: [
 '32g de proteína por porção',
 'Zero lactose',
 'Zero açúcar',
 'Zero glúten',
 'Alternativa de fonte proteica para recuperação e rotina de treino',
 ],
 facts: ['900g', '32g proteína/porção', 'zero açúcar', 'zero glúten', 'zero lactose'],
 tags: ['proteina', 'beef protein', 'zero lactose', 'sem lactose', 'recuperacao muscular', 'ganho de massa'],
 },
 'whey-protein-evolut-dark-wolf': {
 sourcePage: 5,
 description:
 'Whey Protein Evolut Dark Wolf de 900g, combinando proteína concentrada do soro do leite e colágeno hidrolisado. O produto oferece 22g de proteína e 128 kcal por dose, baixo teor de gorduras e zero glúten.',
 benefits: [
 '22g de proteína por dose',
 'Proteína concentrada do soro do leite + colágeno hidrolisado',
 'Suporte à recuperação muscular',
 'Baixo teor de gorduras ',
 'Zero glúten',
 ],
 facts: ['900g', '22g proteína/dose', '128 kcal/dose', 'zero glúten'],
 tags: ['whey', 'proteina', 'colageno hidrolisado', 'recuperacao muscular', 'massa magra'],
 },
 'creatina-dark-wolf': {
 sourcePage: 6,
 description:
 'Creatina monohidratada Dark Wolf com laudo de pureza apresentado pela marca, matéria-prima importada e versões de 300g e 500g. O produto é voltado para força, potência, desempenho e recuperação muscular.',
 benefits: [
 'Suporte ao aumento de força e potência muscular',
 'Suporte ao desempenho físico em treinos intensos',
 'Apoio à recuperação muscular',
 'Creatina monohidratada com laudo apresentado pela marca',
 'Zero açúcar e sem glúten ',
 ],
 facts: ['creatina monohidratada', 'versões 300g e 500g', 'matéria-prima importada', 'laudo apresentado pela marca'],
 tags: ['creatina', 'forca', 'potencia', 'desempenho', 'recuperacao muscular', 'massa magra', 'custo beneficio'],
 },
 'creatina-gummy-dark-wolf': {
 sourcePage: 7,
 description:
 'Creatina Gummy Dark Wolf em formato de gomas, com 60 unidades (240g) e sabores maçã verde, laranja e uva verde. Possui laudo de pureza apresentado pela marca e é uma alternativa prática à creatina em pó.',
 benefits: [
 'Formato em gomas para maior praticidade',
 'Suporte à força e potência muscular',
 'Suporte ao desempenho físico',
 'Apoio à recuperação muscular',
 'Zero açúcar ',
 ],
 facts: ['60 gomas', '240g', 'sabores: maçã verde, laranja e uva verde', 'laudo apresentado pela marca'],
 tags: ['creatina', 'gummy', 'goma', 'praticidade', 'forca', 'potencia', 'recuperacao muscular'],
 },
 'alcateia-pre-workout-dark-wolf': {
 sourcePage: 8,
 description:
 'Alcateia Pré-Workout Dark Wolf de 300g, pré-treino estimulante voltado a energia, foco, resistência e pump. O produto oferece 400mg de cafeína, 2.000mg de beta-alanina, 2.000mg de taurina e 1.000mg de L-arginina na porção indicada.',
 benefits: [
 'Energia e foco para treinos intensos',
 'Suporte à resistência muscular',
 'Suporte a pump e vascularização',
 'Contém beta-alanina, taurina e L-arginina',
 'Pré-treino com alta carga de cafeína ',
 ],
 facts: ['300g', '400mg cafeína', '2.000mg beta-alanina', '2.000mg taurina', '1.000mg L-arginina', 'vitaminas B5, B6 e E'],
 tags: ['pre treino', 'energia', 'foco', 'resistencia', 'pump', 'cafeina', 'estimulante'],
 stimulant: true,
 },
 'alpha-burn-dark-wolf': {
 sourcePage: 9,
 description:
 'Alpha Burn Dark Wolf com 60 cápsulas, termogênico voltado a definição, foco e energia. Também oferece suporte ao controle de apetite e à redução de retenção de líquidos.',
 benefits: [
 'Termogênico voltado a definição e energia',
 'Suporte ao foco e concentração',
 'Apoio ao controle de apetite',
 'Apoio à redução de retenção de líquidos',
 'Opção da categoria Termogênicos & Energia',
 ],
 facts: ['60 cápsulas', '5 ingredientes selecionados'],
 tags: ['termogenico', 'definicao', 'emagrecimento', 'perda de gordura', 'controle de apetite', 'foco', 'energia', 'retencao de liquidos'],
 stimulant: true,
 },
 'multivitaminico-az-dark-wolf': {
 sourcePage: 10,
 description:
 'Multivitamínico AZ Dark Wolf com 90 cápsulas e 20 vitaminas e minerais. Uma cápsula oferece 100% do valor diário dos micronutrientes apresentados, com suporte diário à energia, imunidade, disposição e recuperação.',
 benefits: [
 '20 vitaminas e minerais',
 'Suporte diário ao sistema imunológico',
 'Contribui para a produção de energia',
 'Suporte à saúde de pele e cabelos',
 'Aporte nutricional para a rotina',
 ],
 facts: ['90 cápsulas', '20 vitaminas e minerais', '100% do VD dos micronutrientes apresentados em 1 cápsula'],
 tags: ['multivitaminico', 'saude geral', 'imunidade', 'energia', 'disposicao', 'pele', 'cabelo', 'recuperacao'],
 },
 'multivitaminico-kids-az-dark-wolf': {
 sourcePage: 11,
 description:
 'Multivitamínico Kids Dark Wolf em gomas sabor framboesa, com 30 unidades e 19 vitaminas e minerais. O produto é voltado para suporte nutricional durante a fase de crescimento, energia, imunidade e bem-estar.',
 benefits: [
 '19 vitaminas e minerais',
 'Suporte nutricional para fase de crescimento',
 'Suporte ao sistema imunológico',
 'Contribui para a produção de energia',
 'Formato em gomas sabor framboesa',
 ],
 facts: ['30 gomas', '19 vitaminas e minerais', 'sabor framboesa'],
 tags: ['multivitaminico kids', 'infantil', 'crianca', 'crescimento', 'imunidade', 'energia'],
 },
 'cafeina-pura-200mg-dark-wolf': {
 sourcePage: 12,
 description:
 'Cafeína Pura Dark Wolf com 90 cápsulas de 200mg, estimulante voltado a alerta, foco, energia e desempenho físico. O produto também pode ser usado como opção termogênica.',
 benefits: [
 'Aumento de alerta e foco',
 'Suporte à energia para treinos e rotina',
 'Suporte à resistência e desempenho físico',
 'Ação estimulante',
 'Opção da categoria Termogênicos & Energia',
 ],
 facts: ['90 cápsulas', '200mg de cafeína por cápsula'],
 tags: ['cafeina', 'estimulante', 'energia', 'foco', 'alerta', 'termogenico', 'desempenho'],
 stimulant: true,
 },
 'sleep-zen-dark-wolf': {
 sourcePage: 13,
 description:
 'Sleep Zen Dark Wolf com 60 cápsulas, formulado com triptofano, magnésio, inositol, complexo B e melatonina. O produto é voltado para relaxamento, qualidade do sono e recuperação do corpo.',
 benefits: [
 'Suporte ao relaxamento',
 'Apoio à qualidade do sono',
 'Apoio à recuperação e ao bem-estar',
 'Fórmula com triptofano, magnésio e inositol',
 'Contém complexo B e melatonina ',
 ],
 facts: ['60 cápsulas', 'triptofano', 'magnésio', 'inositol', 'complexo B', 'melatonina'],
 tags: ['sono', 'dormir', 'relaxamento', 'bem estar', 'recuperacao', 'sleep zen'],
 },
 'neuro-focus-dark-wolf': {
 sourcePage: 14,
 description:
 'Neuro Focus Dark Wolf com 60 cápsulas, formulado com L-tirosina, taurina, colina, cafeína e coenzima Q10. O produto é voltado para foco, atenção, concentração e desempenho mental em tarefas diárias.',
 benefits: [
 'Suporte ao foco e atenção',
 'Suporte à concentração em tarefas diárias',
 'Fórmula com L-tirosina, taurina e colina',
 'Contém coenzima Q10',
 'Contém cafeína e possui efeito estimulante',
 ],
 facts: ['60 cápsulas', 'L-tirosina', 'taurina', 'colina', 'cafeína', 'coenzima Q10'],
 tags: ['foco', 'concentracao', 'atencao', 'desempenho mental', 'estudo', 'trabalho', 'energia mental', 'cafeina'],
 stimulant: true,
 },
 'omega-3-1000mg-dark-wolf': {
 sourcePage: 15,
 description:
 'Ômega 3 Dark Wolf com 120 cápsulas. A porção fornece 1.000mg de óleo de peixe, 540mg de EPA e 360mg de DHA, com suporte cardiovascular, cognitivo e ao equilíbrio geral do organismo.',
 benefits: [
 'Fonte de EPA e DHA',
 'Suporte à saúde cardiovascular',
 'Suporte à saúde mental e cognitiva',
 'Apoio ao funcionamento do sistema imunológico',
 'Opção para rotina de saúde geral',
 ],
 facts: ['120 cápsulas', '1.000mg óleo de peixe', '540mg EPA', '360mg DHA'],
 tags: ['omega 3', 'epa', 'dha', 'saude cardiovascular', 'coracao', 'cognitivo', 'imunidade', 'saude geral'],
 },
 'mag-six-dark-wolf': {
 sourcePage: 16,
 description:
 'Mag-Six Dark Wolf com 90 cápsulas e seis formas de magnésio: óxido, taurato, citrato malato, malato, ascorbato e bisglicinato. A fórmula é voltada a metabolismo, função neuromuscular, saúde óssea, relaxamento, sono, energia e foco.',
 benefits: [
 'Combinação de 6 formas de magnésio',
 'Suporte ao funcionamento neuromuscular',
 'Suporte à saúde óssea',
 'Apoio ao relaxamento e qualidade do sono',
 'Suporte à energia e foco no dia a dia',
 ],
 facts: ['90 cápsulas', '6 formas de magnésio', 'zero açúcar', 'sem glúten e lactose '],
 tags: ['magnesio', 'sono', 'relaxamento', 'energia', 'fadiga muscular', 'foco', 'ossos', 'saude ossea', 'imunidade'],
 },
 'magnesio-inositol-dark-wolf': {
 sourcePage: 17,
 description:
 'Magnésio Inositol Dark Wolf de 210g, voltado a relaxamento físico e mental, qualidade do sono e suporte cognitivo. Também oferece foco, memória e redução de fadiga muscular.',
 benefits: [
 'Apoio ao relaxamento físico e mental',
 'Suporte à qualidade do sono',
 'Suporte à memória e ao foco',
 'Apoio à redução da fadiga muscular',
 'Zero açúcar e sem glúten/lactose ',
 ],
 facts: ['210g', 'magnésio + inositol', 'zero açúcar', 'sem glúten e lactose '],
 tags: ['magnesio', 'inositol', 'sono', 'relaxamento', 'foco', 'memoria', 'fadiga muscular'],
 },
 'magnesio-l-treonato-ultra-dark-wolf': {
 sourcePage: 18,
 description:
 'Magnésio L-Treonato Ultra Dark Wolf com 60 cápsulas. O produto é voltado para suporte às funções cognitivas, aprendizado, memória e para uma rotina noturna mais tranquila.',
 benefits: [
 'Suporte às funções cognitivas',
 'Apoio à memória e aprendizado',
 'Apoio ao relaxamento mental',
 'Suporte à qualidade do sono',
 'Sem glúten e lactose ',
 ],
 facts: ['60 cápsulas', 'magnésio L-treonato', 'zero açúcar', 'sem glúten e lactose '],
 tags: ['magnesio l treonato', 'foco', 'cognitivo', 'memoria', 'aprendizado', 'sono', 'relaxamento'],
 },
 'picolinato-de-cromo-250mcg-dark-wolf': {
 sourcePage: 19,
 description:
 'Picolinato de Cromo Dark Wolf com 90 cápsulas de 250mcg. Para atendimento comercial seguro, o produto é apresentado como suporte ao metabolismo energético, controle de apetite e gerenciamento de peso, sem alegações de tratamento de doenças.',
 benefits: [
 'Suporte ao metabolismo energético',
 'Apoio ao controle de apetite',
 'Apoio ao gerenciamento de peso',
 'Pode ser considerado quando o cliente menciona vontade de doces, sem promessa de resultado',
 'Zero açúcar e sem glúten/lactose ',
 ],
 facts: ['90 cápsulas', '250mcg de cromo', 'zero açúcar', 'sem glúten e lactose '],
 tags: ['picolinato de cromo', 'cromo', 'metabolismo', 'controle de apetite', 'vontade de doces', 'gerenciamento de peso'],
 },
 'coenzima-q10-100mg-dark-wolf': {
 sourcePage: 20,
 description:
 'Coenzima Q10 Dark Wolf 100mg com 60 cápsulas. O produto é voltado para suporte à produção de energia, resistência, proteção antioxidante e saúde cardiovascular.',
 benefits: [
 'Suporte à produção de energia',
 'Apoio à resistência física',
 'Proteção antioxidante das células',
 'Suporte à saúde cardiovascular',
 'Opção para vitalidade e rotina ativa',
 ],
 facts: ['60 cápsulas', '100mg de Coenzima Q10'],
 tags: ['coenzima q10', 'q10', 'energia', 'resistencia', 'antioxidante', 'saude cardiovascular', 'coracao', 'vitalidade'],
 },
 'coenzima-q10-200mg-dark-wolf': {
 sourcePage: 21,
 description:
 'Coenzima Q10 Dark Wolf 200mg com 60 cápsulas. A Coenzima Q10 participa na produção de energia celular e proteção antioxidante e a posiciona para energia, resistência, saúde cardiovascular e vitalidade.',
 benefits: [
 'Suporte à produção de energia celular',
 'Apoio à resistência física',
 'Proteção antioxidante',
 'Suporte à saúde cardiovascular',
 'Opção de maior concentração de CoQ10 na linha Dark Wolf',
 ],
 facts: ['60 cápsulas', '200mg de Coenzima Q10'],
 tags: ['coenzima q10', 'q10', 'energia', 'resistencia', 'antioxidante', 'saude cardiovascular', 'coracao', 'vitalidade'],
 },
 'vitamina-d3-2000ui-dark-wolf': {
 sourcePage: 22,
 description:
 'Vitamina D3 Dark Wolf 2000UI com 90 cápsulas. A vitamina D3 contribui para suporte à saúde óssea e muscular e ao funcionamento do sistema imunológico.',
 benefits: [
 'Suporte à saúde óssea',
 'Apoio ao funcionamento muscular',
 'Suporte ao sistema imunológico',
 'Vitamina D3 (colecalciferol)',
 'Sem glúten e lactose ',
 ],
 facts: ['90 cápsulas', '2000UI conforme identificação do produto no cadastro/embalagem', 'vitamina D3 (colecalciferol)'],
 tags: ['vitamina d', 'vitamina d3', 'd3', 'ossos', 'saude ossea', 'musculos', 'imunidade'],
 },
 'osteo-flex-dark-wolf': {
 sourcePage: 23,
 description:
 'Osteo Flex Dark Wolf com 60 cápsulas, fórmula com condroitina, glucosamina e colágeno tipo II. Para atendimento seguro, é apresentado como suporte a articulações, cartilagem e mobilidade, sem prometer tratamento de dor ou lesões.',
 benefits: [
 'Suporte à saúde das articulações',
 'Apoio à manutenção da cartilagem',
 'Apoio à mobilidade no dia a dia',
 'Fórmula com condroitina, glucosamina e colágeno tipo II',
 'Sem glúten e lactose ',
 ],
 facts: ['60 cápsulas', 'condroitina', 'glucosamina', 'colágeno tipo II'],
 tags: ['osteo flex', 'articulacao', 'articulacoes', 'cartilagem', 'mobilidade', 'juntas'],
 },
 'melatonina-liquida-dark-wolf': {
 sourcePage: 24,
 description:
 'Melatonina Líquida Dark Wolf em frasco de 30ml. O frasco rende 600 gotas/porções, com 0,21mg de melatonina por gota. É voltado ao suporte do ciclo sono-vigília e à qualidade do descanso.',
 benefits: [
 'Suporte à regulação do ciclo sono-vigília',
 'Apoio à qualidade do sono',
 'Formato líquido em gotas',
 'Pode complementar uma rotina de descanso, sem substituir avaliação para insônia persistente',
 'Informação objetiva de concentração disponível ',
 ],
 facts: ['30ml', '600 porções/gotas ', '0,21mg de melatonina por gota '],
 tags: ['melatonina', 'sono', 'dormir', 'ciclo do sono', 'descanso', 'bem estar'],
 },
 'nac-600mg-dark-wolf': {
 sourcePage: 25,
 description:
 'NAC Dark Wolf com 60 cápsulas de 600mg de N-acetil L-cisteína. O produto é voltado para suporte antioxidante, produção de glutationa, saúde celular, função respiratória e recuperação em rotinas intensas.',
 benefits: [
 'Suporte antioxidante',
 'Suporte à produção de glutationa',
 'Apoio à saúde celular',
 'Suporte à função respiratória',
 'Apoio à recuperação em rotinas de treino intenso',
 ],
 facts: ['60 cápsulas', '600mg de N-acetil L-cisteína'],
 tags: ['nac', 'n acetilcisteina', 'antioxidante', 'glutationa', 'respiratorio', 'imunidade', 'recuperacao'],
 },
 'vitamina-b12-metilcobalamina-dark-wolf': {
 sourcePage: 26,
 description:
 'Vitamina B12 Metilcobalamina Dark Wolf com 120 cápsulas. A vitamina B12 contribui no metabolismo energético, formação de glóbulos vermelhos e funcionamento do sistema nervoso, além de foco e concentração.',
 benefits: [
 'Contribui para o metabolismo energético',
 'Participa da formação de glóbulos vermelhos',
 'Suporte ao funcionamento do sistema nervoso',
 'Suporte a foco e concentração',
 'Forma metilcobalamina',
 ],
 facts: ['120 cápsulas', 'vitamina B12 na forma metilcobalamina'],
 tags: ['vitamina b12', 'b12', 'metilcobalamina', 'energia', 'metabolismo energetico', 'globulos vermelhos', 'sistema nervoso', 'foco'],
 },
 'trans-resveratrol-dark-wolf': {
 sourcePage: 27,
 description:
 'Trans Resveratrol Dark Wolf com 60 cápsulas. Cada cápsula fornece 30mg de trans-resveratrol por cápsulae o posiciona para suporte antioxidante, saúde celular, equilíbrio metabólico, saúde cardiovascular e pele.',
 benefits: [
 'Ação antioxidante',
 'Suporte à saúde celular',
 'Suporte à saúde cardiovascular',
 'Apoio ao equilíbrio metabólico',
 'Suporte à saúde da pele',
 ],
 facts: ['60 cápsulas', '30mg de trans-resveratrol por cápsula'],
 tags: ['resveratrol', 'trans resveratrol', 'antioxidante', 'saude celular', 'saude cardiovascular', 'coracao', 'pele', 'metabolismo'],
 },
 'vitamina-c-1000mg-dark-wolf': {
 sourcePage: 28,
 description:
 'Vitamina C Dark Wolf com 60 cápsulas de 1000mg. A vitamina C oferece suporte ao sistema imunológico, proteção antioxidante, absorção de ferro, formação de colágeno e manutenção da saúde da pele.',
 benefits: [
 'Suporte ao sistema imunológico',
 'Ação antioxidante',
 'Auxilia na absorção de ferro',
 'Auxilia na formação de colágeno',
 'Suporte à saúde da pele e bem-estar geral',
 ],
 facts: ['60 cápsulas', '1000mg de vitamina C'],
 tags: ['vitamina c', 'imunidade', 'antioxidante', 'ferro', 'colageno', 'pele', 'saude geral'],
 },
};

export function getDarkWolfCatalogKnowledge(
 slug: string | null | undefined,
): DarkWolfCatalogKnowledge | null {
 if (!slug) return null;
 return DARK_WOLF_CATALOG_KNOWLEDGE[slug] ?? null;
}
