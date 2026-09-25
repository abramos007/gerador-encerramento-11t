# Etapa 2 — Backup, lembrete e importação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar os dados do celular com um toque (backup compartilhado em `.txt`), lembrar o técnico de fazer backup, restaurar sem duplicar, e endurecer o armazenamento (limites maiores, lista inválida, ids fora do HTML, cota cheia).

**Architecture:** Tudo continua no `app.js` único, em funções pequenas e globais. Novos dados no `localStorage`: `coprel11t_backup_v1` (`{ lastBackupAt }`). Os botões do Histórico e das Trocas passam a usar `data-action`/`data-id` com um ouvinte por lista. Limites viram o objeto `LIMITS` (mutável, para os testes reduzirem).

**Tech Stack:** HTML, CSS, JavaScript puro, `localStorage`, Web Share API (arquivos), Storage API (`persist`), Service Worker. Verificação com Playwright (`playwright-core` + Chromium já instalado em `~/.cache/ms-playwright`), em harness local fora do git.

**Spec:** `docs/superpowers/specs/2026-09-25-etapa2-backup-design.md`

## Global Constraints

- HTML/CSS/JS puros, `app.js` único, sem build e sem dependências no repositório.
- Chaves inalteradas: `coprel11t_history_v3`, `coprel11t_trocas_v3`, `coprel11t_config_v3`. Nova: `coprel11t_backup_v1`.
- Limites: histórico **1000**, trocas **2000** (`LIMITS.history`, `LIMITS.trocas`).
- Texto dos relatórios inalterado (o caso `t1` compara byte a byte).
- Arquivo de backup: `backup-encerramento-11t-AAAA-MM-DD.txt`, tipo `text/plain`, conteúdo JSON `{ app: "encerramento-11t", version: 1, exportedAt, history, trocas, config }`.
- Cancelar o compartilhamento (`AbortError`) não conta como backup.
- Lembrete: registro com `id` > `lastBackupAt` (ou qualquer, se nunca houve backup) cujo mais antigo tem ≥ 7 dias.
- Importação por junção por `id` (o do celular vence), `id` válido = `Number.isSafeInteger(id) && id > 0`; config do arquivo só entra se não houver `coprel11t_config_v3`.
- `sw.js`: `CACHE` = `encerramento-11t-v6`.
- Visual mínimo nesta etapa (a etapa 4 redesenha tudo); textos da interface em português.
- Branch: `etapa2-e-4`. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Dados reais de clientes nunca entram no repositório.

## Review Focus

- Backup feito com o histórico vazio: o arquivo sai válido (listas vazias) e o lembrete não aparece.
- Importar um backup exportado pelo próprio app, no mesmo aparelho: "Novas: 0 OS e 0 trocas", nada muda.
- Registro importado com `id` duplicado **dentro do próprio arquivo**: entra uma vez só.
- Config do arquivo com campos estranhos ou tipos errados: só `tecnico`, `empresa` (texto) e `confirmBeforeCopy` (booleano) entram.
- Cota cheia ao salvar trocas depois de o histórico ter sido gravado: o app avisa e não mostra "Salvo ✓".

## Harness de verificação (local, fora do git)

O harness está em `.superpowers/harness/check.js` (a pasta `.superpowers/` está em
`.git/info/exclude`). Casos existentes: `t1`–`t9`. Todo comando abaixo assume, a partir da
raiz do repositório:

```bash
cd ~/Projetos/gerador-encerramento-11t
H=.superpowers/harness
export CHROME=$(ls ~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome) NODE_PATH=$PWD/$H/node_modules
(python3 -m http.server 8765 >/dev/null 2>&1 & echo $! > $H/srv.pid); sleep 1
# um caso:       node $H/check.js t10
# todos:         for t in t1 t2 t3 t4 t5 t6 t7 t8 t9 t10 t11 t12 t13; do node $H/check.js $t; done
# ao terminar:   kill $(cat $H/srv.pid)
```

Novos casos entram no objeto `checks`, logo antes do `};` que precede `(async () => {`.
Cada caso começa com `localStorage` limpo e a página recarregada. Um caso que lança `Error`
imprime `FAIL` e sai com 1.

---

### Task 1: Harness local, limites, cota cheia, lista inválida e botões sem `onclick`

**Files:**
- Modify: `app.js` (topo: `LIMITS`; `getStore`, `setStore`, handler de `saveBtn`, `renderHistory`, `openHist`/`copyHist`/`delHist`, `renderTrocas`, `delTroca`, ouvintes das listas)
- Modify (fora do git): `.superpowers/harness/check.js` (caminho da referência; caso `t10`), `.superpowers/harness/node_modules`

**Interfaces:**
- Consumes: `HISTORY_KEY`, `TROCAS_KEY`, `upsertRecord`, `reportMatchesOs`, `esc`, `copyText`, `switchTab`.
- Produces:
  - `LIMITS = { history: 1000, trocas: 2000 }` (objeto global mutável).
  - `getStore(k)` → sempre um array.
  - `setStore(k, x)` → `true` se gravou; `false` (e alerta "Armazenamento cheio: faça um backup e exclua registros antigos.") se falhou.
  - `openHist(id)`, `copyHist(id)`, `delHist(id)`, `delTroca(id)` como declarações de função globais (recebem `id` numérico).
  - Botões das listas com `data-action` (`open` | `copy` | `del`) e `data-id`.

- [ ] **Step 1: Preparar o harness local e gravar a referência**

```bash
cd ~/Projetos/gerador-encerramento-11t
H=.superpowers/harness
(cd $H && npm init -y >/dev/null && npm i playwright-core >/dev/null)
sed -i "s#/tmp/claude-1000/[^\"]*/ref.txt#$PWD/$H/ref.txt#" $H/check.js
grep -n "ref.txt" $H/check.js
```
Expected: a linha do `ref.txt` aponta para `…/gerador-encerramento-11t/.superpowers/harness/ref.txt`.

Com o servidor rodando (bloco do harness), gravar a referência do texto atual e rodar a suíte:

Run: `node $H/check.js t1 save && for t in t1 t2 t3 t4 t5 t6 t7 t8 t9; do node $H/check.js $t; done`
Expected: `t1 PASS: reference saved`, depois `t1`–`t9` todos `PASS`.

- [ ] **Step 2: Escrever o caso `t10`**

Adicionar ao objeto `checks`:

```js
  async t10(p) {
    const msgs = [];
    p.on("dialog", (d) => { msgs.push(d.message()); d.accept(); });
    await p.evaluate(() => {
      localStorage.setItem("coprel11t_history_v3", "null");
      localStorage.setItem("coprel11t_trocas_v3", "{}");
    });
    await p.reload();
    await p.click('[data-tab="historico"]');
    if (!(await p.textContent("#historyList")).includes("Nenhum registro")) throw new Error("histórico null quebrou");
    await p.click('[data-tab="trocas"]');
    if (!(await p.textContent("#trocasList")).includes("Nenhuma troca")) throw new Error("trocas {} quebrou");
    await p.click('[data-tab="nova"]');
    if ((await p.evaluate(() => [LIMITS.history, LIMITS.trocas].join())) !== "1000,2000") throw new Error("limites");
    await p.evaluate(() => { LIMITS.history = 2; });
    const save = async (os) => {
      await p.fill("#os", os); await p.fill("#cliente", "T"); await p.fill("#endereco", "R");
      await p.click("#generateBtn"); await p.click("#saveBtn"); await p.waitForTimeout(5);
    };
    for (const os of ["1", "2", "3"]) await save(os);
    const oss = () => p.evaluate(() => JSON.parse(localStorage.getItem("coprel11t_history_v3")).map((x) => x.os).join());
    if ((await oss()) !== "3,2") throw new Error("corte pelo limite: " + (await oss()));
    await p.evaluate(() => {
      window.__origSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === "coprel11t_history_v3") throw new DOMException("cheio", "QuotaExceededError");
        return window.__origSet.call(this, k, v);
      };
    });
    await save("4");
    if (!msgs.some((m) => m.includes("Armazenamento cheio"))) throw new Error("sem aviso de cota: " + msgs);
    if ((await p.textContent("#copyStatus")).includes("Salvo")) throw new Error("mostrou Salvo com cota cheia");
    if ((await oss()) !== "3,2") throw new Error("perdeu dados com cota cheia");
    await p.evaluate(() => { Storage.prototype.setItem = window.__origSet; });
    await p.evaluate(() => {
      const h = JSON.parse(localStorage.getItem("coprel11t_history_v3"));
      h.push({ id: "1);window.__pwned=1//", cliente: "X", os: "9", data: "", tipo: "", report: "" });
      localStorage.setItem("coprel11t_history_v3", JSON.stringify(h));
    });
    await p.click('[data-tab="historico"]');
    if (await p.locator("#historyList [onclick]").count()) throw new Error("ainda há onclick no histórico");
    const bad = p.locator("#historyList .history-item", { hasText: "OS 9" });
    await bad.locator("button", { hasText: "Excluir" }).click();
    await bad.locator("button", { hasText: "Abrir" }).click();
    if (await p.evaluate(() => window.__pwned)) throw new Error("id executou código");
    await p.click('[data-tab="historico"]');
    await p.locator("#historyList .history-item", { hasText: "OS 3" }).locator("button", { hasText: "Excluir" }).click();
    if ((await oss()).includes("3")) throw new Error("excluir por delegação falhou: " + (await oss()));
    return "limites, cota, lista inválida e delegação ok";
  },
```

- [ ] **Step 3: Rodar `t10` e ver falhar**

Run: `node $H/check.js t10`
Expected: `t10 FAIL` — com `getStore` atual, o histórico `"null"` quebra a renderização (erro de console/`histórico null quebrou`) ou `limites` (`LIMITS` não existe).

- [ ] **Step 4: `LIMITS`, `getStore` e `setStore`**

Em `app.js`, logo depois de `const CONFIG_KEY = "coprel11t_config_v3";`, inserir:

```js
const LIMITS = { history: 1000, trocas: 2000 };
```

Trocar `getStore` e `setStore` por:

```js
function getStore(k) {
  try {
    const x = JSON.parse(localStorage.getItem(k) || "[]");
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}
function setStore(k, x) {
  try {
    localStorage.setItem(k, JSON.stringify(x));
    return true;
  } catch {
    alert("Armazenamento cheio: faça um backup e exclua registros antigos.");
    return false;
  }
}
```

- [ ] **Step 5: Salvar respeitando limites e falhas**

No handler de `$("saveBtn").onclick`:
1. Trocar `setStore(\n    HISTORY_KEY,` por `if (\n    !setStore(\n    HISTORY_KEY,` fechando com `)\n  )\n    return;` — ou seja, o bloco fica:

```js
  if (
    !setStore(
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
        LIMITS.history,
        merge,
      ),
    )
  )
    return;
```

2. No bloco de trocas, da mesma forma: `if (!setStore(TROCAS_KEY, upsertRecord(getStore(TROCAS_KEY), { …mesmos campos… }, LIMITS.trocas, merge))) return;` (substituir o `100` por `LIMITS.trocas` e o `setStore(...)` solto pelo `if (!setStore(...)) return;`).

- [ ] **Step 6: Botões das listas por delegação**

1. Em `renderHistory`, trocar o trecho dos botões por:

```js
<div class="history-actions"><button class="ghost" data-action="open" data-id="${esc(x.id)}">Abrir</button><button class="ghost" data-action="copy" data-id="${esc(x.id)}">Copiar</button><button class="ghost" data-action="del" data-id="${esc(x.id)}">Excluir</button></div>
```

2. Trocar `window.openHist = (id) => {`, `window.copyHist = async (id) => {` e `window.delHist = (id) => {` por `function openHist(id) {`, `async function copyHist(id) {` e `function delHist(id) {` (corpos iguais; fechar com `}` em vez de `};`).

3. Em `renderTrocas`, trocar `<button class="ghost" onclick="delTroca(${x.id})">Excluir</button>` por:

```js
<button class="ghost" data-action="del" data-id="${esc(x.id)}">Excluir</button>
```
e `window.delTroca = (id) => {` por `function delTroca(id) {` (fechando com `}`).

4. Logo depois de `delTroca`, inserir:

```js
function listAction(e, handlers) {
  const b = e.target.closest("button[data-action]");
  if (b && handlers[b.dataset.action]) handlers[b.dataset.action](Number(b.dataset.id));
}
$("historyList").addEventListener("click", (e) =>
  listAction(e, { open: openHist, copy: copyHist, del: delHist }),
);
$("trocasList").addEventListener("click", (e) =>
  listAction(e, { del: delTroca }),
);
```

- [ ] **Step 7: Formatar e rodar tudo**

Run:
```bash
npx --yes prettier@3 --write app.js >/dev/null && node --check app.js && for t in t1 t2 t3 t4 t5 t6 t7 t8 t9 t10; do node $H/check.js $t; done
```
Expected: `t1`–`t10` todos `PASS`.

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "Limites 1000/2000, aviso de armazenamento cheio, lista inválida vira vazia e botões sem onclick

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Compartilhar backup e armazenamento persistente

**Files:**
- Modify: `index.html` (novo card "Backup" na aba de configurações)
- Modify: `styles.css` (status)
- Modify: `app.js` (constantes e funções de backup; chamadas no salvar e na inicialização)
- Modify (fora do git): `.superpowers/harness/check.js` (`t11`)

**Interfaces:**
- Consumes: `getStore`, `getConfig`, `todayISO`, `HISTORY_KEY`, `TROCAS_KEY`.
- Produces:
  - `BACKUP_KEY = "coprel11t_backup_v1"`, `DAY_MS`.
  - `getBackupInfo()` → `{ lastBackupAt?: number }`.
  - `buildBackup()` → objeto do backup; `backupFileName()` → `"backup-encerramento-11t-AAAA-MM-DD.txt"`.
  - `downloadFile(file)`; `shareBackup()` (async) — compartilha ou baixa, grava `lastBackupAt`, chama `requestPersist()` e `renderBackupStatus()`.
  - `formatDateTime(ms)` → `"DD/MM/AAAA HH:MM"`.
  - `renderBackupStatus()` — atualiza `#backupInfo` (e, na Task 3, o lembrete).
  - `requestPersist()`, `renderStorageStatus()` (async).
  - Elementos: `#backupInfo`, `#storageInfo`, `#backupStatus`, `#shareBackupBtn`, `#importBackupBtn`, `#importFile`.

- [ ] **Step 1: Escrever `t11`**

No topo de `check.js`, `fs` já é importado. Adicionar ao objeto `checks`:

```js
  async t11(p) {
    await p.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "canShare", { configurable: true, value: () => window.__shareMode !== "none" });
      Object.defineProperty(Navigator.prototype, "share", {
        configurable: true,
        value: async (d) => {
          if (window.__shareMode === "abort") throw new DOMException("cancelado", "AbortError");
          window.__shared = d.files.map((f) => f.name + "|" + f.type);
        },
      });
    });
    await p.reload();
    await p.fill("#os", "1"); await p.fill("#cliente", "T"); await p.fill("#endereco", "R");
    await p.click("#generateBtn"); await p.click("#saveBtn");
    await p.click('[data-tab="config"]');
    if (!(await p.textContent("#backupInfo")).includes("Nenhum backup ainda")) throw new Error("status inicial");
    const last = () => p.evaluate(() => JSON.parse(localStorage.getItem("coprel11t_backup_v1") || "{}").lastBackupAt);
    await p.evaluate(() => { window.__shareMode = "abort"; });
    await p.click("#shareBackupBtn"); await p.waitForTimeout(300);
    if (await last()) throw new Error("cancelar contou como backup");
    await p.evaluate(() => { window.__shareMode = "ok"; });
    await p.click("#shareBackupBtn"); await p.waitForTimeout(300);
    const shared = await p.evaluate(() => window.__shared);
    if (!shared || !/^backup-encerramento-11t-\d{4}-\d{2}-\d{2}\.txt\|text\/plain$/.test(shared[0])) throw new Error("share: " + shared);
    if (!(await last())) throw new Error("share ok não gravou lastBackupAt");
    if (!(await p.textContent("#backupInfo")).includes("Último backup:")) throw new Error("status após backup");
    await p.evaluate(() => { window.__shareMode = "none"; localStorage.removeItem("coprel11t_backup_v1"); });
    const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#shareBackupBtn")]);
    if (!/^backup-encerramento-11t-\d{4}-\d{2}-\d{2}\.txt$/.test(dl.suggestedFilename())) throw new Error("nome: " + dl.suggestedFilename());
    const d = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    if (d.app !== "encerramento-11t" || d.version !== 1 || isNaN(Date.parse(d.exportedAt)) || d.history.length !== 1 || !Array.isArray(d.trocas) || typeof d.config !== "object")
      throw new Error("conteúdo: " + JSON.stringify(d).slice(0, 200));
    if (!(await last())) throw new Error("download não gravou lastBackupAt");
    if (!/Armazenamento protegido: (Sim|Não|Não suportado)/.test(await p.textContent("#storageInfo"))) throw new Error("storageInfo");
    return "compartilhar/cancelar/baixar ok";
  },
```

Obs.: o harness cria o contexto com `serviceWorkers: "block"`; downloads funcionam no contexto padrão do Playwright (`acceptDownloads` é `true` por padrão).

- [ ] **Step 2: Rodar `t11` e ver falhar**

Run: `node $H/check.js t11`
Expected: `t11 FAIL` com timeout em `textContent("#backupInfo")` (o elemento ainda não existe).

- [ ] **Step 3: HTML e CSS do card**

Em `index.html`, dentro de `<section id="tab-config" class="tab-panel">`, depois do `</section>` que fecha o card de Configurações (logo após o botão `saveConfigBtn`), inserir:

```html
        <section class="card">
          <div class="section-head">
            <h2>Backup</h2>
            <span id="backupStatus"></span>
          </div>
          <p class="hint" id="backupInfo">Nenhum backup ainda</p>
          <p class="hint" id="storageInfo"></p>
          <div class="button-row">
            <button class="primary" id="shareBackupBtn">Compartilhar backup</button>
            <button class="ghost" id="importBackupBtn">Importar backup</button>
          </div>
          <input type="file" id="importFile" accept=".txt,.json,text/plain,application/json" hidden>
        </section>
```

Acrescentar ao final de `styles.css`:

```css
#backupStatus{font-size:12px;font-weight:900;color:var(--ok)}
```

- [ ] **Step 4: Funções de backup**

Em `app.js`, logo depois de `setStore`, inserir:

```js
const BACKUP_KEY = "coprel11t_backup_v1";
const DAY_MS = 24 * 60 * 60 * 1000;
function getBackupInfo() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function buildBackup() {
  return {
    app: "encerramento-11t",
    version: 1,
    exportedAt: new Date().toISOString(),
    history: getStore(HISTORY_KEY),
    trocas: getStore(TROCAS_KEY),
    config: getConfig(),
  };
}
function backupFileName() {
  return `backup-encerramento-11t-${todayISO()}.txt`;
}
function downloadFile(file) {
  const url = URL.createObjectURL(file),
    a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function shareBackup() {
  const file = new File(
    [JSON.stringify(buildBackup(), null, 2)],
    backupFileName(),
    { type: "text/plain" },
  );
  let shared = false;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Backup Encerramento 11T" });
      shared = true;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  if (!shared) downloadFile(file);
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ lastBackupAt: Date.now() }));
  } catch {}
  requestPersist();
  renderBackupStatus();
  $("backupStatus").textContent = "Backup feito ✓";
}
function formatDateTime(ms) {
  const d = new Date(ms),
    p2 = (n) => String(n).padStart(2, "0");
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
function renderBackupStatus() {
  const last = getBackupInfo().lastBackupAt;
  $("backupInfo").textContent = last
    ? "Último backup: " + formatDateTime(last)
    : "Nenhum backup ainda";
}
async function renderStorageStatus() {
  const el = $("storageInfo");
  if (!navigator.storage?.persisted) {
    el.textContent = "Armazenamento protegido: Não suportado";
    return;
  }
  el.textContent =
    "Armazenamento protegido: " +
    ((await navigator.storage.persisted()) ? "Sim" : "Não");
}
function requestPersist() {
  if (navigator.storage?.persist)
    navigator.storage.persist().then(renderStorageStatus).catch(() => {});
}
$("shareBackupBtn").onclick = shareBackup;
```

- [ ] **Step 5: Ligar ao salvar e à inicialização**

1. No final do handler de `saveBtn`, logo depois de `$("copyStatus").textContent = "Salvo ✓";`, acrescentar:

```js
  requestPersist();
  renderBackupStatus();
```

2. Na inicialização, logo depois de `renderTrocas();`, acrescentar:

```js
renderBackupStatus();
renderStorageStatus();
```

- [ ] **Step 6: Formatar e rodar tudo**

Run: `npx --yes prettier@3 --write app.js >/dev/null && node --check app.js && for t in t1 t2 t3 t4 t5 t6 t7 t8 t9 t10 t11; do node $H/check.js $t; done`
Expected: `t1`–`t11` todos `PASS`.

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css app.js
git commit -m "Compartilhar backup (.txt) com fallback de download e armazenamento persistente

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Lembrete de backup

**Files:**
- Modify: `index.html` (aviso no topo da aba Nova OS)
- Modify: `styles.css` (aviso)
- Modify: `app.js` (`backupDue`, `renderBackupStatus`, botão do aviso)
- Modify (fora do git): `.superpowers/harness/check.js` (`t12`)

**Interfaces:**
- Consumes: `getBackupInfo`, `getStore`, `HISTORY_KEY`, `DAY_MS`, `shareBackup`, `renderBackupStatus` (Task 2).
- Produces: `backupDue(now = Date.now())` → booleano; `#backupBanner` (com `hidden`) e `#bannerBackupBtn`. `renderBackupStatus()` passa a atualizar também o aviso.

- [ ] **Step 1: Escrever `t12`**

```js
  async t12(p) {
    await p.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "canShare", { configurable: true, value: () => true });
      Object.defineProperty(Navigator.prototype, "share", { configurable: true, value: async () => {} });
    });
    const seed = async (ages, lastAgo) => {
      await p.evaluate(([ages, lastAgo]) => {
        const now = Date.now(), day = 86400000;
        localStorage.setItem("coprel11t_history_v3", JSON.stringify(ages.map((a, i) => ({ id: now - a * day, cliente: "C" + i, os: String(i + 1), data: "", tipo: "", report: "" }))));
        if (lastAgo === null) localStorage.removeItem("coprel11t_backup_v1");
        else localStorage.setItem("coprel11t_backup_v1", JSON.stringify({ lastBackupAt: now - lastAgo * day }));
      }, [ages, lastAgo]);
      await p.reload();
    };
    const shown = () => p.isVisible("#backupBanner");
    await seed([], null);
    if (await shown()) throw new Error("aviso sem histórico");
    await seed([8], null);
    if (!(await shown())) throw new Error("não avisou 8 dias sem backup");
    await seed([6], null);
    if (await shown()) throw new Error("avisou com 6 dias");
    await seed([8], 1);
    if (await shown()) throw new Error("avisou com registro anterior ao backup");
    await seed([10, 8], 9);
    if (!(await shown())) throw new Error("não avisou registro de 8 dias após backup de 9");
    await p.click("#bannerBackupBtn");
    await p.waitForFunction(() => document.getElementById("backupBanner").hidden);
    return "lembrete ok";
  },
```

- [ ] **Step 2: Rodar `t12` e ver falhar**

Run: `node $H/check.js t12`
Expected: `t12 FAIL` — `#backupBanner` não existe (`isVisible` devolve `false`, então falha em `não avisou 8 dias sem backup`).

- [ ] **Step 3: HTML e CSS**

Em `index.html`, logo depois de `<section id="tab-nova" class="tab-panel active">`, inserir:

```html
        <div class="backup-banner" id="backupBanner" hidden>
          <span>Há OS salvas há 7 dias ou mais sem backup</span>
          <button class="mini primary" id="bannerBackupBtn">Fazer backup</button>
        </div>
```

Acrescentar ao final de `styles.css`:

```css
.backup-banner{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#fff7e6;border:1px solid #f3d08b;color:#6b4a00;padding:10px 12px;border-radius:14px;margin-bottom:14px;font-size:13px;font-weight:700}
.backup-banner[hidden]{display:none}
```

- [ ] **Step 4: `backupDue` e aviso**

Em `app.js`, logo antes de `function renderBackupStatus()`, inserir:

```js
function backupDue(now = Date.now()) {
  const last = Number(getBackupInfo().lastBackupAt) || 0;
  const pending = getStore(HISTORY_KEY)
    .map((x) => Number(x.id))
    .filter((id) => Number.isFinite(id) && id > last);
  return pending.length > 0 && now - Math.min(...pending) >= 7 * DAY_MS;
}
```

Em `renderBackupStatus`, acrescentar como última linha do corpo:

```js
  $("backupBanner").hidden = !backupDue();
```

Logo depois de `$("shareBackupBtn").onclick = shareBackup;`, acrescentar:

```js
$("bannerBackupBtn").onclick = shareBackup;
```

- [ ] **Step 5: Formatar e rodar tudo**

Run: `npx --yes prettier@3 --write app.js >/dev/null && node --check app.js && for t in t1 t2 t3 t4 t5 t6 t7 t8 t9 t10 t11 t12; do node $H/check.js $t; done`
Expected: `t1`–`t12` todos `PASS`.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css app.js
git commit -m "Lembrete de backup quando há OS salvas há 7 dias ou mais sem backup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Importar backup + cache v6

**Files:**
- Modify: `app.js` (funções de importação, ouvintes de `#importBackupBtn` e `#importFile`)
- Modify: `sw.js:1`
- Modify (fora do git): `.superpowers/harness/check.js` (`t13`; `t4` passa a esperar `v6`)

**Interfaces:**
- Consumes: `getStore`, `setStore`, `LIMITS`, `HISTORY_KEY`, `TROCAS_KEY`, `CONFIG_KEY`, `applyConfig`, `renderHistory`, `renderTrocas`, `renderBackupStatus`.
- Produces:
  - `HISTORY_FIELDS`, `TROCAS_FIELDS` (arrays de nomes de campo, sem `id`).
  - `sanitizeRecords(list, fields)` → `{ valid, invalid }`.
  - `mergeById(local, incoming, limit)` → `{ list, added, cut }` (sem duplicar `id`, nem dentro do arquivo).
  - `parseBackup(text)` → objeto do backup ou `null`.
  - `sanitizeConfig(c)` → `{ tecnico, empresa, confirmBeforeCopy }`.
  - `backupDateLabel(iso)` → `"Backup de DD/MM/AAAA"` ou `"Backup sem data"`.
  - `importBackup(file)` (async).

- [ ] **Step 1: Escrever `t13` e ajustar `t4`**

Em `check.js`, no caso `t4`, trocar `encerramento-11t-v5` por `encerramento-11t-v6` (e o texto de retorno `sw v5` por `sw v6`). Adicionar:

```js
  async t13(p) {
    const msgs = [];
    let reply = true;
    p.on("dialog", (d) => { msgs.push(d.message()); reply ? d.accept() : d.dismiss(); });
    const hist = () => p.evaluate(() => JSON.parse(localStorage.getItem("coprel11t_history_v3") || "[]"));
    const trocas = () => p.evaluate(() => JSON.parse(localStorage.getItem("coprel11t_trocas_v3") || "[]"));
    await p.evaluate(() => localStorage.setItem("coprel11t_history_v3", JSON.stringify([{ id: 100, cliente: "Local", os: "A", data: "", tipo: "", report: "" }])));
    await p.reload();
    const backup = {
      app: "encerramento-11t", version: 1, exportedAt: "2026-09-25T12:00:00.000Z",
      history: [
        { id: 100, cliente: "Do backup", os: "A", data: "", tipo: "", report: "" },
        { id: 200, cliente: "Novo", os: "B", data: "", tipo: "", report: "r", extra: "x" },
        { id: 200, cliente: "Duplicado no arquivo", os: "B2", data: "", tipo: "", report: "" },
        { cliente: "Sem id", os: "C" },
        { id: "1);window.__pwned=1//", cliente: "Malicioso", os: "D" },
      ],
      trocas: [{ id: 300, data: "", cliente: "T", os: "B", ret: "1 V5", cond: "Boa", inst: "1 X6-10", qtd: 1, motivo: "M" }],
      config: { tecnico: "Fulano", empresa: 5, confirmBeforeCopy: false, lixo: "<b>" },
    };
    const file = (obj, name = "backup-encerramento-11t-2026-09-25.txt") => ({ name, mimeType: "text/plain", buffer: Buffer.from(typeof obj === "string" ? obj : JSON.stringify(obj)) });
    await p.click('[data-tab="config"]');
    await p.setInputFiles("#importFile", file(backup));
    await p.waitForTimeout(300);
    const summary = msgs.find((m) => m.includes("Novas:")) || "";
    if (!summary.includes("Backup de 25/09/2026: 5 OS e 1 trocas.") || !summary.includes("Novas: 1 OS e 1 trocas.") || !summary.includes("2 registros inválidos"))
      throw new Error("resumo: " + summary);
    let h = await hist();
    if (h.map((x) => x.id).join() !== "200,100" || h.find((x) => x.id === 100).cliente !== "Local" || "extra" in h[0])
      throw new Error("junção: " + JSON.stringify(h));
    if ((await trocas()).length !== 1 || (await trocas())[0].qtd !== "1") throw new Error("trocas: " + JSON.stringify(await trocas()));
    const cfg = await p.evaluate(() => JSON.parse(localStorage.getItem("coprel11t_config_v3")));
    if (JSON.stringify(cfg) !== JSON.stringify({ tecnico: "Fulano", empresa: "5", confirmBeforeCopy: false }) || (await p.inputValue("#tecnicoPadrao")) !== "Fulano")
      throw new Error("config: " + JSON.stringify(cfg));
    if (await p.evaluate(() => window.__pwned)) throw new Error("código executou");
    if (!msgs.some((m) => m.includes("Importação concluída: 1 OS e 1 trocas adicionadas."))) throw new Error("mensagem final");
    msgs.length = 0;
    await p.setInputFiles("#importFile", file(backup, "copia.json"));
    await p.waitForTimeout(300);
    if (!msgs.some((m) => m.includes("Novas: 0 OS e 0 trocas."))) throw new Error("reimportar: " + msgs);
    if ((await hist()).length !== 2 || (await trocas()).length !== 1) throw new Error("reimportar duplicou");
    await p.evaluate(() => localStorage.setItem("coprel11t_config_v3", JSON.stringify({ tecnico: "Local" })));
    msgs.length = 0;
    await p.setInputFiles("#importFile", file(backup));
    await p.waitForTimeout(300);
    if ((await p.evaluate(() => JSON.parse(localStorage.getItem("coprel11t_config_v3")).tecnico)) !== "Local") throw new Error("config sobrescrita");
    msgs.length = 0;
    await p.setInputFiles("#importFile", file({ foo: 1 }));
    await p.waitForTimeout(300);
    if (!msgs.some((m) => m.includes("não é um backup do Encerramento 11T"))) throw new Error("arquivo estranho: " + msgs);
    msgs.length = 0;
    await p.setInputFiles("#importFile", file("isto não é json"));
    await p.waitForTimeout(300);
    if (!msgs.some((m) => m.includes("não é um backup do Encerramento 11T"))) throw new Error("texto: " + msgs);
    await p.evaluate(() => { LIMITS.history = 2; });
    const big = { ...backup, history: [{ id: 500, os: "X" }, { id: 400, os: "Y" }] };
    msgs.length = 0; reply = false;
    await p.setInputFiles("#importFile", file(big));
    await p.waitForTimeout(300);
    if (!msgs.some((m) => m.includes("2 registros mais antigos ficarão de fora"))) throw new Error("limite: " + msgs);
    if ((await hist()).length !== 2 || (await hist())[0].id !== 200) throw new Error("cancelar gravou");
    reply = true; msgs.length = 0;
    await p.setInputFiles("#importFile", file(big));
    await p.waitForTimeout(300);
    if ((await hist()).map((x) => x.id).join() !== "500,400") throw new Error("corte: " + (await hist()).map((x) => x.id));
    return "importação ok";
  },
```

- [ ] **Step 2: Rodar `t13` e ver falhar**

Run: `node $H/check.js t13`
Expected: `t13 FAIL: resumo: ` (nada acontece ao escolher o arquivo; nenhuma caixa de diálogo).

- [ ] **Step 3: Funções de importação**

Em `app.js`, logo depois de `$("bannerBackupBtn").onclick = shareBackup;`, inserir:

```js
const HISTORY_FIELDS = ["cliente", "os", "data", "tipo", "report"];
const TROCAS_FIELDS = ["data", "cliente", "os", "ret", "cond", "inst", "qtd", "motivo"];
function sanitizeRecords(list, fields) {
  const valid = [];
  let invalid = 0;
  list.forEach((x) => {
    if (!x || typeof x !== "object" || !Number.isSafeInteger(x.id) || x.id <= 0) {
      invalid++;
      return;
    }
    const r = { id: x.id };
    fields.forEach((f) => (r[f] = String(x[f] ?? "")));
    valid.push(r);
  });
  return { valid, invalid };
}
function mergeById(local, incoming, limit) {
  const seen = new Set(local.map((x) => x.id));
  const fresh = incoming.filter((x) => !seen.has(x.id) && seen.add(x.id));
  const all = [...local, ...fresh].sort((a, b) => b.id - a.id);
  return {
    list: all.slice(0, limit),
    added: fresh.length,
    cut: Math.max(0, all.length - limit),
  };
}
function parseBackup(text) {
  let d;
  try {
    d = JSON.parse(text);
  } catch {
    return null;
  }
  if (!d || d.app !== "encerramento-11t" || !Array.isArray(d.history) || !Array.isArray(d.trocas))
    return null;
  return d;
}
function sanitizeConfig(c) {
  return {
    tecnico: String(c.tecnico ?? "Equipe 11T"),
    empresa: String(c.empresa ?? "Coprel Telecom"),
    confirmBeforeCopy: c.confirmBeforeCopy !== false,
  };
}
function backupDateLabel(iso) {
  const d = new Date(iso),
    p2 = (n) => String(n).padStart(2, "0");
  if (isNaN(d)) return "Backup sem data";
  return `Backup de ${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
async function importBackup(file) {
  const d = parseBackup(await file.text());
  if (!d) return alert("Este arquivo não é um backup do Encerramento 11T.");
  const h = sanitizeRecords(d.history, HISTORY_FIELDS),
    t = sanitizeRecords(d.trocas, TROCAS_FIELDS),
    mh = mergeById(getStore(HISTORY_KEY), h.valid, LIMITS.history),
    mt = mergeById(getStore(TROCAS_KEY), t.valid, LIMITS.trocas);
  let msg = `${backupDateLabel(d.exportedAt)}: ${d.history.length} OS e ${d.trocas.length} trocas. Novas: ${mh.added} OS e ${mt.added} trocas.`;
  if (h.invalid + t.invalid)
    msg += `\n${h.invalid + t.invalid} registros inválidos serão ignorados.`;
  if (mh.cut + mt.cut)
    msg += `\nPor causa do limite, ${mh.cut + mt.cut} registros mais antigos ficarão de fora.`;
  if (!confirm(msg + "\n\nImportar?")) return;
  if (!setStore(HISTORY_KEY, mh.list) || !setStore(TROCAS_KEY, mt.list)) return;
  if (localStorage.getItem(CONFIG_KEY) === null && d.config && typeof d.config === "object") {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(sanitizeConfig(d.config)));
    applyConfig();
  }
  renderHistory();
  renderTrocas();
  renderBackupStatus();
  alert(`Importação concluída: ${mh.added} OS e ${mt.added} trocas adicionadas.`);
}
$("importBackupBtn").onclick = () => $("importFile").click();
$("importFile").onchange = async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (f) await importBackup(f);
};
```

Nota: com a junção, a contagem "N OS" do resumo é o total de registros no arquivo (inclusive inválidos e duplicados), como na spec.

- [ ] **Step 4: Cache do PWA**

Em `sw.js:1`, trocar `encerramento-11t-v5` por `encerramento-11t-v6`.

- [ ] **Step 5: Formatar e rodar tudo**

Run: `npx --yes prettier@3 --write app.js >/dev/null && node --check app.js && for t in t1 t2 t3 t4 t5 t6 t7 t8 t9 t10 t11 t12 t13; do node $H/check.js $t; done`
Expected: `t1`–`t13` todos `PASS`.

- [ ] **Step 6: Commit**

```bash
git add app.js sw.js
git commit -m "Importar backup juntando sem duplicar, com validação e resumo; cache do PWA v6

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Aceite no celular real (depois da publicação, com o técnico)

Não é tarefa do executor: o compartilhamento de arquivos só pode ser testado no Android
com o app publicado (HTTPS). Depois que o técnico autorizar o push, pedir que ele:
1. Toque em Ajustes/Configurações > **Compartilhar backup** e confirme que o menu do Android
   abre com o arquivo `.txt` (e envie para si mesmo, por exemplo no WhatsApp ou Drive).
2. Toque em **Importar backup**, escolha o arquivo recebido e confirme o resumo
   "Novas: 0 OS e 0 trocas".
Se o menu não abrir (o arquivo for baixado em vez de compartilhado), registrar e tratar
como correção.
