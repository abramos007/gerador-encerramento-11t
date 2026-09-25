# Etapa 3a — Preenchimento rápido: Dificuldade, modo de atendimento e planos

Data: 2026-09-24

## Contexto e objetivo

Continuação da melhoria do app (etapa 1 concluída na branch `etapa1-correcoes`; esta
etapa parte dela, na branch `etapa3-rapidez`). Análise de ~45 encerramentos reais
(ago–set/2026) mostrou que cerca de 60% dos atendimentos são "Dificuldade", tipo que o
app não tem (cai em "Outro", só texto livre). Atendimentos só por telefone ou recusados
pelo cliente também existem e o app hoje sempre escreve "atendimento técnico no
endereço do cliente". Objetivo: montar o relato dos casos mais comuns com toques, sem
digitar, respeitando as regras do técnico (não inventar dados, não registrar teste não
realizado, não registrar deslocamento em atendimento por telefone).

Restrições: HTML/CSS/JS puros, `app.js` único, sem build e sem framework de testes;
comportamento existente dos demais tipos não muda com modo "Presencial".

## Escopo

1. **Tipo "Dificuldade"** (`dificuldade`, título "Dificuldade")
   - Primeiro botão da grade de tipos e tipo selecionado ao abrir e ao "Limpar".
   - Mostra a seção `dificuldadeSection` e a seção de relato livre (`genericSection`).
   - Botões de achado que ligam/desligam (estado visual ativo, `aria-pressed`). Cada
     achado ligado acrescenta uma frase ao relato, sempre na ordem abaixo:
     | Botão | Frase |
     |---|---|
     | Conexão normal | A conexão da Coprel Telecom apresentou funcionamento normal durante o atendimento. |
     | Testes de navegação/streaming | Foram realizados testes de navegação e streaming. |
     | Sem quedas registradas | Não foram identificadas quedas registradas. |
     | IPTV de terceiros | O cliente utiliza IPTV de terceiros. Foi orientado a procurar o responsável pelo serviço caso a dificuldade persista somente no IPTV. |
     | Sky gato | Foi constatado que o cliente utiliza Sky gato por antena. O cliente foi orientado a buscar auxílio com o responsável pelo serviço de TV. |
     | Rede/equipamento particular | Foi constatada a utilização de equipamento/rede interna particular. |
     | Orientado a reiniciar | O cliente foi orientado a reiniciar o equipamento da Coprel Telecom caso o problema ocorra novamente. |
   - Frase de abertura (presencial): "Realizado atendimento técnico para verificação da
     dificuldade relatada pelo cliente."
   - Ordem do relato: abertura, achados ligados, relato livre (`relatoLivre`), observação
     adicional (`obs`). Nenhum achado é ligado por padrão. Achados são zerados no "Limpar".

2. **Modo de atendimento** — controle de 3 botões abaixo da grade de tipos, valor no
   campo oculto `modo`: `presencial` (padrão), `telefone`, `recusado`.
   - `presencial`: comportamento atual, sem alteração.
   - `telefone`: a descrição passa a ser: "Atendimento realizado somente por telefone."
     (sem menção a deslocamento ao local), seguida dos achados (se o tipo for
     Dificuldade), do relato livre e da observação. Linhas específicas de outros tipos
     (reparo, troca, etc.) são omitidas.
   - `recusado`: descrição: "O cliente dispensou o atendimento e não quis prosseguir.
     Testes técnicos: não realizados." seguida do relato livre e da observação (sem
     achados).
   - Em `telefone` e `recusado`: o bloco "Controle de equipamento" não é gerado, os
     campos de troca deixam de ser obrigatórios na validação, e `missingTechFields()`
     devolve lista vazia (sem alerta ao copiar).
   - "Limpar" volta para `presencial`.

3. **Plano e acompanhamento**
   - Botões (chips) que preenchem o campo `plano`: 200 Mbps, 300 Mbps, 400 Mbps,
     500 Mbps, 600 Mbps, Prime, Residencial Prime, Prime Gamer, Residencial Combo. O
     campo continua editável.
   - "Cliente acompanhou" abre com "Sim" selecionado, inclusive após "Limpar".

4. **Cache do PWA:** `CACHE` em `sw.js` passa para `encerramento-11t-v5`.

## Fora do escopo (etapa 3b)

Equipamento adicional (C Box) separado da troca; sinal GPON inicial/final; motivo
"Não confirmado" em trocas; tipos avulsos (sem acesso remoto, reset de UniFi, fibra
baixa/rompida). Também fora: colar relato livre para o app organizar (abordagem B).

## Verificação

Sem framework de testes; verificação automatizada em navegador headless com script
fora do repositório, mais conferência visual no celular pelo técnico. Casos:
- Ao abrir, "Dificuldade" está selecionado; ligar "Conexão normal" e "Sky gato" gera as
  duas frases nessa ordem depois da abertura; desligar remove a frase.
- Modo `telefone` não contém "no endereço" nem "deslocamento" no texto; `recusado`
  contém "Testes técnicos: não realizados."; ambos omitem "Controle de equipamento".
- Copiar em `telefone`/`recusado` com campos técnicos vazios não abre alerta.
- Presencial nos tipos existentes gera texto idêntico ao da etapa 1 (regressão).
- Chip de plano preenche `plano`; "Limpar" mantém acompanhou = Sim e modo = presencial.
- Console sem erros.
