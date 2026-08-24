export type AssistantRole = 'user' | 'assistant';

export interface AssistantHistoryMessage {
  role: AssistantRole;
  content: string;
}

export interface AssistantVariant {
  skuId: string;
  label: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  available: boolean;
  imageUrl: string | null;
  sabor: string | null;
  tamanho: string | null;
  embalagem: string | null;
  cor: string | null;
}

export interface AssistantProductRecommendation {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  badge: string | null;
  description: string | null;
  imageUrl: string | null;
  minPrice: number;
  compareAtPrice: number | null;
  benefits: string[];
  variants: AssistantVariant[];
}

export interface AssistantApiResponse {
  reply: string;
  products: AssistantProductRecommendation[];
}
