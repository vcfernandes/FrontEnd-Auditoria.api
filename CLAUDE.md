# CLAUDE.md — auditoria-web

## Sobre o projeto

Front-end (PWA) de um app de **auditorias e inspeções sanitárias** para consultores e responsáveis técnicos em segurança alimentar (ex.: um médico veterinário que audita padarias, açougues, restaurantes).

O consultor usa principalmente **no celular**, dentro do estabelecimento, respondendo o checklist em pé e às vezes com internet ruim. No **computador** ele consulta o histórico e baixa relatórios.

**Objetivo atual: protótipo.** Entregar o caminho mínimo para o consultor usar no dia a dia e dar feedback. Nada de recursos além da lista "Telas da primeira versão" sem eu pedir.

O backend é outro repositório (`auditoria-api`, Java 21 + Spring Boot 4) e já está pronto para o protótipo.

## Como trabalhar comigo

- Responda em **português**. Textos da interface também em português (pt-BR).
- Trabalhe **uma etapa por vez** (uma tela ou uma peça de infraestrutura). Ao terminar, rode `npm run build` e `npm run lint`, explique brevemente as decisões principais e me diga como testar no navegador.
- Antes de criar ou alterar arquivos, diga quais serão.
- Não implemente itens do backlog sem eu pedir.
- Ao concluir uma etapa, atualize a seção **Status** deste arquivo.
- Se subir o servidor de desenvolvimento para testar, encerre ao terminar.

## Stack

- **React + TypeScript + Vite**
- **PWA** com `vite-plugin-pwa` (manifesto + service worker; instalar na tela inicial)
- **React Router**: navegação
- **TanStack Query**: chamadas à API (cache, loading, erro, invalidação)
- **React Hook Form + Zod**: formulários e validação
- **Tailwind CSS + shadcn/ui**: interface, **mobile-first**
- **openapi-typescript**: tipos gerados a partir do Swagger do backend
- Gerenciador de pacotes: **npm**

## Backend (API)

- Base da API: `http://localhost:8080`. Em desenvolvimento o front **não** chama essa URL direto: `VITE_API_URL=/api` (arquivo `.env`, modelo em `.env.example`) e o proxy do Vite (`vite.config.ts`) encaminha `/api/*` para `http://localhost:8080/*`, removendo o `/api`. Assim o app funciona também no celular, onde `localhost` seria o próprio aparelho. Em produção, definir `VITE_API_URL` com a URL real da API.
- O proxy remove o header `Origin` das chamadas (o CORS do backend só libera `localhost:5173`, e pelo celular o Origin seria o IP da rede).
- O servidor de desenvolvimento usa `host: true` (aceita acesso pela rede local).
- Swagger: `http://localhost:8080/swagger-ui.html` · OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Gere os tipos com o backend rodando: `npx openapi-typescript http://localhost:8080/v3/api-docs -o src/api/schema.d.ts` (deixar como script `npm run gen:api`)
- CORS do backend já libera `http://localhost:5173`.

### Testar no celular (Wi-Fi)
1. Backend rodando em `localhost:8080` e `npm run dev` no computador.
2. Celular no **mesmo Wi-Fi** do computador.
3. Descubra o IP do computador (`ipconfig`, adaptador de Wi-Fi/Ethernet, "Endereço IPv4"; hoje é `192.168.1.103`, pode mudar) ou use o endereço "Network" que o Vite mostra ao subir.
4. No navegador do celular: `http://<IP>:5173`.
5. Se não abrir: liberar a porta 5173 no Firewall do Windows (rede privada) e conferir que o IP não é o de VPN (Radmin) ou de WSL/Hyper-V.
6. Instalar como PWA no celular exige HTTPS (exceto `localhost`); por IP em http o app abre normalmente, mas sem o "instalar".

### Autenticação
- `POST /auth/registrar` (nomeOrganizacao, nome, email, senha) e `POST /auth/login` (email, senha) devolvem `{ token, expiraEmSegundos, usuarioId, nome, email, papel }`.
- Demais rotas: header `Authorization: Bearer <token>`.
- `GET /auth/me` devolve o usuário logado.
- Token expira em 8 h. Ao receber **401**, limpar a sessão e voltar ao login.

### Formato de erro (todas as rotas)
`{ status, mensagem, campos?, timestamp }`. Em validação (400), `campos` é um mapa `campo → mensagem`: mostrar cada mensagem no campo correspondente do formulário. Nos demais erros, mostrar `mensagem`.

### Rotas usadas no protótipo
- **Clientes**: `GET /clientes?nome=&page=&size=` (paginado: `content` + `page`), `POST /clientes`, `GET/PUT/DELETE /clientes/{id}`. Campos: nome, cnpj (opcional, com ou sem máscara), categoria (texto livre), tipo (usar `SIMPLES` no protótipo).
- **Modelos de checklist**: `GET /checklists` (lista da organização + biblioteca, campo `biblioteca`), `GET /checklists/{id}`, `POST /checklists/{id}/duplicar`. O modelo padrão da biblioteca é a RDC 216/2004 (Anvisa).
- **Auditorias**:
  - `POST /auditorias` (clienteId, modeloId, data opcional, observacoes opcional) → auditoria com `secoes[].itens[]` e `resumo`.
  - `GET /auditorias?clienteId=&status=&page=&size=` (paginado).
  - `GET /auditorias/{id}`.
  - `PUT /auditorias/{id}/respostas` com `{ "respostas": [{ itemId, resposta, observacao }] }`. `resposta`: `CONFORME`, `NAO_CONFORME`, `NAO_SE_APLICA` ou `null` (limpa). Só com status `EM_ANDAMENTO`.
  - `POST /auditorias/{id}/finalizar` (422 se faltar obrigatória), `POST /auditorias/{id}/reabrir`, `DELETE /auditorias/{id}` (só em andamento).
  - `GET /auditorias/{id}/relatorio.pdf`: só finalizada. Baixar com o token no header (fetch → blob), não por link direto.
- `resumo`: total, respondidas, conformes, naoConformes, naoSeAplica, obrigatoriasPendentes.
- Classificação: `EXCELENTE` (verde), `BOM` (azul), `REGULAR` (amarelo), `INADEQUADO` (vermelho).

## Telas da primeira versão

1. **Entrar / Criar conta**
2. **Clientes**: lista com busca + cadastro/edição
3. **Nova auditoria**: escolher cliente e modelo
4. **Responder auditoria**: perguntas agrupadas por seção, botões grandes Conforme / Não conforme / Não se aplica, observação por pergunta, **salvamento automático**, indicador de progresso (obrigatórias pendentes) e botão Finalizar
5. **Resultado**: nota, classificação com a cor da faixa, resumo, botão Baixar PDF, botão Reabrir
6. **Histórico**: página Auditorias com abas Realizadas (lista com filtros), Meus modelos e Biblioteca
7. **Início (painel)**: resumo do dia, atalhos e últimas auditorias (`/inicio`)

Navegação no celular: barra inferior (Início, Auditorias, Clientes, Conta). No computador: menu lateral. Após o login: `/inicio` (painel).

## Convenções

- Pastas: `src/api` (cliente HTTP, tipos gerados, hooks do TanStack Query por recurso), `src/pages` (uma pasta por tela), `src/components` (compartilhados; `src/components/ui` = shadcn), `src/lib` (utilitários), `src/auth` (sessão/token).
- Um único cliente HTTP que injeta o token e trata 401 e o formato de erro.
- Sessão (token + usuário) em `localStorage`.
- Datas exibidas em `dd/mm/aaaa`; notas com vírgula (`69,23`).
- Componentes pequenos; sem lógica de API dentro de componentes de UI (usar os hooks de `src/api`).
- Botões e áreas de toque grandes (uso com uma mão, em pé).

### Tema e visual
- **Cor principal: azul-marinho `#1E3A5F`** (`--primary` em `src/index.css`): botões, item ativo, links (`text-primary`), barra de progresso, seleção. Fundo suave dos ícones/destaques: `--primary-suave` (`#dde8f5`, classe `bg-primary-suave`), porque 10% do azul-marinho fica cinza. Cinzas levemente azulados (slate). O app não usa modo escuro (o bloco `.dark` é o padrão do shadcn, sem uso).
- **Menu lateral (computador)**: fundo azul-marinho (`--sidebar`), texto claro, item ativo com fundo mais claro e filete à esquerda. **Cabeçalho do computador**: título da tela (de `handle.titulo`, com seta se `handle.voltar`) à esquerda e `MenuUsuario` (avatar de iniciais + nome; menu Conta / Sair) à direita. As páginas mantêm um `<h1 className="sr-only">` só para leitores de tela.
- **Classificações**: Excelente `emerald-600`, **Bom `sky-500`** (azul-celeste, para não confundir com o azul-marinho), Regular `amber-400`, Inadequado `red-600` (`src/lib/classificacao.ts`). Botões de resposta: verde / vermelho / cinza.
- **Telas de entrada** (`LayoutEntrada`): computador dividido ao meio (formulário à esquerda; à direita `public/login.webp`, versão otimizada de `public/login.jpg`, com camada `bg-primary/85` e só o título "Inspeções sanitárias sem papelada."); celular só o formulário com topo azul-marinho.
- **Peças compartilhadas**: `IconeQuadrado` (ícone em quadrado com fundo suave; tons primário/sucesso/perigo/neutro) nos cartões; `EstadoVazio` (ícone grande + texto amigável + ação); `Esqueletos` (`EsqueletoCartoes`, `EsqueletoFormulario`, `EsqueletoQuestionario`, `EsqueletoResultado`) em todo carregamento — não usar só texto "Carregando…".
- Fundo das telas internas `bg-muted/40` com cartões brancos (`bg-card`).
- Ícones do app/PWA: prancheta com check em fundo `#1e3a5f` (`public/icon.svg`; regenerar com `npm run generate-pwa-assets`).

## Status

### Feito
- [x] Projeto criado com Vite (React + TypeScript)
- [x] Dev na rede local: proxy `/api` no Vite, `VITE_API_URL=/api`, `host: true` (ver "Testar no celular"). `montarUrl` em `src/api/client.ts` aceita base relativa ou absoluta.
- [x] Base: Tailwind v4 + shadcn/ui (preset Nova), React Router, TanStack Query, cliente HTTP (`src/api/client.ts`), tipos do OpenAPI (`npm run gen:api`), `.env` (modelo em `.env.example`). Página inicial provisória em `src/pages/inicio`.
  - `gen:api` roda o `openapi-typescript` via `npx` com TypeScript 5 isolado, porque ele não aceita o TypeScript 7 do projeto.
  - Componentes shadcn importam `cn` do pacote `cn` (oficial do shadcn), não de clsx/tailwind-merge.
- [x] Autenticação: telas Entrar / Criar conta (`src/pages/entrar`, `src/pages/criar-conta`), sessão em `src/auth` (`AuthProvider` + `useAuth`), `RotaProtegida` / `RotaPublica`, logout. Erros 400 vão para o campo (`src/lib/erros.ts`), os demais viram mensagem geral. 401 com token limpa a sessão no cliente HTTP e a rota protegida redireciona para `/entrar`.
- [x] Layout: `src/components/layout/AppLayout.tsx` (barra inferior + cabeçalho no celular, menu lateral a partir de `md`/768 px; itens em `itensNavegacao.ts`). Título do cabeçalho vem de `handle: { titulo }` na rota. Área segura do iPhone via `viewport-fit=cover` + `env(safe-area-inset-*)`. Páginas Auditorias e Clientes vazias ("em construção"); Conta mostra nome, e-mail e organização + Sair; `/` redireciona para `/auditorias`.
  - Conta mostra a organização (`organizacaoNome` de `/auth/me`) no lugar do perfil.
- [x] Clientes: lista com busca (debounce de 400 ms) e "Carregar mais" (`useInfiniteQuery`), cartão com nome/categoria/CNPJ formatado, estados vazio e de carregamento; formulário único para criar/editar em `/clientes/novo` e `/clientes/:id` (CNPJ com máscara, categoria com sugestões em botões + texto livre, `tipo` sempre `SIMPLES`); 409 vai para o campo CNPJ; Inativar com confirmação e volta para a lista. Hooks em `src/api/clientes.ts` (mutações invalidam `['clientes']`). O cabeçalho do celular mostra seta de voltar quando a rota tem `handle.voltar`.
  - Não verificado contra a API: se limpar o CNPJ/categoria na edição (campo omitido no PUT) realmente apaga o valor no backend.
- [x] Nova auditoria: botão "Nova auditoria" em `/auditorias` (`BotaoNovo`: flutuante no celular, no topo no computador; a lista fica para o Histórico). `/auditorias/nova`: cliente (busca + escolha; sem clientes, atalho para cadastrar), modelo (`GET /checklists`, só ativos, etiqueta "Biblioteca", pré-seleciona se houver um único), data (hoje) e observações; `POST /auditorias` e vai para `/auditorias/{id}/responder` (página provisória com cliente, modelo e resumo). Hooks em `src/api/auditorias.ts` e `src/api/checklists.ts`.
  - Cada modelo mostra a quantidade de perguntas (`quantidadePerguntas`).
- [x] Responder auditoria (`src/pages/auditorias/responder`): topo fixo (cliente, progresso, obrigatórias faltando, indicador de salvamento, filtro "Só pendentes"), seções recolhíveis com "x/y", perguntas com 3 botões grandes (tocar de novo limpa) e observação (abre sozinha em Não conforme), Finalizar fixo no rodapé (salva antes, confirma; 422 rola até a 1ª obrigatória pendente e a destaca). Finalizada redireciona para `/auditorias/{id}/resultado` (página provisória com nota e classificação).
  - Salvamento automático: `src/lib/filaRespostas.ts` (sem React) junta alterações por pergunta, envia em lote 800 ms após a última, devolve o lote à fila se falhar e reenvia sozinho (2 s, 4 s… até 30 s; também ao voltar a rede). 4xx não reenvia sozinho. Ligada ao React por `useSalvamentoRespostas` em `src/api/auditorias.ts`.
  - Cada envio leva o par completo da pergunta (`resposta` + `observacao`, `null` quando vazio).
  - Sair com algo não salvo: `useBlocker` tenta salvar e só sai quando terminar (ou se o usuário escolher sair sem salvar após erro); `beforeunload` avisa ao fechar/recarregar.
  - Desempenho: perguntas com `memo` e callbacks estáveis; seções fechadas não renderizam perguntas.
  - Respostas não salvas ficam só na memória: recarregar à força ou 401 durante uma falha perde o que não foi enviado (modo offline está no backlog).
- [x] Histórico (antecipado): lista em `/auditorias` abaixo de "Nova auditoria", abas Em andamento (padrão) / Finalizadas e filtro opcional por cliente, guardados na URL (`?status=finalizadas&cliente=<id>`) — *substituído pela aba Realizadas, ver abaixo*. Cartão: cliente, modelo, data; em andamento mostra progresso e abre `/responder` (com Excluir + confirmação); finalizada mostra nota e classificação e abre `/resultado`. "Carregar mais", estados vazio/carregamento. A ordem (mais recentes primeiro) vem da API.
  - Progresso do cartão vem do `resumo` de cada item de `GET /auditorias`; salvar respostas invalida a lista.
  - Data padrão da Nova auditoria: `hojeIso()` estava correto; o banco mostrou datas 15/10 e 16/10 enviadas pelo front em auditorias criadas em 31/10, provavelmente preenchimento automático do navegador. Campo e formulário agora com `autoComplete="off"` e aviso "Não é a data de hoje · Usar hoje".
- [x] Resultado + PDF (`src/pages/auditorias/resultado`): nota, classificação com a cor da faixa, resumo, lista de Não conformidades por seção (pergunta, observação, referência legal; mensagem positiva se não houver), Baixar PDF, Reabrir com confirmação (volta para responder). Em andamento redireciona para `/responder`.
  - PDF: `api.arquivo()` em `src/api/client.ts` baixa com token como blob e lê o nome do `Content-Disposition` (o CORS do backend já expõe esse header). Computador: baixa direto. Celular (`pointer: coarse`): abre a folha de compartilhar (`navigator.share` com o arquivo); como o Safari pode recusar o compartilhamento depois da espera do download, ficam os botões Compartilhar / Abrir PDF para um novo toque (`src/lib/arquivo.ts`).
- [x] PWA: `vite-plugin-pwa` em `vite.config.ts` (nome e nome curto "Auditorias", pt-BR, standalone, retrato, tema branco `#ffffff`). Ícones: fonte `public/icon.svg` (ClipboardCheck do menu, fundo azul-marinho `#1e3a5f`); `npm run generate-pwa-assets` gera em `public/` os PNGs 64/192/512, o maskable 512, o apple-touch-icon 180 e o favicon.ico (config em `pwa-assets.config.ts`).
  - Service worker (`generateSW`) só pré-carrega arquivos do app; **sem cache de dados da API** (nenhum `runtimeCaching`; `/api/` fora do fallback de navegação). Sem internet o app abre, mostra a faixa "Sem internet" (`src/pwa/AvisoOffline.tsx`) e as chamadas falham com a mensagem do cliente HTTP (`networkMode: 'always'` no TanStack Query, senão as telas ficariam carregando para sempre).
  - Atualização: `registerType: 'prompt'`; aviso fixo "Nova versão disponível" com Atualizar / Depois (`src/pwa/AvisoAtualizacao.tsx`), nunca recarrega sozinho. Procura versão nova de hora em hora.
  - Conta → "Instalar no celular" (`src/pages/conta/InstalarApp.tsx`, `src/pwa/instalacao.ts`): botão quando o navegador dispara `beforeinstallprompt`, passos do Safari no iPhone, ou instruções gerais.
  - Testar o PWA exige o build: `npm run build && npm run preview` (porta 4173, mesmo proxy e host). No `npm run dev` o service worker fica desligado. Instalação em celular só em HTTPS (ou `localhost`).
- [x] Polimento visual (sem funcionalidade nova): tema azul-marinho, menu lateral escuro, cabeçalho do computador com menu do usuário, telas de entrada divididas com foto, ícones em quadrados, esqueletos e estados vazios (ver "Tema e visual").
- [x] Painel inicial `/inicio` (`src/pages/inicio`), página após o login (`/` e `RotaPublica` levam para lá) e 1º item do menu ("Início"; barra do celular com 4 itens). Saudação com primeiro nome + data por extenso; 4 cartões (`GET /dashboard`): Em andamento, Finalizadas no mês, Clientes ativos, Nota média 90 dias (cor da faixa via `classificarNota` em `src/lib/classificacao.ts`, espelho das faixas do backend: ≥90/≥75/≥60); ações rápidas; "Continuar de onde parou" e "Últimas finalizadas" (até 5, `useAuditoriasRecentes`); distribuição por classificação (90 dias, só com finalizadas). Computador (≥1024 px, rota com `handle.larga`): cartões em linha e duas colunas; celular empilhado com cartões 2×2. Conta nova (sem clientes ou sem auditorias): bloco "Boas-vindas" com dois passos no lugar das ações rápidas.
  - `useDashboard` usa `staleTime: 0` (busca de novo sempre que o painel abre) em vez de invalidar em cada mutação de clientes/auditorias.
  - Cartões levam às listas: Finalizadas no mês e Nota média abrem `/auditorias?status=finalizadas&de=aaaa-mm-dd` (filtro `dataInicio`); Em andamento abre `?status=andamento`. **Diferença conhecida**: o painel conta pela data de finalização (`finalizadaEm`) e o filtro `dataInicio` da API usa a data da auditoria (`dataAuditoria`); uma auditoria de um mês finalizada no outro conta no painel e não aparece na lista filtrada.
- [x] Ajustes gerais e Clientes com abas/grade:
  - Largura no computador: o conteúdo de `AppLayout` não fica mais centralizado (sem `mx-auto`) e os limites cresceram (`max-w-4xl`, ou `max-w-7xl` nas rotas `handle.larga`, hoje Início e Clientes) — acaba a faixa vazia entre o menu e o conteúdo em telas largas. O rodapé fixo de Responder auditoria foi ajustado para o mesmo alinhamento.
  - Painel: "Classificações (90 dias)" passou para a coluna da esquerda, abaixo de "Continuar de onde parou" (equilibra com "Últimas finalizadas" à direita).
  - Telas de entrada: formulário centralizado na vertical também no celular (antes só no computador).
  - Toasts (`sonner`, `src/components/ui/sonner.tsx`, montado em `App.tsx`) após salvar/inativar/reativar cliente, iniciar/finalizar/reabrir auditoria, baixar PDF, e em todo erro de rede (status 0 do cliente HTTP) — ficam nos próprios hooks de `src/api`.
  - Título da aba e favicon com o ícone da prancheta: já estavam prontos desde a etapa de PWA (não precisou mudar).
  - Clientes (`src/pages/clientes`): abas Ativos (padrão) / Inativos / Todos (`GET /clientes?status`, guardada na URL); grade de 3 colunas no computador (`lg:grid-cols-3`) e lista no celular; cartão com `AvatarIniciais` (cor estável por nome, `src/components/AvatarIniciais.tsx`) e etiqueta Ativo/Inativo; menu "⋯" com Editar, Nova auditoria para este cliente (`/auditorias/nova?clienteId=`, pré-seleciona o cliente) e Inativar/Reativar; contador "Mostrando X de Y clientes". `useReativarCliente` (`POST /clientes/{id}/reativar`) criado; o formulário de edição também troca Inativar por Reativar quando o cliente já está inativo (antes só existia Inativar).
- [x] Auditorias em três abas (`src/pages/auditorias/AuditoriasPage.tsx`, `?aba=modelos|biblioteca`; sem o parâmetro = Realizadas), com "Nova auditoria" sempre visível (topo no computador, flutuante no celular). Rota `larga`.
  - **Realizadas** (`realizadas/`): busca (cliente ou modelo, `busca` da API, 400 ms após a última tecla), status Todos/Em andamento/Finalizadas, cliente, período De/Até (`dataInicio`/`dataFim`, pela data da auditoria) e "Limpar filtros". Tudo no endereço: `?busca=&status=andamento|finalizadas&cliente=&de=&ate=&pagina=` (página começa em 1; mudar um filtro volta à 1ª). A partir de 1024 px, tabela (Cliente, Modelo, Data, Status, Progresso ou Nota+classificação, Ações: Continuar / Ver resultado + menu "⋯" com Baixar PDF e Reabrir para finalizadas, ou Excluir para em andamento, com confirmação); abaixo disso, os cartões de antes. Paginação de 20 com "Mostrando 21–40 de 57 auditorias" (`src/components/Paginacao.tsx`); `useAuditorias` agora é paginado (`useQuery`, não mais "Carregar mais").
  - Ao trocar de aba os filtros de Realizadas continuam no endereço. A seta "voltar" do cabeçalho e os links "Voltar"/"Cancelar" das telas de auditoria usam o último endereço da lista (`src/lib/ultimaLista.ts`, só em memória; recarregar a página perde).
  - **Meus modelos** (`modelos/`): modelos da organização ativos (nome, descrição, nº de perguntas). Ver perguntas (painel `src/components/ui/dialog.tsx`, só leitura, seções e perguntas numeradas com "Obrigatória" e referência legal; `GET /checklists/{id}` só ao abrir), Iniciar (`/auditorias/nova?modeloId=`, já marcado), menu "⋯" com Duplicar e Inativar (confirmação, `DELETE /checklists/{id}`). Vazio: sugere duplicar da Biblioteca.
  - **Biblioteca**: modelos padrão com etiqueta "Biblioteca": Ver perguntas, Duplicar (`POST /checklists/{id}/duplicar`, depois vai para Meus modelos) e Iniciar. Ainda não há editor de modelos (backlog): a cópia é idêntica, com o nome dado pelo backend.

### Protótipo (fazer agora, nesta ordem)

### Depois do protótipo (backlog)
- Editor de modelos de checklist
- Modo offline (respostas guardadas no aparelho e sincronizadas depois)
- Fotos nas não conformidades
- Unidades e setores de clientes
- Empacotar como app de loja (Capacitor), se necessário
