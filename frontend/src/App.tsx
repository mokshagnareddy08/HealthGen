import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import MealPlan from './pages/MealPlan/MealPlan';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Workouts from './pages/Workouts/Workouts';
import { hasCompletedProfile } from './services/profileStorage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!session) return <Navigate to="/signup" replace />;

  const profileCompleted = hasCompletedProfile(user);
  const isProfileRoute = location.pathname === '/profile';

  if (!profileCompleted && !isProfileRoute) {
    return <Navigate to="/profile" replace state={{ onboarding: true }} />;
  }

  return <Sidebar>{children}</Sidebar>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/meals" element={<ProtectedRoute><MealPlan /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/signup" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
