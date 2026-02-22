# Plano de Auditoria, Refatoração e Luxury UI (Mobile-First)

Este plano visa transformar o ATJJ Dojo V4 em uma experiência premium, focada em segurança máxima, performance instantânea e design de luxo, com prioridade total para uso em dispositivos móveis.

## 🎯 Success Criteria
- [ ] **Segurança:** Headers de segurança configurados e RLS auditado.
- [ ] **Performance:** Tempo de carregamento perceptível < 1s (Skeleton screens e otimização de queries).
- [ ] **Design:** Estética "Luxury Native App" (Sharp geometry, animações fluidas, zero clichês).
- [ ] **Modularização:** Reduzir arquivos grandes (>250 linhas) em sub-componentes reutilizáveis.
- [ ] **Responsividade:** 100% Mobile-First funcional em todas as telas de gestão.

## 🛠️ Tech Stack
- **Frontend:** React + Vite + Tailwind CSS (V4 patterns).
- **Backend/Auth:** Supabase.
- **Animações:** CSS Transitions + Framer Motion (opcional para luxo).
- **Verificação:** ux_audit.py, security_scan.py, playwright_runner.py.

## 📋 Task Breakdown

### Phase 1: Segurança e Infra (P0)
- [ ] **Task 1.1:** Implementar Security Headers no `vercel.json` ou via Middleware.
    - **Agent:** `@security-auditor`
    - **Verify:** `security_scan.py`
- [ ] **Task 1.2:** Auditoria de RLS nas tabelas críticas (`profiles`, `members`, `payments`).
    - **Agent:** `@database-architect`
    - **Verify:** Testes de bypass de RLS.

### Phase 2: Modularização & Clean Code (P1)
- [ ] **Task 2.1:** Extrair Componentes de UI "Core" (`Card`, `Input`, `Button`, `Badge`) para `src/components/ui/`.
    - **Agent:** `@frontend-specialist`
    - **Verify:** Consistência visual em 5 páginas.
- [ ] **Task 2.2:** Refatorar `MemberForm.tsx` e `UserForm.tsx` (Separar lógica de formulário dos componentes visuais).
    - **Agent:** `@backend-specialist` + `@frontend-specialist`
    - **Verify:** Funcionalidade de salvamento intacta.

### Phase 3: Luxury UX & Mobile-First (P2)
- [ ] **Task 3.1:** Re-design do Dashboard para Mobile (Cards dinâmicos com *Gestures*).
    - **Agent:** `@frontend-specialist`
    - **Verify:** `ux_audit.py`.
- [ ] **Task 3.2:** Implementação de Skeleton Screens para carregamento "instantâneo".
    - **Agent:** `@performance-optimizer`
    - **Verify:** Lighthouse Performance > 90.

### Phase 4: Consistência Visual (P3)
- [ ] **Task 4.1:** Auditoria e remoção de *Inline Styles* e *Hardcoded Colors*.
    - **Agent:** `@frontend-specialist`
    - **Verify:** `lint_runner.py`.
- [ ] **Task 4.2:** Refinamento de Geometria (Sharp edges) e Micro-interações.

## 🏁 Phase X: Verificação Final
- [ ] Executar `verify_all.py`
- [ ] Build de produção sem warnings.
- [ ] Teste manual em simulador mobile (iOS/Android).

---
**Status:** 🏗️ Planejamento aprovado. Iniciando Fase 1.
