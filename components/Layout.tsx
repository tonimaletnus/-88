import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { 
  LogOut, 
  BookOpen, 
  Upload, 
  CheckSquare, 
  PieChart, 
  Target, 
  FileText, 
  Search, 
  CheckCircle, 
  Users,
  Bell,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const getMenuItems = () => {
    switch (user.role) {
      case UserRole.TEACHER:
        return [
          { id: 'publish', label: '发布作业', icon: <BookOpen size={20} /> },
          { id: 'upload', label: '上传资料', icon: <Upload size={20} /> },
          { id: 'grading', label: '审核评分', icon: <CheckSquare size={20} /> },
          { id: 'insights', label: '教学洞察', icon: <PieChart size={20} /> },
        ];
      case UserRole.STUDENT:
        return [
          { id: 'tasks', label: '任务中心', icon: <Target size={20} /> },
          { id: 'group', label: '我的小组', icon: <Users size={20} /> }, 
          { id: 'resources', label: '资料中心', icon: <FileText size={20} /> },
          { id: 'query', label: '作业查询', icon: <Search size={20} /> }, 
          { id: 'format', label: '格式检验', icon: <CheckCircle size={20} /> },
        ];
      case UserRole.ADMIN:
        return [
          { id: 'users', label: '用户管理', icon: <Users size={20} /> },
          { id: 'notifications', label: '通知提醒', icon: <Bell size={20} /> },
        ];
      default:
        return [];
    }
  };

  const renderAvatar = (u: User, sizeClass: string = "h-9 w-9", fontSizeClass: string = "text-sm") => {
    if (u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('data:'))) {
        return (
            <img 
                src={u.avatar} 
                alt={u.name} 
                className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-md transition-all duration-300`}
            />
        );
    }
    return (
        <div className={`${sizeClass} rounded-full bg-brand-500 flex items-center justify-center ${fontSizeClass} font-bold shadow-md text-white border-2 border-white transition-all duration-300`}>
            {u.name.charAt(0)}
        </div>
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-800 font-sans">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 z-20`}>
        
        {/* Sidebar Header & Toggle (保持在最顶部以便操作，但视觉上让位于Profile) */}
        <div className="h-12 flex items-center justify-end px-4 pt-4">
           {/* 如果折叠状态，显示展开按钮；如果展开状态，显示关闭按钮 */}
           <button 
             onClick={() => setSidebarOpen(!isSidebarOpen)} 
             className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200/50"
           >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
           </button>
        </div>

        {/* Profile Section - 修改为垂直布局 (头像 -> 姓名 -> 专业) */}
        <div className={`flex flex-col items-center justify-center pb-6 border-b border-slate-200/50 transition-all duration-300 ${isSidebarOpen ? 'px-6' : 'px-2'}`}>
            <div 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setActiveTab('profile')}
                title="进入个人中心"
            >
                {/* 1. 最上面是头像 (展开时变大) */}
                <div className="mb-3 transition-transform duration-300 group-hover:scale-105">
                    {renderAvatar(
                        user, 
                        isSidebarOpen ? "h-20 w-20" : "h-10 w-10", // 展开时大头像，折叠时小头像
                        isSidebarOpen ? "text-3xl" : "text-sm"
                    )}
                </div>

                {/* 仅在展开时显示文字信息 */}
                {isSidebarOpen && (
                    <div className="text-center w-full animate-fadeIn">
                        {/* 2. 往下是姓名 */}
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-brand-600 transition-colors">
                            {user.name}
                        </h3>
                        
                        {/* 3. 再往下是专业/角色 */}
                        <div className="mt-1 inline-block px-3 py-1 bg-slate-200/50 rounded-full">
                            <p className="text-xs font-medium text-slate-500">
                                {user.major ? user.major : (user.role === UserRole.TEACHER ? '教师' : user.role === UserRole.STUDENT ? '学生' : '管理员')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
            {!isSidebarOpen && <div className="h-4"></div>} {/* Spacer for collapsed mode */}
            <nav className="space-y-1 px-3">
                {getMenuItems().map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    activeTab === item.id 
                        ? 'bg-brand-50/80 text-brand-700 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${!isSidebarOpen && 'justify-center px-0'}`}
                >
                    {/* Active Indicator */}
                    {activeTab === item.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full"></div>
                    )}
                    
                    <div className={`${activeTab === item.id ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                        {item.icon}
                    </div>
                    {isSidebarOpen && <span className="text-sm ml-3">{item.label}</span>}
                </button>
                ))}
            </nav>
        </div>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-slate-200/50">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-start space-x-3 px-3' : 'justify-center'} py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
            title="退出登录"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">退出登录</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {activeTab === 'profile' ? '个人信息' : getMenuItems().find(i => i.id === activeTab)?.label || '仪表盘'}
          </h2>
          <div className="flex items-center space-x-5">
             <div className="relative">
                 <Search size={18} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                 <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none w-64 transition-all"
                 />
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 border border-slate-200 rounded px-1.5 bg-white">Ctrl K</div>
             </div>
             
             <button className="relative p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
             </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-white">
          {children}
        </div>
      </main>
    </div>
  );
};