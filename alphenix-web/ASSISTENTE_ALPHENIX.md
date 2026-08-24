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
