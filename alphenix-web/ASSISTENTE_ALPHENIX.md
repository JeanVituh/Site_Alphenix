# Assistente Alphenix

O projeto possui um assistente virtual com IA integrado ao catálogo real do Supabase e usando a API da **Groq**.

## O que foi adicionado

- Mascote flutuante no canto inferior direito.
- Estados visuais: neutro, pensando, falando, recomendando e sucesso.
- Chat responsivo para desktop e celular.
- Atalhos: ganhar massa, definição, energia e escolha de whey.
- Consulta do catálogo real do Supabase via ferramenta da IA.
- Cards de recomendação com preço, disponibilidade, variações, link do produto e botão para adicionar ao carrinho.
- Regras para não inventar produtos/preços e para evitar promessas médicas ou de emagrecimento.
- Rate limit básico e limite de histórico/mensagem para reduzir abuso.
- Chave da Groq protegida no servidor em `GROQ_API_KEY`.

## IA usada

Por padrão o assistente usa:

```env
GROQ_MODEL=openai/gpt-oss-20b
```

O modelo é chamado pela **Groq Responses API**, com function/tool calling. A Groq não acessa o Supabase diretamente: o modelo solicita a função `buscar_produtos`, o servidor Next.js consulta o catálogo e devolve apenas os resultados encontrados.

## Como ativar localmente

1. Crie uma chave no Groq Console: https://console.groq.com/keys
2. Crie/edite `.env.local` na raiz do projeto.
3. Mantenha as variáveis que você já usa no Supabase e acrescente:

```env
GROQ_API_KEY=gsk_sua_chave_aqui
GROQ_MODEL=openai/gpt-oss-20b
```

4. Reinicie o servidor:

```bash
npm run dev
```

## Como ativar na Vercel

No projeto da Vercel, abra **Settings > Environment Variables** e crie:

- `GROQ_API_KEY` = sua chave da Groq
- `GROQ_MODEL` = `openai/gpt-oss-20b`

Depois faça um novo deploy.

> Não coloque `GROQ_API_KEY` com o prefixo `NEXT_PUBLIC_`. Se fizer isso, a chave pode ser exposta no navegador.

## Free Tier da Groq

O projeto funciona com o Free Tier enquanto sua conta estiver dentro dos limites oferecidos pela Groq. O próprio site também mantém um rate limit adicional para evitar que um visitante dispare mensagens demais em pouco tempo.

Se a Groq responder com limite de uso (`429`), o chat mostra uma mensagem amigável pedindo para tentar novamente depois.

## Arquivos principais

- `components/assistant/AlphenixAssistant.tsx`
- `components/assistant/AlphenixAssistant.module.css`
- `app/api/assistant/route.ts`
- `lib/assistant/catalog.ts`
- `lib/assistant/prompt.ts`
- `lib/assistant/types.ts`
- `public/assets/images/mascote/alphenix-assistente.png`

## Observação sobre as poses

A primeira versão usa o mesmo desenho oficial do mascote e muda seu comportamento visual conforme o estado (inclinação, pulso, fala, badge de recomendação e confirmação). A estrutura já separa os estados; no futuro você pode substituir cada estado por um PNG específico sem mudar a lógica da IA/chat.

## Regras para vitaminas, minerais e bem-estar

- Perguntas genéricas como “qual vitamina você recomenda?” geram uma pergunta de objetivo antes de qualquer produto.
- Pedidos por itens específicos (vitamina C, D3, B12, magnésio, ômega 3, multivitamínico, CoQ10, NAC, resveratrol, cromo, melatonina etc.) consultam o catálogo real e mostram apenas nomes/preços/disponibilidade cadastrados.
- Sintomas, diagnósticos, deficiência em exames e pedidos de dose/tratamento não viram prescrição pelo mascote.
- Quando o cliente só pergunta se a loja vende um item específico, o card pode ser mostrado mesmo em contexto de saúde, sem indicar dose/tratamento.
- Objetivos como imunidade, ossos, pele/cabelo/unhas só geram indicação quando o próprio cadastro traz evidência textual para aquele benefício; o assistente não completa benefícios ausentes com conhecimento geral.
- Para sono/bem-estar, o assistente prioriza a categoria `bem-estar e sono` e não apresenta os itens como tratamento para insônia.
- Para foco cognitivo, a busca exige evidência no nome/descrição/benefícios (no banco atual, o Magnésio L-Treonato Ultra possui descrição com “foco cognitivo e sono”).
- Produtos sem estoque imediato, mas com `available=true`, continuam aparecendo como disponíveis por encomenda.

## Catálogo oficial Dark Wolf integrado (v7)

O assistente agora possui uma camada de conhecimento curada em `lib/assistant/darkWolfCatalog.ts`, baseada no catálogo oficial Dark Wolf de 29 páginas fornecido pela loja. Foram mapeados os 26 produtos das páginas 3 a 28.

Essa camada complementa o Supabase com descrições, benefícios, fatos objetivos e palavras-chave de intenção. Preço, estoque, disponibilidade e variações continuam vindo exclusivamente do Supabase.

Exemplos de intenção cobertos de forma determinística:

- imunidade: Vitamina C, Vitamina D3, Multivitamínico AZ e outras opções com evidência no catálogo;
- ossos: Vitamina D3 e Mag-Six;
- articulações/mobilidade: Osteo Flex;
- sono/relaxamento: Sleep Zen, Magnésio Inositol, L-Treonato, Mag-Six e Melatonina;
- foco/memória: Neuro Focus (com aviso de cafeína), L-Treonato, Magnésio Inositol e B12;
- antioxidante: NAC, Resveratrol, CoQ10 e Vitamina C;
- pele/cabelos: Multivitamínico AZ, Vitamina C e Resveratrol;
- saúde cardiovascular geral: Ômega 3, CoQ10 e Resveratrol;
- energia/disposição: Multivitamínico AZ, CoQ10 e B12.

O catálogo de marketing contém algumas alegações médicas fortes. Elas foram intencionalmente removidas da camada usada pela IA. O assistente não deve afirmar que suplementos tratam/previnem diabetes, câncer, hipertensão, colesterol, ansiedade, lesões ou outras doenças.

### Sincronizar essas informações no Supabase (opcional)

O arquivo `supabase/enriquecimento_catalogo_dark_wolf.sql` atualiza somente `description` e `benefits` dos produtos Dark Wolf com a versão curada. Ele não altera preço, estoque, SKU ou variações.

A IA já funciona com as informações oficiais mesmo sem executar esse SQL. Rode o script no Supabase apenas se quiser que o restante do site também passe a usar as descrições/benefícios enriquecidos diretamente da tabela `products`.

### Inconsistências do PDF tratadas

Durante a revisão completa, alguns pontos do material exigiram cautela:

- Vitamina D3: o texto extraído apresenta "200UI" em um ponto, enquanto a embalagem/cadastro identificam 2000UI; a integração usa o produto `vitamina-d3-2000ui-dark-wolf` e evita depender do trecho inconsistente.
- Trans Resveratrol: o título do PDF mostra "300MG" em um ponto, mas a descrição/tabela informam 30mg; a integração usa 30mg.
- Creatina: o texto promocional fala em 99% e o selo visual apresenta 98,6%; a IA fala apenas em "laudo apresentado pela marca", sem fixar um percentual conflitante.
- Algumas páginas trazem alegações médicas/promocionais fortes; essas alegações foram filtradas e não são usadas como recomendação clínica pelo mascote.
