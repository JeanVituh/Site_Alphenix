'use client';

import Link from 'next/link';
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { formatCurrencyBR } from '@/lib/cart';
import type {
  AssistantApiResponse,
  AssistantProductRecommendation,
  AssistantVariant,
} from '@/lib/assistant/types';
import { useCart } from '@/components/cart/CartContext';
import styles from './AlphenixAssistant.module.css';

type MascotState = 'neutral' | 'thinking' | 'talking' | 'recommending' | 'success';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: AssistantProductRecommendation[];
};

const QUICK_PROMPTS = [
  { icon: '💪', label: 'Ganhar massa', text: 'Quero ganhar massa. O que você recomenda?' },
  { icon: '🔥', label: 'Definição', text: 'Quero reduzir gordura e melhorar minha definição. O que pode complementar minha rotina?' },
  { icon: '⚡', label: 'Mais energia', text: 'Quero mais energia para treinar. O que você recomenda?' },
  { icon: '🥤', label: 'Escolher um Whey', text: 'Quero ajuda para escolher um whey.' },
] as const;

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Fala! 🔥 Eu sou o Nix, mascote e assistente virtual da Alphenix. Me diga seu objetivo, orçamento ou o produto que está procurando e eu te ajudo a escolher.',
};

function assetUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
}

function stateLabel(state: MascotState): string {
  switch (state) {
    case 'thinking': return 'Procurando no catálogo...';
    case 'talking': return 'Respondendo';
    case 'recommending': return 'Achei opções para você';
    case 'success': return 'Adicionado ao carrinho!';
    default: return 'Posso te ajudar?';
  }
}

const MASCOT_IMAGE_BY_STATE: Record<MascotState, string> = {
  neutral: '/assets/images/mascote/alphenix-neutral.png',
  thinking: '/assets/images/mascote/alphenix-thinking.png',
  talking: '/assets/images/mascote/alphenix-talking.png',
  recommending: '/assets/images/mascote/alphenix-recommending.png',
  success: '/assets/images/mascote/alphenix-success.png',
};

function MascotVisual({ state, compact = false }: { state: MascotState; compact?: boolean }) {
  return (
    <div
      className={`${styles.mascotVisual} ${styles[`mascotState_${state}`]} ${compact ? styles.mascotCompact : ''}`}
      aria-label={`Mascote Nix da Alphenix: ${stateLabel(state)}`}
    >
      <span className={styles.mascotGlow} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MASCOT_IMAGE_BY_STATE[state]}
        alt={`Nix, mascote da Alphenix — ${stateLabel(state)}`}
        className={styles.mascotImage}
        draggable={false}
      />
    </div>
  );
}

function ProductCard({
  product,
  onAdded,
  onViewProduct,
}: {
  product: AssistantProductRecommendation;
  onAdded: () => void;
  onViewProduct: () => void;
}) {
  const { addItem } = useCart();
  const readyFirst = useMemo(
    () => [...product.variants].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0)),
    [product.variants],
  );
  const [selectedSkuId, setSelectedSkuId] = useState(
    readyFirst.length === 1 ? readyFirst[0].skuId : '',
  );

  useEffect(() => {
    setSelectedSkuId(readyFirst.length === 1 ? readyFirst[0].skuId : '');
  }, [product.slug, readyFirst]);

  const selectedVariant =
    product.variants.find((variant) => variant.skuId === selectedSkuId) ??
    (readyFirst.length === 1 ? readyFirst[0] : null);
  const image = assetUrl(selectedVariant?.imageUrl ?? product.imageUrl);
  const price = selectedVariant?.price ?? product.minPrice;
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;

  function handleAdd() {
    if (!selectedVariant) return;

    const added = addItem({
      skuId: selectedVariant.skuId,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brand: product.brand,
      imageUrl: selectedVariant.imageUrl ?? product.imageUrl,
      sabor: selectedVariant.sabor,
      tamanho: selectedVariant.tamanho,
      embalagem: selectedVariant.embalagem,
      cor: selectedVariant.cor,
      unitPrice: selectedVariant.price,
      compareAtPrice: selectedVariant.compareAtPrice,
      stock: selectedVariant.stock,
      available: selectedVariant.available,
      quantity: 1,
    });

    if (added) onAdded();
  }

  return (
    <article className={styles.productCard}>
      <div className={styles.productImageWrap}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className={styles.productImage} />
        ) : (
          <span className={styles.productImageFallback}><i className="fa-solid fa-dumbbell" /></span>
        )}
      </div>

      <div className={styles.productBody}>
        <span className={styles.productBrand}>{product.brand}</span>
        <strong className={styles.productName}>{product.name}</strong>

        <div className={styles.productPriceRow}>
          <strong>{formatCurrencyBR(price)}</strong>
          {compareAt && compareAt > price && <s>{formatCurrencyBR(compareAt)}</s>}
        </div>

        {product.variants.length > 1 && (
          <label className={styles.variantField}>
            <span>Escolha a variação</span>
            <select
              value={selectedVariant?.skuId ?? ''}
              onChange={(event) => setSelectedSkuId(event.target.value)}
            >
              <option value="">Selecione sabor/tamanho...</option>
              {readyFirst.map((variant) => (
                <option key={variant.skuId} value={variant.skuId}>
                  {variant.label} — {formatCurrencyBR(variant.price)} {variant.stock > 0 ? '• pronta entrega' : '• encomenda'}
                </option>
              ))}
            </select>
          </label>
        )}

        {selectedVariant && (
          <span className={selectedVariant.stock > 0 ? styles.stockReady : styles.stockOrder}>
            <i className={`fa-solid ${selectedVariant.stock > 0 ? 'fa-circle-check' : 'fa-box-open'}`} />
            {selectedVariant.stock > 0 ? 'Pronta entrega' : 'Disponível por encomenda'}
          </span>
        )}

        <div className={styles.productActions}>
          <Link
            href={`/produtos/${product.slug}`}
            className={styles.viewButton}
            onClick={onViewProduct}
          >
            Ver produto
          </Link>
          {product.variants.length > 0 && (
            <button
              type="button"
              className={styles.addButton}
              onClick={handleAdd}
              disabled={!selectedVariant}
              title={!selectedVariant ? 'Escolha uma variação primeiro' : undefined}
            >
              <i className="fa-solid fa-cart-plus" />
              {selectedVariant ? 'Adicionar' : 'Escolha a variação'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function AlphenixAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>('neutral');
  const [showNudge, setShowNudge] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollMessagesToEnd = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    scrollMessagesToEnd('smooth');
  }, [messages, loading, isOpen, scrollMessagesToEnd]);

  // Em celulares, o teclado virtual altera a área realmente visível da tela.
  // A variável abaixo faz o painel acompanhar o Visual Viewport e evita que o
  // campo de texto fique por cima da última mensagem do bot.
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncViewport = () => {
      document.documentElement.style.setProperty(
        '--alphenix-visual-viewport-height',
        `${viewport.height}px`,
      );
      scrollMessagesToEnd('auto');
    };

    syncViewport();
    viewport.addEventListener('resize', syncViewport);
    viewport.addEventListener('scroll', syncViewport);

    return () => {
      viewport.removeEventListener('resize', syncViewport);
      viewport.removeEventListener('scroll', syncViewport);
      document.documentElement.style.removeProperty('--alphenix-visual-viewport-height');
    };
  }, [isOpen, scrollMessagesToEnd]);

  useEffect(() => {
    return () => {
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    };
  }, []);

  function setTemporaryState(state: MascotState, duration = 3200) {
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    setMascotState(state);
    stateTimerRef.current = setTimeout(() => setMascotState('neutral'), duration);
  }

  async function sendMessage(raw: string) {
    const content = raw.trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setMascotState('thinking');
    setShowNudge(false);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })),
          shownProductSlugs: [
            ...new Set(
              nextMessages.flatMap((message) =>
                (message.products ?? []).map((product) => product.slug),
              ),
            ),
          ],
          lastRecommendationCategories: (() => {
            const lastRecommendation = [...nextMessages]
              .reverse()
              .find((message) => message.role === 'assistant' && message.products?.length);
            return [
              ...new Set(
                (lastRecommendation?.products ?? []).map((product) => product.category),
              ),
            ];
          })(),
        }),
      });

      const payload = (await response.json()) as AssistantApiResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível falar com o assistente.');
      }

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: payload.reply,
        products: payload.products,
      };

      setMessages((current) => [...current, assistantMessage]);
      setTemporaryState(payload.products?.length ? 'recommending' : 'talking');
    } catch (error) {
      const text = error instanceof Error
        ? error.message
        : 'O assistente ficou indisponível. Tente novamente.';

      setMessages((current) => [
        ...current,
        { id: `e-${Date.now()}`, role: 'assistant', content: text },
      ]);
      setTemporaryState('talking');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleProductAdded() {
    setTemporaryState('success', 3800);
  }

  return (
    <aside className={styles.root} aria-label="Nix, assistente virtual da Alphenix">
      {isOpen && (
        <section className={styles.panel} aria-label="Chat com Nix, assistente da Alphenix">
          <header className={styles.header}>
            <MascotVisual state={mascotState} compact />
            <div className={styles.headerText}>
              <strong>Nix • Assistente Alphenix</strong>
              <span><i className={styles.onlineDot} /> IA do catálogo • {stateLabel(mascotState)}</span>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Fechar assistente"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </header>

          <div className={styles.messages} ref={scrollRef} aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={styles.messageGroup}>
                <div
                  className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                >
                  {message.content}
                </div>

                {message.products?.length ? (
                  <div className={styles.recommendations}>
                    {message.products.map((product) => (
                      <ProductCard
                        key={product.slug}
                        product={product}
                        onAdded={handleProductAdded}
                        onViewProduct={() => setIsOpen(false)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {loading && (
              <div className={`${styles.message} ${styles.assistantMessage} ${styles.loadingMessage}`}>
                <span>Hmm... deixa eu procurar no catálogo</span>
                <span className={styles.typingDots} aria-hidden="true"><i /><i /><i /></span>
              </div>
            )}
          </div>

          {messages.length === 1 && !loading && (
            <div className={styles.quickPrompts}>
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt.label} type="button" onClick={() => void sendMessage(prompt.text)}>
                  <span aria-hidden="true">{prompt.icon}</span>
                  {prompt.label}
                </button>
              ))}
            </div>
          )}

          <form className={styles.composer} onSubmit={handleSubmit}>
            <label className={styles.srOnly} htmlFor="alphenix-assistant-input">
              Digite sua dúvida sobre suplementos
            </label>
            <textarea
              id="alphenix-assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 700))}
              onFocus={() => {
                // Espera o teclado abrir e reposiciona a conversa para a última mensagem.
                window.setTimeout(() => scrollMessagesToEnd('auto'), 80);
                window.setTimeout(() => scrollMessagesToEnd('smooth'), 280);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (input.trim()) void sendMessage(input);
                }
              }}
              placeholder="Ex.: qual whey até R$ 150?"
              rows={1}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar mensagem">
              <i className="fa-solid fa-paper-plane" />
            </button>
          </form>

          <p className={styles.disclaimer}>
            Recomendações informativas; não substituem orientação médica ou nutricional.
          </p>
        </section>
      )}

      {!isOpen && showNudge && (
        <div className={styles.nudge}>
          <button
            type="button"
            className={styles.nudgeClose}
            onClick={() => setShowNudge(false)}
            aria-label="Fechar dica"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <strong>Oi, eu sou o Nix 🔥</strong>
          <span>Posso te ajudar a escolher.</span>
        </div>
      )}

      <button
        type="button"
        className={`${styles.launcher} ${isOpen ? styles.launcherOpen : ''}`}
        onClick={() => {
          setIsOpen((value) => !value);
          setShowNudge(false);
          setMascotState('neutral');
        }}
        aria-label={isOpen ? 'Fechar chat do Nix' : 'Abrir chat do Nix'}
      >
        {isOpen ? (
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        ) : (
          <MascotVisual state={mascotState} />
        )}
        {!isOpen && <span className={styles.launcherBadge}>IA</span>}
      </button>
    </aside>
  );
}
