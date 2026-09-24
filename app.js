const $ = (id) => document.getElementById(id);

const fields = [
  "cliente","os","codigo","endereco","equipAntigo","equipNovo",
  "plano","gpon","responsavel","obs","mkInput","resultado"
];

function normalizeLine(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function parseMK() {
  const raw = $("mkInput").value.trim();
  if (!raw) {
    alert("Cole os dados da OS antes de identificar.");
    return;
  }

  const lines = raw.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const osLineIndex = lines.findIndex(l => /\bOS\b/i.test(l) && /\d{3,}/.test(l));
  const osLine = osLineIndex >= 0 ? lines[osLineIndex] : "";

  const osMatch = osLine.match(/\bOS\s*[-:]?\s*(\d+)/i);
  const codMatch = osLine.match(/\bCOD(?:IGO)?\s*[-:]?\s*(\d+)/i);

  let cliente = "";
  if (osLineIndex > 0) {
    cliente = lines[osLineIndex - 1];
  } else {
    cliente = lines[0] || "";
  }

  let endereco = "";
  if (osLineIndex >= 0 && lines.length > osLineIndex + 1) {
    endereco = lines.slice(osLineIndex + 1).join(" - ");
  } else if (lines.length >= 3) {
    endereco = lines.slice(2).join(" - ");
  }

  $("cliente").value = cliente;
  $("os").value = osMatch ? osMatch[1] : "";
  $("codigo").value = codMatch ? codMatch[1] : "";
  $("endereco").value = endereco;

  if (!$("os").value) {
    alert("Não consegui identificar o número da OS. Você pode preencher manualmente.");
  }
}

function todayBR() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function yesNo(v) {
  return v === "sim" ? "Sim" : "Não";
}

function serviceTitle(tipo) {
  const map = {
    upgrade: "Upgrade de plano / Troca de equipamento",
    troca: "Troca de equipamento",
    reparo: "Reparo / Cliente offline",
    wifi: "Suporte Wi-Fi / Lentidão",
    instalacao: "Instalação",
    telefonia: "Telefonia",
    iptv: "IPTV / Equipamento de terceiros",
    dificuldade: "Dificuldade / Sem falha de internet"
  };
  return map[tipo] || "Atendimento técnico";
}

function paragraphFor(tipo, d) {
  const oldEq = d.equipAntigo ? ` do equipamento ${d.equipAntigo}` : " do equipamento anterior";
  const newEq = d.equipNovo ? ` por ${d.equipNovo}` : " por equipamento compatível";

  switch (tipo) {
    case "upgrade":
      return `Realizado atendimento técnico no endereço do cliente para execução do upgrade de plano. Durante o atendimento, foi realizada a substituição${oldEq}${newEq}${d.telefonia === "sim" ? " com telefonia" : ""}, compatível com o novo plano contratado.`;
    case "troca":
      return `Realizado atendimento técnico no endereço do cliente para substituição de equipamento. Foi efetuada a troca${oldEq}${newEq}, seguida das configurações e validações necessárias.`;
    case "reparo":
      return `Realizado atendimento técnico para diagnóstico e reparo da conexão do cliente. Após identificação da causa do problema, foram efetuados os ajustes necessários para restabelecimento do serviço.`;
    case "wifi":
      return `Realizado atendimento técnico para verificação de desempenho e cobertura Wi-Fi. Foram realizados testes de conectividade, navegação e velocidade, além das verificações e ajustes necessários no equipamento.`;
    case "instalacao":
      return `Realizado atendimento técnico para instalação e ativação dos serviços no endereço do cliente. Foram efetuadas as configurações do equipamento e os testes necessários para validação do funcionamento.`;
    case "telefonia":
      return `Realizado atendimento técnico para verificação do serviço de telefonia. Foram realizadas as configurações e os testes necessários para validação do funcionamento da linha.`;
    case "iptv":
      return `Realizado atendimento técnico para verificação da conexão utilizada pelo serviço de IPTV/equipamento de terceiros. A conexão de internet foi testada e validada durante o atendimento.`;
    case "dificuldade":
      return `Realizado atendimento técnico para análise da dificuldade relatada pelo cliente. Durante os testes não foram identificadas falhas na conexão de internet, sendo realizadas as verificações necessárias no local.`;
    default:
      return `Realizado atendimento técnico no endereço do cliente, com execução dos procedimentos necessários e testes de funcionamento dos serviços.`;
  }
}

function closingParagraph(tipo, d) {
  const parts = ["Após o atendimento, foram realizados testes de conectividade, navegação e velocidade"];
  if (d.gpon) parts.push("verificação dos parâmetros da fibra óptica");
  if (d.telefonia !== "na") parts.push("testes de funcionamento da telefonia");

  const joined = parts.length === 1
    ? parts[0]
    : parts.slice(0, -1).join(", ") + " e " + parts[parts.length - 1];

  const status = d.internet === "sim"
    ? "confirmando que os serviços ficaram operando normalmente."
    : "sendo constatado que a conexão ainda apresenta indisponibilidade ou necessidade de continuidade no atendimento.";

  return `${joined}, ${status}`;
}

function generateReport() {
  const d = {
    cliente: $("cliente").value.trim(),
    os: $("os").value.trim(),
    codigo: $("codigo").value.trim(),
    endereco: $("endereco").value.trim(),
    tipo: $("tipo").value,
    equipAntigo: $("equipAntigo").value.trim(),
    equipNovo: $("equipNovo").value.trim(),
    plano: $("plano").value.trim(),
    gpon: $("gpon").value.trim(),
    telefonia: $("telefonia").value,
    internet: $("internet").value,
    acompanhou: $("acompanhou").value,
    responsavel: $("responsavel").value.trim() || "Cliente",
    obs: $("obs").value.trim()
  };

  const info = [];
  info.push(`- Internet restabelecida/operando: ${yesNo(d.internet)}`);
  if (d.plano) info.push(`- Plano contratado: ${d.plano}`);
  if (d.gpon) info.push(`- Potência óptica (GPON): ${d.gpon}`);
  if (d.telefonia !== "na") info.push(`- Telefonia: ${d.telefonia === "sim" ? "Funcionando" : "Com problema"}`);
  info.push(`- Cliente acompanhou os testes: ${yesNo(d.acompanhou)}`);
  info.push(`- Responsável presente: ${d.responsavel}`);
  if (d.obs) info.push(`- Observação: ${d.obs}`);

  const codigoTxt = d.codigo ? `\nCódigo: ${d.codigo}` : "";

  const report = `Data do atendimento: ${todayBR()}
Cliente: ${d.cliente || "-"}
OS: ${d.os || "-"}${codigoTxt}
Técnico responsável: Equipe 11T
Endereço: ${d.endereco || "-"}

Tipo de serviço: ${serviceTitle(d.tipo)}

Relatório da Ordem de Serviço

${paragraphFor(d.tipo, d)}

${closingParagraph(d.tipo, d)}

Informações técnicas:

${info.join("\n")}`;

  $("resultado").value = report;
  $("copyStatus").textContent = "Texto gerado";
}

async function copyResult() {
  const text = $("resultado").value.trim();
  if (!text) {
    alert("Gere o encerramento primeiro.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    $("copyStatus").textContent = "Copiado ✓";
  } catch {
    $("resultado").select();
    document.execCommand("copy");
    $("copyStatus").textContent = "Copiado ✓";
  }
}

function clearForm() {
  $("mkInput").value = "";
  $("cliente").value = "";
  $("os").value = "";
  $("codigo").value = "";
  $("endereco").value = "";
  $("equipAntigo").value = "";
  $("equipNovo").value = "";
  $("plano").value = "";
  $("gpon").value = "";
  $("telefonia").value = "na";
  $("internet").value = "sim";
  $("acompanhou").value = "sim";
  $("responsavel").value = "Cliente";
  $("obs").value = "";
  $("resultado").value = "";
  $("copyStatus").textContent = "";
}

$("parseBtn").addEventListener("click", parseMK);
$("generateBtn").addEventListener("click", generateReport);
$("copyBtn").addEventListener("click", copyResult);
$("clearBtn").addEventListener("click", clearForm);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
