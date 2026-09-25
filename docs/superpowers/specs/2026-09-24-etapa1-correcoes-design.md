# Etapa 1 — Corrigir erros e lacunas

Data: 2026-09-24

## Contexto e objetivo

App web estático (PWA, HTML/CSS/JS puros, sem build) usado no celular pela Equipe 11T
para gerar o texto de encerramento de OS. Esta é a etapa 1 de 4 da melhoria do app
(1 correções, 2 segurança dos dados, 3 rapidez, 4 visual). Objetivo: eliminar erros
bobos e deixar o código legível para as etapas seguintes.

Restrições: manter HTML/CSS/JS puros e arquivo único `app.js` (atualização via Termux);
sem framework de testes; comportamento existente não muda fora do listado abaixo.

## Escopo

1. **Reformatar `app.js`** — commit separado, sem mudança de comportamento. Quebrar linhas
   comprimidas em funções legíveis.
2. **Sem duplicatas** — ao salvar, se já existir registro com mesma OS e mesma data,
   atualizá-lo (mantendo posição no topo) em vez de criar outro. Vale para histórico
   (`coprel11t_history_v3`) e trocas (`coprel11t_trocas_v3`).
3. **Excluir troca** — botão "Excluir" com `confirm()` em cada item de Trocas; título da
   tela mostra a contagem de trocas salvas.
4. **Alerta de campos faltando** — ao clicar em Copiar, se `confirmBeforeCopy` estiver
   ligado e faltar algum de: Internet funcionando (`internet`), Sinal GPON (`gpon`),
   Plano (`plano`), Cliente acompanhou (`acompanhou`), exibir `confirm()` listando os
   campos ausentes ("Copiar mesmo assim?"). Não bloqueia. Desligado: copia direto.
5. **Cache do PWA** — subir `CACHE` em `sw.js` para `encerramento-11t-v4`.

## Fora do escopo

Backup/importação (etapa 2), memória de últimos valores e atalhos (etapa 3), visual e
tema escuro (etapa 4).

## Verificação

Sem framework de testes. Rodar servidor local e conferir manualmente, com o console
sem erros: salvar a mesma OS duas vezes gera 1 registro em Histórico e 1 em Trocas;
excluir uma troca a remove e atualiza a contagem; Copiar com campos técnicos vazios
mostra o aviso, e com a opção desligada não mostra.
