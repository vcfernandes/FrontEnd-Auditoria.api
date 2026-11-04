# Auditorias (auditoria-web)

Aplicativo web (PWA) para **auditorias e inspeções sanitárias**, feito para consultores e responsáveis técnicos em segurança alimentar, como um médico veterinário que audita padarias, açougues e restaurantes.

O consultor usa principalmente **no celular**, dentro do estabelecimento, respondendo o checklist em pé e às vezes com internet ruim. No **computador**, consulta o histórico, monta modelos e baixa os relatórios em PDF.

> **Status:** protótipo. O caminho mínimo para o uso no dia a dia está pronto; o que falta está no fim do [CLAUDE.md](CLAUDE.md) (backlog) e o que já foi feito está no [CHANGELOG.md](CHANGELOG.md).

Este repositório é só o **front-end**. A API está em outro repositório (`auditoria-api`, Java 21 + Spring Boot 4).

## O que o app faz

- Criar conta e entrar.
- Cadastrar clientes (estabelecimentos).
- Montar e editar **modelos de checklist** (ou partir da Biblioteca, como a RDC 216/2004 da Anvisa).
- Fazer a auditoria no celular, com salvamento automático.
- Finalizar, ver a nota e a classificação, e gerar o **relatório em PDF**.
- Painel inicial e histórico com filtros.

## Stack

- React + TypeScript + Vite
- PWA com `vite-plugin-pwa` (instalável na tela inicial)
- React Router, TanStack Query, React Hook Form + Zod
- Tailwind CSS + shadcn/ui, mobile-first
- `openapi-typescript` (tipos gerados a partir do Swagger da API)
- npm

## Como rodar em desenvolvimento

Requisitos: **Node 22.12 ou mais novo** (o Vite 8 exige) e a API rodando em `http://localhost:8080`.

```bash
npm install
cp .env.example .env     # VITE_API_URL=/api
npm run dev
```

Abra http://localhost:5173.

Em desenvolvimento o app **não** chama a API direto: o proxy do Vite encaminha `/api/*` para `http://localhost:8080/*`, sem o prefixo `/api`. Por isso também funciona no celular, pelo Wi-Fi: abra `http://<IP do computador>:5173` (veja o passo a passo em "Testar no celular" no [CLAUDE.md](CLAUDE.md)).

## Comandos principais

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (porta 5173, aceita acesso pela rede local) |
| `npm run build` | Confere os tipos e gera o `dist/` de produção |
| `npm run preview` | Serve o `dist/` (porta 4173); é o único jeito de testar o PWA e o service worker |
| `npm run lint` | Verifica o código (oxlint) |
| `npm run gen:api` | Regenera `src/api/schema.d.ts` a partir do Swagger (API rodando em `localhost:8080`) |
| `npm run generate-pwa-assets` | Regenera os ícones do app a partir de `public/icon.svg` |

## Publicação

O front é publicado atrás de um Caddy que serve o `dist/` na raiz e repassa `/api/*` para a API removendo o `/api` (mesma origem). O build usa `npm ci` + `npm run build` e lê `VITE_API_URL=/api` do `.env.production`. Detalhes e cuidados na seção "Publicação" do [CLAUDE.md](CLAUDE.md).

## Documentação

- [docs/MANUAL.md](docs/MANUAL.md): guia de uso para o consultor, passo a passo.
- [CHANGELOG.md](CHANGELOG.md): o que foi feito, por etapa.
- [CLAUDE.md](CLAUDE.md): contexto técnico do projeto (decisões, convenções, status detalhado e backlog). É o arquivo de trabalho do assistente de código, mas serve de referência para quem for mexer no projeto.

## Estrutura de pastas

- `src/api`: cliente HTTP, tipos gerados e hooks do TanStack Query por recurso
- `src/pages`: uma pasta por tela
- `src/components`: componentes compartilhados (`ui/` = shadcn)
- `src/lib`: utilitários
- `src/auth`: sessão e token
- `src/pwa`: instalação, atualização e aviso de falta de internet
