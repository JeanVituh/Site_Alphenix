// ================================================================
//  ALPHENIX — lib/categories.ts
//
//  Categorias usadas nas abas de filtro da home e no rodapé.
//
//  ⚠️ IMPORTANTE: o campo `id` de cada categoria precisa ser
//  EXATAMENTE igual ao valor salvo na coluna `category` da
//  tabela `products` no Supabase, senão o filtro não vai
//  encontrar nada para aquela aba. Confira no seu banco (ex:
//  Table Editor do Supabase) os valores reais e ajuste os ids
//  abaixo se necessário.
//
//  Atualização: o schema.sql do banco define a coluna `category`
//  com esta regra exata:
//
//    CHECK (category IN ('proteinas', 'creatinas', 'pre-treino', 'combos e outros'))
//
//  Ou seja, o valor correto É "combos e outros" (com espaços) —
//  isso é o que o Postgres aceita ao inserir um produto. Os ids
//  abaixo foram ajustados para bater exatamente com essa regra.
// ================================================================

export interface Category {
  id: string;
  label: string;
  icon: string; // classe do Font Awesome, ex: "fa-dumbbell"
}

export const CATEGORIES: Category[] = [
  { id: 'all',              label: 'Todos',           icon: 'fa-grip-vertical' },
  { id: 'proteinas',        label: 'Proteínas',       icon: 'fa-dumbbell'      },
  { id: 'creatinas',        label: 'Creatinas',       icon: 'fa-flask'         },
  { id: 'pre-treino',       label: 'Pré-Treinos',     icon: 'fa-bolt'          },
  { id: 'combos e outros',  label: 'Combos e outros', icon: 'fa-box-open'      },
];
