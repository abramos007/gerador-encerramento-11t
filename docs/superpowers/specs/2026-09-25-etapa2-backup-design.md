# Etapa 2 — Segurança dos dados: backup, lembrete e importação

Data: 2026-09-25

## Contexto e objetivo

O histórico e as trocas vivem só no `localStorage` do celular. Limpar os dados do
navegador, reinstalar o app ou trocar de aparelho apaga tudo. Objetivo: tirar os dados do
celular com facilidade (backup compartilhado), lembrar o técnico de fazer isso, e
restaurar num aparelho novo sem duplicar nada.

Decisões do técnico: backup por **compartilhamento** (menu do Android); **lembrete
discreto a cada 7 dias**; importação por **junção** (não substitui).

Esta etapa vem antes da etapa 4 (redesign visual). Os ícones do app, antes previstos
aqui, passaram para a etapa 4, porque dependem da nova identidade.

## Restrições

- HTML/CSS/JS puros, `app.js` único, sem build e sem dependências.
- Chaves existentes inalteradas: `coprel11t_history_v3`, `coprel11t_trocas_v3`,
  `coprel11t_config_v3`. Limites inalterados: histórico 50, trocas 100.
- Texto dos relatórios inalterado.

## Escopo

### 1. Arquivo de backup

- Nome: `backup-encerramento-11t-AAAA-MM-DD.json` (data local do dia).
- Conteúdo (JSON):
  ```json
  { "app": "encerramento-11t", "version": 1, "exportedAt": "<ISO 8601>",
    "history": [ ... ], "trocas": [ ... ], "config": { ... } }
  ```
  `history`, `trocas` e `config` são cópias exatas do que está no `localStorage`.

### 2. Compartilhar backup (Configurações, card "Backup")

- Botão **Compartilhar backup**. Se `navigator.canShare({ files: [arquivo] })` for
  verdadeiro, usa `navigator.share({ files, title })`; senão, baixa o arquivo (link com
  `download`).
- O backup só **conta como feito** quando o compartilhamento resolve sem erro ou quando o
  download é disparado. Cancelar o menu (`AbortError`) não conta e não mostra erro; outro
  erro de compartilhamento cai para o download.
- Ao contar como feito, grava em `coprel11t_backup_v1` o objeto `{ "lastBackupAt": <ms> }`
  e mostra "Backup feito ✓".
- O card mostra "Último backup: DD/MM/AAAA HH:MM" ou "Nenhum backup ainda", e o estado do
  armazenamento (item 5).

### 3. Lembrete

- Aviso no topo da aba Nova OS, com o texto "Há OS salvas há 7 dias ou mais sem backup" e
  o botão **Fazer backup** (mesma ação do item 2).
- Regra: existe ao menos um registro no histórico com `id` maior que `lastBackupAt` (ou
  qualquer registro, se nunca houve backup) **e** o mais antigo desses registros tem
  7 dias ou mais (`agora - id >= 7 × 24 h`). Os `id` são `Date.now()` do momento do
  salvamento.
- O aviso é recalculado ao abrir o app, ao salvar, ao importar e após o backup; some quando
  a regra deixa de valer. Quem não tem histórico não vê o aviso.

### 4. Importar backup (Configurações, card "Backup")

- Botão **Importar backup** abre a escolha de arquivo (`accept=".json,application/json"`).
- **Validação do arquivo:** JSON válido, `app === "encerramento-11t"`, `history` e
  `trocas` são listas. Caso contrário: alerta "Este arquivo não é um backup do
  Encerramento 11T." e nada muda.
- **Validação de cada registro:** `id` precisa ser número inteiro positivo
  (`Number.isSafeInteger(id) && id > 0`); os demais campos conhecidos viram texto
  (`String(valor ?? "")`) e campos desconhecidos são descartados. Registro sem `id` válido
  é descartado e contado.
  - Histórico: `id, cliente, os, data, tipo, report`.
  - Trocas: `id, data, cliente, os, ret, cond, inst, qtd, motivo`.
- **Junção:** registro cujo `id` já existe no celular é ignorado (o do celular fica).
  Os demais entram; a lista é ordenada por `id` decrescente e cortada no limite
  (50 / 100).
- **Resumo antes de gravar** (`confirm`):
  "Backup de DD/MM/AAAA: N OS e M trocas. Novas: X OS e Y trocas." e, quando houver,
  "Z registros inválidos serão ignorados." e "Por causa do limite, W registros mais
  antigos ficarão de fora." Cancelar não muda nada.
- **Configurações:** `config` do backup só é gravado se o celular não tiver
  `coprel11t_config_v3`; nesse caso `applyConfig()` é chamado.
- Depois de importar: re-renderiza Histórico e Trocas, recalcula o lembrete e mostra
  "Importação concluída: X OS e Y trocas adicionadas."

### 5. Armazenamento persistente

- Na primeira vez que o técnico salva uma OS ou faz backup, o app chama
  `navigator.storage.persist()` (quando existe). Chamadas repetidas são inofensivas.
- O card "Backup" mostra "Armazenamento protegido: Sim / Não / Não suportado", lido de
  `navigator.storage.persisted()`.

### 6. Robustez (pendências da revisão da etapa 1)

- `getStore()` devolve `[]` quando o JSON salvo não é uma lista (`null`, `{}`, etc.).
- Histórico e Trocas deixam de montar `onclick="…(${id})"`: cada botão recebe
  `data-action` e `data-id`, e um único ouvinte por lista (delegação) trata o clique,
  convertendo `data-id` com `Number()`. Assim um `id` vindo de arquivo nunca vira código.

### 7. Cache do PWA

- `CACHE` em `sw.js` passa para `encerramento-11t-v6`.

## Fora do escopo

Ícones e qualquer mudança visual além dos novos elementos (etapa 4); backup automático em
nuvem; criptografia do arquivo.

## Verificação

Testes automatizados em navegador headless (script local em `.superpowers/harness/`,
fora do git), além dos 9 casos existentes:

- Backup: sem `navigator.share` o arquivo é baixado, com nome e conteúdo no formato do
  item 1; `lastBackupAt` é gravado. Com `share` simulado rejeitando `AbortError`, nada é
  gravado.
- Lembrete: aparece com registro de 8 dias sem backup; não aparece com registro de 6 dias;
  some após o backup; não aparece sem histórico.
- Importação: importar o mesmo arquivo duas vezes adiciona só na primeira; arquivo de
  outro app é recusado sem mudar nada; registro sem `id` é descartado e contado; `id` com
  código (`"1);alert(1)//"`) é descartado e nada executa; o limite de 50 corta os mais
  antigos e o resumo avisa; `config` só entra em aparelho sem configuração.
- `getStore` com `"null"` e `"{}"` salvos: telas abrem sem erro.
- Excluir no Histórico e nas Trocas continua funcionando pela delegação.
- Console sem erros.
