import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<MembersList />} />
          <Route path="members/new" element={<MemberForm />} />
          <Route path="members/:id" element={<MemberForm />} />


          <Route path="agenda" element={<Agenda />} />
          <Route path="agenda/new" element={<ClassForm />} />
          <Route path="agenda/edit/:id" element={<ClassForm />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="groups/new" element={<GroupForm />} />
          <Route path="groups/:id" element={<GroupForm />} />
          <Route path="belts" element={<BeltManagement />} />
          <Route path="badges" element={<BadgeManagement />} />
          <Route path="gamification/leaderboard" element={<Leaderboard />} />
          <Route path="gamification/graduation" element={<GraduationPanel />} />
          <Route path="competitions" element={<PlaceholderPage title="Competições" />} />
          <Route path="finance" element={<Finance />} />
          <Route path="finance/new" element={<PaymentForm />} />
          <Route path="reports" element={<PlaceholderPage title="Relatórios" />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
