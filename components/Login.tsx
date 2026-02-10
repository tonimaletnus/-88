import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock Login Logic
    const mockUser: User = {
      id: '123',
      name: username || '测试用户',
      role: role,
      studentId: role === UserRole.STUDENT ? '2025001' : undefined,
      major: role === UserRole.STUDENT ? '思想政治教育' : undefined,
      class: role === UserRole.STUDENT ? '2班' : undefined,
    };
    onLogin(mockUser);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-sans text-slate-800">
      {/* Left Side: Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2256&auto=format&fit=crop" 
          alt="Social Survey and Teamwork Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-600/90 to-brand-800/40 flex flex-col justify-end p-16 text-white">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">社会调查<br/>作业提交管理系统</h1>
          <p className="text-xl text-brand-50 max-w-lg font-light leading-relaxed">
            连接教学与实践，提供一站式作业提交、审核评分与数据洞察服务。
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-100">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">欢迎登录</h2>
            <p className="mt-2 text-sm text-slate-500">请输入您的账号密码</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="flex justify-center space-x-2 mb-6 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              {[
                { r: UserRole.STUDENT, label: '学生' },
                { r: UserRole.TEACHER, label: '教师' },
                { r: UserRole.ADMIN, label: '管理员' }
              ].map((item) => (
                <button
                  key={item.r}
                  type="button"
                  onClick={() => setRole(item.r)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                    role === item.r 
                      ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="用户名 / 学号 / 工号"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all shadow-sm hover:shadow-md"
            >
              登录系统
            </button>
          </form>
          
          <div className="text-center text-xs text-slate-400 mt-6">
             &copy; 2026 社会调查作业管理系统 版权所有
          </div>
        </div>
      </div>
    </div>
  );
};