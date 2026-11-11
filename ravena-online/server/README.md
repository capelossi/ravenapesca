# Servidor de zona — fundação de simulação

**Status: protótipo lógico, não é um servidor MMORPG online nem um serviço implantável.** Este diretório contém apenas a simulação de posição e filtro espacial para futura integração.

## Objetivo

Separar a lógica autoritativa de zonas do navegador. O cliente informa um destino desejado, mas o servidor calcula o deslocamento permitido por tick e retorna somente jogadores relevantes para cada observador.

`zone-engine.mjs` exporta `createZone({world,maxPlayers,speed,visibility,cellSize})` com `join`, `leave`, `queueMove`, `tick`, `state`, `snapshot` e `size`. Não importa Babylon.js, não depende de DOM ou WebSocket.

## Testes

Node.js 22 ou superior:

```sh
node --test ravena-online/server/zone-engine.test.mjs
```

Ou execute o teste de validação estática:

```sh
node ravena-online/check.mjs
```

## Próximas etapas de infraestrutura

1. Adicionar gateway WSS com autenticação real, tickets de sessão e gestão segura de credenciais. Nunca usar o ID passado livremente pelo navegador como autenticação.
2. Validar colisões e navegação com geometria de servidor/NavMesh (este simulador valida apenas limites e velocidade).
3. Fazer reconciliação de posição entre cliente e servidor, interpolação, previsão controlada e telemetria.
4. Implementar transferência de zonas e descoberta de servidores, persistência PostgreSQL e migração de esquemas.
5. Implementar inventário, combate e comércio autoritativos e transacionais. Não confiar em dano, moedas, XP, loot ou itens enviados pelo cliente.
6. Testar performance e escala real com conexões simultâneas e carga de rede.

O sistema não escuta em nenhuma porta, não aceita conexões e não modifica o estado online do jogo. A interface continuará exibindo **Modo Solo** até existir infraestrutura autenticada e integrada.
