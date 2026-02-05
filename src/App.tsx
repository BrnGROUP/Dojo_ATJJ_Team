import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

import { MembersList } from './pages/members/MembersList';
import { MemberForm } from './pages/members/MemberForm';
import { PlaceholderPage } from './pages/Placeholder';
import { Agenda } from './pages/agenda/Agenda';
import { ClassForm } from './pages/agenda/ClassForm';
import { GroupList } from './pages/groups/GroupList';
import { GroupForm } from './pages/groups/GroupForm';
import { Finance } from './pages/finance/Finance';
import { PaymentForm } from './pages/finance/PaymentForm';
import { BadgeManagement } from './pages/gamification/BadgeManagement';
import { BeltManagement } from './pages/gamification/BeltManagement';
import { Leaderboard } from './pages/gamification/Leaderboard';
import { GraduationPanel } from './pages/gamification/GraduationPanel';
import { StudentEvolution } from './pages/gamification/StudentEvolution';
import { CurriculumManagement } from './pages/gamification/CurriculumManagement';
import { Settings } from './pages/Settings';
import { UsersList } from './pages/users/UsersList';
import { UserForm } from './pages/users/UserForm';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />

              {/* Rotas acessíveis por todos os autenticados */}
              <Route path="agenda" element={<Agenda />} />
              <Route path="members" element={<MembersList />} />
              <Route path="gamification/leaderboard" element={<Leaderboard />} />
              <Route path="gamification/evolution" element={<StudentEvolution />} />

              {/* Staff (Admin, Manager, Coordinator) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'coordinator']} />}>
                <Route path="members/new" element={<MemberForm />} />
                <Route path="members/:id" element={<MemberForm />} />
                <Route path="agenda/new" element={<ClassForm />} />
                <Route path="agenda/edit/:id" element={<ClassForm />} />
                <Route path="groups" element={<GroupList />} />
                <Route path="groups/new" element={<GroupForm />} />
                <Route path="groups/:id" element={<GroupForm />} />
                <Route path="belts" element={<BeltManagement />} />
                <Route path="badges" element={<BadgeManagement />} />
                <Route path="gamification/graduation" element={<GraduationPanel />} />
                <Route path="gamification/curriculum" element={<CurriculumManagement />} />
                <Route path="finance" element={<Finance />} />
                <Route path="finance/new" element={<PaymentForm />} />
                <Route path="reports" element={<PlaceholderPage title="Relatórios" />} />
                <Route path="competitions" element={<PlaceholderPage title="Competições" />} />
              </Route>

              {/* Admin & Manager Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                <Route path="users" element={<UsersList />} />
                <Route path="users/:id" element={<UserForm />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
