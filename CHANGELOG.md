# Changelog

O que foi feito no Auditorias, etapa por etapa, em linguagem simples. As etapas mais novas ficam no topo. Os detalhes técnicos de cada etapa estão na seção "Status" do [CLAUDE.md](CLAUDE.md).

O projeto está em fase de **protótipo**: o objetivo é o consultor usar no dia a dia e dar retorno.

## Etapa 17 — Assinatura na tela (4 nov 2026)

- No **resultado** da auditoria finalizada há uma seção **Assinaturas**, antes dos botões de relatório, com dois cartões: **Auditor** (o seu nome já vem preenchido, mas pode ser trocado) e **Responsável pelo estabelecimento** (nome e cargo).
- Toque em **Assinar** para abrir o **quadro de assinatura em tela cheia**, pensado para assinar com o dedo no celular, de preferência deitado. A página não rola enquanto você assina. Há **Limpar**, **Cancelar** e **Confirmar**.
- O app **recorta o espaço vazio** em volta da assinatura e salva com fundo transparente.
- A assinatura salva aparece como miniatura, com nome, cargo, data e hora, e as opções **Assinar de novo** e **Remover**.
- As assinaturas saem nos dois relatórios em PDF.
- **Reabrir** uma auditoria **apaga as assinaturas**: o app avisa antes (no resultado e no menu ⋯ da lista).
- O manual explica como assinar.

## Etapa 16 — Dois relatórios em PDF (4 nov 2026)

- O botão **Baixar PDF** foi trocado por duas opções, no resultado e no menu **⋯** da lista de auditorias finalizadas:
  - **Relatório para o cliente** (em destaque): curto, com a nota, as não conformidades com fotos e as assinaturas. É o que se entrega ao dono do estabelecimento.
  - **Relatório completo**: tudo isso e mais o checklist inteiro, para seu arquivo e para a fiscalização.
- Gerar o relatório pode levar alguns segundos. Enquanto isso o botão mostra **Gerando…** e as duas opções ficam bloqueadas, para não gerar duas vezes sem querer.
- O nome do arquivo agora termina com o tipo (`-resumido` ou `-completo`).
- Auditorias em andamento não oferecem relatório.
- O manual explica a diferença entre os dois relatórios.
- Os PDFs agora trazem as fotos (isso vem da atualização da API).

## Etapa 15 — Fotos nas respostas (4 nov 2026)

- Cada pergunta agora tem o botão **Adicionar foto**: no celular abre a câmera traseira; no computador, a escolha de arquivo. Em **Não conforme**, o botão fica destacado em vermelho.
- A foto é **reduzida no próprio aparelho** antes de subir (no máximo 1600 px, em JPEG), já na posição certa. Uma foto de 12 MB chega a virar cerca de 0,5 MB, o que ajuda muito em internet ruim.
- **Envio em segundo plano**: a miniatura aparece na hora, com o aviso "Enviando…", e você continua respondendo. Se a internet falhar, o app tenta de novo sozinho, sem duplicar a foto, e oferece **Reenviar**. O envio continua mesmo se você sair da tela da auditoria (mas não feche o app).
- Toque na miniatura para **ver em tela cheia** e **excluir** (com confirmação). São até **5 fotos por pergunta**, e o app avisa ao chegar no limite.
- A tela de **resultado** mostra as fotos em cada não conformidade.
- **Finalizar** espera as fotos terminarem de subir; se alguma não subir, o app avisa e leva até a pergunta, para nenhuma foto se perder.
- Uma falha de rede ao atualizar a auditoria não troca mais a tela de responder por uma mensagem de erro.
- Nesta etapa o **PDF** ainda não trazia as fotos (resolvido na Etapa 16).

## Etapa 14 — Editor de modelos de checklist (3 nov 2026)

- Agora você cria e edita os seus próprios **modelos de checklist**, sem depender de ninguém: **Auditorias → Meus modelos → Novo modelo**.
- Dá para montar **seções** e **perguntas**, mudar a ordem (com botões ou arrastando, no computador), duplicar, mover pergunta de uma seção para outra e remover.
- Cada pergunta tem **peso** (1 a 10), marca de **obrigatória** e **referência legal** (opcional).
- **Colar perguntas**: cole uma lista pronta (de um Word ou PDF) e o app cria uma pergunta por linha, já tirando a numeração do começo.
- Na Biblioteca, **Duplicar e editar** copia um modelo padrão (como a RDC 216/2004) para Meus modelos e já abre o editor.
- **Rascunho automático** no aparelho: se a tela fechar, a internet cair ou a sessão vencer antes de salvar, o app oferece **Recuperar alterações não salvas**.
- Erros de preenchimento aparecem no lugar exato (seção e pergunta), e o app avisa antes de sair com alterações não salvas.
- Editar um modelo **não muda** as auditorias que já foram feitas com ele.

## Etapa 13 — Preparação para publicação (1 nov 2026)

- O app ficou pronto para ser publicado atrás de um servidor (Caddy) que entrega o site e repassa `/api` para a API, na mesma origem.
- Configuração de produção versionada (`.env.production`), endereço da API montado de forma simples e build conferido com Node 22 a partir de um clone limpo.
- Confirmado que o app **não guarda dados da API em cache** no celular e que o PDF é baixado com o acesso do usuário.

## Etapa 12 — Auditorias em três abas (1 nov 2026)

- A página **Auditorias** agora tem três abas: **Realizadas**, **Meus modelos** e **Biblioteca**. O botão **Nova auditoria** fica sempre visível.
- **Realizadas**: busca por cliente ou modelo, filtros por status, cliente e período (De/Até), e botão **Limpar filtros**. No computador, uma tabela com ações (Continuar, Ver resultado, Baixar PDF, Reabrir, Excluir); no celular, cartões. Paginação com "Mostrando X de Y".
- Os filtros ficam no endereço da página: ao voltar de uma auditoria, a lista continua como estava.
- **Meus modelos** e **Biblioteca**: ver as perguntas, duplicar, iniciar uma auditoria com o modelo já escolhido e inativar.
- Os cartões do painel (Em andamento, Finalizadas no mês, Nota média) abrem a lista já filtrada.

## Etapa 11 — Ajustes gerais e Clientes com abas (1 nov 2026)

- No computador, o conteúdo aproveita melhor a largura da tela.
- No painel, "Classificações (90 dias)" foi para baixo de "Continuar de onde parou", equilibrando as colunas.
- Telas de entrada com o formulário centralizado também no celular.
- **Avisos na tela** (toasts) ao salvar cliente, inativar, reativar, iniciar, finalizar e reabrir auditoria, gerar PDF, e quando falta internet.
- **Clientes**: abas **Ativos / Inativos / Todos**, avatar com as iniciais e uma cor própria para cada cliente, etiqueta Ativo/Inativo, grade de cartões no computador e lista no celular, contador "Mostrando X de Y clientes".
- Menu **⋯** em cada cliente: Editar, Nova auditoria para este cliente, Inativar ou Reativar.

## Etapa 10 — Painel inicial (31 out – 1 nov 2026)

- Nova tela **Início**, a primeira depois do login: saudação com a data, quatro números (em andamento, finalizadas no mês, clientes ativos, nota média dos 90 dias), atalhos, "Continuar de onde parou", "Últimas finalizadas" e um gráfico de classificações.
- Conta nova mostra um passo a passo de boas-vindas (cadastrar cliente e fazer a primeira auditoria).
- A barra de baixo do celular passou a ter quatro itens: Início, Auditorias, Clientes e Conta.
- Tela de entrada mais limpa, sem o parágrafo abaixo do título.

## Etapa 9 — Polimento visual (31 out 2026)

- Visual novo em **azul-marinho**: botões, menu lateral escuro no computador, ícones em quadrados coloridos, cabeçalho com menu do usuário.
- Telas de entrada divididas no computador, com uma foto e a frase "Inspeções sanitárias sem papelada."
- Telas de carregamento com "esqueletos" animados e mensagens amigáveis quando não há nada para mostrar.

## Etapa 8 — App instalável (PWA) (31 out 2026)

- O Auditorias pode ser **instalado na tela inicial** do celular, com ícone próprio (prancheta com check) e abertura em tela cheia.
- Em **Conta → Instalar no celular**: botão no Android e passo a passo para o iPhone.
- Aviso **"Sem internet"** quando a conexão cai, e aviso **"Nova versão disponível"** que nunca atualiza sozinho no meio do seu trabalho.

## Etapa 7 — Resultado e PDF (31 out 2026)

- Tela de **resultado**: nota, classificação com a cor da faixa (Excelente, Bom, Regular, Inadequado), resumo das respostas e lista das **não conformidades** com observação e referência legal.
- **Baixar PDF** do relatório: no computador baixa direto; no celular abre a folha de compartilhar (WhatsApp, e-mail…), com botões de reserva para o iPhone.
- **Reabrir** uma auditoria finalizada para corrigir (a nota é descartada até finalizar de novo).

## Etapa 6 — Histórico de auditorias (31 out 2026)

- Lista de auditorias com abas **Em andamento / Finalizadas** e filtro por cliente, com excluir para as em andamento.
- Corrigida a data padrão da nova auditoria (preenchimento automático do navegador podia trocar o dia); agora o campo avisa quando a data não é a de hoje.

## Etapa 5 — Responder auditoria (31 out 2026)

- Perguntas agrupadas por seção, com três botões grandes: **Conforme**, **Não conforme** e **Não se aplica** (tocar de novo desfaz).
- Observação por pergunta (abre sozinha em Não conforme), barra de progresso e contagem de perguntas obrigatórias que faltam.
- **Salvamento automático**: cada resposta é enviada sozinha, com indicador "Salvando… / Salvo". Se a internet cair, o app tenta de novo sozinho e avisa antes de você sair com algo não salvo.
- Filtro **Só pendentes** e botão **Finalizar auditoria**, que leva até a primeira pergunta obrigatória que falta.

## Etapa 4 — Nova auditoria (31 out 2026)

- Tela para iniciar uma auditoria: escolher o **cliente**, o **modelo de checklist** (a RDC 216/2004 da Anvisa já vem na Biblioteca), a data e observações.

## Etapa 3 — Clientes (31 out 2026)

- Cadastro, edição e inativação de clientes, com busca por nome, CNPJ com máscara automática e categorias sugeridas (Padaria, Açougue, Restaurante…).

## Etapa 2 — Navegação e layout (31 out 2026)

- **Barra inferior** no celular e **menu lateral** no computador, com título em cada tela.
- Tela **Conta** com nome, e-mail, organização e botão **Sair**.
- Respeito às áreas seguras do iPhone (barra e entalhe da tela).

## Etapa 1 — Base e acesso (31 out 2026)

- Projeto criado com a base técnica (React, Tailwind, shadcn/ui, navegação, chamadas à API).
- Telas **Criar conta** e **Entrar**, com mensagens de erro nos próprios campos, e saída automática quando o acesso vence (8 horas).
- Preparado para testar também **no celular pelo Wi-Fi**, usando o computador como servidor de desenvolvimento.
