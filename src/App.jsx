// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MemberManagement from './pages/MemberManagement';
import TaskManagement from './pages/TaskManagement';
import WeeklyChart from './pages/WeeklyChart';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<WeeklyChart />} />
            <Route path="members" element={<MemberManagement />} />
            <Route path="tasks" element={<TaskManagement />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;