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
//  Atualização: a migração `SUPABASE_CATALOGO_COMPLETO.sql` amplia
//  o CHECK da coluna `category` para as categorias do catálogo completo.
//  Os ids abaixo precisam continuar idênticos aos valores gravados no banco.
// ================================================================

export interface Category {
  id: string;
  label: string;
  icon: string; // classe do Font Awesome, ex: "fa-dumbbell"
}

export const CATEGORIES: Category[] = [
  { id: 'all',                   label: 'Todos',                icon: 'fa-grip-vertical' },
  { id: 'proteinas',             label: 'Proteínas',            icon: 'fa-dumbbell'      },
  { id: 'creatinas',             label: 'Creatinas',            icon: 'fa-flask'         },
  { id: 'pre-treino',            label: 'Pré-Treinos',          icon: 'fa-bolt'          },
  { id: 'vitaminas e minerais',  label: 'Vitaminas & Minerais', icon: 'fa-capsules'       },
  { id: 'bem-estar e sono',      label: 'Bem-estar & Sono',     icon: 'fa-moon'           },
  { id: 'hipercaloricos',        label: 'Hipercalóricos',       icon: 'fa-weight-hanging' },
  { id: 'combos e outros',       label: 'Combos & Acessórios',  icon: 'fa-box-open'       },
];
