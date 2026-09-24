# Gerador de Encerramento 11T — Versão Operacional v2

Aplicação PWA baseada na Base Operacional de Encerramentos da Equipe 11T.

## Principais recursos
- Cola e interpreta dados copiados do MK.
- Campos dinâmicos conforme o tipo de atendimento.
- Validação obrigatória em trocas de equipamento.
- Regra específica para Huawei V5.
- Tratamento separado para IPTV de terceiros e Sky gato por antena.
- Campos para GPON, plano, acompanhamento, materiais, OTDR e pendências.
- Geração do relatório no padrão "Relatório de Ordem de Serviço".
- Histórico local dos últimos encerramentos.
- Funciona offline após o primeiro carregamento.

## Atualizar no GitHub Pages pelo Termux

```bash
cd ~/storage/downloads
unzip -o gerador-encerramento-11t-v2-operacional.zip -d ~/projetos/gerador-encerramento-11t
cd ~/projetos/gerador-encerramento-11t
git add .
git commit -m "Atualiza gerador para versão operacional v2"
git push
```

O app não inventa dados técnicos ausentes. Em troca de equipamento, bloqueia a geração quando faltam campos obrigatórios.
