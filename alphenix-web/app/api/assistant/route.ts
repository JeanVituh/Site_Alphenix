import { NextRequest, NextResponse } from 'next/server';
import { searchCatalog } from '@/lib/assistant/catalog';
import { ALPHENIX_ASSISTANT_PROMPT } from '@/lib/assistant/prompt';
import type {
  AssistantApiResponse,
  AssistantHistoryMessage,
  AssistantProductRecommendation,
} from '@/lib/assistant/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GROQ_URL = 'https://api.groq.com/openai/v1/responses';
const MAX_HISTORY = 8;
const MAX_MESSAGE_LENGTH = 500;
const MAX_TOOL_ROUNDS = 2;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 30;

const tools = [
  {
    type: 'function',
    name: 'buscar_produtos',
    description:
      'Pesquisa produtos REAIS do catálogo Alphenix. Use antes de citar ou recomendar produto, preço, estoque, sabor, tamanho ou promoção.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: ['string', 'null'],
          description:
            'Texto livre para buscar nome, marca, característica ou sabor. Use null quando a categoria já for suficiente.',
        },
        evidence_query: {
          type: ['string', 'null'],
          description:
            'Filtro estrito para objetivo/benefício. A busca considera o cadastro do Supabase e, para produtos Dark Wolf, o conhecimento curado do catálogo oficial incorporado no servidor. Use quando a indicação depender de evidência textual real (ex.: "imunidade", "sono", "foco").',
        },
        category: {
          type: ['string', 'null'],
          enum: [
            'proteinas',
            'creatinas',
            'pre-treino',
            'termogenicos e energia',
            'vitaminas e minerais',
            'bem-estar e sono',
            'hipercaloricos',
            'combos e outros',
            null,
          ],
          description: 'Categoria exata do catálogo, ou null.',
        },
        max_price: {
          type: ['number', 'null'],
          description: 'Preço máximo em reais, ou null se o cliente não definiu orçamento.',
        },
        in_stock_only: {
          type: ['boolean', 'null'],
          description:
            'Use true SOMENTE quando o cliente exigir explicitamente pronta entrega/estoque imediato. false/null permite pronta entrega e também encomenda. Se true não encontrar nada, o servidor buscará automaticamente opções por encomenda para oferecer como alternativa.',
        },
        limit: {
          type: ['integer', 'null'],
          description: 'Quantidade desejada de resultados. Normalmente 3.',
        },
      },
      additionalProperties: false,
    },
  },
] as const;

type GroqOutputItem = {
  type?: string;
  name?: string;
  arguments?: string;
  call_id?: string;
  content?: Array<{ type?: string; text?: string; refusal?: string }>;
  [key: string]: unknown;
};

type GroqResponsePayload = {
  id?: string;
  output?: GroqOutputItem[];
  error?: { message?: string } | null;
};

class GroqRateLimitError extends Error {
  retryAfterSeconds: number | null;

  constructor(retryAfterSeconds: number | null) {
    super('GROQ_RATE_LIMIT');
    this.name = 'GroqRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous';
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

function sanitizeHistory(value: unknown): AssistantHistoryMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is AssistantHistoryMessage => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<AssistantHistoryMessage>;
      return (
        (candidate.role === 'user' || candidate.role === 'assistant') &&
        typeof candidate.content === 'string' &&
        candidate.content.trim().length > 0
      );
    })
    .slice(-MAX_HISTORY)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function cleanPlainTextReply(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractText(response: GroqResponsePayload): string {
  const chunks: string[] = [];

  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' && part.text) chunks.push(part.text);
      if (part.type === 'refusal' && part.refusal) chunks.push(part.refusal);
    }
  }

  return cleanPlainTextReply(chunks.join('\n'));
}

async function callGroq(
  input: unknown[],
  allowShortRetry = true,
): Promise<GroqResponsePayload> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY_NOT_CONFIGURED');
  }

  const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: ALPHENIX_ASSISTANT_PROMPT,
      input,
      tools,
      tool_choice: 'auto',
      // GPT-OSS 20B suporta tool calling, mas não chamadas locais paralelas.
      parallel_tool_calls: false,
      reasoning: { effort: 'low' },
      // Respostas curtas reduzem bastante o consumo do Free Tier.
      max_output_tokens: 350,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const payload = (await response.json()) as GroqResponsePayload;

  if (!response.ok) {
    if (response.status === 429) {
      const retryHeader = response.headers.get('retry-after');
      const parsedRetry = retryHeader ? Number.parseFloat(retryHeader) : Number.NaN;
      const retryAfterSeconds = Number.isFinite(parsedRetry)
        ? Math.max(1, Math.ceil(parsedRetry))
        : null;

      console.warn('[Alphenix Assistant] Groq 429', {
        retryAfterSeconds,
        remainingRequests: response.headers.get('x-ratelimit-remaining-requests'),
        remainingTokens: response.headers.get('x-ratelimit-remaining-tokens'),
        resetRequests: response.headers.get('x-ratelimit-reset-requests'),
        resetTokens: response.headers.get('x-ratelimit-reset-tokens'),
      });

      // Quando for apenas um pico muito curto, esperamos uma única vez.
      // Para limites maiores (TPM/TPD/RPD), caímos imediatamente no modo catálogo.
      if (allowShortRetry && retryAfterSeconds !== null && retryAfterSeconds <= 2) {
        await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000 + 150));
        return callGroq(input, false);
      }

      throw new GroqRateLimitError(retryAfterSeconds);
    }
    throw new Error(payload.error?.message || `Groq HTTP ${response.status}`);
  }

  return payload;
}

function parseToolArgs(raw: string | undefined): {
  query?: string | null;
  evidence_query?: string | null;
  category?: string | null;
  max_price?: number | null;
  in_stock_only?: boolean | null;
  limit?: number | null;
} {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeFallbackText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const CATALOG_CATEGORIES = new Set([
  'proteinas',
  'creatinas',
  'pre-treino',
  'termogenicos e energia',
  'vitaminas e minerais',
  'bem-estar e sono',
  'hipercaloricos',
  'combos e outros',
]);

function sanitizeShownProductSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => /^[a-z0-9-]{1,120}$/.test(item)),
    ),
  ].slice(0, 80);
}

function sanitizeRecommendationCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => normalizeFallbackText(item).trim())
        .filter((item) => CATALOG_CATEGORIES.has(item)),
    ),
  ].slice(0, 4);
}

function asksForMoreProducts(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /\b(?:mais opcoes|mais produtos|outras opcoes|outros produtos|outros|outras|mostrar mais|mostra mais|ver mais|quero mais|tem mais|mais whey|mais creatina|mais creatinas|mais pre[- ]?treino|mais vitaminas?|mais magnesio)\b/.test(
    normalized,
  );
}

function appendMoreOptionsOffer(reply: string, hasMore: boolean): string {
  if (!hasMore) return reply;
  if (/posso te mostrar mais|mostrar mais opcoes|ver mais opcoes/i.test(reply)) return reply;
  return `${reply.trim()}\n\nSe quiser, posso te mostrar mais opções.`;
}

function categoryDisplayName(category: string): string {
  const labels: Record<string, string> = {
    proteinas: 'proteínas e wheys',
    creatinas: 'creatinas',
    'pre-treino': 'pré-treinos',
    'termogenicos e energia': 'termogênicos e energia',
    'vitaminas e minerais': 'vitaminas e minerais',
    'bem-estar e sono': 'bem-estar e sono',
    hipercaloricos: 'hipercalóricos',
    'combos e outros': 'combos e acessórios',
  };
  return labels[category] ?? 'produtos';
}

function fallbackBudget(text: string): number | null {
  const normalized = normalizeFallbackText(text);
  const moneyMatch = normalized.match(/r\$\s*(\d{1,4}(?:[.,]\d{1,2})?)/i);
  const budgetMatch = normalized.match(
    /(?:ate|no maximo|maximo|max|orcamento|tenho|gastar|por menos de|menos de|abaixo de|por ate)\s+(?:de\s+)?(?:r\$\s*)?(\d{1,4}(?:[.,]\d{1,2})?)/i,
  );
  const raw = moneyMatch?.[1] ?? budgetMatch?.[1];
  if (!raw) return null;
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function fallbackStockOnly(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /pronta entrega|em estoque|estoque imediato|entrega hoje|preciso hoje|disponivel agora|para hoje|pra hoje/.test(normalized);
}

function hasConcentratedWheyIntent(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return (
    /whey[^.!?\n]{0,40}concentrad/.test(normalized) ||
    /concentrad[^.!?\n]{0,40}whey/.test(normalized) ||
    /\bwpc\b/.test(normalized)
  );
}

function concentratedWheyBrandQuery(text: string): string | null {
  const normalized = normalizeFallbackText(text);
  if (/dark wolf/.test(normalized)) return 'dark wolf whey concentrado';
  if (/integralmedica|integral medica/.test(normalized)) return 'integralmedica whey concentrado';
  if (/probiotica/.test(normalized)) return 'probiotica whey concentrado';
  if (/max titanium|ramon dino/.test(normalized)) return 'max titanium whey concentrado';
  if (/\bdux\b/.test(normalized)) return 'dux whey concentrado';
  return null;
}

function fallbackHasHealthContext(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /gravidez|gravida|amament|pressao alta|hipertens|cardiac|coracao|medicamento|remedio|reacao adversa|doenca|menor de idade/.test(
    normalized,
  );
}

function hasWeightLossIntent(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /emagrec|perder (?:peso|gordura)|perda de (?:peso|gordura)|reduzir gordura|definicao|secar/.test(
    normalized,
  );
}

function explicitlyRequestsPreWorkout(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /pre[- ]?treino|energia (?:no|para o) treino|desempenho no treino/.test(normalized);
}

function explicitlyRequestsProtein(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /whey|proteina/.test(normalized);
}

function explicitlyRequestsHypercaloric(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /hipercalor|ganhar peso|aumentar peso/.test(normalized);
}

function hasStimulantRestriction(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /sem cafeina|nao (?:quero|posso|gosto de) cafeina|sensivel a cafeina|sensibilidade a cafeina|evitar estimulante|sem estimulante/.test(
    normalized,
  );
}

function applyRecommendationPolicy(
  args: ReturnType<typeof parseToolArgs>,
  lastUserMessage: string,
  recentContext: string,
  recentUserContext: string,
): ReturnType<typeof parseToolArgs> {
  const userBudget =
    fallbackBudget(lastUserMessage) ?? fallbackBudget(recentUserContext);
  const userAskedReadyStock = fallbackStockOnly(lastUserMessage);

  let safeArgs: ReturnType<typeof parseToolArgs> = {
    ...args,
    // O mascote não pode transformar uma busca comum em "somente pronta entrega".
    // Só aplicamos esse filtro quando o próprio cliente pediu isso explicitamente.
    in_stock_only: userAskedReadyStock,
  };

  if (userBudget !== null) {
    safeArgs = { ...safeArgs, max_price: userBudget };
  }

  const weightLoss = hasWeightLossIntent(recentContext);
  if (!weightLoss) return safeArgs;

  // Em emagrecimento, hipercalórico não é uma sugestão coerente por padrão.
  // Só respeitamos essa categoria se o próprio cliente a pedir explicitamente.
  if (safeArgs.category === 'hipercaloricos' && !explicitlyRequestsHypercaloric(lastUserMessage)) {
    return { ...safeArgs, query: null, category: 'termogenicos e energia' };
  }

  // Pré-treino também não é o padrão para emagrecimento. Só entra quando
  // a pessoa pediu especificamente energia/desempenho/pré-treino.
  if (safeArgs.category === 'pre-treino' && !explicitlyRequestsPreWorkout(lastUserMessage)) {
    return { ...safeArgs, query: null, category: 'termogenicos e energia' };
  }

  // Em uma pergunta ampla como "quero emagrecer, o que recomenda?", a
  // busca principal deve ser pelos termogênicos reais da loja. Se a pessoa
  // pediu whey/proteína explicitamente, preservamos a categoria de proteínas.
  if (
    !safeArgs.category &&
    !explicitlyRequestsProtein(lastUserMessage) &&
    !explicitlyRequestsPreWorkout(lastUserMessage) &&
    !explicitlyRequestsHypercaloric(lastUserMessage)
  ) {
    return { ...safeArgs, query: null, category: 'termogenicos e energia' };
  }

  return safeArgs;
}

function filterRecommendationsForIntent(
  products: AssistantProductRecommendation[],
  lastUserMessage: string,
  recentContext: string,
): AssistantProductRecommendation[] {
  if (!hasWeightLossIntent(recentContext)) return products;

  const avoidStimulants =
    fallbackHasHealthContext(recentContext) || hasStimulantRestriction(recentContext);

  return products.filter((product) => {
    const category = normalizeFallbackText(product.category);
    if (category === 'hipercaloricos' && !explicitlyRequestsHypercaloric(lastUserMessage)) {
      return false;
    }
    if (category === 'pre-treino' && !explicitlyRequestsPreWorkout(lastUserMessage)) {
      return false;
    }
    if (
      avoidStimulants &&
      (category === 'termogenicos e energia' || category === 'pre-treino')
    ) {
      return false;
    }
    return true;
  });
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function buildGroundedWeightLossReply(
  products: AssistantProductRecommendation[],
): string {
  if (!products.length) {
    return 'Para perda de gordura, alimentação e déficit calórico são a base. Não encontrei agora uma opção compatível no catálogo para recomendar com segurança.';
  }

  const lines = products.slice(0, 3).map((product, index) => {
    const ready = product.variants.some((variant) => variant.stock > 0);
    const availability = ready ? 'pronta entrega' : 'disponível por encomenda';
    const benefit = product.benefits.slice(0, 2).join('; ');
    return `${index + 1}️⃣ ${product.name} — a partir de ${formatBRL(product.minPrice)} (${availability})${benefit ? ` · ${benefit}` : ''}`;
  });

  const hasThermogenic = products.some(
    (product) => normalizeFallbackText(product.category) === 'termogenicos e energia',
  );

  const intro = hasThermogenic
    ? 'Para perda de gordura, alimentação e déficit calórico são a base. No catálogo da Alphenix, eu começaria pelas opções de Termogênicos & Energia; elas não emagrecem sozinhas, mas podem complementar a rotina se você não tiver restrição a estimulantes.'
    : 'Para perda de gordura, alimentação e déficit calórico são a base. Separei opções do catálogo que combinam com o que você pediu, sem incluir hipercalóricos.';

  return `${intro}\n\n${lines.join('\n')}\n\nConfira os cards abaixo para ver as variações e o status de cada opção.`;
}


function hasVitaminWellnessTopic(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /vitamina|mineral|multivitamin|magnes|omega\s*3|b12|d3|coenzima|q10|nac|resveratrol|cromo|picolinato|melatonina|sleep zen|sono|dormir|bem estar|saude geral|imunidade|ossos|saude ossea|articulac|cartilagem|mobilidade|cabelo|unhas|pele|foco|concentrac|memoria|antioxidante|saude cardiovascular|vitalidade|disposicao|energia no dia a dia|respirator/.test(
    normalized,
  );
}

function hasSymptomOrDiagnosisContext(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /cansac|fadiga persistente|fraqueza|tontura|anemia|queda de cabelo|caibra|cambra|deficiencia|exame|diagnostic|insonia|dor persistente|lesao|sintoma|tratamento|ansiedade|depressao|panico|diabetes|cancer|hipertens|pressao alta|colesterol alto|doenca renal|doenca hepatica/.test(
    normalized,
  );
}

function asksForTreatmentOrDose(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /o que (?:eu )?(?:tomo|tomar)|qual (?:vitamina|suplemento) (?:eu )?(?:tomo|tomar)|quanto (?:eu )?(?:tomo|tomar)|qual dose|dosagem|tratar|tratamento|preciso tomar|devo tomar|cura|prevenir doenca/.test(
    normalized,
  );
}

function asksOnlyAvailability(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /\btem\b|\btemos\b|vende|voces tem|vocês tem|disponivel|estoque|encomenda/.test(normalized);
}

function isGenericVitaminQuestion(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  const mentionsSpecific = /vitamina\s*c\b|vitamina\s*d3?\b|\bb12\b|magnes|omega\s*3|multivitamin|coenzima|\bq10\b|\bnac\b|resveratrol|picolinato|cromo|melatonina|sleep zen|osteo flex/.test(
    normalized,
  );
  const mentionsObjective = /sono|dormir|foco|concentrac|memoria|saude geral|imunidade|ossos|articulac|cabelo|unhas|pele|antioxidante|cardiovascular|vitalidade|disposicao/.test(
    normalized,
  );
  return /qual vitamina|vitamina recomenda|recomenda.*vitamina|alguma vitamina/.test(normalized) && !mentionsSpecific && !mentionsObjective;
}

type VitaminCatalogIntent = {
  query?: string | null;
  evidence_query?: string | null;
  category?: string | null;
  label: string;
};

function detectSpecificVitaminIntent(text: string): VitaminCatalogIntent | null {
  const normalized = normalizeFallbackText(text);

  if (/vitamina\s*c\b/.test(normalized)) {
    return { query: 'vitamina-c-1000mg-dark-wolf', category: 'vitaminas e minerais', label: 'vitamina C' };
  }
  if (/vitamina\s*d3?\b/.test(normalized)) {
    return { query: 'vitamina-d3-2000ui-dark-wolf', category: 'vitaminas e minerais', label: 'vitamina D3' };
  }
  if (/\bb12\b|metilcobalamina/.test(normalized)) {
    return { query: 'vitamina-b12-metilcobalamina-dark-wolf', category: 'vitaminas e minerais', label: 'vitamina B12' };
  }
  if (/multivitamin.*kids|kids.*multivitamin/.test(normalized)) {
    return { query: 'multivitaminico-kids-az-dark-wolf', category: 'vitaminas e minerais', label: 'multivitamínico infantil' };
  }
  if (/multivitamin/.test(normalized)) {
    return { query: 'multivitaminico-az-dark-wolf', category: 'vitaminas e minerais', label: 'multivitamínico' };
  }
  if (/magnesio l[- ]?treonato|l[- ]?treonato/.test(normalized)) {
    return { query: 'magnesio-l-treonato-ultra-dark-wolf', category: 'vitaminas e minerais', label: 'magnésio L-treonato' };
  }
  if (/magnesio inositol/.test(normalized)) {
    return { query: 'magnesio-inositol-dark-wolf', category: 'vitaminas e minerais', label: 'magnésio com inositol' };
  }
  if (/mag[- ]?six/.test(normalized)) {
    return { query: 'mag-six-dark-wolf', category: 'vitaminas e minerais', label: 'Mag-Six' };
  }
  if (/magnes/.test(normalized)) {
    return { query: 'magnesio', category: 'vitaminas e minerais', label: 'magnésio' };
  }
  if (/omega\s*3/.test(normalized)) {
    return { query: 'omega-3-1000mg-dark-wolf', category: 'vitaminas e minerais', label: 'ômega 3' };
  }
  if (/coenzima\s*q10|\bq10\b/.test(normalized)) {
    return { query: 'coenzima q10', category: 'vitaminas e minerais', label: 'coenzima Q10' };
  }
  if (/\bnac\b|acetilcisteina/.test(normalized)) {
    return { query: 'nac-600mg-dark-wolf', category: 'vitaminas e minerais', label: 'NAC' };
  }
  if (/resveratrol/.test(normalized)) {
    return { query: 'trans-resveratrol-dark-wolf', category: 'vitaminas e minerais', label: 'resveratrol' };
  }
  if (/picolinato|\bcromo\b/.test(normalized)) {
    return { query: 'picolinato-de-cromo-250mcg-dark-wolf', category: 'vitaminas e minerais', label: 'picolinato de cromo' };
  }
  if (/osteo flex/.test(normalized)) {
    return { query: 'osteo-flex-dark-wolf', category: 'vitaminas e minerais', label: 'Osteo Flex' };
  }
  if (/melatonina/.test(normalized)) {
    return { query: 'melatonina-liquida-dark-wolf', category: 'bem-estar e sono', label: 'melatonina' };
  }
  if (/sleep zen/.test(normalized)) {
    return { query: 'sleep-zen-dark-wolf', category: 'bem-estar e sono', label: 'Sleep Zen' };
  }

  return null;
}

function productAvailability(product: AssistantProductRecommendation): string {
  return product.variants.some((variant) => variant.stock > 0)
    ? 'pronta entrega'
    : 'disponível por encomenda';
}

function buildNeutralCatalogList(
  intro: string,
  products: AssistantProductRecommendation[],
  hasMore = false,
): string {
  if (!products.length) return intro;

  const lines = products.slice(0, 3).map((product, index) => {
    const benefits = product.benefits.slice(0, 2).join('; ');
    const detail = benefits
      ? ` — ${benefits}`
      : product.description
        ? ` — ${product.description}`
        : '';
    return `${index + 1}️⃣ ${product.name}${detail}`;
  });

  const base = `${intro}\n\n${lines.join('\n')}\n\nVeja os produtos nos cards abaixo 👇`;
  return appendMoreOptionsOffer(base, hasMore);
}

async function searchPrioritizedProducts(
  slugs: string[],
  maxPrice: number | null,
  stockOnly: boolean,
  limit = 3,
): Promise<AssistantProductRecommendation[]> {
  const load = async (inStockOnly: boolean) => {
    const groups = await Promise.all(
      slugs.map((slug) =>
        searchCatalog({
          query: slug,
          max_price: maxPrice,
          in_stock_only: inStockOnly,
          limit: 1,
        }),
      ),
    );
    return groups.flat();
  };

  let products = await load(stockOnly);
  if (!products.length && stockOnly) products = await load(false);

  const bySlug = new Map(products.map((product) => [product.slug, product]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is AssistantProductRecommendation => Boolean(product))
    .slice(0, limit);
}

function wellnessGoalSlugs(
  normalized: string,
  avoidStimulants: boolean,
): { intro: string; slugs: string[] } | null {
  if (/imunidade|sistema imunologico|baixa imunidade/.test(normalized)) {
    return {
      intro: 'Para suporte à imunidade, selecionei opções com nutrientes e características relacionados a esse objetivo. Isso é suporte nutricional, não tratamento ou prevenção de doenças.',
      slugs: [
        'vitamina-c-1000mg-dark-wolf',
        'vitamina-d3-2000ui-dark-wolf',
        'multivitaminico-az-dark-wolf',
        'nac-600mg-dark-wolf',
        'omega-3-1000mg-dark-wolf',
        'mag-six-dark-wolf',
      ],
    };
  }

  if (/articulac|cartilagem|mobilidade|juntas/.test(normalized)) {
    return {
      intro: 'Para suporte às articulações e mobilidade, a opção mais diretamente relacionada é o Osteo Flex. Não vou tratar isso como solução para dor ou lesão.',
      slugs: ['osteo-flex-dark-wolf'],
    };
  }

  if (/ossos|saude ossea/.test(normalized)) {
    return {
      intro: 'Para suporte à saúde óssea, estas são as opções com relação mais direta com esse objetivo.',
      slugs: ['vitamina-d3-2000ui-dark-wolf', 'mag-six-dark-wolf'],
    };
  }

  if (/sono|dormir|descanso|relaxamento|bem estar/.test(normalized)) {
    return {
      intro: 'Para sono e relaxamento, selecionei opções voltadas à qualidade do descanso e ao relaxamento. Elas não são tratamento para insônia ou ansiedade.',
      slugs: [
        // Os três primeiros são os mais diretamente ligados ao pedido amplo de sono.
        // Como a resposta mostra no máximo 3 cards, a melatonina precisa estar no topo
        // da prioridade para não ser cortada pelos magnésios.
        'sleep-zen-dark-wolf',
        'melatonina-liquida-dark-wolf',
        'magnesio-inositol-dark-wolf',
        'magnesio-l-treonato-ultra-dark-wolf',
        'mag-six-dark-wolf',
      ],
    };
  }

  if (/foco|concentrac|atencao|memoria|desempenho mental/.test(normalized)) {
    const slugs = [
      'magnesio-l-treonato-ultra-dark-wolf',
      'magnesio-inositol-dark-wolf',
      'vitamina-b12-metilcobalamina-dark-wolf',
      'mag-six-dark-wolf',
    ];
    if (!avoidStimulants) slugs.unshift('neuro-focus-dark-wolf');
    return {
      intro: avoidStimulants
        ? 'Para foco e memória, como você mencionou uma restrição a estimulantes/saúde, deixei de fora as opções com cafeína e selecionei alternativas sem esse tipo de estimulante.'
        : 'Para foco e concentração, selecionei opções diretamente relacionadas a esse objetivo. O Neuro Focus contém cafeína, então vale considerar sua sensibilidade a estimulantes.',
      slugs,
    };
  }

  if (/pele|cabelo|unhas|colageno/.test(normalized)) {
    return {
      intro: 'Para pele e cabelos, selecionei somente produtos com benefícios relacionados a esse objetivo.',
      slugs: [
        'multivitaminico-az-dark-wolf',
        'vitamina-c-1000mg-dark-wolf',
        'trans-resveratrol-dark-wolf',
      ],
    };
  }

  if (/antioxidante|radicais livres|estresse oxidativo/.test(normalized)) {
    return {
      intro: 'Para suporte antioxidante, selecionei opções que têm essa característica descrita entre seus benefícios.',
      slugs: [
        'nac-600mg-dark-wolf',
        'trans-resveratrol-dark-wolf',
        'coenzima-q10-200mg-dark-wolf',
        'vitamina-c-1000mg-dark-wolf',
      ],
    };
  }

  if (/saude cardiovascular|saude do coracao|coracao saudavel/.test(normalized)) {
    return {
      intro: 'Para suporte cardiovascular geral, selecionei opções com benefícios relacionados a esse objetivo. Se houver doença, sintomas ou uso de medicação, a escolha deve ser confirmada com um profissional de saúde.',
      slugs: [
        'omega-3-1000mg-dark-wolf',
        'coenzima-q10-100mg-dark-wolf',
        'coenzima-q10-200mg-dark-wolf',
        'trans-resveratrol-dark-wolf',
      ],
    };
  }

  if (/respirator/.test(normalized)) {
    return {
      intro: 'Para suporte respiratório geral, o NAC é a opção com relação mais direta a esse objetivo. Isso não substitui avaliação de sintomas respiratórios.',
      slugs: ['nac-600mg-dark-wolf'],
    };
  }

  if (/vitalidade|disposicao|energia no dia a dia|mais energia/.test(normalized)) {
    return {
      intro: 'Para disposição e energia no dia a dia, selecionei opções relacionadas ao metabolismo energético e à vitalidade. Se o cansaço for persistente, isso merece avaliação profissional em vez de escolher suplemento no escuro.',
      slugs: [
        'multivitaminico-az-dark-wolf',
        'coenzima-q10-100mg-dark-wolf',
        'vitamina-b12-metilcobalamina-dark-wolf',
      ],
    };
  }

  if (/saude geral|equilibrio do organismo|dia a dia/.test(normalized)) {
    return {
      intro: 'Para uma opção geral de rotina, selecionei produtos voltados ao aporte de micronutrientes e à saúde geral. Isso não significa que você tenha deficiência ou precise suplementar.',
      slugs: [
        'multivitaminico-az-dark-wolf',
        'omega-3-1000mg-dark-wolf',
        'vitamina-c-1000mg-dark-wolf',
      ],
    };
  }

  return null;
}

async function buildVitaminWellnessResponse(
  history: AssistantHistoryMessage[],
  shownProductSlugs: string[],
): Promise<AssistantApiResponse | null> {
  const lastUserMessage = [...history].reverse().find((message) => message.role === 'user')?.content ?? '';
  if (!lastUserMessage) return null;

  const recentContext = history
    .slice(-6)
    .map((message) => message.content)
    .join(' ');
  const recentUserContext = history
    .filter((message) => message.role === 'user')
    .slice(-4)
    .map((message) => message.content)
    .join(' ');

  const wantsMore = asksForMoreProducts(lastUserMessage);
  const topicContext = wantsMore ? recentContext : lastUserMessage;
  if (!hasVitaminWellnessTopic(topicContext)) return null;

  const specific = detectSpecificVitaminIntent(lastUserMessage);
  const filterContext = wantsMore ? recentUserContext : lastUserMessage;
  const stockOnly = fallbackStockOnly(filterContext);
  const maxPrice = fallbackBudget(filterContext);

  if (
    (hasSymptomOrDiagnosisContext(recentUserContext) || asksForTreatmentOrDose(lastUserMessage)) &&
    !(specific && asksOnlyAvailability(lastUserMessage))
  ) {
    return {
      reply:
        'Como você mencionou sintoma, diagnóstico, deficiência ou uma dúvida de dose/tratamento, não é seguro eu escolher um suplemento para você. Posso mostrar produtos que a Alphenix vende, mas para decidir o que usar ou a dose, confirme com médico ou nutricionista.',
      products: [],
    };
  }

  if (isGenericVitaminQuestion(lastUserMessage)) {
    return {
      reply:
        'Claro. Qual é seu objetivo? Posso te ajudar com saúde geral, imunidade, ossos/articulações, sono/relaxamento, foco/memória, pele/cabelos ou um item específico como vitamina C, D3, B12, magnésio, ômega 3 ou multivitamínico.',
      products: [],
    };
  }

  if (specific) {
    let products = await searchCatalog({
      query: specific.query,
      category: specific.category,
      max_price: maxPrice,
      in_stock_only: stockOnly,
      limit: 3,
    });

    if (!products.length && stockOnly) {
      products = await searchCatalog({
        query: specific.query,
        category: specific.category,
        max_price: maxPrice,
        in_stock_only: false,
        limit: 4,
      });
    }

    const intro = products.length
      ? `Encontrei ${specific.label} no catálogo da Alphenix. As informações abaixo usam o cadastro da loja e o catálogo oficial Dark Wolf; não vou transformar isso em diagnóstico ou prescrição.`
      : `Não encontrei ${specific.label} compatível com esse filtro no catálogo agora.`;

    return {
      reply: buildNeutralCatalogList(intro, products),
      products: products.slice(0, 3),
    };
  }

  const normalized = normalizeFallbackText(topicContext);
  const avoidStimulants =
    hasStimulantRestriction(recentUserContext) || fallbackHasHealthContext(recentUserContext);
  const goal = wellnessGoalSlugs(normalized, avoidStimulants);

  if (goal) {
    const allProducts = await searchPrioritizedProducts(
      goal.slugs,
      maxPrice,
      stockOnly,
      goal.slugs.length,
    );

    const shown = new Set(shownProductSlugs);
    const availableProducts = wantsMore
      ? allProducts.filter((product) => !shown.has(product.slug))
      : allProducts;
    const products = availableProducts.slice(0, 3);
    const hasMore = availableProducts.length > products.length;

    if (!products.length) {
      return {
        reply: wantsMore
          ? 'Essas eram as opções mais relacionadas a esse objetivo no catálogo agora. Se quiser, posso te ajudar a comparar as que já mostrei.'
          : 'Entendi o objetivo, mas não encontrei uma opção compatível com esse filtro no catálogo agora. Posso tentar outra faixa de preço ou mostrar opções disponíveis por encomenda.',
        products: [],
      };
    }

    const intro = wantsMore
      ? 'Claro! Separei mais algumas opções relacionadas ao mesmo objetivo, sem repetir as anteriores.'
      : goal.intro;

    return {
      reply: buildNeutralCatalogList(intro, products, hasMore),
      products,
    };
  }

  return null;
}


async function buildMoreProductsResponse(
  history: AssistantHistoryMessage[],
  shownProductSlugs: string[],
  lastRecommendationCategories: string[],
): Promise<AssistantApiResponse | null> {
  const lastUserMessage =
    [...history].reverse().find((message) => message.role === 'user')?.content ?? '';
  if (!lastUserMessage || !asksForMoreProducts(lastUserMessage)) return null;

  const recentContext = history
    .slice(-6)
    .map((message) => message.content)
    .join(' ');

  const explicitCategories = fallbackCategories(lastUserMessage);
  const categories =
    explicitCategories.length > 0
      ? explicitCategories
      : lastRecommendationCategories.length > 0
        ? lastRecommendationCategories
        : fallbackCategories(recentContext);

  if (!categories.length) {
    return {
      reply:
        'Claro. Mais opções de qual tipo você quer ver? Posso mostrar, por exemplo, mais wheys, creatinas, pré-treinos, vitaminas ou produtos para sono.',
      products: [],
    };
  }

  const shown = new Set(shownProductSlugs);
  const recentUserContext = history
    .filter((message) => message.role === 'user')
    .slice(-4)
    .map((message) => message.content)
    .join(' ');
  const maxPrice = fallbackBudget(recentUserContext);
  const inStockOnly = fallbackStockOnly(recentUserContext);

  const concentratedWheyContext = hasConcentratedWheyIntent(recentUserContext);

  const load = async (stockOnly: boolean) => {
    if (concentratedWheyContext && categories.includes('proteinas')) {
      return searchCatalog({
        query: 'whey concentrado',
        category: 'proteinas',
        max_price: maxPrice,
        in_stock_only: stockOnly,
        limit: 24,
      });
    }

    const groups = await Promise.all(
      categories.map((category) =>
        searchCatalog({
          category,
          max_price: maxPrice,
          in_stock_only: stockOnly,
          limit: 24,
        }),
      ),
    );
    return groups.flat();
  };

  let candidates = await load(inStockOnly);
  if (!candidates.length && inStockOnly) candidates = await load(false);

  const remaining = [
    ...new Map(
      candidates
        .filter((product) => !shown.has(product.slug))
        .map((product) => [product.slug, product]),
    ).values(),
  ];

  const products = remaining.slice(0, 3);
  const hasMore = remaining.length > products.length;

  if (!products.length) {
    return {
      reply:
        'Por enquanto, essas eram as opções dessa categoria que eu tinha para te mostrar. Se quiser, posso comparar as anteriores ou procurar outra categoria/faixa de preço.',
      products: [],
    };
  }

  const label =
    categories.length === 1
      ? categoryDisplayName(categories[0])
      : 'produtos relacionados ao seu objetivo';

  const intro = `Claro! Aqui vão mais ${label}, sem repetir os que já mostrei.`;
  return {
    reply: buildNeutralCatalogList(intro, products, hasMore),
    products,
  };
}


async function buildConcentratedWheyResponse(
  history: AssistantHistoryMessage[],
): Promise<AssistantApiResponse | null> {
  const lastUserMessage =
    [...history].reverse().find((message) => message.role === 'user')?.content ?? '';
  if (!lastUserMessage) return null;

  const recentUserContext = history
    .filter((message) => message.role === 'user')
    .slice(-4)
    .map((message) => message.content)
    .join(' ');

  // Um pedido atual por isolado substitui o contexto anterior de concentrado.
  if (/isolad/.test(normalizeFallbackText(lastUserMessage))) return null;
  if (!hasConcentratedWheyIntent(recentUserContext)) return null;

  const maxPrice =
    fallbackBudget(lastUserMessage) ?? fallbackBudget(recentUserContext);
  const inStockOnly = fallbackStockOnly(lastUserMessage);
  const brandQuery = concentratedWheyBrandQuery(lastUserMessage);
  const query = brandQuery ?? 'whey concentrado';

  let allProducts = await searchCatalog({
    query,
    category: 'proteinas',
    max_price: maxPrice,
    in_stock_only: inStockOnly,
    limit: 24,
  });

  let usedOrderFallback = false;
  if (!allProducts.length && inStockOnly) {
    allProducts = await searchCatalog({
      query,
      category: 'proteinas',
      max_price: maxPrice,
      in_stock_only: false,
      limit: 24,
    });
    usedOrderFallback = allProducts.length > 0;
  }

  const products = allProducts.slice(0, 3);
  const hasMore = allProducts.length > products.length;

  if (!products.length) {
    const budgetText = maxPrice !== null ? ` até ${formatBRL(maxPrice)}` : '';
    return {
      reply:
        `Não encontrei whey concentrado${budgetText} com esse filtro agora. ` +
        'Se quiser, posso ampliar a faixa de preço ou mostrar outras opções de whey.',
      products: [],
    };
  }

  let intro: string;
  if (brandQuery && /dark wolf/.test(normalizeFallbackText(lastUserMessage))) {
    intro =
      'Sim. O Whey 100% Pure da Dark Wolf também entra nas opções de whey concentrado. Separei ele para você.';
  } else if (usedOrderFallback) {
    intro =
      'Não encontrei whey concentrado em pronta entrega com esse filtro, mas há opções disponíveis por encomenda.';
  } else if (maxPrice !== null) {
    intro = `Separei os wheys concentrados que cabem no seu limite de até ${formatBRL(maxPrice)}.`;
  } else {
    intro = 'Separei algumas opções de whey concentrado da Alphenix.';
  }

  return {
    reply: buildNeutralCatalogList(intro, products, hasMore),
    products,
  };
}

function fallbackCategories(text: string): string[] {
  const normalized = normalizeFallbackText(text);

  if (/creatina/.test(normalized)) return ['creatinas'];
  if (/whey|proteina/.test(normalized)) return ['proteinas'];
  if (/termogen|queimar gordura|perder gordura|emagrec|definicao/.test(normalized)) {
    return ['termogenicos e energia'];
  }
  if (/pre[- ]?treino|energia no treino|disposicao|estimulante/.test(normalized)) {
    return ['pre-treino'];
  }
  if (/hipercalor|ganhar peso/.test(normalized)) return ['hipercaloricos'];
  if (/ganhar massa|massa muscular|hipertrofia/.test(normalized)) {
    return ['creatinas', 'proteinas', 'hipercaloricos'];
  }
  if (/vitamina|mineral/.test(normalized)) return ['vitaminas e minerais'];
  if (/sono|dormir|bem estar/.test(normalized)) return ['bem-estar e sono'];

  return [];
}

async function buildCatalogFallback(
  history: AssistantHistoryMessage[],
): Promise<AssistantApiResponse | null> {
  const lastUserMessage = [...history].reverse().find((message) => message.role === 'user')?.content ?? '';
  if (!lastUserMessage) return null;

  // Usa também o contexto recente para entender respostas curtas como
  // "custo-benefício", "até 150" ou "pode ser por encomenda".
  const recentContext = history
    .slice(-6)
    .map((message) => message.content)
    .join(' ');

  if (fallbackHasHealthContext(recentContext)) {
    return {
      reply:
        'Sua dúvida envolve saúde ou uma restrição importante. Para não te orientar de forma incompleta, prefiro não recomendar um suplemento específico agora. Tente novamente em alguns instantes ou converse com um médico/nutricionista.',
      products: [],
    };
  }

  const categories = fallbackCategories(recentContext);
  if (!categories.length) return null;

  const maxPrice = fallbackBudget(lastUserMessage);
  const inStockOnly = fallbackStockOnly(lastUserMessage);

  const groups = await Promise.all(
    categories.map((category) =>
      searchCatalog({
        category,
        max_price: maxPrice,
        in_stock_only: inStockOnly,
        limit: categories.length > 1 ? 2 : 4,
      }),
    ),
  );

  let products = groups.flat();

  // Se a pessoa exigiu pronta entrega e não houver nada, ainda oferecemos encomenda.
  if (products.length === 0 && inStockOnly) {
    const orderGroups = await Promise.all(
      categories.map((category) =>
        searchCatalog({
          category,
          max_price: maxPrice,
          in_stock_only: false,
          limit: categories.length > 1 ? 2 : 4,
        }),
      ),
    );
    products = orderGroups.flat();
  }

  const allUniqueProducts = [...new Map(products.map((product) => [product.slug, product])).values()];
  const uniqueProducts = allUniqueProducts.slice(0, 3);
  const hasMore = allUniqueProducts.length > uniqueProducts.length;
  if (!uniqueProducts.length) {
    return {
      reply:
        'Não encontrei uma opção compatível com esse pedido no catálogo agora. Se quiser, tente outra faixa de preço ou outra categoria.',
      products: [],
    };
  }

  const readyCount = uniqueProducts.filter((product) =>
    product.variants.some((variant) => variant.stock > 0),
  ).length;
  const orderOnlyCount = uniqueProducts.filter(
    (product) =>
      product.variants.length > 0 && product.variants.every((variant) => variant.stock <= 0),
  ).length;

  let reply = 'Separei algumas opções do catálogo que combinam com o que você pediu. Veja os cards abaixo e escolha a variação que preferir.';
  if (readyCount === 0 && orderOnlyCount > 0) {
    reply =
      'No momento não encontrei pronta entrega para esse pedido, mas há opções disponíveis por encomenda. Separei algumas abaixo para você.';
  } else if (orderOnlyCount > 0) {
    reply =
      'Encontrei opções para você, incluindo pronta entrega e produtos disponíveis por encomenda. Confira o status em cada card abaixo.';
  }

  return { reply: appendMoreOptionsOffer(reply, hasMore), products: uniqueProducts };
}

export async function POST(request: NextRequest) {
  if (!rateLimit(getClientKey(request))) {
    return NextResponse.json(
      { error: 'Muitas mensagens em pouco tempo. Aguarde alguns minutos e tente novamente.' },
      { status: 429 },
    );
  }

  let history: AssistantHistoryMessage[] = [];

  try {
    const body = (await request.json()) as {
      messages?: unknown;
      shownProductSlugs?: unknown;
      lastRecommendationCategories?: unknown;
    };
    history = sanitizeHistory(body.messages);
    const shownProductSlugs = sanitizeShownProductSlugs(body.shownProductSlugs);
    const lastRecommendationCategories = sanitizeRecommendationCategories(
      body.lastRecommendationCategories,
    );

    if (!history.length || history.at(-1)?.role !== 'user') {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 });
    }

    const lastUserMessage = history.at(-1)?.content ?? '';
    const recentContext = history
      .slice(-6)
      .map((message) => message.content)
      .join(' ');
    const recentUserContext = history
      .filter((message) => message.role === 'user')
      .slice(-4)
      .map((message) => message.content)
      .join(' ');

    // Vitaminas/minerais e sono têm uma política determinística antes do LLM.
    // Assim o mascote não transforma sintomas em diagnóstico, não inventa
    // benefícios e só mostra produtos que realmente existem no Supabase.
    const vitaminWellnessResponse = await buildVitaminWellnessResponse(
      history,
      shownProductSlugs,
    );
    if (vitaminWellnessResponse) {
      return NextResponse.json(vitaminWellnessResponse);
    }

    const concentratedWheyResponse = await buildConcentratedWheyResponse(history);
    if (concentratedWheyResponse) {
      return NextResponse.json(concentratedWheyResponse);
    }

    const moreProductsResponse = await buildMoreProductsResponse(
      history,
      shownProductSlugs,
      lastRecommendationCategories,
    );
    if (moreProductsResponse) {
      return NextResponse.json(moreProductsResponse);
    }

    const input: unknown[] = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const recommendations = new Map<string, AssistantProductRecommendation>();
    let response = await callGroq(input);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const toolCalls = (response.output ?? []).filter(
        (item) => item.type === 'function_call' && item.name === 'buscar_produtos' && item.call_id,
      );

      if (!toolCalls.length) break;

      const toolOutputs = await Promise.all(
        toolCalls.map(async (call) => {
          const parsedArgs = parseToolArgs(call.arguments);
          const args = applyRecommendationPolicy(
            parsedArgs,
            lastUserMessage,
            recentContext,
            recentUserContext,
          );
          const broadSearchArgs = {
            ...args,
            limit: Math.max(4, Math.min(12, Math.floor(args.limit ?? 3) + 1)),
          };
          let products = await searchCatalog(broadSearchArgs);
          let orderFallbackUsed = false;

          // Se o cliente pediu pronta entrega e não há estoque imediato, não encerramos
          // a conversa com "não tem". Buscamos novamente incluindo itens disponíveis
          // por encomenda para que o mascote possa oferecer uma alternativa real.
          if (products.length === 0 && args.in_stock_only === true) {
            products = await searchCatalog({
              ...broadSearchArgs,
              in_stock_only: false,
            });
            orderFallbackUsed = products.length > 0;
          }

          products = filterRecommendationsForIntent(products, lastUserMessage, recentContext);
          const visibleProducts = products.slice(0, 3);
          const hasMoreOptions = products.length > visibleProducts.length;
          visibleProducts.forEach((product) => recommendations.set(product.slug, product));

          const readyCount = visibleProducts.filter((product) =>
            product.variants.some((variant) => variant.stock > 0),
          ).length;
          const orderOnlyCount = visibleProducts.filter((product) =>
            product.variants.length > 0 && product.variants.every((variant) => variant.stock <= 0),
          ).length;

          return {
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify({
              found: visibleProducts.length,
              more_options_available: hasMoreOptions,
              ready_stock_found: readyCount,
              order_only_found: orderOnlyCount,
              order_fallback_used: orderFallbackUsed,
              availability_instruction: orderFallbackUsed
                ? 'Não há opção de pronta entrega para este filtro, mas há produtos disponíveis por encomenda. Avise isso claramente e recomende as opções por encomenda abaixo; não diga apenas que não há produtos.'
                : orderOnlyCount > 0 && readyCount === 0
                  ? 'As opções encontradas estão disponíveis somente por encomenda. Avise claramente que não há pronta entrega no momento e recomende estas opções por encomenda.'
                  : orderOnlyCount > 0
                    ? 'Há opções de pronta entrega e também por encomenda. Informe o status correto de cada opção quando for relevante.'
                    : 'As opções encontradas possuem pronta entrega.',
              products: visibleProducts.map((product) => ({
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                category: product.category,
                min_price: product.minPrice,
                compare_at_price: product.compareAtPrice,
                has_ready_stock: product.variants.some((variant) => variant.stock > 0),
                has_order_option: product.variants.some(
                  (variant) => variant.available && variant.stock <= 0,
                ),
                description: product.description,
                benefits: product.benefits.slice(0, 5),
                catalog_facts: product.catalogFacts.slice(0, 6),
                official_catalog_page: product.catalogSourcePage,
                variants: product.variants.slice(0, 4).map((variant) => ({
                  label: variant.label,
                  price: variant.price,
                  stock: variant.stock,
                  status: variant.stock > 0 ? 'pronta entrega' : 'disponível por encomenda',
                })),
              })),
            }),
          };
        }),
      );

      input.push(...(response.output ?? []), ...toolOutputs);
      response = await callGroq(input);
    }

    let groundedProducts = filterRecommendationsForIntent(
      [...recommendations.values()],
      lastUserMessage,
      recentContext,
    ).slice(0, 3);

    // Proteção final para perguntas amplas de emagrecimento: se o modelo não
    // pesquisou a categoria correta (ou não chamou ferramenta), fazemos a
    // consulta no servidor. Assim hipercalóricos e nomes inventados nunca
    // viram recomendação nesse fluxo.
    if (
      hasWeightLossIntent(recentContext) &&
      !fallbackHasHealthContext(recentContext) &&
      !hasStimulantRestriction(recentContext) &&
      !explicitlyRequestsProtein(lastUserMessage) &&
      !explicitlyRequestsPreWorkout(lastUserMessage) &&
      !explicitlyRequestsHypercaloric(lastUserMessage)
    ) {
      const stockOnly = fallbackStockOnly(lastUserMessage);
      let thermogenics = await searchCatalog({
        category: 'termogenicos e energia',
        in_stock_only: stockOnly,
        max_price: fallbackBudget(lastUserMessage),
        limit: 3,
      });

      // Mesmo quando o cliente pergunta por pronta entrega, se não houver
      // estoque imediato mostramos a possibilidade de encomenda.
      if (thermogenics.length === 0 && stockOnly) {
        thermogenics = await searchCatalog({
          category: 'termogenicos e energia',
          in_stock_only: false,
          max_price: fallbackBudget(lastUserMessage),
          limit: 4,
        });
      }

      if (thermogenics.length > 0) {
        groundedProducts = thermogenics.slice(0, 3);
      }
    }

    let hasMoreGroundedOptions = false;
    if (groundedProducts.length === 3) {
      const categories = [...new Set(groundedProducts.map((product) => normalizeFallbackText(product.category)))];
      if (categories.length === 1) {
        const categoryCandidates = await searchCatalog({
          category: categories[0],
          max_price: fallbackBudget(lastUserMessage),
          in_stock_only: fallbackStockOnly(lastUserMessage),
          limit: 4,
        });
        hasMoreGroundedOptions = categoryCandidates.length > groundedProducts.length;
      }
    }

    const modelReplyBase = extractText(response) ||
      'Consegui consultar o catálogo, mas não consegui montar a resposta agora. Tente perguntar de outra forma.';
    const modelReply = appendMoreOptionsOffer(modelReplyBase, hasMoreGroundedOptions);

    // Em objetivo de emagrecimento, a resposta final é montada a partir dos
    // próprios produtos retornados pelo Supabase. Isso impede alucinações como
    // nomes de produtos inexistentes e evita sugestões incoerentes como
    // hipercalórico sem o cliente ter pedido.
    const weightLoss = hasWeightLossIntent(recentContext);
    const avoidStimulants =
      fallbackHasHealthContext(recentContext) || hasStimulantRestriction(recentContext);

    const reply = weightLoss && groundedProducts.length > 0
      ? buildGroundedWeightLossReply(groundedProducts)
      : weightLoss && avoidStimulants
        ? 'Para perda de gordura, alimentação e déficit calórico são a base. Como você mencionou uma restrição relacionada à saúde ou a estimulantes, prefiro não indicar termogênico/pré-treino. Posso te ajudar a procurar uma opção sem estimulantes ou você pode confirmar com médico/nutricionista o que faz sentido para você.'
        : modelReply;

    const result: AssistantApiResponse = {
      reply,
      products: groundedProducts,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Alphenix Assistant]', error);

    if (error instanceof Error && error.message === 'GROQ_API_KEY_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          error:
            'A IA ainda não foi ativada no servidor. Configure GROQ_API_KEY na Vercel para ligar o Assistente Alphenix.',
        },
        { status: 503 },
      );
    }

    if (error instanceof GroqRateLimitError) {
      try {
        const fallback = await buildCatalogFallback(history);
        if (fallback) {
          return NextResponse.json(fallback);
        }
      } catch (fallbackError) {
        console.error('[Alphenix Assistant] fallback de catálogo falhou', fallbackError);
      }

      const wait = error.retryAfterSeconds;
      return NextResponse.json(
        {
          error: wait
            ? `A IA está com muita demanda agora. Tente novamente em cerca de ${wait} segundos.`
            : 'A IA está com muita demanda agora. Aguarde um pouco e tente novamente.',
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: 'O assistente ficou indisponível por alguns instantes. Tente novamente.' },
      { status: 500 },
    );
  }
}
