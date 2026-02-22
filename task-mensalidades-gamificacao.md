# 🎯 Task: Controle de Mensalidades e Gamificação Real

## 📋 Descrição
Implementar a inteligência financeira para detectar mensalidades atrasadas e integrar a presença dos alunos com o ganho automático de XP.

## 🛠️ Subtarefas

### 1. 📂 Banco de Dados (Migração)
- [ ] Adicionar colunas `billing_day` e `monthly_fee` na tabela `members`.
- [ ] Criar função SQL para verificar pendências financeiras.

### 2. 💸 Inteligência Financeira
- [ ] Criar hook `useFinanceAlerts` para buscar alunos inadimplentes.
- [ ] Adicionar card de alerta no `Dashboard.tsx`.
- [ ] Adicionar indicador visual de status de pagamento no `MembersList.tsx`.

### 3. 🥋 Gamificação (Tatame Inteligente)
- [ ] Criar lógica de ganho de XP automático ao registrar presença.
- [ ] Atualizar o Leaderboard no Dashboard com dados 100% reais.

### 4. 🎨 UI/UX Refinement
- [ ] Garantir que todos os alertas sigam o padrão "Luxury Native App".
- [ ] Implementar micro-animações de "XP Ganho" (opcional/interativo).

## 📅 Cronograma Estimado
- **DB & Logic**: 1h
- **Dashboard & Members UI**: 1h
- **Gamification Logic**: 1h
- **Testes & Ajustes**: 30min

---
**Status:** 🔵 Iniciado
