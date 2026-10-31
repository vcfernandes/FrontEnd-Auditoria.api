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
6. **Histórico**: lista de auditorias com filtro por status e cliente

Navegação no celular: barra inferior (Auditorias, Clientes, Conta). No computador: menu lateral.

## Convenções

- Pastas: `src/api` (cliente HTTP, tipos gerados, hooks do TanStack Query por recurso), `src/pages` (uma pasta por tela), `src/components` (compartilhados; `src/components/ui` = shadcn), `src/lib` (utilitários), `src/auth` (sessão/token).
- Um único cliente HTTP que injeta o token e trata 401 e o formato de erro.
- Sessão (token + usuário) em `localStorage`.
- Datas exibidas em `dd/mm/aaaa`; notas com vírgula (`69,23`).
- Componentes pequenos; sem lógica de API dentro de componentes de UI (usar os hooks de `src/api`).
- Botões e áreas de toque grandes (uso com uma mão, em pé).

## Status

### Feito
- [x] Projeto criado com Vite (React + TypeScript)
- [x] Dev na rede local: proxy `/api` no Vite, `VITE_API_URL=/api`, `host: true` (ver "Testar no celular"). `montarUrl` em `src/api/client.ts` aceita base relativa ou absoluta.
- [x] Base: Tailwind v4 + shadcn/ui (preset Nova), React Router, TanStack Query, cliente HTTP (`src/api/client.ts`), tipos do OpenAPI (`npm run gen:api`), `.env` (modelo em `.env.example`). Página inicial provisória em `src/pages/inicio`.
  - `gen:api` roda o `openapi-typescript` via `npx` com TypeScript 5 isolado, porque ele não aceita o TypeScript 7 do projeto.
  - Componentes shadcn importam `cn` do pacote `cn` (oficial do shadcn), não de clsx/tailwind-merge.
- [x] Autenticação: telas Entrar / Criar conta (`src/pages/entrar`, `src/pages/criar-conta`), sessão em `src/auth` (`AuthProvider` + `useAuth`), `RotaProtegida` / `RotaPublica`, logout. Erros 400 vão para o campo (`src/lib/erros.ts`), os demais viram mensagem geral. 401 com token limpa a sessão no cliente HTTP e a rota protegida redireciona para `/entrar`.
- [x] Layout: `src/components/layout/AppLayout.tsx` (barra inferior + cabeçalho no celular, menu lateral a partir de `md`/768 px; itens em `itensNavegacao.ts`). Título do cabeçalho vem de `handle: { titulo }` na rota. Área segura do iPhone via `viewport-fit=cover` + `env(safe-area-inset-*)`. Páginas Auditorias e Clientes vazias ("em construção"); Conta mostra nome, e-mail e perfil + Sair; `/` redireciona para `/auditorias`.
  - Pendência do backend: a API não devolve o nome da organização em `/auth/me` nem no login, então a Conta não mostra a organização.

### Protótipo (fazer agora, nesta ordem)
- [ ] Clientes: lista + cadastro/edição
- [ ] Nova auditoria
- [ ] Responder auditoria
- [ ] Resultado + PDF
- [ ] Histórico
- [ ] PWA: manifesto, ícones, instalação

### Depois do protótipo (backlog)
- Editor de modelos de checklist
- Modo offline (respostas guardadas no aparelho e sincronizadas depois)
- Fotos nas não conformidades
- Unidades e setores de clientes
- Empacotar como app de loja (Capacitor), se necessário
