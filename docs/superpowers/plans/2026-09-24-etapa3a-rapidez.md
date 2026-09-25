# Etapa 3a — Preenchimento rápido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o tipo "Dificuldade" com botões de queixa e achado, o modo de atendimento (presencial / só por telefone / recusado), botões de plano e botões de "Cliente acompanhou".

**Architecture:** Continua HTML/CSS/JS puros com `app.js` único. Os botões de liga/desliga são `<button class="chip toggle">` lidos pela classe `active`; textos ficam em tabelas (`QUEIXAS`, `ACHADOS`) no `app.js`. O modo de atendimento e o "acompanhou" viram campos ocultos (`#modo`, `#acompanhou`) escritos por grupos de botões, para o resto do código continuar lendo `v("modo")` e `v("acompanhou")`.

**Tech Stack:** HTML, CSS, JavaScript puro, `localStorage`, Service Worker. Verificação com script Playwright fora do repositório.

**Spec:** `docs/superpowers/specs/2026-09-24-etapa3a-rapidez-design.md`

## Global Constraints

- Manter HTML/CSS/JS puros e um único `app.js`; sem build, sem dependências novas, sem framework de testes no repositório.
- Modo `presencial` deixa o texto dos tipos existentes **idêntico** ao da etapa 1.
- Nada vem ligado/marcado por padrão: queixas, achados e "Cliente acompanhou" começam vazios; o texto só afirma o que o técnico tocou.
- Cache do PWA: `sw.js` passa a `encerramento-11t-v5`.
- Chaves de armazenamento inalteradas: `coprel11t_history_v3`, `coprel11t_trocas_v3`, `coprel11t_config_v3`.
- Textos da interface e do relatório em português do Brasil.
- Dados reais de clientes (arquivo `~/Downloads/todos_os_dados_da_conversa.md`) nunca entram no repositório, em commits ou em documentos.
- Mensagens de commit terminam com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Trabalho na branch `etapa3-rapidez` (parte da `etapa1-correcoes`).

## Review Focus

- Modo `telefone`/`recusado` com tipo Upgrade/Troca: não exigir campos de troca, não gerar "Controle de equipamento" e **não salvar troca fantasma** ao clicar em Salvar.
- Achados e queixas saem sempre na ordem fixa da tabela, não na ordem em que foram tocados.
- Queixa livre só com espaços, ou terminada em ponto/interrogação: não gera item vazio nem pontuação duplicada.
- "Limpar" zera botões (com `aria-pressed`), `queixaTexto`, modo e acompanhou **sem apagar o valor dos campos ocultos** (`modo` vazio quebraria a geração do texto).
- Tocar duas vezes no mesmo botão de "Cliente acompanhou" volta a "não informado"; o alerta ao copiar continua listando o campo vazio.
- Abrir relato antigo do Histórico e salvar continua protegido (etapa 1) com os novos tipos e modos.

## Harness de verificação (fora do repositório)

O script de verificação da etapa 1 já existe em
`SP=/tmp/claude-1000/-home-a/3e00e76a-f7ca-4c84-99d5-b5ef51e20c6f/scratchpad`
(`$SP/check.js`, com casos `t1`–`t5`). Todo comando abaixo assume:

```bash
cd ~/Projetos/gerador-encerramento-11t
SP=/tmp/claude-1000/-home-a/3e00e76a-f7ca-4c84-99d5-b5ef51e20c6f/scratchpad
export CHROME=$(ls ~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome) NODE_PATH=$SP/node_modules
(python3 -m http.server 8765 >/dev/null 2>&1 & echo $! > /tmp/srv.pid); sleep 1
# rodar um caso:  node $SP/check.js t6
# ao terminar a sessão:  kill $(cat /tmp/srv.pid)
```

Novos casos entram no objeto `checks` de `$SP/check.js`, logo antes do `};` que precede
`(async () => {`. Um caso que lança `Error` faz o script imprimir `FAIL` e sair com 1.

---

### Task 1: Tipo "Dificuldade" com queixa e achados

**Files:**
- Modify: `index.html` (grade de tipos, campo oculto `tipo`, nova `dificuldadeSection`)
- Modify: `styles.css` (botões liga/desliga)
- Modify: `app.js` (`configs`, `dynamic`, tabelas e funções novas, `description`, `clearForm`, inicialização)
- Modify (fora do repo): `$SP/check.js` (caso `t6`; ajuste de `fillTroca`)

**Interfaces:**
- Consumes: `v(id)`, `sentence(s)`, `selectService(type)`, `clearForm()`.
- Produces:
  - `QUEIXAS` (objeto chave → fragmento) e `ACHADOS` (objeto chave → frase).
  - `activeKeys(attr)` → `Set` das chaves com `data-<attr>` cujo botão tem classe `active`.
  - `joinList(items)` → `"a"`, `"a e b"` ou `"a, b e c"`.
  - `queixaSentence()` → `""` ou `"O cliente relatou: … ."`.
  - `achadoSentences()` → array de frases na ordem de `ACHADOS`.
  - `resetToggles()` → desliga todos os `.toggle` e põe `aria-pressed="false"`.
  - Tipo `dificuldade` em `configs`, selecionado por padrão.

- [ ] **Step 1: Ajustar o harness e escrever o caso `t6` que deve falhar**

O tipo padrão passa a ser Dificuldade, então `fillTroca` precisa escolher Upgrade antes de clicar no preset. No `$SP/check.js`, na função `fillTroca`, inserir como primeira linha do corpo:

```js
  await p.click('[data-service="upgrade"]');
```

Adicionar ao objeto `checks`:

```js
  async t6(p) {
    if ((await p.inputValue("#tipo")) !== "dificuldade") throw new Error("tipo padrão não é dificuldade");
    const body = async () => (await p.inputValue("#resultado")).split("Relatório da Ordem de Serviço\n\n")[1].trim();
    const fill = async () => {
      await p.fill("#os", "1"); await p.fill("#cliente", "Teste"); await p.fill("#endereco", "Rua A");
    };
    const A = "Realizado atendimento técnico para verificação da dificuldade relatada pelo cliente.";
    const CONEXAO = "A conexão da Coprel Telecom apresentou funcionamento normal durante o atendimento.";
    await fill();
    await p.click('[data-queixa="lentidao"]');
    await p.click('[data-queixa="tv"]');
    await p.click('[data-achado="sky"]');
    await p.click('[data-achado="conexao"]');
    await p.click("#generateBtn");
    let want = [A, "O cliente relatou: TV travando e lentidão.", CONEXAO, "Foi constatado que o cliente utiliza Sky gato por antena."].join("\n\n");
    let got = await body();
    if (got !== want) throw new Error("ordem/texto:\n" + got);
    await p.click('[data-queixa="lentidao"]');
    await p.click("#generateBtn");
    if (!(await body()).includes("O cliente relatou: TV travando.\n")) throw new Error("desligar não removeu: " + (await body()));
    await p.click('[data-queixa="lentidao"]');
    await p.fill("#queixaTexto", "sem sinal na sala.");
    await p.click("#generateBtn");
    if (!(await body()).includes("O cliente relatou: TV travando, lentidão e sem sinal na sala.\n")) throw new Error("queixa livre: " + (await body()));
    await p.fill("#queixaTexto", "   ");
    await p.click("#generateBtn");
    if (!(await body()).includes("O cliente relatou: TV travando e lentidão.\n")) throw new Error("queixa só com espaços: " + (await body()));
    await p.click("#clearBtn");
    if ((await p.inputValue("#tipo")) !== "dificuldade") throw new Error("Limpar não voltou a dificuldade");
    if ((await p.getAttribute('[data-achado="sky"]', "aria-pressed")) !== "false" || (await p.locator(".toggle.active").count()) !== 0)
      throw new Error("Limpar não desligou os botões");
    await fill();
    await p.click('[data-achado="iptv"]');
    await p.click("#generateBtn");
    got = await body();
    if (!got.includes("O cliente utiliza IPTV de terceiros.") || got.includes("orientado")) throw new Error("IPTV sozinho: " + got);
    return "dificuldade + queixa + achados ok";
  },
```

- [ ] **Step 2: Rodar `t6` e ver falhar**

Run: `node $SP/check.js t6`
Expected: `t6 FAIL: tipo padrão não é dificuldade`.

- [ ] **Step 3: HTML — botão do tipo, valor padrão e seção**

Em `index.html`:

1. Em `<div class="service-grid" id="serviceGrid">`, inserir como **primeiro** botão:

```html
            <button data-service="dificuldade">Dificuldade</button>
```

2. Trocar `<input type="hidden" id="tipo" value="upgrade">` por:

```html
          <input type="hidden" id="tipo" value="dificuldade">
```

3. Imediatamente antes de `<section class="card dynamic" id="genericSection" hidden>`, inserir:

```html
        <section class="card dynamic" id="dificuldadeSection">
          <h2>3. Dificuldade</h2>
          <div class="preset-block">
            <span>Queixa do cliente</span>
            <div class="chip-row">
              <button class="chip toggle" data-queixa="tv" aria-pressed="false">TV travando</button>
              <button class="chip toggle" data-queixa="quedas" aria-pressed="false">Quedas/oscilações</button>
              <button class="chip toggle" data-queixa="lentidao" aria-pressed="false">Lentidão</button>
              <button class="chip toggle" data-queixa="semnet" aria-pressed="false">Sem internet</button>
              <button class="chip toggle" data-queixa="wifi" aria-pressed="false">Pouco alcance do Wi-Fi</button>
            </div>
          </div>
          <label for="queixaTexto">Outra queixa</label>
          <input id="queixaTexto" type="text" placeholder="Ex.: sem sinal na sala">
          <div class="preset-block spaced">
            <span>O que foi constatado / orientado</span>
            <div class="chip-row">
              <button class="chip toggle" data-achado="conexao" aria-pressed="false">Conexão normal</button>
              <button class="chip toggle" data-achado="testes" aria-pressed="false">Testes de navegação/streaming</button>
              <button class="chip toggle" data-achado="semquedas" aria-pressed="false">Sem quedas registradas</button>
              <button class="chip toggle" data-achado="iptv" aria-pressed="false">IPTV de terceiros</button>
              <button class="chip toggle" data-achado="iptvOrient" aria-pressed="false">Orientado: responsável pelo IPTV</button>
              <button class="chip toggle" data-achado="sky" aria-pressed="false">Sky gato</button>
              <button class="chip toggle" data-achado="skyOrient" aria-pressed="false">Orientado: responsável pela TV</button>
              <button class="chip toggle" data-achado="particular" aria-pressed="false">Rede/equipamento particular</button>
              <button class="chip toggle" data-achado="reiniciar" aria-pressed="false">Orientado a reiniciar</button>
            </div>
          </div>
        </section>

```

- [ ] **Step 4: CSS**

Acrescentar ao final de `styles.css`:

```css
.chip.toggle{cursor:pointer}
.chip.toggle.active{background:var(--ink);color:#fff;border-color:var(--ink)}
.spaced{margin-top:14px}
```

- [ ] **Step 5: `app.js` — tipo, tabelas e funções**

1. Em `configs`, inserir como **primeira** entrada (antes de `upgrade:`):

```js
  dificuldade: {
    title: "Dificuldade",
    show: ["dificuldadeSection", "genericSection"],
    hint: "Ligue só o que realmente ocorreu: cada botão vira uma frase do relato.",
  },
```

2. Em `dynamic`, acrescentar `"dificuldadeSection",` antes de `"genericSection",`.

3. Logo depois do `];` que fecha `dynamic` (antes de `function v(id)`), inserir:

```js
const QUEIXAS = {
  tv: "TV travando",
  quedas: "quedas/oscilações",
  lentidao: "lentidão",
  semnet: "sem internet",
  wifi: "pouco alcance do Wi-Fi",
};
const ACHADOS = {
  conexao:
    "A conexão da Coprel Telecom apresentou funcionamento normal durante o atendimento.",
  testes: "Foram realizados testes de navegação e streaming.",
  semquedas: "Não foram identificadas quedas registradas.",
  iptv: "O cliente utiliza IPTV de terceiros.",
  iptvOrient:
    "O cliente foi orientado a procurar o responsável pelo serviço caso a dificuldade persista somente no IPTV.",
  sky: "Foi constatado que o cliente utiliza Sky gato por antena.",
  skyOrient:
    "O cliente foi orientado a buscar auxílio com o responsável pelo serviço de TV.",
  particular:
    "Foi constatada a utilização de equipamento/rede interna particular.",
  reiniciar:
    "O cliente foi orientado a reiniciar o equipamento da Coprel Telecom caso o problema ocorra novamente.",
};
function activeKeys(attr) {
  return new Set(
    [...document.querySelectorAll(`[data-${attr}].active`)].map(
      (b) => b.dataset[attr],
    ),
  );
}
function joinList(items) {
  if (items.length < 2) return items.join("");
  return items.slice(0, -1).join(", ") + " e " + items[items.length - 1];
}
function queixaSentence() {
  const on = activeKeys("queixa");
  const items = Object.keys(QUEIXAS)
    .filter((k) => on.has(k))
    .map((k) => QUEIXAS[k]);
  const extra = v("queixaTexto").replace(/[.!?]+$/, "");
  if (extra) items.push(extra);
  return items.length ? `O cliente relatou: ${joinList(items)}.` : "";
}
function achadoSentences() {
  const on = activeKeys("achado");
  return Object.keys(ACHADOS)
    .filter((k) => on.has(k))
    .map((k) => ACHADOS[k]);
}
function resetToggles() {
  document.querySelectorAll(".toggle").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
  });
}
document.querySelectorAll(".toggle").forEach((b) =>
  b.addEventListener("click", () => {
    const on = b.classList.toggle("active");
    b.setAttribute("aria-pressed", String(on));
  }),
);
```

4. Em `description()`, trocar

```js
  } else if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  if (["upgrade", "troca"].includes(t))
```
por
```js
  } else if (t === "dificuldade") {
    lines.push(
      "Realizado atendimento técnico para verificação da dificuldade relatada pelo cliente.",
    );
    if (queixaSentence()) lines.push(queixaSentence());
    lines.push(...achadoSentences());
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  if (["upgrade", "troca"].includes(t))
```

5. Em `clearForm()`, trocar `selectService("upgrade");` por:

```js
  resetToggles();
  selectService("dificuldade");
```

6. Na inicialização (final do arquivo), trocar `selectService("upgrade");` por `selectService("dificuldade");`.

- [ ] **Step 6: Formatar, checar sintaxe e rodar todos os casos**

Run:
```bash
npx --yes prettier@3 --write app.js && node --check app.js && for t in t1 t2 t3 t4 t5 t6; do node $SP/check.js $t; done
```
Expected: `t1`–`t6` todos `PASS` (t6: `dificuldade + queixa + achados ok`), sem erros de console.

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css app.js
git commit -m "Adiciona tipo Dificuldade com botões de queixa e achados

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Modo de atendimento (presencial / só por telefone / recusado)

**Files:**
- Modify: `index.html` (card "2. Tipo de atendimento")
- Modify: `styles.css` (grupo de botões segmentados)
- Modify: `app.js` (`setModo`, `remoteDescription`, `description`, `validate`, `equipBlock`, `missingTechFields`, salvar troca, `clearForm`, inicialização)
- Modify (fora do repo): `$SP/check.js` (caso `t7`)

**Interfaces:**
- Consumes: `queixaSentence()`, `achadoSentences()` (Task 1); `v`, `sentence`.
- Produces: campo oculto `#modo` (`presencial` | `telefone` | `recusado`); `setModo(m)`; `remoteDescription(modo)` → texto; botões `.seg` com `data-modo`. Tudo que consulta `v("modo")` trata `presencial` como o comportamento atual.

- [ ] **Step 1: Escrever o caso `t7` que deve falhar**

Adicionar ao objeto `checks` de `$SP/check.js`:

```js
  async t7(p) {
    const body = async () => (await p.inputValue("#resultado")).split("Relatório da Ordem de Serviço\n\n")[1].trim();
    await p.fill("#os", "1"); await p.fill("#cliente", "Teste"); await p.fill("#endereco", "Rua A");
    await p.click('[data-modo="telefone"]');
    await p.click('[data-queixa="tv"]');
    await p.click('[data-achado="conexao"]');
    await p.click("#generateBtn");
    let b = await body();
    const want = ["Atendimento realizado somente por telefone.", "O cliente relatou: TV travando.", "A conexão da Coprel Telecom apresentou funcionamento normal durante o atendimento."].join("\n\n");
    if (b !== want) throw new Error("telefone:\n" + b);
    if (/endereço do cliente|deslocamento/i.test(b)) throw new Error("telefone menciona deslocamento");
    await p.click('[data-service="upgrade"]');
    await p.click("#generateBtn");
    const full = await p.inputValue("#resultado");
    if (!full.includes("Atendimento realizado somente por telefone.") || full.includes("Controle de equipamento"))
      throw new Error("upgrade por telefone:\n" + full);
    await p.click("#saveBtn");
    const trocas = await p.evaluate(() => JSON.parse(localStorage.getItem("coprel11t_trocas_v3") || "[]").length);
    if (trocas !== 0) throw new Error("troca fantasma salva: " + trocas);
    await p.click('[data-service="dificuldade"]');
    await p.click('[data-modo="recusado"]');
    await p.click("#generateBtn");
    b = await body();
    if (b !== "O cliente dispensou o atendimento e não quis prosseguir. Testes técnicos: não realizados.")
      throw new Error("recusado:\n" + b);
    await p.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const seen = [];
    p.on("dialog", (d) => { seen.push(d.message()); d.dismiss(); });
    await p.click("#copyBtn");
    await p.waitForFunction(() => document.getElementById("copyStatus").textContent.includes("Copiado"));
    if (seen.length) throw new Error("alerta em modo recusado: " + seen);
    await p.click('[data-modo="presencial"]');
    await p.click("#generateBtn");
    if (!(await body()).startsWith("Realizado atendimento técnico para verificação")) throw new Error("presencial não voltou");
    await p.click('[data-modo="telefone"]');
    await p.click("#clearBtn");
    if ((await p.inputValue("#modo")) !== "presencial") throw new Error("Limpar não voltou a presencial");
    return "modos telefone/recusado/presencial ok";
  },
```

- [ ] **Step 2: Rodar `t7` e ver falhar**

Run: `node $SP/check.js t7`
Expected: `t7 FAIL` com erro de timeout ao clicar `[data-modo="telefone"]` (o botão ainda não existe).

- [ ] **Step 3: HTML e CSS**

Em `index.html`, logo depois de `<div class="hint" id="tipoHint"></div>` (card "2. Tipo de atendimento"), inserir:

```html
          <div class="group-label">Modo de atendimento</div>
          <div class="seg-row">
            <button class="seg active" data-modo="presencial">Presencial</button>
            <button class="seg" data-modo="telefone">Só por telefone</button>
            <button class="seg" data-modo="recusado">Recusado pelo cliente</button>
          </div>
          <input type="hidden" id="modo" value="presencial">
          <div class="hint" id="modoHint"></div>
```

Acrescentar ao final de `styles.css`:

```css
.group-label{font-size:13px;font-weight:800;color:var(--ink);margin:14px 0 6px}
.seg-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.seg{background:#f0f2f8;color:#4c5470;border:1px solid #e0e4ef;padding:11px 6px;font-size:13px}
.seg.active{background:var(--ink);color:#fff;border-color:var(--ink)}
```

- [ ] **Step 4: `app.js` — modo e regras**

1. Depois de `resetToggles`/handlers de `.toggle` (Task 1), inserir:

```js
const MODO_HINTS = {
  presencial: "",
  telefone:
    "Não registra deslocamento ao local. Campos específicos do tipo (troca, reparo…) são ignorados.",
  recusado:
    "Registra que os testes técnicos não foram realizados. Só relato livre e observação entram.",
};
function setModo(m) {
  $("modo").value = m;
  document
    .querySelectorAll("[data-modo]")
    .forEach((b) => b.classList.toggle("active", b.dataset.modo === m));
  $("modoHint").textContent = MODO_HINTS[m];
}
document
  .querySelectorAll("[data-modo]")
  .forEach((b) =>
    b.addEventListener("click", () => setModo(b.dataset.modo)),
  );
function remoteDescription(modo) {
  const lines = [];
  if (modo === "telefone") {
    lines.push("Atendimento realizado somente por telefone.");
    if (v("tipo") === "dificuldade") {
      if (queixaSentence()) lines.push(queixaSentence());
      lines.push(...achadoSentences());
    }
  } else {
    lines.push(
      "O cliente dispensou o atendimento e não quis prosseguir. Testes técnicos: não realizados.",
    );
  }
  if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  if (v("obs")) lines.push(sentence(v("obs")));
  return lines.join("\n\n");
}
```

2. Em `description()`, trocar a abertura

```js
function description() {
  const t = v("tipo"),
```
por
```js
function description() {
  if (v("modo") !== "presencial") return remoteDescription(v("modo"));
  const t = v("tipo"),
```

3. Em `validate()`, trocar `if (["upgrade", "troca"].includes(v("tipo"))) {` (o da validação de troca) por:

```js
  if (v("modo") === "presencial" && ["upgrade", "troca"].includes(v("tipo"))) {
```

4. Em `equipBlock()`, trocar `return ["upgrade", "troca"].includes(v("tipo"))` por:

```js
  return v("modo") === "presencial" &&
    ["upgrade", "troca"].includes(v("tipo"))
```

5. Em `missingTechFields()`, primeira linha do corpo:

```js
  if (v("modo") !== "presencial") return [];
```

6. No handler de `$("saveBtn")`, trocar `if (["upgrade", "troca"].includes(v("tipo"))) {` por:

```js
  if (v("modo") === "presencial" && ["upgrade", "troca"].includes(v("tipo"))) {
```

7. Em `clearForm()`, na lista de ids ignorados pelo laço de `input/textarea` (`"data", "qtdRet", …, "tipo"`), acrescentar `"modo"`; e depois de `resetToggles();` chamar `setModo("presencial");`.

8. Na inicialização, logo antes de `selectService("dificuldade");`, acrescentar `setModo("presencial");`.

- [ ] **Step 5: Formatar e rodar todos os casos**

Run:
```bash
npx --yes prettier@3 --write app.js && node --check app.js && for t in t1 t2 t3 t4 t5 t6 t7; do node $SP/check.js $t; done
```
Expected: `t1`–`t7` todos `PASS`; `t1` prova que o texto presencial de Upgrade não mudou.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css app.js
git commit -m "Adiciona modo de atendimento: presencial, só por telefone e recusado

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Botões de "Cliente acompanhou", botões de plano e cache v5

**Files:**
- Modify: `index.html` (campo "Cliente acompanhou" e campo "Plano")
- Modify: `app.js` (`setAcompanhou`, botões de plano, `clearForm`, inicialização)
- Modify: `sw.js:1`
- Modify (fora do repo): `$SP/check.js` (caso `t8`; ajustes em `t4`)

**Interfaces:**
- Consumes: `.seg`/`.seg-row`/`.group-label` (Task 2), `.chip-row`, `.spaced`.
- Produces: campo oculto `#acompanhou` (valores `na`, `sim`, `nao`, `responsavel`, mesmos de antes); `setAcompanhou(val)`; botões `[data-acomp]` e `[data-plan]`.

- [ ] **Step 1: Escrever `t8`, ajustar `t4` e ver falhar**

No `$SP/check.js`, no caso `t4`, trocar `await p.selectOption("#acompanhou", "sim");` por `await p.click('[data-acomp="sim"]');` e `encerramento-11t-v4` por `encerramento-11t-v5`. Adicionar ao objeto `checks`:

```js
  async t8(p) {
    const text = async () => p.inputValue("#resultado");
    if ((await p.inputValue("#acompanhou")) !== "na" || (await p.locator("[data-acomp].active").count()) !== 0)
      throw new Error("acompanhou não abre vazio");
    await p.fill("#os", "1"); await p.fill("#cliente", "Teste"); await p.fill("#endereco", "Rua A");
    await p.click('[data-acomp="sim"]');
    await p.click("#generateBtn");
    if (!(await text()).includes("- Cliente acompanhou os testes: Sim")) throw new Error("sim não gerou");
    await p.click('[data-acomp="sim"]');
    if ((await p.inputValue("#acompanhou")) !== "na") throw new Error("segundo toque não desmarcou");
    await p.click("#generateBtn");
    if ((await text()).includes("Cliente acompanhou")) throw new Error("na gerou linha");
    await p.click('[data-acomp="responsavel"]');
    await p.fill("#responsavel", "Filho do cliente");
    await p.click("#generateBtn");
    if (!(await text()).includes("- Cliente acompanhou os testes: Filho do cliente")) throw new Error("responsável");
    await p.click('[data-plan="Prime Gamer"]');
    if ((await p.inputValue("#plano")) !== "Prime Gamer") throw new Error("chip de plano");
    await p.click("#generateBtn");
    if (!(await text()).includes("- Plano: Prime Gamer")) throw new Error("plano no texto");
    await p.click("#clearBtn");
    if ((await p.inputValue("#acompanhou")) !== "na" || (await p.locator("[data-acomp].active").count()) !== 0 || (await p.inputValue("#plano")) !== "")
      throw new Error("Limpar não zerou acompanhou/plano");
    return "acompanhou + planos ok";
  },
```

Run: `node $SP/check.js t8`
Expected: `t8 FAIL` com erro de `getAttribute/inputValue` porque `#acompanhou` ainda é um `select` sem `[data-acomp]` (ou timeout em `[data-acomp="sim"]`).

- [ ] **Step 2: HTML**

Em `index.html`, na seção "4. Informações técnicas":

1. Trocar o bloco

```html
            <div>
              <label for="acompanhou">Cliente acompanhou</label>
              <select id="acompanhou">
                <option value="na">Não informado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
                <option value="responsavel">Responsável</option>
              </select>
            </div>
```
por
```html
            <div>
              <div class="group-label">Cliente acompanhou</div>
              <div class="seg-row">
                <button class="seg" data-acomp="sim" aria-pressed="false">Sim</button>
                <button class="seg" data-acomp="nao" aria-pressed="false">Não</button>
                <button class="seg" data-acomp="responsavel" aria-pressed="false">Responsável</button>
              </div>
              <input type="hidden" id="acompanhou" value="na">
            </div>
```

2. No campo Plano, trocar `<input id="plano" type="text" placeholder="Ex.: 400 Mbps">` por:

```html
              <input id="plano" type="text" placeholder="Ex.: 400 Mbps">
              <div class="chip-row spaced">
                <button class="chip" data-plan="200 Mbps">200</button>
                <button class="chip" data-plan="300 Mbps">300</button>
                <button class="chip" data-plan="400 Mbps">400</button>
                <button class="chip" data-plan="500 Mbps">500</button>
                <button class="chip" data-plan="600 Mbps">600</button>
                <button class="chip" data-plan="Prime">Prime</button>
                <button class="chip" data-plan="Residencial Prime">Res. Prime</button>
                <button class="chip" data-plan="Prime Gamer">Prime Gamer</button>
                <button class="chip" data-plan="Residencial Combo">Res. Combo</button>
              </div>
```

- [ ] **Step 3: `app.js`**

1. Depois de `remoteDescription` (Task 2), inserir:

```js
function setAcompanhou(val) {
  $("acompanhou").value = val;
  document.querySelectorAll("[data-acomp]").forEach((b) => {
    const on = b.dataset.acomp === val;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
document.querySelectorAll("[data-acomp]").forEach((b) =>
  b.addEventListener("click", () =>
    setAcompanhou($("acompanhou").value === b.dataset.acomp ? "na" : b.dataset.acomp),
  ),
);
document
  .querySelectorAll("[data-plan]")
  .forEach((b) => (b.onclick = () => ($("plano").value = b.dataset.plan)));
```

2. Em `clearForm()`: acrescentar `"acompanhou"` à lista de ids ignorados pelo laço de `input/textarea` (junto de `"modo"`), e depois de `setModo("presencial");` chamar `setAcompanhou("na");`.

3. Na inicialização, depois de `setModo("presencial");`, acrescentar `setAcompanhou("na");`.

- [ ] **Step 4: Cache do PWA**

Em `sw.js:1`, trocar `encerramento-11t-v4` por `encerramento-11t-v5`.

- [ ] **Step 5: Formatar e rodar todos os casos**

Run:
```bash
npx --yes prettier@3 --write app.js && node --check app.js && for t in t1 t2 t3 t4 t5 t6 t7 t8; do node $SP/check.js $t; done
```
Expected: `t1`–`t8` todos `PASS`. `t4` continua provando que o alerta ao copiar lista "Cliente acompanhou" quando nenhum botão está marcado.

- [ ] **Step 6: Commit**

```bash
git add index.html app.js sw.js
git commit -m "Botões de Cliente acompanhou e de plano; sobe cache do PWA para v5

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Critério de aceitação com casos reais

**Files:**
- Create (fora do repo): `$SP/real-cases.js`
- Nenhum arquivo do repositório muda.

**Interfaces:**
- Consumes: todo o app das Tasks 1–3 servido em `http://localhost:8765`.
- Produces: os textos gerados para 10 casos, para o técnico comparar com o que escreveria. A etapa só é considerada pronta com a aprovação dele. Os casos abaixo vêm de atendimentos reais de Dificuldade do arquivo de dados, **sem nomes de clientes**.

- [ ] **Step 1: Criar o script dos casos**

Escrever `$SP/real-cases.js`:

```js
const { chromium } = require("playwright-core");
const cases = [
  { nome: "IPTV de terceiros, TV travando", queixa: ["tv"], achados: ["conexao", "iptv", "iptvOrient"], relato: "Telefone e navegação testados.", internet: "sim", plano: "500 Mbps", gpon: "-26 dBm", acomp: "sim" },
  { nome: "TV não abria pela manhã", queixaTexto: "TV não estava abrindo pela manhã", achados: ["testes", "semquedas", "iptv", "iptvOrient"], internet: "sim", plano: "400 Mbps", gpon: "-21 dBm", acomp: "sim" },
  { nome: "Rede compartilhada com mercado", queixaTexto: "problema ocorrido pela manhã", achados: ["conexao", "particular"], relato: "Internet compartilhada com um mercado, que utiliza roteador TP-Link antigo.", internet: "sim", plano: "600 Mbps", gpon: "-19 dBm", acomp: "sim" },
  { nome: "Filho do cliente presente", queixaTexto: "travamentos no YouTube", achados: ["testes"], relato: "Nenhuma anormalidade identificada. Orientado a testar novamente.", internet: "sim", plano: "400 Mbps", gpon: "-18 dBm", acomp: "responsavel", responsavel: "Filho do cliente" },
  { nome: "Internet parou no dia anterior", queixaTexto: "internet parou em todos os dispositivos no dia anterior", achados: ["semquedas", "reiniciar", "conexao"], relato: "Cliente orientado a providenciar passagem para cabo no ponto com C Box.", internet: "sim", plano: "Prime", gpon: "-21 dBm", acomp: "sim" },
  { nome: "Sky gato", queixaTexto: "dificuldade na TV", achados: ["sky", "skyOrient", "conexao"], relato: "Cliente orientado a realizar testes nos demais aplicativos.", internet: "sim", plano: "Residencial Prime", gpon: "-22 dBm", acomp: "sim" },
  { nome: "Roteador da sala, C Box recusado", queixaTexto: "dificuldade concentrada no roteador da sala", achados: ["iptv"], relato: "Foi sugerido teste com 1 C Box antes de alteração de plano, que o cliente recusou.", internet: "sim", plano: "400 Mbps", gpon: "-21 dBm", acomp: "sim" },
  { nome: "Chamadas do celular", queixaTexto: "não conseguia realizar chamadas pelo celular", achados: ["conexao"], relato: "Foi explicado que chamadas da operadora móvel não dependem da internet da Coprel Telecom.", internet: "sim" },
  { nome: "Só por telefone", modo: "telefone", queixaTexto: "cliente pretende cancelar o serviço", relato: "Foi informado que a equipe gostaria de entender o problema. O cliente dispensou o atendimento." },
  { nome: "Recusado pelo cliente", modo: "recusado", relato: "Cliente informou que pretende cancelar o serviço." },
];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await (await b.newContext({ serviceWorkers: "block" })).newPage();
  await p.goto("http://localhost:8765/index.html");
  for (const [i, c] of cases.entries()) {
    await p.click("#clearBtn");
    await p.fill("#os", String(i + 1));
    await p.fill("#cliente", "Cliente Teste");
    await p.fill("#endereco", "Rua Exemplo, 1");
    if (c.modo) await p.click(`[data-modo="${c.modo}"]`);
    for (const k of c.queixa || []) await p.click(`[data-queixa="${k}"]`);
    if (c.queixaTexto) await p.fill("#queixaTexto", c.queixaTexto);
    for (const k of c.achados || []) await p.click(`[data-achado="${k}"]`);
    if (c.relato) await p.fill("#relatoLivre", c.relato);
    if (c.internet) await p.selectOption("#internet", c.internet);
    if (c.plano) await p.fill("#plano", c.plano);
    if (c.gpon) await p.fill("#gpon", c.gpon);
    if (c.acomp) await p.click(`[data-acomp="${c.acomp}"]`);
    if (c.responsavel) await p.fill("#responsavel", c.responsavel);
    await p.click("#generateBtn");
    const txt = await p.inputValue("#resultado");
    console.log(`\n===== Caso ${i + 1}: ${c.nome} =====\n${txt.split("Relatório da Ordem de Serviço\n\n")[1]}`);
  }
  await b.close();
})();
```

- [ ] **Step 2: Rodar e mostrar os textos ao técnico**

Run: `node $SP/real-cases.js`
Expected: 10 blocos `===== Caso N: … =====`, cada um com o relato gerado. Colar a saída na conversa para o técnico comparar com o que ele escreveria; anotar o que ele quiser mudar (frases, botões que faltam).

- [ ] **Step 3: Ajustes pedidos pelo técnico**

Se o técnico pedir mudança de frase ou de botão: alterar `QUEIXAS`/`ACHADOS`/HTML correspondente, rodar de novo `for t in t1 t2 t3 t4 t5 t6 t7 t8; do node $SP/check.js $t; done` (ajustando as frases esperadas em `t6`/`t7` se tiverem mudado) e commitar:

```bash
git add index.html app.js
git commit -m "Ajusta frases e botões da Dificuldade conforme revisão do técnico

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

Se ele aprovar sem mudanças, não há commit nesta tarefa.
