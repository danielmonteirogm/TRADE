# TraderDesk

Plataforma web para administrar ganhos e perdas de day trade: diário de operações, dashboard de performance, análises, calculadora de risco, metas e checklist de disciplina.

Todos os dados ficam salvos localmente no navegador (localStorage) — nada é enviado para servidor.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Funcionalidades

- **Dashboard**: saldo, P&L líquido, win rate, profit factor, expectância, drawdown máximo, sequência de vitórias/derrotas, curva de capital e calendário de P&L diário.
- **Operações**: diário de trades (CRUD) com ativo, lado, horários, preços, taxas, estratégia, setup, emoção, tags e notas; filtros e exportação/importação em CSV.
- **Importar extrato de corretora**: em *Operações → Importar extrato corretora*, aceita o extrato de ordens no formato Santander/BMF (CSV `;`-separado). A importação casa automaticamente compras e vendas executadas (FIFO) em operações fechadas, ignora ordens canceladas/rejeitadas e detecta o multiplicador financeiro do contrato (ex.: 0,2 p/ ponto no WIN) a partir do próprio arquivo. Um arquivo de exemplo real está em `Relatorios/extrato diario.csv`.
- **Análises**: resultado por ativo, estratégia, dia da semana, horário de entrada e estado emocional.
- **Calculadora de risco**: tamanho de posição sugerido a partir do saldo, % de risco, preço de entrada/stop e relação risco:retorno.
- **Metas**: progresso de metas diária/semanal/mensal e limite de perda diária.
- **Disciplina**: checklist de regras de trading, marcado por dia.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, Recharts, Zustand (persistência em localStorage).
