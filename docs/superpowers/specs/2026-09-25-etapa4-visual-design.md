# Etapa 4 — Aparência própria para celular, sem marca

Data: 2026-09-25

## Contexto e objetivo

O app ainda carrega a identidade da Coprel Telecom (logo, título, nome no manifest) e um
layout de página web: faixa grande no topo, abas no alto, relatório no fim de uma página
longa. Objetivo: aparência própria, pensada para usar com uma mão no celular, sem logo e
sem nome da empresa na interface.

Decisões do técnico (tomadas com maquetes):
- Tema **escuro** (grafite + âmbar) como padrão, com botão de **modo sol** (claro de alto
  contraste) no topo.
- Esqueleto aprovado: menu embaixo, botão principal fixo, cartão da OS que recolhe, tipos
  mais usados à vista com "+ Mais", relatório em folha que sobe por cima.
- Ícone **C · Fibra**.
- O **texto dos relatórios continua igual**, inclusive "Coprel Telecom" nas frases.

Esta etapa vem depois da etapa 2 (backup) e estiliza também os elementos criados nela.

## Restrições

- HTML/CSS/JS puros, `app.js` único, sem build, sem dependências, sem fontes externas
  (fonte do sistema), funcionando offline.
- Chaves de armazenamento inalteradas (`coprel11t_…`); o usuário nunca as vê.
- Texto gerado dos relatórios **idêntico** ao atual (regressão coberta por teste).
- Comportamento dos campos e regras (etapas 1, 2 e 3a) inalterado; muda a apresentação.
- Sem rolagem horizontal em telas de 360 px (corrige também o excesso de 6 px herdado).

## Escopo

### 1. Remover a marca da interface

- Remover `coprel-telecom-logo.png` do repositório, do HTML e do `ASSETS` do `sw.js`.
- Título da página e do manifest: **"Encerramento 11T"** (`name` e `short_name`).
  Descrição do manifest: "Gerador de encerramentos de OS, offline."
- Remover o campo "Empresa" de Configurações (não é usado em nenhum texto). O valor salvo
  antigo em `coprel11t_config_v3.empresa` é simplesmente ignorado.
- Remover o selo "Equipe 11T", o selo "Offline" e o bloco de abertura ("Base
  Operacional / Gerador de Encerramento").
- As frases dos relatórios que citam "Coprel Telecom" **não mudam**.

### 2. Temas

Tokens CSS em `:root`, trocados por `[data-theme="sol"]` no `<html>`:

| Papel | Escuro (padrão) | Modo sol |
|---|---|---|
| Fundo | `#121417` | `#ffffff` |
| Superfície (cartão) | `#1d2126` | `#ffffff` com borda 2 px `#0b0b0b` |
| Superfície 2 (campo, segmentado) | `#262b31` | `#ffffff` com borda 2 px `#9aa0a8` |
| Chip desligado | `#2a2f36` / texto `#d6dae0` | borda 2 px `#0b0b0b` / texto `#0b0b0b` |
| Texto | `#e8eaee` | `#0b0b0b` |
| Texto secundário | `#9aa3b0` | `#5b6068` |
| Acento (chip ligado, botão principal, aba ativa) | `#f5a524`, texto `#1a1300` | `#b45309`, texto `#ffffff`; botão principal `#0b0b0b` |
| Perigo | `#ff6b6b` | `#b3261e` |

- Botão ☀ (no escuro) / ☾ (no modo sol) no canto direito da barra do topo, com
  `aria-label` "Ativar modo sol" / "Ativar tema escuro".
- A escolha fica em `localStorage` na chave `coprel11t_theme` (`"escuro"` | `"sol"`),
  lida e gravada com `try/catch`; sem valor, usa escuro. É aplicada antes da primeira
  pintura (script curto no `<head>`) para não piscar.
- `<meta name="theme-color">` acompanha o tema (`#121417` / `#ffffff`).
- Contraste: todo par texto/fundo listado acima atinge pelo menos 4,5:1.

### 3. Esqueleto

- **Barra do topo** fixa: título da aba atual ("Nova OS", "Histórico", "Trocas",
  "Ajustes") à esquerda e botão de tema à direita.
- **Menu inferior** fixo com 4 abas (Nova OS, Histórico, Trocas, Ajustes), ícone SVG em
  linha + rótulo, área de toque de pelo menos 48 px de altura, respeitando
  `env(safe-area-inset-bottom)`. A aba "Configurações" passa a se chamar **"Ajustes"**.
- **Botão "Gerar encerramento"** fixo acima do menu, só na aba Nova OS; o conteúdo tem
  margem inferior suficiente para nada ficar escondido atrás dele.
- Cartões com cantos de 14 px, sem numeração nos títulos ("Dados da OS", "Tipo",
  "Queixa", "Constatado"…). Entradas com fonte de 16 px (evita zoom automático).
- Alvos de toque de pelo menos 44 × 44 px em chips, segmentados e botões.

### 4. Cartão da OS que recolhe

- Contém: colar do MK, "Identificar dados", data, OS, cliente, código e endereço.
- Recolhe automaticamente depois de "Identificar dados" quando OS e cliente ficam
  preenchidos; recolhido, mostra uma linha "OS <número> · <cliente> ▾" e o endereço.
- Tocar no cartão recolhido expande. "Limpar" expande e esvazia.
- Se "Gerar" falhar por campo obrigatório da OS, o cartão expande sozinho.

### 5. Tipos com "+ Mais"

- Sempre visíveis: **Dificuldade, Reparo / Offline, Troca, Upgrade, Instalação**.
- Botão "+ Mais" mostra os demais (Wi-Fi / Lentidão, Telefonia, IPTV terceiros, Sky por
  antena, Rede particular, IPv6, Pesquisa, Câmera, Outro) e vira "− Menos".
- Se o tipo selecionado estiver entre os escondidos, ele continua visível mesmo recolhido.

### 6. Relatório em folha

- "Gerar encerramento" com sucesso abre uma folha que sobe de baixo (altura ~80% da
  tela) sobre um fundo escurecido. Ela contém o relatório editável, **Copiar** (botão
  principal) e **Salvar**, e o status ("Copiado ✓", "Salvo ✓").
- Fecha ao tocar no fundo escurecido, no puxador, ou com o botão Voltar do Android
  (`history.pushState` ao abrir, `popstate` fecha). O foco volta ao botão Gerar.
- "Abrir" no Histórico mostra o relatório na mesma folha.
- Comportamentos de Copiar/Salvar (alerta de campos faltando, proteção contra
  sobrescrever outra OS) inalterados.

### 7. Lembrete e card de backup (da etapa 2)

- Lembrete: faixa âmbar escura no topo da Nova OS (modo sol: borda âmbar), texto curto
  "7 dias sem backup" + botão "Fazer backup".
- Card "Backup" nos Ajustes segue o padrão dos demais cartões.

### 8. Ícones

- Ícone **C · Fibra**: fundo `#121417`, curva de fibra âmbar `#f5a524` terminando num ponto
  de luz, traço cinza `#9aa3b0` abaixo (desenho aprovado na maquete).
- Arquivos gerados a partir de um `icon.svg` versionado: `icon-192.png`, `icon-512.png`
  (`purpose: "any"`) e `icon-maskable-512.png` (`purpose: "maskable"`, desenho dentro da
  zona segura de 80%). Também `apple-touch-icon` (180 px) e favicon SVG.
- Manifest: `icons` com os três PNGs, `background_color` e `theme_color` `#121417`.
- `sw.js`: `ASSETS` com os ícones novos; `CACHE` passa para `encerramento-11t-v7`.

## Fora do escopo

Mudanças no texto dos relatórios; novos campos ou regras; animações além da subida da
folha (respeitando `prefers-reduced-motion`); publicação em loja/APK.

## Verificação

- Todos os testes existentes (etapas 1, 2 e 3a) passam, ajustados só nos seletores que
  mudarem de lugar; o texto gerado é comparado byte a byte com a referência.
- Novos casos: tema padrão escuro; botão alterna para sol e a escolha sobrevive a recarregar;
  `theme-color` acompanha; menu inferior troca de aba e o título do topo muda; "Gerar" abre a
  folha, fundo/puxador/Voltar fecham; "Abrir" do histórico usa a folha; cartão da OS recolhe
  após identificar e expande ao tocar e em erro de validação; "+ Mais" mostra/esconde e o tipo
  escondido selecionado continua visível; nenhuma referência a "coprel-telecom-logo" ou
  "Coprel" na interface (exceto no texto gerado); sem rolagem horizontal a 360 px nas 4 abas e
  nos dois temas; manifest com os 3 ícones e arquivos existentes.
- Capturas de tela a 360 px nas 4 abas, nos dois temas, com a folha aberta, para o técnico
  aprovar antes do merge.
