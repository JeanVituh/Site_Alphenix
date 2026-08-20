// ================================================================
//  ALPHENIX — lib/categories.ts
//
//  Categorias usadas nas abas de filtro da home e no rodapé.
//
//  IMPORTANTE: normalmente o `id` deve ser igual ao valor salvo em
//  products.category no Supabase. Para a reorganização de estimulantes,
//  mantemos também um fallback por slug: assim Alpha Burn, Cafeína e
//  Neuro Focus já aparecem em "Termogênicos & Energia" antes mesmo da
//  migração SQL ser executada no banco.
// ================================================================

import type { ProductCategory } from '@/lib/types';

export interface Category {
  id: 'all' | ProductCategory;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all',                    label: 'Todos',                  icon: 'fa-grip-vertical' },
  { id: 'proteinas',              label: 'Proteínas',              icon: 'fa-dumbbell'      },
  { id: 'creatinas',              label: 'Creatinas',              icon: 'fa-flask'         },
  { id: 'pre-treino',             label: 'Pré-Treinos',            icon: 'fa-bolt'          },
  { id: 'termogenicos e energia', label: 'Termogênicos & Energia', icon: 'fa-fire-flame-curved' },
  { id: 'vitaminas e minerais',   label: 'Vitaminas & Minerais',   icon: 'fa-capsules'       },
  { id: 'bem-estar e sono',       label: 'Bem-estar & Sono',       icon: 'fa-moon'           },
  { id: 'hipercaloricos',         label: 'Hipercalóricos',         icon: 'fa-weight-hanging' },
  { id: 'combos e outros',        label: 'Combos & Acessórios',    icon: 'fa-box-open'       },
];

// Proteção temporária: funciona mesmo se os três produtos ainda estiverem
// gravados como "pre-treino" no Supabase.
export const CATEGORY_OVERRIDES_BY_SLUG: Partial<Record<string, ProductCategory>> = {
  'alpha-burn-dark-wolf': 'termogenicos e energia',
  'cafeina-pura-200mg-dark-wolf': 'termogenicos e energia',
  'neuro-focus-dark-wolf': 'termogenicos e energia',
};

const BADGE_OVERRIDES_BY_SLUG: Partial<Record<string, string>> = {
  'alpha-burn-dark-wolf': '🔥 Termogênico',
  'cafeina-pura-200mg-dark-wolf': '⚡ Estimulante',
  'neuro-focus-dark-wolf': '🧠 Foco & Energia',
};

export function getCatalogCategory(product: { slug: string; category: string }): ProductCategory {
  return (
    CATEGORY_OVERRIDES_BY_SLUG[product.slug] ??
    product.category
  ) as ProductCategory;
}

export function getCatalogBadge(product: { slug: string; badge: string | null }): string | null {
  return BADGE_OVERRIDES_BY_SLUG[product.slug] ?? product.badge;
}

export function getCategoryLabel(categoryId: string): string {
  return CATEGORIES.find((category) => category.id === categoryId)?.label ?? categoryId;
}
