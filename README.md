# Gerador de Encerramento 11T

MVP em HTML/CSS/JavaScript, sem backend.

## Como testar no PC
Abra a pasta em um servidor local. Exemplos:

### VS Code
Use a extensão Live Server e abra `index.html`.

### Python
No terminal, dentro da pasta:

```bash
python -m http.server 8080
```

Acesse:
http://localhost:8080

## Como usar no celular
Hospede os arquivos em GitHub Pages, Netlify, Vercel ou outro serviço estático.
Depois abra no Chrome do Android e escolha "Adicionar à tela inicial".

## Funções atuais
- Cola os dados copiados do MK
- Extrai cliente, OS, código e endereço
- Tipos de atendimento predefinidos
- Campos técnicos
- Geração automática do relatório
- Botão para copiar o encerramento
- PWA com cache offline

## Próximas melhorias sugeridas
- Salvar presets de equipamentos
- Histórico local dos últimos encerramentos
- Botões rápidos para GPON
- Campos específicos para cada tipo de serviço
- Importação de texto via compartilhamento do Android
