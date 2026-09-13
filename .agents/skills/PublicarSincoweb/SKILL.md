---
name: PublicarSincoweb
description: Instruções e procedimentos corretos para compilar o Frontend e publicar o sistema Sincoweb no ambiente de produção oficial (Easypanel).
---

# Skill: PublicarSincoweb

## Contexto de Deploy e Produção
O sistema Sincoweb possui uma arquitetura de deploy dividida em dois repositórios no GitHub e um ambiente de produção no **Easypanel** (servidor no IP 85.31.60.68).

**NUNCA** considere o deploy como concluído apenas fazendo `git push` no repositório local principal. O Easypanel do Sincoweb consome os arquivos e pacotes já compilados (pasta `dist` convertida e `src`) a partir de um repositório secundário (chamado `publicarsincoweb`), através da pasta `PublicacaoSite`.

## Regras e Procedimento Oficial
Para realizar a publicação da versão atual do Sincoweb para o servidor de produção real, execute **EXATAMENTE** os passos abaixo.

### 1. Garanta que as mudanças locais estão salvas
Certifique-se de que os arquivos do Frontend (`frontend/src/...`) e Backend (`src/server.js`, etc) foram devidamente salvos. 

### 2. Execute o script de Build e Deploy
Existe um script PowerShell na raiz do projeto preparado para fazer todo o empacotamento. Ele:
- Roda `npm run build` no Frontend (Vite).
- Copia os arquivos pré-compilados e minificados para a pasta raiz obrigatória `PublicacaoSite`.
- Copia o backend para a mesma pasta.
- Realiza os commits de deploy e envia (`git push`) para a branch `main` nos DOIS repositórios (`origin` e `deployrepo`).
- Dispara um webhook via `Invoke-WebRequest` diretamente para o Easypanel (85.31.60.68), que inicia automaticamente a substituição dos containeres.

**Comando para rodar:**
Execute isso através da ferramenta `run_command` na raiz do seu workspace (`c:\SincoWeb\SINCO-WEB\SINCO-WEB`):
\`\`\`powershell
powershell .\build_deploy.ps1
\`\`\`

### 3. Validação
Aguarde a conclusão do script (a tarefa passará por log de compilação do Vite e mostrará a mensagem de *Deploy acionado com sucesso no Easypanel!*).
Informe o usuário que o Deploy foi realizado e que o webhook foi disparado. Peça para o usuário aguardar entre 1 a 2 minutos e usar `Ctrl + F5` na página web para receber a nova versão de produção.
