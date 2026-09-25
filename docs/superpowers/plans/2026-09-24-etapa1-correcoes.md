# Etapa 1 — Correções e lacunas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o `app.js` legível e corrigir duplicatas, exclusão de trocas, alerta de campos faltando e cache do PWA.

**Architecture:** App estático em HTML/CSS/JS puros. Toda a lógica fica em `app.js` (scripts globais, sem módulos). Cada correção vira uma função pequena e nomeada, chamada pelos handlers existentes.

**Tech Stack:** HTML, CSS, JavaScript puro, `localStorage`, Service Worker. Sem build e sem framework de testes.

**Spec:** `docs/superpowers/specs/2026-09-24-etapa1-correcoes-design.md`

## Global Constraints

- Manter HTML/CSS/JS puros e um único `app.js` (atualização via Termux).
- Não adicionar dependências ao projeto nem framework de testes. Prettier roda só via `npx`, sem entrar no repositório.
- Comportamento existente não muda fora do que a spec lista.
- Chaves de armazenamento inalteradas: `coprel11t_history_v3`, `coprel11t_trocas_v3`, `coprel11t_config_v3`.
- Limites de armazenamento inalterados: histórico 50, trocas 100.
- Textos da interface em português do Brasil.
- Mensagens de commit terminam com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Review Focus

- Salvar com OS vazia: registros sem OS não podem se sobrescrever entre si (só deduplicar quando `os` não estiver vazia).
- Mesma OS em datas diferentes: são registros distintos e ambos permanecem.
- Clicar em Salvar duas vezes seguidas: continua 1 registro, e ele fica no topo da lista.
- Copiar com tipo de atendimento em que GPON/plano não se aplicam (ex.: Câmera): o aviso aparece, mas "Copiar mesmo assim" sempre funciona.
- `localStorage` com JSON inválido ou ausente: as funções novas seguem usando `getStore`, que já devolve `[]`.

## Como verificar (vale para todas as tarefas)

Não há framework de testes. Servir a pasta e usar o console do navegador:

```bash
cd ~/Projetos/gerador-encerramento-11t && python3 -m http.server 8000
```

Abrir `http://localhost:8000`, abrir o console (F12) e conferir que não há erros vermelhos. Para começar cada verificação do zero, rodar no console `localStorage.clear(); location.reload()`. As funções do `app.js` são globais e podem ser chamadas direto no console.

---

### Task 1: Reformatar `app.js` sem mudar comportamento

**Files:**
- Modify: `app.js` (arquivo inteiro)

**Interfaces:**
- Consumes: nada.
- Produces: `app.js` com uma instrução por linha e os mesmos nomes de funções e variáveis globais. As tarefas seguintes localizam o código por nome de função, não por número de linha.

- [ ] **Step 1: Registrar o comportamento de referência**

Com o servidor rodando, abrir o app, preencher OS `1`, cliente `Teste`, endereço `Rua A`, tipo Upgrade, clicar no preset "V5 → X6-10" e em "Gerar encerramento". Copiar o texto do campo Encerramento para um arquivo `/tmp/antes.txt` (o texto usa a data de hoje, então o depois será comparado no mesmo dia).

- [ ] **Step 2: Formatar com Prettier**

Run: `cd ~/Projetos/gerador-encerramento-11t && npx --yes prettier@3 --write app.js`
Expected: `app.js` reformatado, uma instrução por linha, sem alterar nomes.

- [ ] **Step 3: Checar sintaxe**

Run: `node --check app.js`
Expected: sem saída e código de saída 0.

- [ ] **Step 4: Repetir a verificação de referência**

Recarregar o app (Ctrl+Shift+R), repetir exatamente os passos do Step 1 e salvar em `/tmp/depois.txt`.
Run: `diff /tmp/antes.txt /tmp/depois.txt && echo IGUAL`
Expected: `IGUAL`. Console sem erros.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "Reformata app.js sem alterar comportamento

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Salvar sem duplicatas

**Files:**
- Modify: `app.js` (handler `$("saveBtn").onclick`; nova função `upsertRecord` logo acima dele)

**Interfaces:**
- Consumes: `getStore(key)`, `setStore(key, list)`, `HISTORY_KEY`, `TROCAS_KEY`, `v(id)`, `brDate(s)`, `configs`.
- Produces: `upsertRecord(list, record, limit)` → nova lista. `record` tem os campos `os` e `data`. Se `record.os` não for vazia, remove de `list` qualquer item com mesma `os` e mesma `data`. Coloca `record` no início e corta em `limit` itens.

- [ ] **Step 1: Escrever a verificação que deve falhar**

No console do app (antes de implementar):

```js
typeof upsertRecord
```
Expected: `"undefined"`.

- [ ] **Step 2: Implementar `upsertRecord`**

Acima do handler `$("saveBtn").onclick`, adicionar:

```js
function upsertRecord(list, record, limit) {
  const others = record.os
    ? list.filter((x) => !(x.os === record.os && x.data === record.data))
    : list;
  return [record, ...others].slice(0, limit);
}
```

- [ ] **Step 3: Usar `upsertRecord` no handler de salvar**

No handler `$("saveBtn").onclick`, trocar as duas montagens de lista (`h.unshift(...)` seguido de `setStore(HISTORY_KEY, h.slice(0, 50))`, e `t.unshift(...)` seguido de `setStore(TROCAS_KEY, t.slice(0, 100))`) por chamadas a `upsertRecord`, mantendo os mesmos campos de cada registro:

```js
setStore(
  HISTORY_KEY,
  upsertRecord(
    getStore(HISTORY_KEY),
    {
      id: Date.now(),
      cliente: v("cliente"),
      os: v("os"),
      data: brDate(v("data")),
      tipo: configs[v("tipo")].title,
      report: r,
    },
    50,
  ),
);
if (["upgrade", "troca"].includes(v("tipo"))) {
  setStore(
    TROCAS_KEY,
    upsertRecord(
      getStore(TROCAS_KEY),
      {
        id: Date.now(),
        data: brDate(v("data")),
        cliente: v("cliente"),
        os: v("os"),
        ret: v("qtdRet") + " " + v("equipRet"),
        cond: v("condicao"),
        inst: v("qtdInst") + " " + v("equipInst"),
        qtd: v("qtdInst"),
        motivo: v("motivoTroca"),
      },
      100,
    ),
  );
}
```

- [ ] **Step 4: Verificar**

Recarregar com `localStorage.clear(); location.reload()`. No console:

```js
JSON.stringify(upsertRecord([{os:"1",data:"a",n:1}], {os:"1",data:"a",n:2}, 50))
```
Expected: `[{"os":"1","data":"a","n":2}]` (1 item, o novo).

```js
upsertRecord([{os:"1",data:"a"}], {os:"1",data:"b"}, 50).length
```
Expected: `2` (mesma OS em data diferente permanece).

```js
upsertRecord([{os:"",data:"a"}], {os:"",data:"a"}, 50).length
```
Expected: `2` (OS vazia não deduplica).

```js
upsertRecord(Array.from({length: 60}, (_, i) => ({os: String(i), data: "a"})), {os:"x",data:"a"}, 50).length
```
Expected: `50`.

Na interface: preencher uma troca (OS `1`, cliente `Teste`, endereço `Rua A`, preset "V5 → X6-10"), Gerar, clicar em "Salvar histórico" duas vezes. Em Histórico e em Trocas deve haver **1** registro cada, sem erros no console.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "Evita duplicar histórico e trocas ao salvar a mesma OS

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Excluir troca e mostrar contagem

**Files:**
- Modify: `index.html` (título da seção de trocas, dentro de `#tab-trocas`)
- Modify: `app.js` (`renderTrocas`; nova `window.delTroca`)

**Interfaces:**
- Consumes: `getStore`, `setStore`, `TROCAS_KEY`, `esc(s)`, `renderTrocas()`.
- Produces: `window.delTroca(id)` remove a troca de `id` após `confirm()` e chama `renderTrocas()`. `#trocasCount` mostra o número de trocas salvas.

- [ ] **Step 1: Escrever a verificação que deve falhar**

No console: `typeof delTroca`
Expected: `"undefined"`. Na aba Trocas não há botão Excluir nem contagem.

- [ ] **Step 2: Adicionar a contagem no `index.html`**

Em `#tab-trocas`, trocar `<h2>Controle de trocas</h2>` por:

```html
<h2>Controle de trocas <span id="trocasCount"></span></h2>
```

- [ ] **Step 3: Atualizar `renderTrocas` e criar `delTroca`**

Em `renderTrocas`, depois de `let a = getStore(TROCAS_KEY)`, adicionar:

```js
$("trocasCount").textContent = a.length ? `(${a.length})` : "";
```

No HTML de cada item, depois da `div` com a classe `hint`, incluir os botões de ação (mesma classe usada no histórico):

```js
`<div class="history-actions"><button class="ghost" onclick="delTroca(${x.id})">Excluir</button></div>`
```

Abaixo de `renderTrocas`, adicionar:

```js
window.delTroca = (id) => {
  if (!confirm("Excluir esta troca?")) return;
  setStore(
    TROCAS_KEY,
    getStore(TROCAS_KEY).filter((x) => x.id !== id),
  );
  renderTrocas();
};
```

- [ ] **Step 4: Verificar**

Recarregar com `localStorage.clear(); location.reload()`. Salvar duas trocas com OS `1` e `2`. Na aba Trocas o título mostra `(2)`. Clicar em Excluir na primeira, cancelar no diálogo: continua `(2)`. Excluir de novo e confirmar: some o item e o título mostra `(1)`. Excluir a última: título sem contagem e mensagem "Nenhuma troca salva." Console sem erros.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js
git commit -m "Permite excluir troca e mostra contagem de trocas salvas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Alerta de campos técnicos faltando + cache do PWA

**Files:**
- Modify: `app.js` (handler `$("copyBtn").onclick`; nova `missingTechFields`)
- Modify: `sw.js:1`

**Interfaces:**
- Consumes: `v(id)`, `getConfig()`, `copyText(text)`.
- Produces: `missingTechFields()` → array de nomes (strings) dos campos técnicos vazios, na ordem: `"Internet funcionando"`, `"Plano"`, `"Sinal GPON"`, `"Cliente acompanhou"`.

- [ ] **Step 1: Escrever a verificação que deve falhar**

No console: `typeof missingTechFields`
Expected: `"undefined"`. Com o formulário vazio, Gerar e Copiar copia direto, sem aviso.

- [ ] **Step 2: Implementar `missingTechFields`**

Acima do handler `$("copyBtn").onclick`, adicionar:

```js
function missingTechFields() {
  const missing = [];
  if (v("internet") === "na") missing.push("Internet funcionando");
  if (!v("plano")) missing.push("Plano");
  if (!v("gpon")) missing.push("Sinal GPON");
  if (v("acompanhou") === "na") missing.push("Cliente acompanhou");
  return missing;
}
```

- [ ] **Step 3: Usar o alerta no botão Copiar**

No handler `$("copyBtn").onclick`, logo depois da checagem de texto vazio (`if (!t) return alert("Gere o encerramento.")`) e antes de `copyText`, adicionar:

```js
if (getConfig().confirmBeforeCopy !== false) {
  const missing = missingTechFields();
  if (
    missing.length &&
    !confirm(
      "Campos técnicos não informados:\n• " +
        missing.join("\n• ") +
        "\n\nCopiar mesmo assim?",
    )
  )
    return;
}
```

O `!== false` mantém o padrão ligado, igual ao `applyConfig`, para quem nunca salvou as configurações.

- [ ] **Step 4: Subir a versão do cache**

Em `sw.js:1`, trocar:

```js
const CACHE="encerramento-11t-v3";
```
por:
```js
const CACHE="encerramento-11t-v4";
```

- [ ] **Step 5: Verificar**

Recarregar com `localStorage.clear(); location.reload()`. No console: `missingTechFields()`
Expected: `["Internet funcionando","Plano","Sinal GPON","Cliente acompanhou"]`.

Na interface: preencher OS `1`, cliente `Teste`, endereço `Rua A`, tipo Camera, Gerar, Copiar.
Expected: diálogo listando os 4 campos. "Cancelar" não copia; "OK" copia e mostra "Copiado ✓".

Preencher Internet = Sim, Plano `400 Mbps`, GPON `-21 dBm` e Cliente acompanhou = Sim, Gerar, Copiar.
Expected: copia direto, sem diálogo.

Em Configurações, desmarcar o alerta, Salvar configurações, esvaziar os campos técnicos, Gerar e Copiar.
Expected: copia direto, sem diálogo. Console sem erros.

Em DevTools > Application > Service Workers, conferir que o cache `encerramento-11t-v4` existe depois de recarregar.

- [ ] **Step 6: Commit**

```bash
git add app.js sw.js
git commit -m "Alerta ao copiar com campos técnicos faltando e sobe cache do PWA

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
