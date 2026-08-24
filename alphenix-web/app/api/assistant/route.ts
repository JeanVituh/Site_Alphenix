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
const MAX_HISTORY = 12;
const MAX_MESSAGE_LENGTH = 700;
const MAX_TOOL_ROUNDS = 3;

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

async function callGroq(input: unknown[]): Promise<GroqResponsePayload> {
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
      max_output_tokens: 550,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const payload = (await response.json()) as GroqResponsePayload;

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('GROQ_RATE_LIMIT');
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

export async function POST(request: NextRequest) {
  if (!rateLimit(getClientKey(request))) {
    return NextResponse.json(
      { error: 'Muitas mensagens em pouco tempo. Aguarde alguns minutos e tente novamente.' },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as { messages?: unknown };
    const history = sanitizeHistory(body.messages);

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
                benefits: product.benefits,
                variants: product.variants.slice(0, 8).map((variant) => ({
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

    if (error instanceof Error && error.message === 'GROQ_RATE_LIMIT') {
      return NextResponse.json(
        {
          error:
            'O assistente atingiu temporariamente o limite de uso da Groq. Aguarde um pouco e tente novamente.',
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
