# Pasta de Textos para Flood

Esta pasta contém os arquivos `.txt` que o bot usará para enviar mensagens.

## Como usar:

1. Adicione arquivos `.txt` nesta pasta (`data/flood_texts/`)
2. Cada arquivo pode conter qualquer texto (até 2000 caracteres)
3. O bot escolherá um arquivo aleatório a cada mensagem
4. Você pode usar `@everyone`, `@here` ou mencionar cargos como `<@&ID_DO_CARGO>`

## Exemplo:

Crie um arquivo `mensagem1.txt`:
```
Seu texto aqui
@everyone Mensagem importante!
```

Crie outro arquivo `mensagem2.txt`:
```
Outro texto diferente
<@&123456789> Ping no cargo
```

O bot lerá aleatoriamente de qualquer arquivo `.txt` nesta pasta.
