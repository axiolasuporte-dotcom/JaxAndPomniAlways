# Discord Moderation Bot

## Overview
Bot de moderação do Discord com sistema avançado de segurança, gerenciamento de whitelist e painel interativo.

## Owner
- **Nome:** axiola
- **ID:** 1467666380932251720
- Todas as verificações de owner são feitas por ID, não por cargo.

## Comandos Disponíveis

### Comandos Públicos
- `/test` - Verificar status do bot
- `/invite` - Link de convite do bot
- `/blame` - Culpar alguém aleatoriamente
- `/say` - Fazer o bot dizer algo
- `/gping` - Ghost ping alguém

### Comandos Owner Only
- `/whitelist add <id>` - Adicionar usuário à whitelist
- `/whitelist remove <id>` - Remover usuário da whitelist
- `/whitelist list` - Listar usuários na whitelist
- `/panel` - Painel de controle interativo
- `/edit` - Configurar nome, avatar, status e staff do bot
- `/security` - Sistema de segurança (anti-raid, anti-spam, proteção contra bots)
- `/config` - Configurações avançadas

## Sistema de Segurança

### Anti-Raid
- Detecta entrada em massa de membros
- Ativa lockdown automaticamente
- Configurável: limite de membros/minuto

### Anti-Spam
- Detecta mensagens repetidas
- Detecta uso excessivo de @everyone/@here
- Sistema de avisos progressivos
- Auto-mute após X avisos

### Proteção contra Bots
- Monitora adição de novos bots
- Detecta comportamento malicioso (deleção de canais)
- Bane automaticamente bots maliciosos
- Revoga permissões de quem adicionou o bot malicioso

### Lockdown
- Ativação manual ou automática
- Bloqueia canais durante ataques

## Estrutura do Projeto

```
bot/
├── index.js           # Entrada principal
├── commands/          # Comandos slash
│   ├── whitelist.js
│   ├── panel.js
│   ├── edit.js
│   ├── security.js
│   └── ...
├── events/            # Eventos do Discord
│   ├── interactionCreate.js
│   ├── messageCreate.js    # Anti-spam
│   ├── channelDelete.js    # Detecção de ataques
│   ├── guildBotAdd.js      # Monitoramento de bots
│   └── ...
├── utils/             # Utilitários
│   ├── config.js
│   ├── owner.js
│   ├── whitelist.js
│   └── ...
└── data/              # Dados persistentes
    ├── config.json
    └── whitelist.json
```

## Variáveis de Ambiente

- `DISCORD_TOKEN` - Token do bot Discord
- `CLIENT_ID` - ID do aplicativo Discord

## Como Iniciar

```bash
node index.js
```

## Data de Atualização
27/01/2026
