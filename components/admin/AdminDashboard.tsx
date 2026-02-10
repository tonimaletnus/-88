import React, { useState, useRef, useEffect } from 'react';
import { Users, Settings, Bell, Upload, Trash2, Edit2, Plus, X, Save, Shield, HardDrive, User as UserIcon, Camera, Mail, Loader2, CheckCircle, Search, Hash } from 'lucide-react';
import { User } from '../../types';

interface AdminDashboardProps {
  activeTab: string;
  user: User;
  onUpdateUser: (u: Partial<User>) => void;
}

interface AdminUser {
    id: number;
    name: string;
    role: 'Student' | 'Teacher' | 'Admin';
    email: string;
    uploadLimitMB: number;
    code: string; // 学号或工号
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, user, onUpdateUser }) => {
  const [users, setUsers] = useState<AdminUser[]>([
    { id: 1, name: '辛旗', role: 'Student', email: 'xinqi@uni.edu', uploadLimitMB: 50, code: '2025001' },
    { id: 2, name: '张教授', role: 'Teacher', email: 'zhang@uni.edu', uploadLimitMB: 500, code: 'T2008001' },
    { id: 3, name: '王强', role: 'Student', email: 'wang@uni.edu', uploadLimitMB: 50, code: '2023002' },
    { id: 4, name: '赵敏', role: 'Student', email: 'zhao@uni.edu', uploadLimitMB: 50, code: '2023003' },
    { id: 5, name: '刘管理员', role: 'Admin', email: 'admin_liu@uni.edu', uploadLimitMB: 1024, code: 'ADM001' },
  ]);

  // Modal States
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [newUser, setNewUser] = useState<Partial<AdminUser>>({ role: 'Student', uploadLimitMB: 50, code: '' });

  // Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
      name: user.name,
  });

  useEffect(() => {
    setProfileForm({
        name: user.name,
    });
  }, [user]);

  // Filter Users based on Search
  const filteredUsers = users.filter(u => {
      const term = searchQuery.toLowerCase();
      const roleName = u.role === 'Student' ? '学生' : u.role === 'Teacher' ? '教师' : '管理员';
      return (
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.code.toLowerCase().includes(term) ||
          roleName.includes(term)
      );
  });

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.email || !newUser.code) return;
      const u: AdminUser = {
          id: Date.now(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role as any,
          uploadLimitMB: newUser.uploadLimitMB || 50,
          code: newUser.code
      };
      setUsers([...users, u]);
      setAddModalOpen(false);
      setNewUser({ role: 'Student', uploadLimitMB: 50, code: '' });
      alert('用户添加成功');
  };

  const handleEditUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      setUsers(users.map(u => u.id === currentUser.id ? currentUser : u));
      setEditModalOpen(false);
      setCurrentUser(null);
      alert('用户信息更新成功');
  };

  const handleDeleteUser = (id: number) => {
      if (confirm('确定要删除该用户吗？此操作不可恢复。')) {
          setUsers(users.filter(u => u.id !== id));
      }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setIsImporting(false);
        return;
      }

      // Simple CSV Parsing logic
      const lines = text.split(/\r?\n/);
      const importedUsers: AdminUser[] = [];
      
      // Assume CSV format: name,role,email,uploadLimitMB,code
      // Skip header if it exists
      const startIdx = (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('姓名')) ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const [name, role, email, limit, code] = parts;
          
          // Role normalization
          let normalizedRole: 'Student' | 'Teacher' | 'Admin' = 'Student';
          if (role.toLowerCase() === 'teacher' || role === '教师') normalizedRole = 'Teacher';
          if (role.toLowerCase() === 'admin' || role === '管理员') normalizedRole = 'Admin';

          importedUsers.push({
            id: Date.now() + i,
            name: name,
            role: normalizedRole,
            email: email,
            uploadLimitMB: parseInt(limit) || 50,
            code: code || `U${Date.now() + i}` // Fallback if missing
          });
        }
      }

      if (importedUsers.length > 0) {
        setUsers(prev => [...prev, ...importedUsers]);
        alert(`成功导入 ${importedUsers.length} 位用户`);
      } else {
        alert('未在文件中发现有效用户数据。请确保 CSV 格式为: 姓名,角色,邮箱,配额,学号/工号');
      }
      
      setIsImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    };

    reader.onerror = () => {
      alert('读取文件失败');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              onUpdateUser({ avatar: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateUser({
          name: profileForm.name,
      });
      setIsEditProfileOpen(false);
      alert('个人资料已更新');
  };

  const openEditModal = (user: AdminUser) => {
      setCurrentUser({...user});
      setEditModalOpen(true);
  };

  if (activeTab === 'users') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex items-center gap-2">
               <h3 className="text-2xl font-bold text-slate-800 tracking-tight">用户管理</h3>
               <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                   共 {users.length} 人
               </span>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             {/* Search Input */}
             <div className="relative flex-1 sm:w-64">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                 <input 
                    type="text" 
                    placeholder="搜索姓名、邮箱、角色或学号..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 {searchQuery && (
                     <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                     >
                         <X size={14} />
                     </button>
                 )}
             </div>

             <div className="flex gap-3">
                <input 
                    type="file" 
                    ref={csvInputRef} 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleImportCSV} 
                />
                <button 
                    onClick={() => csvInputRef.current?.click()}
                    disabled={isImporting}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
                >
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16}/>}
                导入
                </button>
                <button 
                    onClick={() => setAddModalOpen(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-brand-700 shadow-md transition-all whitespace-nowrap"
                >
                <Plus size={16}/> 添加用户
                </button>
             </div>
           </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">姓名</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">学号/工号</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">角色</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">邮箱</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">上传配额</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-800 font-medium flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                              {u.name.charAt(0)}
                          </div>
                          <div>
                              <div className="text-sm">{u.name}</div>
                              <div className="text-xs text-slate-400 md:hidden">{u.email}</div>
                          </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                          {u.code}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            u.role === 'Teacher' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : u.role === 'Admin' 
                            ? 'bg-slate-800 text-white border-slate-700'
                            : 'bg-brand-50 text-brand-700 border-brand-100'
                        }`}>
                          {u.role === 'Teacher' ? '教师' : u.role === 'Admin' ? '管理员' : '学生'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-sm hidden md:table-cell">{u.email}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm hidden sm:table-cell">
                          <span className="flex items-center gap-1.5">
                              <HardDrive size={14} className="text-slate-400"/>
                              {u.uploadLimitMB} MB
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => openEditModal(u)}
                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="编辑信息"
                            >
                                <Edit2 size={16}/>
                            </button>
                            <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除用户"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                        {searchQuery ? <Search size={48} className="text-slate-200" /> : <Users size={48} className="text-slate-200" />}
                        <p>{searchQuery ? `未找到匹配 "${searchQuery}" 的用户` : "暂无用户数据，请点击右上方按钮添加或导入。"}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">添加新用户</h3>
                        <button onClick={() => setAddModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <form onSubmit={handleAddUser} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">姓名</label>
                                <input type="text" required className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-brand-500"
                                    value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">学号 / 工号</label>
                                <input type="text" required className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-brand-500"
                                    value={newUser.code || ''} onChange={e => setNewUser({...newUser, code: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">邮箱</label>
                            <input type="email" required className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-brand-500"
                                value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">角色</label>
                                <select className="w-full border-slate-300 rounded-lg p-2.5 border bg-white focus:ring-2 focus:ring-brand-500"
                                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                                    <option value="Student">学生</option>
                                    <option value="Teacher">教师</option>
                                    <option value="Admin">管理员</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">上传限额 (MB)</label>
                                <input type="number" className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-brand-500"
                                    value={newUser.uploadLimitMB} onChange={e => setNewUser({...newUser, uploadLimitMB: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">取消</button>
                            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">确认添加</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && currentUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Settings size={18} className="text-brand-600"/> 
                            编辑用户信息
                        </h3>
                        <button onClick={() => setEditModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <form onSubmit={handleEditUser} className="p-6 space-y-4">
                        <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">学号 / 工号</label>
                             <input type="text" required className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-brand-500"
                                 value={currentUser.code} onChange={e => setCurrentUser({...currentUser, code: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">系统角色 (赋权)</label>
                            <select className="w-full border-slate-300 rounded-lg p-2.5 border bg-white focus:ring-2 focus:ring-brand-500"
                                value={currentUser.role} onChange={e => setCurrentUser({...currentUser, role: e.target.value as any})}>
                                <option value="Student">学生 (普通权限)</option>
                                <option value="Teacher">教师 (管理作业)</option>
                                <option value="Admin">管理员 (系统设置)</option>
                            </select>
                        </div>
                        
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <HardDrive size={16}/> 文件上传配额限制
                            </label>
                            <div className="flex items-center gap-3">
                                <input type="number" className="flex-1 border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-brand-500"
                                    value={currentUser.uploadLimitMB} onChange={e => setCurrentUser({...currentUser, uploadLimitMB: Number(e.target.value)})} />
                                <span className="text-slate-500 font-medium">MB</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">限制该用户单次上传的最大文件大小。</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">取消</button>
                            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
                                <Save size={16}/> 保存更改
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (activeTab === 'notifications') {
    return (
        <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Bell size={20} className="text-brand-600"/> 通知与提醒</h3>
           <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 mb-4 flex gap-3">
                 <Bell size={20} className="text-amber-600 mt-1 flex-shrink-0"/>
                 <div>
                    <h4 className="font-bold text-amber-800 text-sm">自动提醒规则</h4>
                    <p className="text-amber-700 text-xs mt-1 leading-relaxed">系统将自动检测逾期未提交的学生和待审核超过3天的教师任务。点击下方按钮手动触发通知。</p>
                 </div>
              </div>
              <button className="w-full border border-slate-300 bg-white py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex justify-center items-center gap-2">
                 一键提醒：逾期未提交学生
              </button>
              <button className="w-full border border-slate-300 bg-white py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex justify-center items-center gap-2">
                 一键提醒：待审核教师
              </button>
           </div>
        </div>
    )
  }
  
  if (activeTab === 'profile') {
      return (
          <div className="max-w-3xl mx-auto">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-slate-800"></div>
                <div className="px-8 pb-8 -mt-12">
                   <div className="flex justify-between items-end">
                      <div className="relative group">
                          <input 
                                type="file" 
                                ref={avatarInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                          <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-slate-600 overflow-hidden relative">
                              {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                                   <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover"/>
                               ) : (
                                   user.name.charAt(0)
                               )}
                               <div 
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                                 >
                                     <Camera size={24}/>
                                 </div>
                          </div>
                      </div>
                      <div className="mb-2">
                          <button 
                            onClick={() => setIsEditProfileOpen(true)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                          >
                              编辑资料
                          </button>
                      </div>
                   </div>
                   
                   <div className="mt-6">
                       <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                       <p className="text-slate-500 text-sm font-medium">系统管理员</p>
                       
                       <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                               <Mail size={18} className="text-slate-400"/>
                               <div>
                                   <p className="text-xs text-slate-400 uppercase font-bold">工作邮箱</p>
                                   <p className="text-sm font-semibold text-slate-700">admin@uni.edu</p>
                               </div>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                               <Shield size={18} className="text-slate-400"/>
                               <div>
                                   <p className="text-xs text-slate-400 uppercase font-bold">管理权限</p>
                                   <p className="text-sm font-semibold text-slate-700">超级管理员 (Root)</p>
                               </div>
                           </div>
                       </div>
                   </div>
                </div>
             </div>

            {/* Edit Profile Modal */}
            {isEditProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">编辑个人资料</h3>
                            <button onClick={() => setIsEditProfileOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">姓名</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full border-slate-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-brand-500"
                                    value={profileForm.name}
                                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditProfileOpen(false)} 
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                                >
                                    取消
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
                                >
                                    <Save size={16}/> 保存更改
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
          </div>
      )
  }

  return <div className="text-slate-500 p-8 text-center">请选择左侧菜单项</div>;
};