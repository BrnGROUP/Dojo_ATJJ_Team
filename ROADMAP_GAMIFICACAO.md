# 🥋 ATJJ Dojo - Roadmap de Gamificação & Pedagogia

## 📋 Visão Geral

Este documento detalha o roadmap completo de funcionalidades pedagógicas e de gamificação para o sistema de gestão do dojo ATJJ.

---

## 🏆 FASE 1 - CORE GAMIFICATION (Prioridade Máxima)

### ✅ 1.1 Sistema de Insígnias (EM IMPLEMENTAÇÃO)
**Status:** 🟡 Em Desenvolvimento  
**Tempo Estimado:** 3-4 horas  
**Descrição:** Sistema de conquistas/badges que alunos ganham ao atingir marcos específicos.

**Insígnias Planejadas:**
- 🔥 **"Guerreiro do Fogo"**: 30 dias consecutivos de presença
- 🦁 **"Leão de Tatame"**: 100 aulas frequentadas
- 🥇 **"Campeão"**: Ganhou uma competição
- 🤝 **"Mentor"**: Ajudou 10 colegas
- 📚 **"Estudioso"**: Completou 50 técnicas do curriculum
- ⏰ **"Pontualidade"**: 90% de presença no horário
- 🎯 **"Técnico"**: Nota 10 em 3 avaliações consecutivas

**Estrutura do Banco:**
```sql
-- Tabela: insignias
CREATE TABLE insignias (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji ou nome do ícone Material
  condition_type TEXT, -- 'streak', 'total_classes', 'xp_threshold', 'competition', 'evaluation'
  condition_value INTEGER,
  xp_reward INTEGER DEFAULT 50,
  rarity TEXT CHECK (rarity IN ('comum', 'raro', 'épico', 'lendário'))
);

-- Tabela: member_insignias
CREATE TABLE member_insignias (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  insignia_id UUID REFERENCES insignias(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- Para tracking de progresso (%)
  UNIQUE(member_id, insignia_id)
);
```

---

### 🏅 1.2 Leaderboard/Ranking
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 2-3 horas  
**Descrição:** Ranking visual dos alunos por diferentes métricas.

**Tipos de Ranking:**
1. **Top XP do Mês** - Maior XP ganho nos últimos 30 dias
2. **Maior Evolução** - Diferença de XP vs. mês anterior
3. **Mais Frequentes** - Maior % de presença
4. **Streak Atual** - Dias consecutivos de treino
5. **Técnicas Dominadas** - Total de técnicas no nível "dominado"

**Features:**
- Filtros: Por turma, faixa, período (semanal/mensal/anual)
- Visualização: Cards estilo pódio para Top 3
- Atualização: Real-time ou refresh automático

**Componente Planejado:**
```
/src/pages/gamification/Leaderboard.tsx
/src/components/LeaderboardCard.tsx
```

---

### 📊 1.3 Dashboard de Estatísticas (Aluno)
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 4-5 horas  
**Descrição:** Dashboard individual mostrando evolução do aluno.

**Gráficos e Métricas:**
- 📈 XP ao longo do tempo (gráfico de linha)
- 🔥 Heatmap de frequência (estilo GitHub contribution graph)
- 📊 Taxa de presença mensal (gráfico de barras)
- 🎯 Técnicas aprendidas por categoria (pizza ou barras)
- 📉 Compare: Eu vs. Média da minha faixa

**Dependências:**
- Biblioteca de gráficos: Recharts ou Chart.js
- Queries otimizadas para agregações

---

## 📚 FASE 2 - PEDAGOGIA & TRACKING (Alta Prioridade)

### 📖 2.1 Curriculum Tracker
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 5-6 horas  
**Descrição:** Sistema para rastrear técnicas aprendidas/dominadas por aluno.

**Estrutura do Banco:**
```sql
-- Tabela: techniques
CREATE TABLE techniques (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('guarda', 'passagem', 'finalização', 'queda', 'transição', 'defesa')),
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
  belt_requirement TEXT, -- Faixa mínima recomendada
  video_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: member_techniques
CREATE TABLE member_techniques (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  technique_id UUID REFERENCES techniques(id),
  proficiency TEXT CHECK (proficiency IN ('iniciante', 'intermediário', 'avançado', 'dominado')),
  last_practiced DATE,
  notes TEXT,
  instructor_notes TEXT,
  UNIQUE(member_id, technique_id)
);
```

**Features:**
- CRUD de técnicas (Admin/Professor)
- Marcar técnica como praticada na aula
- Dashboard do aluno: "30/100 técnicas dominadas"
- Filtros por categoria, nível, faixa

**Componentes:**
```
/src/pages/curriculum/TechniquesList.tsx
/src/pages/curriculum/TechniqueForm.tsx
/src/pages/curriculum/MemberProgress.tsx
```

---

### 🎯 2.2 Sistema de Metas Pessoais
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 3-4 horas  
**Descrição:** Alunos definem metas e acompanham progresso.

**Estrutura do Banco:**
```sql
CREATE TABLE member_goals (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT CHECK (goal_type IN ('frequency', 'xp', 'techniques', 'competition', 'custom')),
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  deadline DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Exemplos de Metas:**
- "Frequentar 3x por semana durante 3 meses"
- "Dominar 10 técnicas de passagem"
- "Atingir 500 XP até final do mês"

---

### 📜 2.3 Certificados PDF de Graduação
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 3-4 horas  
**Descrição:** Gerar certificado profissional ao graduar.

**Tecnologia:** 
- Biblioteca: `jspdf` ou `pdfmake`
- Template: Layout profissional com logo ATJJ

**Dados no Certificado:**
- Nome completo do aluno
- Faixa anterior → Nova faixa
- Data da graduação
- Assinatura do professor (digital)
- XP total acumulado
- Tempo de treino (desde cadastro)

**Integração:**
- Botão "Baixar Certificado" no histórico de graduações
- Envio automático por email (opcional)

---

## 🎮 FASE 3 - ENGAJAMENTO & RETENÇÃO (Média Prioridade)

### 🔔 3.1 Sistema de Notificações
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 4-5 horas  
**Descrição:** Notificações in-app para manter engajamento.

**Tipos de Notificação:**
- ⚡ "Falta apenas 50 XP para a próxima faixa!"
- 🔥 "Streak de 7 dias! Continue assim!"
- 📚 "Nova técnica disponível para sua faixa"
- 😢 "Há 10 dias sem treinar, sentimos sua falta"
- 🏆 "Você está no Top 3 do ranking mensal!"

**Estrutura do Banco:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- 'achievement', 'reminder', 'ranking', 'goal'
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🎊 3.2 Eventos & Desafios Temporários
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 4-5 horas  
**Descrição:** Desafios mensais/semanais com recompensas extras.

**Estrutura do Banco:**
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT,
  target_value INTEGER,
  xp_reward INTEGER,
  insignia_reward UUID REFERENCES insignias(id),
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE member_challenges (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  challenge_id UUID REFERENCES challenges(id),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  UNIQUE(member_id, challenge_id)
);
```

**Exemplos:**
- "Desafio de Outubro: Frequente 20 aulas"
- "Semana da Técnica: Aprenda 5 técnicas novas"
- "Campeonato Interno: Torneio de submissão"

---

### 📸 3.3 Linha do Tempo de Evolução
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 3-4 horas  
**Descrição:** Feed visual mostrando marcos importantes.

**Eventos na Timeline:**
- 🎓 Graduações
- 🏆 Competições
- 🏅 Insígnias desbloqueadas
- 📚 Técnicas dominadas
- ⚡ Marcos de XP (1000, 5000, 10000)

**Componente:**
```
/src/components/MemberTimeline.tsx
```

---

## 🎨 FASE 4 - VISUAL & POLISH (Baixa Prioridade)

### 🎮 4.1 Gamificação Visual Avançada
**Status:** 🔴 Não Iniciado  
**Tempo Estimado:** 5-6 horas  

**Features:**
- Avatar do aluno (com faixa, gi, patches)
- Animações de "Level up!" ao ganhar faixa
- Confetti ao desbloquear insígnia
- Sons de feedback (opcional, toggle on/off)
- Tema dark/light mode

---

## 📊 KPIs & Métricas de Sucesso

**Métricas para Acompanhar:**
1. Taxa de retenção de alunos (% que continua após 3 meses)
2. Média de frequência mensal
3. Engajamento (acessos ao sistema por semana)
4. Insígnias mais desbloqueadas
5. Técnicas mais praticadas
6. Taxa de conclusão de metas

---

## 🛠️ Tech Stack Adicional

**Bibliotecas Necessárias:**
- `recharts` - Gráficos e visualizações
- `jspdf` ou `pdfmake` - Geração de PDFs
- `react-confetti` - Animações de celebração
- `date-fns` - Manipulação de datas
- `react-hot-toast` - Notificações (já usando)

---

## 📅 Timeline Estimado

| Fase | Tempo Estimado | Prioridade |
|------|----------------|------------|
| Fase 1 - Core Gamification | 9-12 horas | 🔥 Máxima |
| Fase 2 - Pedagogia & Tracking | 11-14 horas | ⚡ Alta |
| Fase 3 - Engajamento | 11-14 horas | 📊 Média |
| Fase 4 - Visual & Polish | 5-6 horas | 🎨 Baixa |
| **TOTAL** | **36-46 horas** | |

---

## 🎯 Próximos Passos Imediatos

1. ✅ Finalizar Sistema de Insígnias
2. 🚀 Implementar Leaderboard/Ranking
3. 📊 Dashboard de Estatísticas (Aluno)
4. 📚 Curriculum Tracker

---

**Última Atualização:** 2026-01-28  
**Status Geral:** 🟡 10% Completo (XP Manual, Avaliações, Planos de Aula)
