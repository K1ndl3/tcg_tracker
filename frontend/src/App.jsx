import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Browse from './pages/Browse/Browse';
import Collection from './pages/Collection/Collection';
import Analytics from './pages/Analytics/Analytics';
import Spending from './pages/Spending/Spending';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/spending" element={<Spending />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
