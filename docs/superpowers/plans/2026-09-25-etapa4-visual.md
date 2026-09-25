# Etapa 4 — Aparência para celular Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o visual de página web por um app de celular: tema escuro com modo sol, menu embaixo, botão Gerar fixo, relatório em folha, cartão da OS que recolhe, tipos com "+ Mais" e ícone próprio — sem mudar o texto dos relatórios.

**Architecture:** `styles.css` é reescrito com tokens em `:root` e `[data-theme="sol"]`. O `index.html` ganha barra do topo, menu inferior, barra do botão Gerar e uma folha (`#sheet`) fora da aba Nova OS. O `app.js` ganha funções pequenas e globais: `applyTheme`, `openSheet`/`closeSheet`, `setOsCollapsed`, `setMoreTypes`. Nenhuma regra de texto muda.

**Tech Stack:** HTML, CSS, JavaScript puro, Service Worker. Verificação com Playwright (`playwright-core` + Chromium local) em harness fora do git. Ícones PNG gerados a partir de `icon.svg` com o próprio Chromium.

**Spec:** `docs/superpowers/specs/2026-09-25-etapa4-visual-design.md`

## Global Constraints

- HTML/CSS/JS puros, `app.js` único, sem build, sem dependências, sem fontes externas; funciona offline.
- Texto gerado **idêntico** (caso `t1` compara byte a byte). Frases com "Coprel Telecom" nos relatórios ficam.
- Chaves `coprel11t_…` inalteradas; nova chave `coprel11t_theme` (`"escuro"` | `"sol"`), lida/gravada com `try/catch`.
- Paleta exata da spec (tabela da seção 2). Todos os pares texto/fundo ≥ 4,5:1 (já verificados).
- Alvos de toque ≥ 44 × 44 px; campos com fonte de 16 px; sem rolagem horizontal a 360 px.
- `sw.js`: `CACHE` = `encerramento-11t-v9`.
- IDs usados pelo código e pelos testes continuam existindo (`#generateBtn`, `#resultado`, `#copyBtn`, `#saveBtn`, `#copyStatus`, `[data-tab]`, `[data-service]`…).
- Branch: `etapa4-visual`. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Dados reais de clientes nunca entram no repositório nem nas capturas.

## Review Focus

- Botão Voltar do Android com a folha aberta fecha a folha e **não sai do app**; fechar pelo fundo e reabrir logo em seguida não deixa a folha fechar sozinha depois.
- Cartão da OS recolhido e o técnico toca em "Gerar" com endereço vazio: o cartão abre e mostra o campo.
- Tipo escondido em "+ Mais" que está selecionado (ex.: Câmera) continua visível e marcado após recolher.
- Modo sol escolhido, fechar e abrir o app: abre já no modo sol, sem piscar escuro.
- Teclado virtual aberto num campo perto do fim da tela: o campo não fica escondido atrás do botão Gerar/menu (margem inferior + `scroll-padding`).

## Harness de verificação (local, fora do git)

`.superpowers/harness/check.js` (pasta em `.git/info/exclude`), casos `t1`–`t16`. A partir da raiz:

```bash
cd ~/Projetos/gerador-encerramento-11t
H=.superpowers/harness
export CHROME=$(ls ~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome) NODE_PATH=$PWD/$H/node_modules
(python3 -m http.server 8765 >/dev/null 2>&1 & echo $! > $H/srv.pid); sleep 1
# todos: for t in $(seq -f "t%g" 1 22); do grep -q "async $t(" $H/check.js && node $H/check.js $t; done
# ao terminar: kill $(cat $H/srv.pid)
```

Novos casos entram no objeto `checks`, antes do `};` que precede `(async () => {`.

---

### Task 1: Tokens, temas, barra do topo, menu inferior e botão Gerar fixo

**Files:**
- Rewrite: `styles.css`
- Modify: `index.html` (`<head>`, cabeçalho, abas, bloco de abertura, títulos dos cartões, aviso de backup, cartão do botão Gerar, menu inferior)
- Modify: `app.js` (`THEME_KEY`, `applyTheme`, `currentTheme`, botão de tema, `TAB_TITLES`, `switchTab`, inicialização)
- Modify (fora do git): `.superpowers/harness/check.js` (`t15` ajustado; caso `t17`)

**Interfaces:**
- Consumes: `$`, `renderHistory`, `renderTrocas`.
- Produces:
  - Tokens CSS (`--bg`, `--surface`, `--surface2`, `--chip`, `--chip-ink`, `--ink`, `--muted`, `--accent`, `--accent-ink`, `--cta`, `--cta-ink`, `--danger`, `--ok`, `--card-line`, `--field-line`, `--chip-line`, `--warn-bg`, `--warn-ink`, `--warn-line`) e classes `.topbar`, `.screen-title`, `.icon-btn`, `.bottom-nav`, `.tab`, `.cta-bar`.
  - `#screenTitle`, `#themeBtn`, `#ctaBar` (contém `#validation` e `#generateBtn`), `.bottom-nav` com `.tab[data-tab]`.
  - `applyTheme(t)`, `currentTheme()` → `"escuro"` | `"sol"`; `TAB_TITLES`.
  - `switchTab(name)` também atualiza `#screenTitle` e esconde `#ctaBar` fora da aba `nova`.

- [ ] **Step 1: Ajustar `t15` e escrever `t17`**

Em `check.js`, no caso `t15`, trocar a linha

```js
    if ((await p.textContent(".topbar")).indexOf("Encerramento 11T") < 0) throw new Error("topo sem nome do app");
```
por
```js
    if ((await p.title()) !== "Encerramento 11T") throw new Error("título sem nome do app");
```

Adicionar ao objeto `checks`:

```js
  async t17(p) {
    const st = () => p.evaluate(() => ({
      theme: document.documentElement.dataset.theme || "",
      bg: getComputedStyle(document.body).backgroundColor,
      meta: document.querySelector('meta[name="theme-color"]').content,
      label: document.getElementById("themeBtn").getAttribute("aria-label"),
    }));
    let s = await st();
    if (s.theme !== "" || s.bg !== "rgb(18, 20, 23)" || s.meta !== "#121417" || s.label !== "Ativar modo sol") throw new Error("padrão: " + JSON.stringify(s));
    await p.click("#themeBtn");
    s = await st();
    if (s.theme !== "sol" || s.bg !== "rgb(255, 255, 255)" || s.meta !== "#ffffff" || s.label !== "Ativar tema escuro") throw new Error("sol: " + JSON.stringify(s));
    await p.reload();
    if ((await st()).theme !== "sol") throw new Error("sol não sobreviveu ao recarregar");
    await p.click("#themeBtn");
    await p.reload();
    if ((await st()).theme !== "") throw new Error("escuro não sobreviveu ao recarregar");
    if (await p.locator(".hero, .pill, .eyebrow").count()) throw new Error("restos do topo antigo");
    if ((await p.evaluate(() => getComputedStyle(document.querySelector(".bottom-nav")).position)) !== "fixed") throw new Error("menu não é fixo embaixo");
    const titles = { historico: "Histórico", trocas: "Trocas", config: "Ajustes", nova: "Nova OS" };
    for (const [tab, t] of Object.entries(titles)) {
      await p.click(`[data-tab="${tab}"]`);
      if ((await p.textContent("#screenTitle")) !== t) throw new Error("título da aba " + tab);
      if ((await p.isVisible("#generateBtn")) !== (tab === "nova")) throw new Error("botão Gerar na aba " + tab);
    }
    const g = await p.locator("#generateBtn").boundingBox(), nav = await p.locator(".bottom-nav").boundingBox();
    const vh = p.viewportSize().height;
    if (g.y + g.height > nav.y + 1 || nav.y + nav.height > vh + 1) throw new Error("Gerar não está fixo acima do menu");
    const fs16 = await p.evaluate(() => [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=file]),select,textarea")].every((e) => getComputedStyle(e).fontSize === "16px" || e.id === "resultado"));
    if (!fs16) throw new Error("campo com fonte menor que 16px");
    return "temas, topo, menu inferior e Gerar fixo ok";
  },
```

- [ ] **Step 2: Rodar `t17` e ver falhar**

Run: `node $H/check.js t17`
Expected: `t17 FAIL: padrão: {"theme":"","bg":"rgb(241, 243, 249)",…}` (ou timeout em `#themeBtn`).

- [ ] **Step 3: `styles.css` novo (substitui o arquivo inteiro)**

```css
*{box-sizing:border-box}
[hidden]{display:none!important}
:root{
  --bg:#121417;--surface:#1d2126;--surface2:#262b31;--chip:#2a2f36;--chip-ink:#d6dae0;
  --ink:#e8eaee;--muted:#9aa3b0;--accent:#f5a524;--accent-ink:#1a1300;
  --cta:#f5a524;--cta-ink:#1a1300;--danger:#ff6b6b;--ok:#4ade80;
  --card-line:transparent;--field-line:transparent;--chip-line:transparent;
  --warn-bg:#2b2210;--warn-ink:#f7d493;--warn-line:#5a4516;
  color-scheme:dark;
}
[data-theme="sol"]{
  --bg:#ffffff;--surface:#ffffff;--surface2:#ffffff;--chip:#ffffff;--chip-ink:#0b0b0b;
  --ink:#0b0b0b;--muted:#5b6068;--accent:#b45309;--accent-ink:#ffffff;
  --cta:#0b0b0b;--cta-ink:#ffffff;--danger:#b3261e;--ok:#146b49;
  --card-line:#0b0b0b;--field-line:#9aa0a8;--chip-line:#0b0b0b;
  --warn-bg:#ffffff;--warn-ink:#0b0b0b;--warn-line:#b45309;
  color-scheme:light;
}
html{-webkit-text-size-adjust:100%;scroll-padding-top:72px;scroll-padding-bottom:180px}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-x:hidden}
button,input,select,textarea{font:inherit;color:inherit}
.shell{width:min(640px,100%);margin:0 auto;padding:0 16px calc(176px + env(safe-area-inset-bottom))}

.topbar{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 -16px 12px;padding:calc(8px + env(safe-area-inset-top)) 16px 8px;background:var(--bg);border-bottom:1px solid var(--surface2)}
[data-theme="sol"] .topbar{border-bottom:2px solid var(--ink)}
.screen-title{margin:0;font-size:20px;font-weight:800;color:var(--ink)}
.icon-btn{width:44px;height:44px;min-height:44px;padding:0;border-radius:12px;background:var(--surface);color:var(--accent);font-size:20px;display:grid;place-items:center}
[data-theme="sol"] .icon-btn{background:var(--ink);color:#fff}

.bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:30;display:grid;grid-template-columns:repeat(4,1fr);background:var(--surface);border-top:1px solid var(--surface2);padding:4px 4px env(safe-area-inset-bottom)}
[data-theme="sol"] .bottom-nav{border-top:2px solid var(--ink)}
.tab{min-height:56px;padding:4px 2px;background:none;color:var(--muted);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:700;border-radius:12px}
.tab svg{width:24px;height:24px}
.tab.active{color:var(--accent)}
.cta-bar{position:fixed;left:0;right:0;bottom:calc(64px + env(safe-area-inset-bottom));z-index:25;padding:10px 16px 8px;background:linear-gradient(to top,var(--bg) 75%,transparent)}
.cta-bar>*{max-width:608px;margin-left:auto;margin-right:auto}
.tab-panel{display:none}.tab-panel.active{display:block}

.card{background:var(--surface);border:2px solid var(--card-line);border-radius:14px;padding:14px;margin-bottom:12px}
h2{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 10px}
[data-theme="sol"] h2{color:var(--ink)}
.section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.section-head h2{margin:0}
label,.group-label{display:block;font-size:13px;font-weight:700;color:var(--muted);margin:12px 0 6px}
[data-theme="sol"] label,[data-theme="sol"] .group-label{color:var(--ink)}
input,select,textarea{width:100%;min-height:44px;border:2px solid var(--field-line);background:var(--surface2);border-radius:10px;padding:9px 12px;font-size:16px;outline:none}
input::placeholder,textarea::placeholder{color:var(--muted);opacity:1}
input:focus,select:focus,textarea:focus{border-color:var(--accent)}
textarea{resize:vertical}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.full{grid-column:1/-1}
.button-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}

button{border:0;border-radius:12px;padding:10px 14px;min-height:44px;min-width:44px;font-weight:800;cursor:pointer}
button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.primary,.success{background:var(--cta);color:var(--cta-ink)}
.ghost{background:var(--chip);color:var(--ink);border:2px solid var(--chip-line)}
.mini{padding:6px 12px;font-size:13px}
.wide{width:100%}

.service-grid,.chip-row,.quick-actions,.material-quick{display:flex;gap:8px;flex-wrap:wrap}
.chip,.service-grid button{padding:8px 14px;border-radius:999px;background:var(--chip);color:var(--chip-ink);border:2px solid var(--chip-line);font-size:14px;font-weight:700}
[data-theme="sol"] .chip,[data-theme="sol"] .service-grid button{border-radius:10px}
.chip.active,.service-grid button.active{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.seg-row{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:var(--surface2);border:2px solid var(--chip-line);border-radius:12px;padding:3px}
.seg{padding:6px 4px;border-radius:9px;background:none;color:var(--ink);font-size:13px;line-height:1.2}
.seg.active{background:var(--accent);color:var(--accent-ink)}

.hint{font-size:13px;color:var(--muted);margin-top:8px}
.preset-block{margin-bottom:12px}.preset-block>span{display:block;color:var(--muted);font-size:13px;font-weight:700;margin-bottom:8px}
[data-theme="sol"] .preset-block>span{color:var(--ink)}
.spaced{margin-top:12px}
.rule-box{margin-top:12px;background:var(--surface2);border:2px solid var(--field-line);color:var(--muted);padding:10px 12px;border-radius:10px;font-size:13px}
.validation{background:var(--surface);border:2px solid var(--danger);color:var(--danger);padding:10px 12px;border-radius:10px;margin-bottom:8px;font-size:14px}
#copyStatus,#backupStatus{font-size:13px;font-weight:800;color:var(--ok)}

.history-list{display:grid;gap:10px;margin-top:12px}
.history-item{background:var(--surface2);border:2px solid var(--field-line);border-radius:12px;padding:12px}
.history-item strong{color:var(--ink)}
.history-meta{display:flex;justify-content:space-between;color:var(--muted);font-size:13px;margin:4px 0 8px;gap:10px}
.history-actions{display:flex;gap:8px;margin-top:10px}.history-actions button{flex:1;font-size:13px}
.empty{color:var(--muted);padding:12px 0;font-size:14px}
.checkline{display:flex;align-items:flex-start;gap:10px;color:var(--ink);margin-top:14px;font-weight:600}
.checkline input{width:22px;min-height:22px;height:22px;margin-top:2px;accent-color:var(--accent)}
.backup-banner{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--warn-bg);border:2px solid var(--warn-line);color:var(--warn-ink);padding:6px 6px 6px 12px;border-radius:12px;margin-bottom:12px;font-size:14px;font-weight:700}

@media(max-width:420px){.grid{grid-template-columns:1fr}.full{grid-column:auto}.button-row{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
```

- [ ] **Step 4: `index.html`**

1. No `<head>`, trocar `<meta name="theme-color" content="#251973" />` por:

```html
  <meta name="theme-color" content="#121417" />
  <script>try{if(localStorage.getItem("coprel11t_theme")==="sol"){document.documentElement.dataset.theme="sol";document.querySelector('meta[name="theme-color"]').content="#ffffff"}}catch(e){}</script>
```

2. Trocar o cabeçalho e as abas antigas (de `<header class="topbar">` até o `</nav>` das abas, inclusive) por:

```html
    <header class="topbar">
      <h1 class="screen-title" id="screenTitle">Nova OS</h1>
      <button class="icon-btn" id="themeBtn" type="button" aria-label="Ativar modo sol">☀</button>
    </header>
```

3. Remover o bloco de abertura inteiro (`<section class="hero">` … `</section>`).

4. No aviso de backup, trocar `<span>Há OS salvas há 7 dias ou mais sem backup</span>` por `<span>7 dias sem backup</span>`.

5. Tirar a numeração dos títulos dos cartões: `<h2>1. Dados da OS</h2>` → `<h2>Dados da OS</h2>`, `2. Tipo de atendimento` → `Tipo de atendimento`, e o mesmo para todos os `<h2>3. …</h2>`, `4. Informações técnicas`, `5. Materiais` e `6. Encerramento`. Comando equivalente: `sed -i -E 's#<h2>[0-9]+\. #<h2>#' index.html`.

6. No cartão de configurações, trocar `<h2>Configurações</h2>` por `<h2>Relatório</h2>`.

7. Remover o cartão do botão Gerar:

```html
        <section class="card">
          <div id="validation" class="validation" hidden></div>
          <button class="primary wide" id="generateBtn">Gerar encerramento</button>
        </section>
```

8. Logo depois de `</main>`, inserir:

```html
    <div class="cta-bar" id="ctaBar">
      <div id="validation" class="validation" hidden></div>
      <button class="primary wide" id="generateBtn">Gerar encerramento</button>
    </div>

    <nav class="bottom-nav" aria-label="Navegação">
      <button class="tab active" data-tab="nova"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15h6"/></svg><span>Nova OS</span></button>
      <button class="tab" data-tab="historico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>Histórico</span></button>
      <button class="tab" data-tab="trocas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg><span>Trocas</span></button>
      <button class="tab" data-tab="config"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg><span>Ajustes</span></button>
    </nav>
```

- [ ] **Step 5: `app.js`**

1. Logo depois de `const LIMITS = …;`, inserir:

```js
const THEME_KEY = "coprel11t_theme";
const TAB_TITLES = {
  nova: "Nova OS",
  historico: "Histórico",
  trocas: "Trocas",
  config: "Ajustes",
};
function currentTheme() {
  return document.documentElement.dataset.theme === "sol" ? "sol" : "escuro";
}
function applyTheme(t) {
  const sol = t === "sol";
  if (sol) document.documentElement.dataset.theme = "sol";
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]').content = sol
    ? "#ffffff"
    : "#121417";
  $("themeBtn").textContent = sol ? "☾" : "☀";
  $("themeBtn").setAttribute(
    "aria-label",
    sol ? "Ativar tema escuro" : "Ativar modo sol",
  );
}
$("themeBtn").onclick = () => {
  const t = currentTheme() === "sol" ? "escuro" : "sol";
  applyTheme(t);
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {}
};
```

2. Em `switchTab(name)`, depois das duas linhas que alternam `.tab` e `.tab-panel`, acrescentar:

```js
  $("screenTitle").textContent = TAB_TITLES[name];
  $("ctaBar").hidden = name !== "nova";
```

3. Na inicialização, logo depois de `applyConfig();`, acrescentar `applyTheme(currentTheme());`.

- [ ] **Step 6: Formatar e rodar tudo**

Run: `npx --yes prettier@3 --write app.js >/dev/null && node --check app.js && for t in $(seq -f "t%g" 1 17); do grep -q "async $t(" $H/check.js && node $H/check.js $t; done`
Expected: `t1`–`t17` todos `PASS` (t1 prova que o texto não mudou).

- [ ] **Step 7: Commit**

```bash
git add styles.css index.html app.js
git commit -m "Tema escuro com modo sol, barra do topo, menu inferior e botão Gerar fixo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Relatório em folha

**Files:**
- Modify: `index.html` (cartão do encerramento sai da aba e vira `#sheet`)
- Modify: `styles.css` (folha)
- Modify: `app.js` (`openSheet`, `closeSheet`, `hideSheet`, `popstate`, `generate`, `openHist`, `switchTab`)
- Modify (fora do git): `.superpowers/harness/check.js` (adaptador de clique; caso `t19`)

**Interfaces:**
- Consumes: `generate`, `openHist`, `switchTab` (Task 1).
- Produces: `#sheet` (com `#sheetGrab`, `#copyStatus`, `#resultado`, `#copyBtn`, `#saveBtn`), `#sheetBackdrop`; `openSheet()`, `closeSheet()`, `hideSheet()`, `isSheetOpen()`. `generate()` abre a folha quando gera; `switchTab()` fecha a folha; `openHist(id)` mostra o relatório na folha.

- [ ] **Step 1: Adaptador de clique no harness e caso `t19`**

Os casos antigos clicam em campos do formulário logo depois de "Gerar" (que agora cobre a tela com a folha) e em `#copyBtn`/`#saveBtn` quando a folha pode estar fechada. Em `check.js`, dentro de `(async () => {`, logo depois de `const p = await ctx.newPage();`, inserir:

```js
  p.rawClick = p.click.bind(p);
  p.click = async (sel, o) => {
    await p.evaluate((sel) => {
      if (typeof openSheet !== "function") return;
      let el = null;
      try { el = document.querySelector(sel); } catch {}
      const inSheet = !!(el && el.closest("#sheet"));
      const open = !document.getElementById("sheet").hidden;
      if (inSheet && !open && document.getElementById("resultado").value) openSheet();
      if (!inSheet && open) closeSheet();
      if (el && el.closest("#serviceGrid") && el.offsetParent === null && typeof setMoreTypes === "function") setMoreTypes(true);
    }, sel).catch(() => {});
    return p.rawClick(sel, o);
  };
```

(O ramo de `setMoreTypes` só passa a agir na Task 3.) Adicionar ao objeto `checks`:

```js
  async t19(p) {
    const open = () => p.evaluate(() => !document.getElementById("sheet").hidden);
    await p.fill("#os", "1"); await p.fill("#cliente", "T"); await p.fill("#endereco", "R");
    if (await open()) throw new Error("folha aberta ao carregar");
    await p.rawClick("#generateBtn");
    if (!(await open())) throw new Error("gerar não abriu a folha");
    if (!(await p.inputValue("#resultado")).startsWith("Relatório de Ordem de Serviço")) throw new Error("folha sem relatório");
    if ((await p.evaluate(() => document.activeElement.id)) !== "copyBtn") throw new Error("foco não foi para Copiar");
    if (await p.locator("#tab-nova #resultado").count()) throw new Error("relatório ainda no fim da página");
    await p.rawClick("#sheetBackdrop", { position: { x: 20, y: 20 } });
    if (await open()) throw new Error("fundo não fechou");
    await p.rawClick("#generateBtn"); await p.rawClick("#sheetGrab");
    if (await open()) throw new Error("puxador não fechou");
    await p.rawClick("#generateBtn");
    await p.evaluate(() => history.back());
    await p.waitForFunction(() => document.getElementById("sheet").hidden);
    if (!p.url().includes("index.html")) throw new Error("Voltar saiu da página");
    await p.rawClick("#generateBtn");
    await p.evaluate(() => { closeSheet(); openSheet(); });
    await p.waitForTimeout(400);
    if (!(await open())) throw new Error("fechar e abrir rápido fechou a folha");
    await p.evaluate(() => history.back());
    await p.waitForFunction(() => document.getElementById("sheet").hidden);
    await p.rawClick("#generateBtn"); await p.rawClick("#saveBtn");
    if (!(await p.textContent("#copyStatus")).includes("Salvo")) throw new Error("salvar na folha");
    await p.evaluate(() => closeSheet());
    await p.rawClick('[data-tab="historico"]');
    await p.locator("#historyList button", { hasText: "Abrir" }).first().click();
    if (!(await open()) || (await p.textContent("#screenTitle")) !== "Nova OS") throw new Error("Abrir do histórico não usou a folha");
    await p.evaluate(() => switchTab("trocas"));
    if (await open()) throw new Error("trocar de aba não fechou a folha");
    return "folha: abre, fecha (fundo, puxador, Voltar), histórico ok";
  },
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node $H/check.js t19`
Expected: `t19 FAIL` (`gerar não abriu a folha` ou erro por `#sheet` inexistente).

- [ ] **Step 3: HTML**

Remover o cartão do encerramento da aba Nova OS (de `<section class="card result-card">` até o `</section>` correspondente). Logo depois do `</nav>` do menu inferior (Task 1), inserir:

```html
    <div class="sheet-backdrop" id="sheetBackdrop" hidden></div>
    <section class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" hidden>
      <button class="sheet-grab" id="sheetGrab" type="button" aria-label="Fechar"></button>
      <div class="section-head">
        <h2 id="sheetTitle">Encerramento</h2>
        <span id="copyStatus"></span>
      </div>
      <textarea id="resultado" rows="14" aria-label="Texto do encerramento"></textarea>
      <div class="button-row sheet-actions">
        <button class="primary" id="copyBtn">Copiar</button>
        <button class="ghost" id="saveBtn">Salvar</button>
      </div>
    </section>
```

- [ ] **Step 4: CSS (acrescentar ao final de `styles.css`)**

```css
.sheet-backdrop{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.55)}
.sheet{position:fixed;left:0;right:0;bottom:0;z-index:50;max-width:640px;margin:0 auto;height:80vh;height:80dvh;display:flex;flex-direction:column;gap:8px;background:var(--surface);border:2px solid var(--card-line);border-bottom:0;border-radius:20px 20px 0 0;padding:4px 16px calc(12px + env(safe-area-inset-bottom));animation:sheet-up .2s ease-out}
.sheet textarea{flex:1;min-height:0;resize:none;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace}
.sheet-grab{align-self:center;width:88px;min-height:44px;padding:0;background:none;display:grid;place-items:center}
.sheet-grab::before{content:"";width:40px;height:5px;border-radius:5px;background:var(--muted)}
.sheet .sheet-actions{grid-template-columns:1fr 1fr;margin-top:0}
body.sheet-open{overflow:hidden}
@keyframes sheet-up{from{transform:translateY(100%)}to{transform:none}}
```

- [ ] **Step 5: `app.js`**

1. Logo depois de `$("themeBtn").onclick = …;` (Task 1), inserir:

```js
let sheetHistory = false,
  pendingBack = false;
function isSheetOpen() {
  return !$("sheet").hidden;
}
function openSheet() {
  if (isSheetOpen()) return;
  $("sheet").hidden = false;
  $("sheetBackdrop").hidden = false;
  document.body.classList.add("sheet-open");
  if (!pendingBack) {
    try {
      history.pushState({ sheet: true }, "");
      sheetHistory = true;
    } catch {}
  }
  $("copyBtn").focus();
}
function hideSheet() {
  $("sheet").hidden = true;
  $("sheetBackdrop").hidden = true;
  document.body.classList.remove("sheet-open");
  $("generateBtn").focus({ preventScroll: true });
}
function closeSheet() {
  if (!isSheetOpen()) return;
  hideSheet();
  if (sheetHistory) {
    sheetHistory = false;
    pendingBack = true;
    history.back();
  }
}
window.addEventListener("popstate", () => {
  if (pendingBack) {
    pendingBack = false;
    if (isSheetOpen()) {
      history.pushState({ sheet: true }, "");
      sheetHistory = true;
    }
    return;
  }
  if (sheetHistory) {
    sheetHistory = false;
    hideSheet();
  }
});
$("sheetBackdrop").onclick = closeSheet;
$("sheetGrab").onclick = closeSheet;
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});
```

2. Em `switchTab(name)`, como primeira linha do corpo: `closeSheet();`.

3. Em `generate()`, depois de `$("copyStatus").textContent = "Texto gerado";`, acrescentar `openSheet();`.

4. Em `openHist(id)`, trocar o corpo do `if (x) { … }` por:

```js
    switchTab("nova");
    $("resultado").value = x.report;
    $("copyStatus").textContent = "";
    openSheet();
```

- [ ] **Step 6: Formatar e rodar tudo**

Run: `npx --yes prettier@3 --write app.js >/dev/null && node --check app.js && for t in $(seq -f "t%g" 1 19); do grep -q "async $t(" $H/check.js && node $H/check.js $t; done`
Expected: todos os casos existentes `PASS` (`t18` ainda não existe).

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css app.js
git commit -m "Relatório abre numa folha com Copiar e Salvar; Voltar do Android fecha a folha

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Cartão da OS que recolhe e tipos com "+ Mais"

**Files:**
- Modify: `index.html` (cartão da OS; ordem e marcação da grade de tipos)
- Modify: `styles.css`
- Modify: `app.js` (`setOsCollapsed`, `setMoreTypes`, `parseMK`, `validate`, `clearForm`, seletores da grade, inicialização)
- Modify (fora do git): `.superpowers/harness/check.js` (caso `t20`)

**Interfaces:**
- Consumes: `v`, `selectService`, `parseMK`, `validate`, `clearForm`.
- Produces: `#osCard`, `#osSummary` (`#osSummaryMain`, `#osSummarySub`), `#osFields`; `setOsCollapsed(bool)`; `#moreTypesBtn`, classe `.more` nos tipos extras, `.expanded` na grade; `setMoreTypes(bool)`.

- [ ] **Step 1: Escrever `t20`**

```js
  async t20(p) {
    const vis = (s) => p.isVisible(s);
    for (const t of ["dificuldade", "reparo", "troca", "upgrade", "instalacao"])
      if (!(await vis(`[data-service="${t}"]`))) throw new Error("tipo principal escondido: " + t);
    for (const t of ["wifi", "camera", "outro"]) if (await vis(`[data-service="${t}"]`)) throw new Error("tipo extra visível: " + t);
    if ((await p.textContent("#moreTypesBtn")).trim() !== "+ Mais") throw new Error("rótulo Mais");
    await p.rawClick("#moreTypesBtn");
    if (!(await vis('[data-service="camera"]')) || (await p.textContent("#moreTypesBtn")).trim() !== "− Menos") throw new Error("Mais não abriu");
    await p.rawClick('[data-service="camera"]');
    if ((await p.inputValue("#tipo")) !== "camera") throw new Error("não selecionou câmera");
    await p.rawClick("#moreTypesBtn");
    if (!(await vis('[data-service="camera"]')) || (await vis('[data-service="wifi"]'))) throw new Error("tipo escondido selecionado sumiu");
    await p.rawClick('[data-service="dificuldade"]');
    await p.fill("#mkInput", "DINO TRENTO\nOS - 495574 / COD 39810\nLinha 25 - Interior - Marau");
    await p.rawClick("#parseBtn");
    if ((await vis("#os")) || !(await vis("#osSummary"))) throw new Error("cartão não recolheu");
    if (!(await p.textContent("#osSummary")).includes("OS 495574 · DINO TRENTO")) throw new Error("resumo: " + (await p.textContent("#osSummary")));
    if ((await p.getAttribute("#osSummary", "aria-expanded")) !== "false") throw new Error("aria-expanded");
    await p.rawClick("#osSummary");
    if (!(await vis("#os"))) throw new Error("não expandiu ao tocar");
    await p.rawClick("#parseBtn");
    await p.evaluate(() => { document.getElementById("endereco").value = ""; });
    await p.rawClick("#generateBtn");
    if (!(await vis("#endereco"))) throw new Error("erro de validação não expandiu");
    await p.rawClick("#parseBtn");
    await p.evaluate(() => clearForm());
    if (!(await vis("#os")) || (await p.inputValue("#os")) !== "") throw new Error("Limpar não expandiu/esvaziou");
    if ((await p.textContent("#moreTypesBtn")).trim() !== "+ Mais") throw new Error("Limpar não recolheu os tipos");
    return "cartão da OS e + Mais ok";
  },
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node $H/check.js t20`
Expected: `t20 FAIL: tipo extra visível: wifi`.

- [ ] **Step 3: HTML**

1. Cartão da OS: trocar a abertura `<section class="card">` que vem logo antes de `<h2>Dados da OS</h2>` (dentro de `<div class="section-head">`) por:

```html
        <section class="card os-card" id="osCard">
          <button class="os-summary" id="osSummary" type="button" aria-expanded="false" aria-controls="osFields" hidden>
            <span class="os-summary-main" id="osSummaryMain"></span>
            <span class="os-summary-sub" id="osSummarySub"></span>
          </button>
          <div id="osFields">
```
e, no fim desse cartão, trocar o `</section>` que fecha o cartão (logo depois do `</div>` da `grid` com Endereço) por `</div>\n        </section>`.

2. Grade de tipos: trocar o conteúdo de `<div class="service-grid" id="serviceGrid">` por:

```html
            <button data-service="dificuldade">Dificuldade</button>
            <button data-service="reparo">Reparo / Offline</button>
            <button data-service="troca">Troca</button>
            <button data-service="upgrade">Upgrade</button>
            <button data-service="instalacao">Instalação</button>
            <button class="more" data-service="wifi">Wi‑Fi / Lentidão</button>
            <button class="more" data-service="telefonia">Telefonia</button>
            <button class="more" data-service="iptv">IPTV terceiros</button>
            <button class="more" data-service="sky">Sky por antena</button>
            <button class="more" data-service="particular">Rede particular</button>
            <button class="more" data-service="ipv6">IPv6</button>
            <button class="more" data-service="pesquisa">Pesquisa</button>
            <button class="more" data-service="camera">Câmera</button>
            <button class="more" data-service="outro">Outro</button>
            <button class="more-toggle" id="moreTypesBtn" type="button" aria-expanded="false">+ Mais</button>
```

- [ ] **Step 4: CSS (acrescentar)**

```css
.os-summary{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:none;padding:4px 0;text-align:left;color:var(--ink)}
.os-summary-main{font-size:16px;font-weight:800}
.os-summary-sub{font-size:13px;font-weight:600;color:var(--muted)}
.service-grid:not(.expanded) .more:not(.active){display:none}
.service-grid .more-toggle{background:none;color:var(--accent);border:2px dashed var(--chip-line);border-radius:999px;padding:8px 14px;font-size:14px}
[data-theme="sol"] .service-grid .more-toggle{border-style:solid;border-radius:10px;color:var(--ink)}
```

- [ ] **Step 5: `app.js`**

1. Nos dois pontos que usam `"#serviceGrid button"` (em `selectService` e no `forEach` que liga os cliques), trocar por `"#serviceGrid button[data-service]"`.

2. Depois de `selectService`, inserir:

```js
function setOsCollapsed(c) {
  $("osFields").hidden = c;
  $("osSummary").hidden = !c;
  $("osSummary").setAttribute("aria-expanded", String(!c));
  if (c) {
    $("osSummaryMain").textContent = `OS ${v("os")} · ${v("cliente")} ▾`;
    $("osSummarySub").textContent = v("endereco");
  }
}
$("osSummary").onclick = () => setOsCollapsed(false);
function setMoreTypes(on) {
  $("serviceGrid").classList.toggle("expanded", on);
  $("moreTypesBtn").textContent = on ? "− Menos" : "+ Mais";
  $("moreTypesBtn").setAttribute("aria-expanded", String(on));
}
$("moreTypesBtn").onclick = () =>
  setMoreTypes(!$("serviceGrid").classList.contains("expanded"));
```

3. No fim de `parseMK()`, acrescentar: `if (v("os") && v("cliente")) setOsCollapsed(true);`

4. Em `validate()`, logo depois de `if (e.length) {`, acrescentar:

```js
    if (e.some((x) => ["Data", "Cliente", "OS", "Endereço"].includes(x)))
      setOsCollapsed(false);
```

5. Em `clearForm()`, junto de `resetToggles();`, acrescentar `setOsCollapsed(false);` e `setMoreTypes(false);`.

6. Na inicialização, depois de `selectService("dificuldade");`, acrescentar `setMoreTypes(false);`.

- [ ] **Step 6: Formatar e rodar tudo**

Run: `npx --yes prettier@3 --write app.js >/dev/null && node --check app.js && for t in $(seq -f "t%g" 1 20); do grep -q "async $t(" $H/check.js && node $H/check.js $t; done`
Expected: todos `PASS` (o adaptador de clique abre "+ Mais" quando um caso antigo clica num tipo escondido, como Câmera no `t4`).

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css app.js
git commit -m "Cartão da OS recolhe depois de identificar; tipos menos usados em + Mais

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Ícone Fibra, manifest e cache v9

**Files:**
- Create: `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
- Create (fora do git): `.superpowers/harness/make-icons.js`
- Modify: `index.html` (`<head>`), `manifest.webmanifest`, `sw.js`
- Modify (fora do git): `.superpowers/harness/check.js` (`t4` → v9; caso `t21`)

**Interfaces:**
- Consumes: nada de código.
- Produces: arquivos de ícone na raiz; manifest com `icons`; `ASSETS` do `sw.js` com os ícones.

- [ ] **Step 1: `t21` e `t4`**

Em `check.js`, no `t4`, trocar `encerramento-11t-v8` por `encerramento-11t-v9` e `sw v8 ok` por `sw v9 ok`. Adicionar:

```js
  async t21(p) {
    const m = JSON.parse(fs.readFileSync("/home/a/Projetos/gerador-encerramento-11t/manifest.webmanifest", "utf8"));
    const want = [["icon-192.png", "192x192", "any"], ["icon-512.png", "512x512", "any"], ["icon-maskable-512.png", "512x512", "maskable"]];
    if (JSON.stringify((m.icons || []).map((i) => [i.src, i.sizes, i.purpose])) !== JSON.stringify(want)) throw new Error("icons: " + JSON.stringify(m.icons));
    if (m.background_color !== "#121417" || m.theme_color !== "#121417") throw new Error("cores do manifest");
    const r = await p.evaluate(async (list) => Promise.all(list.map((src) => new Promise((ok) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext("2d"); g.drawImage(img, 0, 0);
        ok([src, img.naturalWidth, [...g.getImageData(4, 4, 1, 1).data].join()]);
      };
      img.onerror = () => ok([src, 0, ""]);
      img.src = src;
    }))), ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]);
    const sizes = { "icon-192.png": 192, "icon-512.png": 512, "icon-maskable-512.png": 512, "apple-touch-icon.png": 180 };
    for (const [src, w, px] of r) if (w !== sizes[src] || px !== "18,20,23,255") throw new Error("ícone " + src + ": " + w + " " + px);
    if (!(await p.locator('link[rel="apple-touch-icon"][href="apple-touch-icon.png"]').count())) throw new Error("apple-touch-icon");
    if (!(await p.locator('link[rel="icon"][href="icon.svg"]').count())) throw new Error("favicon");
    return "ícones e manifest ok";
  },
```

Run: `node $H/check.js t21`
Expected: `t21 FAIL: icons: undefined`.

- [ ] **Step 2: `icon.svg`**

Criar `icon.svg` (desenho aprovado na maquete; o traço fica dentro do círculo de raio 40 no centro, a zona segura do ícone adaptável):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#121417"/><path d="M22 62 C38 62 38 38 54 38 S70 50 78 50" fill="none" stroke="#f5a524" stroke-width="7" stroke-linecap="round"/><circle cx="78" cy="50" r="8" fill="#f5a524"/><path d="M26 74 h34" stroke="#9aa3b0" stroke-width="6" stroke-linecap="round"/></svg>
```

- [ ] **Step 3: Gerar os PNGs**

Criar `.superpowers/harness/make-icons.js`:

```js
const { chromium } = require("playwright-core");
const fs = require("fs");
const root = "/home/a/Projetos/gerador-encerramento-11t/";
const svg = fs.readFileSync(root + "icon.svg", "utf8");
const out = [["icon-192.png", 192], ["icon-512.png", 512], ["icon-maskable-512.png", 512], ["apple-touch-icon.png", 180]];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage();
  for (const [name, size] of out) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
    await p.screenshot({ path: root + name, clip: { x: 0, y: 0, width: size, height: size } });
  }
  await b.close();
})();
```

Run: `node $H/make-icons.js && python3 -c "from PIL import Image;[print(f,Image.open(f).size) for f in ['icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png']]"`
Expected: `(192, 192)`, `(512, 512)`, `(512, 512)`, `(180, 180)`.

- [ ] **Step 4: `<head>`, manifest e `sw.js`**

1. Em `index.html`, logo depois de `<link rel="manifest" href="manifest.webmanifest" />`:

```html
  <link rel="icon" href="icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />
```

2. `manifest.webmanifest` inteiro:

```json
{
  "name": "Encerramento 11T",
  "short_name": "Encerramento 11T",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#121417",
  "theme_color": "#121417",
  "description": "Gerador de encerramentos de OS, offline.",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

3. `sw.js`, linhas 1–2:

```js
const CACHE="encerramento-11t-v9";
const ASSETS=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
```

- [ ] **Step 5: Rodar tudo**

Run: `for t in $(seq -f "t%g" 1 21); do grep -q "async $t(" $H/check.js && node $H/check.js $t; done`
Expected: todos `PASS` (`t15` confere que todo item de `ASSETS` responde 200).

- [ ] **Step 6: Commit**

```bash
git add icon.svg icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png index.html manifest.webmanifest sw.js
git commit -m "Ícone Fibra (192, 512, adaptável e Apple), manifest com ícones; cache do PWA v9

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Celular de 360 px — sem rolagem lateral, alvos de toque e capturas para aprovação

**Files:**
- Modify (se necessário): `styles.css`
- Create (fora do git): `.superpowers/harness/shots.js`
- Modify (fora do git): `.superpowers/harness/check.js` (caso `t22`)

**Interfaces:**
- Consumes: tudo das Tasks 1–4.
- Produces: capturas em `~/Downloads/etapa4-capturas/` para o técnico aprovar.

- [ ] **Step 1: Escrever `t22`**

```js
  async t22(p) {
    await p.setViewportSize({ width: 360, height: 740 });
    const probs = [];
    for (const theme of ["escuro", "sol"]) {
      await p.evaluate((t) => applyTheme(t), theme);
      for (const tab of ["nova", "historico", "trocas", "config"]) {
        await p.evaluate((t) => switchTab(t), tab);
        const r = await p.evaluate(() => {
          const out = [];
          if (document.documentElement.scrollWidth > 360) out.push("rolagem lateral " + document.documentElement.scrollWidth);
          document.querySelectorAll("button").forEach((b) => {
            const q = b.getBoundingClientRect();
            if (q.width && q.height && (q.width < 44 || q.height < 44)) out.push("alvo pequeno: " + (b.id || b.textContent.trim().slice(0, 20)) + " " + Math.round(q.width) + "x" + Math.round(q.height));
          });
          return out;
        });
        probs.push(...r.map((x) => `${theme}/${tab}: ${x}`));
      }
      await p.evaluate(() => { switchTab("nova"); document.getElementById("resultado").value = "x"; openSheet(); });
      if (await p.evaluate(() => document.documentElement.scrollWidth > 360)) probs.push(theme + "/folha: rolagem lateral");
      await p.evaluate(() => closeSheet());
    }
    if (probs.length) throw new Error(probs.slice(0, 8).join("; "));
    return "360px sem rolagem lateral e alvos ≥ 44px";
  },
```

- [ ] **Step 2: Rodar**

Run: `node $H/check.js t22`
Expected: `PASS`. Se falhar, a mensagem lista cada problema (tela/tema/elemento). Corrigir no `styles.css` a causa específica (ex.: `min-width`/`padding` de um botão, `overflow-wrap:anywhere` em texto longo, `max-width:100%` num elemento largo), sem mexer em HTML/JS, e rodar de novo até `PASS`. Registrar cada ajuste no commit.

- [ ] **Step 3: Rodar a suíte inteira**

Run: `for t in $(seq -f "t%g" 1 22); do grep -q "async $t(" $H/check.js && node $H/check.js $t; done`
Expected: todos `PASS`.

- [ ] **Step 4: Capturas para o técnico**

Criar `.superpowers/harness/shots.js`:

```js
const { chromium } = require("playwright-core");
const fs = require("fs");
const dir = require("os").homedir() + "/Downloads/etapa4-capturas/";
fs.mkdirSync(dir, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await (await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, serviceWorkers: "block" })).newPage();
  p.on("dialog", (d) => d.accept());
  await p.goto("http://localhost:8765/index.html");
  await p.evaluate(() => {
    localStorage.clear();
    const now = Date.now(), day = 86400000;
    localStorage.setItem("coprel11t_history_v3", JSON.stringify([
      { id: now - 8 * day, cliente: "Cliente Exemplo", os: "100001", data: "17/09/2026", tipo: "Dificuldade", report: "…" },
      { id: now - 9 * day, cliente: "Outro Cliente", os: "100002", data: "16/09/2026", tipo: "Reparo / Cliente offline", report: "…" },
    ]));
    localStorage.setItem("coprel11t_trocas_v3", JSON.stringify([
      { id: now - 9 * day, data: "16/09/2026", cliente: "Outro Cliente", os: "100002", ret: "1 ONU Huawei V5", cond: "Boa / funcionando", inst: "1 Huawei X6-10 sem telefonia", qtd: "1", motivo: "Atualização para tecnologia mais recente" },
    ]));
  });
  for (const theme of ["escuro", "sol"]) {
    await p.reload();
    await p.evaluate((t) => applyTheme(t), theme);
    await p.fill("#mkInput", "CLIENTE EXEMPLO\nOS - 100003 / COD 12345\nRua Exemplo, 1 - Centro - Marau");
    await p.click("#parseBtn");
    await p.click('[data-queixa="tv"]'); await p.click('[data-achado="conexao"]'); await p.click('[data-achado="iptv"]');
    await p.screenshot({ path: `${dir}${theme}-1-nova-os.png` });
    await p.evaluate(() => window.scrollTo(0, 99999));
    await p.screenshot({ path: `${dir}${theme}-2-nova-os-fim.png` });
    await p.selectOption("#internet", "sim"); await p.click('[data-plan="400 Mbps"]'); await p.click('[data-gpon="-21 dBm"]'); await p.click('[data-acomp="sim"]');
    await p.click("#generateBtn");
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${dir}${theme}-3-folha.png` });
    await p.evaluate(() => closeSheet());
    for (const [tab, n] of [["historico", 4], ["trocas", 5], ["config", 6]]) {
      await p.click(`[data-tab="${tab}"]`);
      await p.screenshot({ path: `${dir}${theme}-${n}-${tab}.png` });
    }
  }
  await b.close();
  console.log("capturas em " + dir);
})();
```

Run: `rm -rf ~/Downloads/etapa4-capturas && node $H/shots.js && ls ~/Downloads/etapa4-capturas`
Expected: 12 arquivos (`escuro-1-nova-os.png` … `sol-6-config.png`). Olhar cada captura (ferramenta de leitura de imagem) e corrigir no CSS qualquer defeito visível (texto cortado, sobreposição, contraste) antes de mostrar ao técnico; rodar a suíte de novo se o CSS mudar.

- [ ] **Step 5: Commit (se o CSS mudou nos Steps 2 ou 4)**

```bash
git add styles.css
git commit -m "Ajustes de layout para 360 px (sem rolagem lateral, alvos de toque ≥ 44 px)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Aprovação do técnico**

Mostrar as 12 capturas ao técnico e pedir aprovação antes de qualquer merge. Pedidos de ajuste viram mudanças de CSS/HTML com a suíte rodando de novo e commit próprio.
