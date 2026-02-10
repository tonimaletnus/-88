import React, { useState } from 'react';
import { User, UserRole } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('tasks'); // Default varies by role logic below

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Set default tab based on role
    if (loggedInUser.role === UserRole.TEACHER) setActiveTab('grading');
    else if (loggedInUser.role === UserRole.STUDENT) setActiveTab('tasks');
    else if (loggedInUser.role === UserRole.ADMIN) setActiveTab('users');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {user.role === UserRole.TEACHER && (
        <TeacherDashboard activeTab={activeTab} onUpdateUser={handleUpdateUser} user={user} />
      )}
      {user.role === UserRole.STUDENT && (
        <StudentDashboard activeTab={activeTab} user={user} onUpdateUser={handleUpdateUser} />
      )}
      {user.role === UserRole.ADMIN && (
        <AdminDashboard activeTab={activeTab} onUpdateUser={handleUpdateUser} user={user} />
      )}
    </Layout>
  );
};

export default App;