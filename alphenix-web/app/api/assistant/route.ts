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

function fallbackBudget(text: string): number | null {
  const normalized = normalizeFallbackText(text);
  const moneyMatch = normalized.match(/r\$\s*(\d{1,4}(?:[.,]\d{1,2})?)/i);
  const budgetMatch = normalized.match(
    /(?:ate|maximo|max|orcamento|tenho|gastar)\s+(?:de\s+)?(?:r\$\s*)?(\d{1,4}(?:[.,]\d{1,2})?)/i,
  );
  const raw = moneyMatch?.[1] ?? budgetMatch?.[1];
  if (!raw) return null;
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function fallbackStockOnly(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /pronta entrega|em estoque|estoque imediato|entrega hoje|preciso hoje/.test(normalized);
}

function fallbackHasHealthContext(text: string): boolean {
  const normalized = normalizeFallbackText(text);
  return /gravidez|gravida|amament|pressao alta|hipertens|cardiac|coracao|medicamento|remedio|reacao adversa|doenca|menor de idade/.test(
    normalized,
  );
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
        limit: categories.length > 1 ? 1 : 3,
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
          limit: categories.length > 1 ? 1 : 3,
        }),
      ),
    );
    products = orderGroups.flat();
  }

  const uniqueProducts = [...new Map(products.map((product) => [product.slug, product])).values()].slice(0, 3);
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

  return { reply, products: uniqueProducts };
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
    const body = (await request.json()) as { messages?: unknown };
    history = sanitizeHistory(body.messages);

    if (!history.length || history.at(-1)?.role !== 'user') {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 });
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
          const args = parseToolArgs(call.arguments);
          let products = await searchCatalog(args);
          let orderFallbackUsed = false;

          // Se o cliente pediu pronta entrega e não há estoque imediato, não encerramos
          // a conversa com "não tem". Buscamos novamente incluindo itens disponíveis
          // por encomenda para que o mascote possa oferecer uma alternativa real.
          if (products.length === 0 && args.in_stock_only === true) {
            products = await searchCatalog({
              ...args,
              in_stock_only: false,
            });
            orderFallbackUsed = products.length > 0;
          }

          products.forEach((product) => recommendations.set(product.slug, product));

          const readyCount = products.filter((product) =>
            product.variants.some((variant) => variant.stock > 0),
          ).length;
          const orderOnlyCount = products.filter((product) =>
            product.variants.length > 0 && product.variants.every((variant) => variant.stock <= 0),
          ).length;

          return {
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify({
              found: products.length,
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
              products: products.map((product) => ({
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
                benefits: product.benefits.slice(0, 3),
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

    const reply = extractText(response) ||
      'Consegui consultar o catálogo, mas não consegui montar a resposta agora. Tente perguntar de outra forma.';

    const result: AssistantApiResponse = {
      reply,
      products: [...recommendations.values()].slice(0, 3),
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
