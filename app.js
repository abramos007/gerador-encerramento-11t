const $ = (id) => document.getElementById(id);
const HISTORY_KEY = "coprel11t_history_v3";
const TROCAS_KEY = "coprel11t_trocas_v3";
const CONFIG_KEY = "coprel11t_config_v3";
const LIMITS = { history: 1000, trocas: 2000 };

const configs = {
  dificuldade: {
    title: "Dificuldade",
    show: ["dificuldadeSection", "genericSection"],
    hint: "Ligue só o que realmente ocorreu: cada botão vira uma frase do relato.",
  },
  upgrade: {
    title: "Upgrade de plano / Troca de equipamento",
    show: ["equipSection"],
    hint: "Troca exige modelo, quantidade, condição, equipamento instalado, quantidade e motivo.",
  },
  troca: {
    title: "Troca de equipamento",
    show: ["equipSection"],
    hint: "Preencha todos os campos obrigatórios do controle de equipamento.",
  },
  reparo: {
    title: "Reparo / Cliente offline",
    show: ["reparoSection"],
    hint: "Registre o que foi identificado, o que foi realizado e eventual pendência.",
  },
  wifi: {
    title: "Wi-Fi / Alcance / Lentidão",
    show: ["wifiSection"],
    hint: "Velocidade contratada não significa maior alcance. Registre rede/equipamento particular quando houver.",
  },
  telefonia: {
    title: "Telefonia fixa",
    show: ["telefoniaSection", "genericSection"],
    hint: "Número pode ser incluído quando informado.",
  },
  iptv: {
    title: "IPTV de terceiros",
    show: ["iptvSection", "genericSection"],
    hint: "IPTV de terceiros não deve ser usado como único parâmetro da internet.",
  },
  sky: {
    title: "Sky gato por antena",
    show: ["skySection", "genericSection"],
    hint: "Sky por antena não será descrito como IPTV.",
  },
  particular: {
    title: "Equipamento particular / Rede interna",
    show: ["wifiSection", "genericSection"],
    hint: "Não atribua defeito ao equipamento particular sem comprovação.",
  },
  ipv6: {
    title: "IPv6",
    show: ["ipv6Section", "genericSection"],
    hint: "Só serão registradas as ações marcadas no formulário.",
  },
  instalacao: {
    title: "Instalação",
    show: ["genericSection"],
    hint: "Descreva somente instalação/configuração/testes realmente realizados.",
  },
  pesquisa: {
    title: "Pesquisa de satisfação",
    show: ["genericSection"],
    hint: "O relatório identificará a origem em pesquisa de satisfação.",
  },
  camera: {
    title: "Instalação de câmera",
    show: ["cameraSection"],
    hint: "Modelo padrão disponível: Intelbras iM7 S Full Color.",
  },
  outro: {
    title: "Outro atendimento",
    show: ["genericSection"],
    hint: "Use relato livre sem inferir dados ausentes.",
  },
};

const dynamic = [
  "equipSection",
  "reparoSection",
  "wifiSection",
  "telefoniaSection",
  "iptvSection",
  "skySection",
  "ipv6Section",
  "cameraSection",
  "dificuldadeSection",
  "genericSection",
];
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
const MODO_HINTS = {
  presencial: "",
  telefone:
    "Não registra deslocamento ao local, acompanhamento dos testes nem material. Use o relato para descrever o contato.",
  recusado:
    "Registra que os testes técnicos não foram realizados. Só relato e observação entram; dados técnicos e material são ignorados.",
};
function applySections() {
  const type = v("tipo"),
    modo = v("modo");
  let show = configs[type].show || [];
  if (modo === "telefone")
    show =
      type === "dificuldade"
        ? ["dificuldadeSection", "genericSection"]
        : ["genericSection"];
  if (modo === "recusado") show = ["genericSection"];
  dynamic.forEach((id) => ($(id).hidden = !show.includes(id)));
}
function setModo(m) {
  $("modo").value = m;
  document
    .querySelectorAll("[data-modo]")
    .forEach((b) => b.classList.toggle("active", b.dataset.modo === m));
  $("modoHint").textContent = MODO_HINTS[m];
  applySections();
}
document
  .querySelectorAll("[data-modo]")
  .forEach((b) => b.addEventListener("click", () => setModo(b.dataset.modo)));
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
function setAcompanhou(val) {
  $("acompanhou").value = val;
  document.querySelectorAll("[data-acomp]").forEach((b) => {
    const on = b.dataset.acomp === val;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
document
  .querySelectorAll("[data-acomp]")
  .forEach((b) =>
    b.addEventListener("click", () =>
      setAcompanhou(
        $("acompanhou").value === b.dataset.acomp ? "na" : b.dataset.acomp,
      ),
    ),
  );
document
  .querySelectorAll("[data-plan]")
  .forEach((b) => (b.onclick = () => ($("plano").value = b.dataset.plan)));
function v(id) {
  return ($(id)?.value || "").trim();
}
function todayISO() {
  let d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function brDate(s) {
  if (!s) return "";
  let [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}
function sentence(s) {
  s = (s || "").trim();
  return !s ? "" : /[.!?]$/.test(s) ? s : s + ".";
}
function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveConfig() {
  localStorage.setItem(
    CONFIG_KEY,
    JSON.stringify({
      tecnico: v("tecnicoPadrao") || "Equipe 11T",
      empresa: v("empresaPadrao") || "Coprel Telecom",
      confirmBeforeCopy: $("confirmBeforeCopy").checked,
    }),
  );
  alert("Configurações salvas.");
}
function applyConfig() {
  let c = getConfig();
  $("tecnicoPadrao").value = c.tecnico || "Equipe 11T";
  $("empresaPadrao").value = c.empresa || "Coprel Telecom";
  $("confirmBeforeCopy").checked = c.confirmBeforeCopy !== false;
}

function switchTab(name) {
  document
    .querySelectorAll(".tab")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.toggle("active", p.id === `tab-${name}`));
  if (name === "historico") renderHistory();
  if (name === "trocas") renderTrocas();
}
document
  .querySelectorAll(".tab")
  .forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

function selectService(type) {
  $("tipo").value = type;
  document
    .querySelectorAll("#serviceGrid button")
    .forEach((b) => b.classList.toggle("active", b.dataset.service === type));
  applySections();
  $("tipoHint").textContent = configs[type].hint || "";
  updateEquipmentRule();
}
document
  .querySelectorAll("#serviceGrid button")
  .forEach((b) =>
    b.addEventListener("click", () => selectService(b.dataset.service)),
  );

function parseMK() {
  const raw = v("mkInput");
  if (!raw) return alert("Cole os dados da OS.");
  const lines = raw
    .split(/\r?\n/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const idx = lines.findIndex((l) => /\bOS\b/i.test(l) && /\d{3,}/.test(l));
  const osLine = idx >= 0 ? lines[idx] : "";
  const om = osLine.match(/\bOS\s*[-:]?\s*(\d+)/i),
    cm = osLine.match(/\bCOD(?:IGO)?\s*[-:]?\s*(\d+)/i);
  $("cliente").value = idx > 0 ? lines[idx - 1] : lines[0] || "";
  $("os").value = om ? om[1] : "";
  $("codigo").value = cm ? cm[1] : "";
  $("endereco").value =
    idx >= 0 ? lines.slice(idx + 1).join(" - ") : lines.slice(2).join(" - ");
}
async function pasteMK() {
  try {
    $("mkInput").value = await navigator.clipboard.readText();
    parseMK();
  } catch {
    alert("Cole manualmente no campo.");
  }
}
$("parseBtn").onclick = parseMK;
$("pasteBtn").onclick = pasteMK;

const presets = {
  v5x610: [
    "ONU Huawei V5",
    "Boa / funcionando",
    "Huawei X6-10 sem telefonia",
    "Atualização para tecnologia mais recente",
  ],
  l5x610: [
    "ONU Huawei L5 sem Wi-Fi",
    "Boa / funcionando",
    "Huawei X6-10 sem telefonia",
    "Atualização para tecnologia mais recente",
  ],
  parksx610: [
    "ONU Parks",
    "Não informada",
    "Huawei X6-10 sem telefonia",
    "Upgrade de plano / atualização tecnológica",
  ],
  x6x610: [
    "ONU Huawei X6 antiga",
    "Não informada",
    "Huawei X6-10 sem telefonia",
    "Atualização tecnológica",
  ],
  cbox: [
    "C Box K562",
    "Não informada",
    "C Box K562-E",
    "Oscilações/desconexões no C Box",
  ],
};
document.querySelectorAll("[data-preset]").forEach(
  (b) =>
    (b.onclick = () => {
      let p = presets[b.dataset.preset];
      $("equipRet").value = p[0];
      $("condicao").value = p[1];
      $("equipInst").value = p[2];
      $("motivoTroca").value = p[3];
      updateEquipmentRule();
    }),
);

function updateEquipmentRule() {
  if ($("equipSection").hidden) return;
  const ret = v("equipRet").toLowerCase(),
    cond = v("condicao").toLowerCase();
  if (ret.includes("huawei v5")) {
    if (!v("motivoTroca"))
      $("motivoTroca").value =
        cond.includes("defeito") || cond.includes("queimada")
          ? "Defeito"
          : "Atualização para tecnologia mais recente";
    $("equipRule").textContent =
      "Regra Huawei V5: atualização tecnológica é o padrão, salvo quando informado defeito, queima ou falha.";
  } else if (ret.includes("l5") || ret.includes("sem wi-fi")) {
    $("equipRule").textContent =
      "Huawei L5 / sem Wi‑Fi: mantenha exatamente o modelo informado; não converter automaticamente para V5.";
  } else {
    $("equipRule").textContent =
      "Mantenha exatamente modelo e característica informada, inclusive com/sem telefonia e com/sem FXS.";
  }
}
$("equipRet").oninput = updateEquipmentRule;
$("condicao").onchange = updateEquipmentRule;

document.querySelectorAll(".gpon-chip").forEach(
  (b) =>
    (b.onclick = () => {
      $("gpon").value = b.dataset.gpon;
    }),
);
document.querySelectorAll(".material-chip").forEach(
  (b) =>
    (b.onclick = () => {
      const cur = v("materiais");
      $("materiais").value = cur
        ? cur + "\n" + b.dataset.material
        : b.dataset.material;
    }),
);
document.querySelectorAll(".repair-chip").forEach(
  (b) =>
    (b.onclick = () => {
      const k = b.dataset.repair;
      if (k === "fast-interno") {
        $("problema").value = "conector FAST interno danificado";
        $("acao").value = "Foi refeito o conector FAST interno";
        addMaterial("1 conector FAST");
      }
      if (k === "fast-cto") {
        $("problema").value = "conector FAST na CTO com necessidade de reparo";
        $("acao").value = "Foi refeito o conector FAST na CTO";
        addMaterial("1 conector FAST");
      }
      if (k === "drop-rompido") {
        $("problema").value = "drop rompido";
        $("acao").value =
          "Foi realizada uma emenda no local e, após o reparo, a conexão foi normalizada";
      }
      if (k === "otdr") {
        $("otdr").value = "sim";
      }
    }),
);
function addMaterial(x) {
  const cur = v("materiais");
  $("materiais").value = cur ? cur + "\n" + x : x;
}

function validate() {
  let e = [];
  ["data", "cliente", "os", "endereco"].forEach((id) => {
    if (!v(id))
      e.push(
        { data: "Data", cliente: "Cliente", os: "OS", endereco: "Endereço" }[
          id
        ],
      );
  });
  if (v("modo") === "presencial" && ["upgrade", "troca"].includes(v("tipo"))) {
    [
      ["equipRet", "Equipamento retirado"],
      ["qtdRet", "Quantidade retirada"],
      ["condicao", "Condição"],
      ["equipInst", "Equipamento instalado"],
      ["qtdInst", "Quantidade instalada"],
      ["motivoTroca", "Motivo da troca"],
    ].forEach(([id, l]) => {
      if (!v(id)) e.push(l);
    });
  }
  const box = $("validation");
  if (e.length) {
    box.hidden = false;
    box.innerHTML =
      "<strong>Antes de gerar:</strong><br>" +
      e.map((x) => "• " + x).join("<br>");
    return false;
  }
  box.hidden = true;
  return true;
}

function description() {
  if (v("modo") !== "presencial") return remoteDescription(v("modo"));
  const t = v("tipo"),
    internet = v("internet"),
    lines = [];
  if (t === "upgrade")
    lines.push(
      "Realizado atendimento técnico no endereço do cliente para execução do upgrade de plano e substituição de equipamento.",
    );
  else if (t === "troca")
    lines.push(
      "Realizado atendimento técnico no endereço do cliente para substituição de equipamento.",
    );
  else if (t === "reparo") {
    lines.push(
      "Realizado atendimento técnico para diagnóstico e reparo da conexão do cliente.",
    );
    if (v("problema"))
      lines.push(`Foi identificado: ${sentence(v("problema"))}`);
    if (v("acao")) lines.push(sentence(v("acao")));
    if (v("otdr") === "sim")
      lines.push(
        v("otdrDist")
          ? `Foi utilizado OTDR, com evento/indicação a aproximadamente ${v("otdrDist")}.`
          : "Foi utilizado OTDR durante o atendimento.",
      );
    if (v("pendencia"))
      lines.push(`Pendência/encaminhamento: ${sentence(v("pendencia"))}`);
  } else if (t === "wifi") {
    lines.push(
      "Realizado atendimento técnico para verificação de desempenho, alcance Wi-Fi e/ou rede interna.",
    );
    if (v("wifiAchado")) lines.push(sentence(v("wifiAchado")));
    if (v("wifiOrientacao") === "sim")
      lines.push(
        "Foi explicado ao cliente que a velocidade contratada e o alcance do Wi-Fi são características distintas.",
      );
    if (v("equipParticular") === "sim" && internet === "sim")
      lines.push(
        "Foi constatada a utilização de equipamento/rede interna particular. A conexão da Coprel Telecom apresentou funcionamento normal durante os testes.",
      );
  } else if (t === "telefonia") {
    lines.push(
      "Realizado atendimento técnico para verificação do serviço de telefonia fixa.",
    );
    if (v("reconfigTel") === "sim")
      lines.push(
        "Foi realizada a reconfiguração do serviço de telefonia e, após o ajuste, foram realizados testes, confirmando a normalização.",
      );
    if (v("numeroTel")) lines.push(`Número informado: ${v("numeroTel")}.`);
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (t === "iptv") {
    lines.push(
      "Realizado atendimento técnico para verificação da conexão utilizada por IPTV de terceiros.",
    );
    if (v("outrosApps") === "sim")
      lines.push(
        "Foram realizados testes de navegação e em outros aplicativos.",
      );
    if (v("iptvSomente") === "sim" && internet === "sim")
      lines.push(
        "Não foram identificadas anormalidades na conexão. O cliente foi orientado de que, caso o problema persista somente no IPTV, deverá buscar auxílio com o responsável pelo serviço.",
      );
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (t === "sky") {
    lines.push("Foi constatado que o cliente utiliza Sky gato por antena.");
    if (internet === "sim")
      lines.push(
        "Foram realizados testes na conexão de internet, que apresentou funcionamento normal.",
      );
    lines.push(
      "O cliente foi orientado a buscar auxílio com o responsável pelo serviço de TV.",
    );
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (t === "particular") {
    lines.push(
      "Realizado atendimento técnico para verificação da conexão e da rede interna do cliente.",
    );
    if (v("wifiAchado")) lines.push(sentence(v("wifiAchado")));
    if (internet === "sim")
      lines.push(
        "A conexão da Coprel Telecom apresentou funcionamento normal durante os testes.",
      );
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (t === "ipv6") {
    lines.push(
      "Realizado atendimento técnico para análise de dificuldade de navegação/conectividade.",
    );
    if (v("ipv6Desat") === "sim")
      lines.push("Foi constatado que o IPv6 estava desativado na ONU.");
    if (v("ipv6Hab") === "sim")
      lines.push("Após a habilitação, foram realizados novos testes.");
    if (v("ipv6Hab") === "sim" && internet === "sim")
      lines.push("A navegação foi normalizada.");
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (t === "pesquisa") {
    lines.push(
      "Realizado atendimento em decorrência do retorno do cliente à pesquisa de satisfação.",
    );
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (t === "camera") {
    let q = v("cameraQtd") || "1",
      m = v("cameraModelo");
    lines.push(
      `Realizado atendimento para instalação de ${q} câmera${Number(q) > 1 ? "s" : ""}${m ? " " + m : ""}.`,
    );
    lines.push(
      "Foi realizada a instalação, configuração e testes de funcionamento.",
    );
    if (v("cameraOrient"))
      lines.push(`Foram fornecidas orientações sobre ${v("cameraOrient")}.`);
  } else if (t === "instalacao") {
    lines.push(
      "Realizado atendimento técnico para instalação e ativação dos serviços no endereço do cliente.",
    );
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (t === "dificuldade") {
    lines.push(
      "Realizado atendimento técnico para verificação da dificuldade relatada pelo cliente.",
    );
    if (queixaSentence()) lines.push(queixaSentence());
    lines.push(...achadoSentences());
    if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  } else if (v("relatoLivre")) lines.push(sentence(v("relatoLivre")));
  if (["upgrade", "troca"].includes(t))
    lines.push(
      `Foi retirado ${v("qtdRet")} ${v("equipRet")} e instalado ${v("qtdInst")} ${v("equipInst")}. Motivo da troca: ${v("motivoTroca")}.`,
    );
  if (v("obs")) lines.push(sentence(v("obs")));
  return lines.join("\n\n");
}

function techLines() {
  let a = [];
  if (v("internet") === "sim")
    a.push("- Internet funcionando normalmente: Sim");
  if (v("internet") === "nao")
    a.push("- Internet funcionando normalmente: Não");
  if (v("plano")) a.push("- Plano: " + v("plano"));
  if (v("gpon")) a.push("- Sinal GPON: " + v("gpon"));
  if (v("acompanhou") === "sim") a.push("- Cliente acompanhou os testes: Sim");
  if (v("acompanhou") === "nao") a.push("- Cliente acompanhou os testes: Não");
  if (v("acompanhou") === "responsavel" && v("responsavel"))
    a.push("- Cliente acompanhou os testes: " + v("responsavel"));
  if (v("acompanhou") === "nao" && v("responsavel"))
    a.push("- Responsável presente: " + v("responsavel"));
  return a;
}
function materialBlock() {
  let a = v("materiais")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return a.length
    ? `\n\nMaterial utilizado:\n\n${a.map((x) => "- " + x).join("\n")}`
    : "";
}
function equipBlock() {
  return v("modo") === "presencial" && ["upgrade", "troca"].includes(v("tipo"))
    ? `\n\nControle de equipamento:\n\n- Equipamento retirado: ${v("qtdRet")} ${v("equipRet")}\n- Condição: ${v("condicao")}\n- Equipamento instalado: ${v("qtdInst")} ${v("equipInst")}\n- Quantidade: ${v("qtdInst")}\n- Motivo da troca: ${v("motivoTroca")}`
    : "";
}

function generate() {
  if (!validate()) return;
  let cfg = getConfig(),
    codigo = v("codigo") ? `\nCódigo: ${v("codigo")}` : "",
    tech = techLines();
  if (v("modo") === "recusado") tech = [];
  if (v("modo") === "telefone")
    tech = tech.filter(
      (l) => !/Cliente acompanhou|Responsável presente/.test(l),
    );
  let r = `Relatório de Ordem de Serviço

Data do atendimento: ${brDate(v("data"))}
Cliente: ${v("cliente")}
OS: ${v("os")}${codigo}
Técnico responsável: ${cfg.tecnico || "Equipe 11T"}
Endereço: ${v("endereco")}
Tipo de serviço: ${configs[v("tipo")].title}

Relatório da Ordem de Serviço

${description()}`;
  if (tech.length) r += "\n\n" + tech.join("\n");
  if (v("modo") === "presencial") r += materialBlock();
  r += equipBlock();
  $("resultado").value = r.trim();
  $("copyStatus").textContent = "Texto gerado";
}
$("generateBtn").onclick = generate;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
function missingTechFields() {
  if (v("modo") !== "presencial") return [];
  const missing = [];
  if (v("internet") === "na") missing.push("Internet funcionando");
  if (!v("plano")) missing.push("Plano");
  if (!v("gpon")) missing.push("Sinal GPON");
  if (v("acompanhou") === "na") missing.push("Cliente acompanhou");
  return missing;
}
$("copyBtn").onclick = async () => {
  let t = v("resultado");
  if (!t) return alert("Gere o encerramento.");
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
  let ok = await copyText(t);
  $("copyStatus").textContent = ok
    ? "Copiado ✓"
    : "Selecione e copie manualmente";
};

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
      await navigator.share({
        files: [file],
        title: "Backup Encerramento 11T",
      });
      shared = true;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  if (!shared) downloadFile(file);
  try {
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ lastBackupAt: Date.now() }),
    );
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
function backupDue(now = Date.now()) {
  const last = Number(getBackupInfo().lastBackupAt) || 0;
  const pending = getStore(HISTORY_KEY)
    .map((x) => Number(x.id))
    .filter((id) => Number.isFinite(id) && id > last);
  return pending.length > 0 && now - Math.min(...pending) >= 7 * DAY_MS;
}
function renderBackupStatus() {
  const last = getBackupInfo().lastBackupAt;
  $("backupInfo").textContent = last
    ? "Último backup: " + formatDateTime(last)
    : "Nenhum backup ainda";
  $("backupBanner").hidden = !backupDue();
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
    navigator.storage
      .persist()
      .then(renderStorageStatus)
      .catch(() => {});
}
$("shareBackupBtn").onclick = shareBackup;
$("bannerBackupBtn").onclick = shareBackup;
function upsertRecord(list, record, limit, merge = true) {
  const others =
    merge && record.os
      ? list.filter((x) => !(x.os === record.os && x.data === record.data))
      : list;
  return [record, ...others].slice(0, limit);
}
function reportMatchesOs(report, os) {
  return report.split(/\r?\n/).some((l) => l.trim() === `OS: ${os}`);
}
$("saveBtn").onclick = () => {
  let r = v("resultado");
  if (!r) return alert("Gere o encerramento.");
  const merge = reportMatchesOs(r, v("os"));
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
  if (v("modo") === "presencial" && ["upgrade", "troca"].includes(v("tipo"))) {
    if (
      !setStore(
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
          LIMITS.trocas,
          merge,
        ),
      )
    )
      return;
  }
  $("copyStatus").textContent = "Salvo ✓";
  requestPersist();
  renderBackupStatus();
};

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}
function renderHistory() {
  let q = v("historySearch").toLowerCase(),
    a = getStore(HISTORY_KEY).filter(
      (x) =>
        !q ||
        `${x.cliente} ${x.os} ${x.data} ${x.tipo}`.toLowerCase().includes(q),
    ),
    el = $("historyList");
  el.innerHTML = a.length
    ? a
        .map(
          (x) =>
            `<div class="history-item"><strong>${esc(x.cliente)}</strong><div class="history-meta"><span>OS ${esc(x.os)}</span><span>${esc(x.data)}</span></div><div class="hint">${esc(x.tipo)}</div><div class="history-actions"><button class="ghost" data-action="open" data-id="${esc(x.id)}">Abrir</button><button class="ghost" data-action="copy" data-id="${esc(x.id)}">Copiar</button><button class="ghost" data-action="del" data-id="${esc(x.id)}">Excluir</button></div></div>`,
        )
        .join("")
    : '<div class="empty">Nenhum registro encontrado.</div>';
}
$("historySearch").oninput = renderHistory;
function openHist(id) {
  let x = getStore(HISTORY_KEY).find((x) => x.id === id);
  if (x) {
    $("resultado").value = x.report;
    switchTab("nova");
    setTimeout(() => $("resultado").scrollIntoView({ behavior: "smooth" }), 50);
  }
}
async function copyHist(id) {
  let x = getStore(HISTORY_KEY).find((x) => x.id === id);
  if (x) await copyText(x.report);
}
function delHist(id) {
  setStore(
    HISTORY_KEY,
    getStore(HISTORY_KEY).filter((x) => x.id !== id),
  );
  renderHistory();
}
$("clearHistoryBtn").onclick = () => {
  if (confirm("Excluir todo o histórico?")) {
    setStore(HISTORY_KEY, []);
    renderHistory();
  }
};

function renderTrocas() {
  let a = getStore(TROCAS_KEY),
    el = $("trocasList");
  $("trocasCount").textContent = a.length ? `(${a.length})` : "";
  el.innerHTML = a.length
    ? a
        .map(
          (x) =>
            `<div class="history-item"><strong>${esc(x.cliente)}</strong><div class="history-meta"><span>OS ${esc(x.os)}</span><span>${esc(x.data)}</span></div><div class="hint">Saiu: ${esc(x.ret)}<br>Condição: ${esc(x.cond)}<br>Entrou: ${esc(x.inst)}<br>Motivo: ${esc(x.motivo)}</div><div class="history-actions"><button class="ghost" data-action="del" data-id="${esc(x.id)}">Excluir</button></div></div>`,
        )
        .join("")
    : '<div class="empty">Nenhuma troca salva.</div>';
}
function delTroca(id) {
  if (!confirm("Excluir esta troca?")) return;
  setStore(
    TROCAS_KEY,
    getStore(TROCAS_KEY).filter((x) => x.id !== id),
  );
  renderTrocas();
}
function listAction(e, handlers) {
  const b = e.target.closest("button[data-action]");
  if (b && handlers[b.dataset.action])
    handlers[b.dataset.action](Number(b.dataset.id));
}
$("historyList").addEventListener("click", (e) =>
  listAction(e, { open: openHist, copy: copyHist, del: delHist }),
);
$("trocasList").addEventListener("click", (e) =>
  listAction(e, { del: delTroca }),
);
$("exportTrocasBtn").onclick = () => {
  let a = getStore(TROCAS_KEY);
  if (!a.length) return alert("Nenhuma troca salva.");
  let rows = [
    [
      "Data",
      "Cliente",
      "OS",
      "Equipamento retirado",
      "Condição",
      "Equipamento instalado",
      "Quantidade",
      "Motivo",
    ],
    ...a.map((x) => [
      x.data,
      x.cliente,
      x.os,
      x.ret,
      x.cond,
      x.inst,
      x.qtd,
      x.motivo,
    ]),
  ];
  let csv = rows
    .map((r) =>
      r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"),
    )
    .join("\n");
  let blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    url = URL.createObjectURL(blob),
    ael = document.createElement("a");
  ael.href = url;
  ael.download = "trocas-equipe-11t.csv";
  ael.click();
  URL.revokeObjectURL(url);
};

function clearForm() {
  document
    .querySelectorAll("#tab-nova input,#tab-nova textarea")
    .forEach((el) => {
      if (
        [
          "data",
          "qtdRet",
          "qtdInst",
          "cameraQtd",
          "cameraModelo",
          "tipo",
          "modo",
          "acompanhou",
        ].includes(el.id)
      )
        return;
      el.value = "";
    });
  document
    .querySelectorAll("#tab-nova select")
    .forEach((el) => (el.selectedIndex = 0));
  $("data").value = todayISO();
  $("qtdRet").value = "1";
  $("qtdInst").value = "1";
  $("cameraQtd").value = "1";
  $("cameraModelo").value = "Intelbras iM7 S Full Color";
  $("resultado").value = "";
  $("copyStatus").textContent = "";
  $("validation").hidden = true;
  resetToggles();
  setModo("presencial");
  setAcompanhou("na");
  selectService("dificuldade");
}
$("clearBtn").onclick = clearForm;
$("saveConfigBtn").onclick = saveConfig;

applyConfig();
$("data").value = todayISO();
setModo("presencial");
setAcompanhou("na");
selectService("dificuldade");
renderHistory();
renderTrocas();
renderBackupStatus();
renderStorageStatus();
if ("serviceWorker" in navigator)
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js"),
  );
