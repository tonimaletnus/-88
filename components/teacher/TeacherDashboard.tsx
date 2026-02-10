import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Submission, TaskStatus, TaskType, SurveyTheme, User } from '../../types';
import { Check, X, MessageCircle, FileText, Eye, Settings, Search, Filter, PenTool, UploadCloud, Calendar, Plus, Trash2, File, GraduationCap, MapPin, User as UserIcon, Shield, Lock, AlertCircle, Book, Clock, Download, Camera, Save } from 'lucide-react';

// Sky Blue Palette for Charts
const COLORS = ['#0369a1', '#0284c7', '#0ea5e9', '#7dd3fc'];

// Helper to translate TaskType to Chinese
const TASK_TYPE_CN: Record<TaskType, string> = {
  [TaskType.THEME_SELECTION]: '选题确认',
  [TaskType.PROCESS_MATERIAL]: '过程性材料',
  [TaskType.FINAL_REPORT]: '调查报告'
};

interface TeacherDashboardProps {
  activeTab: string;
  onUpdateUser: (u: Partial<User>) => void;
  user: User;
}

// Mock Data
const MOCK_SUBMISSIONS: Submission[] = [
  { 
      id: '1', 
      studentId: '2025001', 
      studentName: '辛旗', 
      taskType: TaskType.THEME_SELECTION, 
      status: TaskStatus.APPROVED, 
      submittedAt: '2026-01-01', 
      theme: SurveyTheme.ECOLOGY, 
      score: 95,
      content: "我的选题是《社会主义基本经济制度》。\n\n调查目的：了解居民对社会主义基本经济制度的认知。\n调查方法：问卷调查法、访谈法。\n预期成果：形成一份不少于1500字的调查报告，并提出改进建议。" 
  },
  { 
      id: '2', 
      studentId: '2025002', 
      studentName: '张伟', 
      taskType: TaskType.PROCESS_MATERIAL, 
      status: TaskStatus.REVIEWING, 
      submittedAt: '2026-01-05', 
      content: "", // Empty content implies file upload
      fileUrl: "interview_records.mp3"
  },
  { 
      id: '3', 
      studentId: '2025003', 
      studentName: '王芳', 
      taskType: TaskType.FINAL_REPORT, 
      status: TaskStatus.PENDING, 
      submittedAt: '2026-01-10',
      content: "摘要：\n随着老龄化社会的到来，养老问题日益严峻。本文通过对XX市XX区的实地调研，分析了当前社区居家养老模式的运行困境..."
  },
  { 
      id: '4', 
      studentId: '2025004', 
      studentName: '刘洋', 
      taskType: TaskType.THEME_SELECTION, 
      status: TaskStatus.REJECTED, 
      submittedAt: '2026-01-02', 
      theme: SurveyTheme.POLITICS,
      content: "选题：大学生政治参与感调查。"
  },
  { 
      id: '5', 
      studentId: '2025005', 
      studentName: '陈静', 
      taskType: TaskType.PROCESS_MATERIAL, 
      status: TaskStatus.SUBMITTED, 
      submittedAt: '2026-01-06',
      content: "",
      fileUrl: "data_analysis.xlsx"
  },
];

const MOCK_STATS = [
  { name: '已提交', value: 85 },
  { name: '未提交', value: 15 },
];

const MOCK_GRADES = [
  { name: '优秀 (90-100)', value: 12 },
  { name: '良好 (80-89)', value: 25 },
  { name: '中等 (70-79)', value: 8 },
  { name: '及格 (60-69)', value: 3 },
  { name: '不及格 (<60)', value: 2 },
];

const MOCK_RESOURCES = [
    { id: 1, name: '社会调查方法论.pdf', size: '2.4 MB', date: '2026-01-15' },
    { id: 2, name: '问卷设计模板.docx', size: '1.1 MB', date: '2026-01-20' },
    { id: 3, name: '往届优秀报告范例.pdf', size: '5.6 MB', date: '2026-01-01' },
];

// Mock Published History
const MOCK_PUBLISHED_HISTORY = [
    { id: 101, title: '2026年度社会调查选题确认', type: TaskType.THEME_SELECTION, date: '2026-01-01', deadline: '2026-04-15', status: '进行中' },
    { id: 102, title: '过程性材料提交（第一阶段）', type: TaskType.PROCESS_MATERIAL, date: '2026-01-20', deadline: '2026-05-01', status: '进行中' },
];

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ activeTab, user, onUpdateUser }) => {
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');

  // Publish State
  const [publishForm, setPublishForm] = useState({
      title: '',
      type: TaskType.THEME_SELECTION,
      deadline: '',
      description: ''
  });
  const [publishHistory, setPublishHistory] = useState(MOCK_PUBLISHED_HISTORY);

  // Upload State
  const [resources, setResources] = useState(MOCK_RESOURCES);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
      name: user.name,
      department: user.major || '' // Map major to department for teacher
  });

  useEffect(() => {
    setProfileForm({
        name: user.name,
        department: user.major || ''
    });
  }, [user]);

  const handleReview = (id: string, status: TaskStatus) => {
    setSubmissions(prev => prev.map(s => 
      s.id === id ? { ...s, status, score: Number(score), feedback } : s
    ));
    setSelectedSubmission(null);
    setFeedback('');
    setScore('');
  };

  const handlePublish = (e: React.FormEvent) => {
      e.preventDefault();
      const newAssignment = {
          id: Date.now(),
          title: publishForm.title,
          type: publishForm.type,
          date: new Date().toISOString().split('T')[0],
          deadline: publishForm.deadline,
          status: '已发布'
      };
      setPublishHistory([newAssignment, ...publishHistory]);
      alert(`作业 "${publishForm.title}" 发布成功！`);
      setPublishForm({ title: '', type: TaskType.THEME_SELECTION, deadline: '', description: '' });
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const newResource = {
              id: Date.now(),
              name: file.name,
              size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
              date: new Date().toISOString().split('T')[0]
          };
          setResources([newResource, ...resources]);
          alert(`文件 "${file.name}" 上传成功！`);
      }
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

  const handleViewResource = (file: any) => {
      alert(`正在预览文件：${file.name}\n(这是一个模拟预览窗口，真实环境中将打开PDF或Office预览器)`);
  };

  const handleDeleteResource = (id: number) => {
      if(confirm('确定要删除该资料吗？')) {
          setResources(resources.filter(r => r.id !== id));
      }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateUser({
          name: profileForm.name,
          major: profileForm.department
      });
      setIsEditProfileOpen(false);
      alert('个人资料已更新');
  };

  if (activeTab === 'publish') {
      return (
          <div className="max-w-5xl mx-auto space-y-8">
              {/* Publish Form */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Book size={24} className="text-brand-500"/> 发布新作业
                  </h3>
                  <form onSubmit={handlePublish} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">作业标题</label>
                              <input 
                                  type="text" 
                                  required
                                  className="w-full bg-slate-50 border border-slate-200 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:bg-white transition-colors"
                                  placeholder="例如：2026社会调查选题确认"
                                  value={publishForm.title}
                                  onChange={e => setPublishForm({...publishForm, title: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">截止日期</label>
                              <div className="relative">
                                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                                  <input 
                                      type="date" 
                                      required
                                      className="w-full bg-slate-50 border border-slate-200 rounded-md shadow-sm p-2.5 pl-10 focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:bg-white transition-colors"
                                      value={publishForm.deadline}
                                      onChange={e => setPublishForm({...publishForm, deadline: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">作业类型</label>
                          <select 
                              className="w-full bg-slate-50 border border-slate-200 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:bg-white transition-colors"
                              value={publishForm.type}
                              onChange={e => setPublishForm({...publishForm, type: e.target.value as TaskType})}
                          >
                              {Object.values(TaskType).map(t => <option key={t} value={t}>{TASK_TYPE_CN[t]}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">详细要求与说明</label>
                          <textarea 
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-brand-200 focus:border-brand-500 focus:bg-white h-32 transition-colors"
                              placeholder="请输入具体的作业要求、评分标准等..."
                              value={publishForm.description}
                              onChange={e => setPublishForm({...publishForm, description: e.target.value})}
                          />
                      </div>

                      <div className="pt-2 flex justify-end">
                          <button 
                              type="submit"
                              className="bg-brand-500 text-white px-8 py-2.5 rounded-md font-semibold hover:bg-brand-600 shadow-sm transition-all flex items-center gap-2"
                          >
                              <Plus size={20}/> 确认发布
                          </button>
                      </div>
                  </form>
              </div>

              {/* Publish History */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                      <Clock size={20} className="text-brand-600"/>
                      <h4 className="font-bold text-slate-800">发布历史</h4>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                              <tr>
                                  <th className="px-6 py-3">作业标题</th>
                                  <th className="px-6 py-3">类型</th>
                                  <th className="px-6 py-3">发布日期</th>
                                  <th className="px-6 py-3">截止日期</th>
                                  <th className="px-6 py-3">状态</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {publishHistory.map(item => (
                                  <tr key={item.id} className="hover:bg-brand-50/20 transition-colors">
                                      <td className="px-6 py-4 font-semibold text-slate-700">{item.title}</td>
                                      <td className="px-6 py-4 text-slate-600">{TASK_TYPE_CN[item.type]}</td>
                                      <td className="px-6 py-4 text-slate-500">{item.date}</td>
                                      <td className="px-6 py-4 text-slate-500">{item.deadline}</td>
                                      <td className="px-6 py-4">
                                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-100">
                                              {item.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  }

  if (activeTab === 'upload') {
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              {/* Upload Area */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <UploadCloud size={24} className="text-brand-500"/> 上传参考资料
                  </h3>
                  
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                  />
                  
                  <div 
                      className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-brand-50/30 hover:border-brand-300 transition-all cursor-pointer group"
                      onClick={triggerFileUpload}
                  >
                      <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <UploadCloud size={32}/>
                      </div>
                      <h4 className="text-lg font-semibold text-slate-700 mb-2">点击此处选择文件上传</h4>
                      <p className="text-slate-500 text-sm">支持 PDF, Word, Excel, PPT, JPG 等格式 (最大 50MB)</p>
                  </div>
              </div>

              {/* File List */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                      <h4 className="font-bold text-slate-800">已上传资料库</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                      {resources.map(file => (
                          <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-brand-50 text-brand-700 rounded-lg flex items-center justify-center">
                                      <File size={20}/>
                                  </div>
                                  <div>
                                      <p className="text-sm font-semibold text-slate-800 cursor-pointer hover:text-brand-600 hover:underline" onClick={() => handleViewResource(file)}>
                                          {file.name}
                                      </p>
                                      <p className="text-xs text-slate-500">{file.size} • {file.date}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleViewResource(file)}
                                    className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors" 
                                    title="预览"
                                  >
                                      <Eye size={18}/>
                                  </button>
                                  <button 
                                      onClick={() => handleDeleteResource(file.id)}
                                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                      title="删除"
                                  >
                                      <Trash2 size={18}/>
                                  </button>
                              </div>
                          </div>
                      ))}
                      {resources.length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-sm">
                              暂无上传资料
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // Profile tab logic
  if (activeTab === 'profile') {
    return (
        <div className="grid grid-cols-12 gap-8 h-full">
            {/* Left Column: Avatar & Basic Info Card */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-0">
                <div className="h-24 bg-brand-500"></div>
                <div className="px-6 pb-6 relative">
                    <div className="h-24 w-24 rounded-full bg-white p-1 absolute -top-12 left-1/2 transform -translate-x-1/2 shadow-md relative group">
                        <input 
                            type="file" 
                            ref={avatarInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                        <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-600 overflow-hidden relative">
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
                    <div className="mt-14 text-center">
                        <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                        <p className="text-slate-500 text-sm mt-1">{user.major ? user.major + ' • 教授' : '马克思主义学院 • 教授'}</p>
                        
                        <div className="mt-6 space-y-4 text-left">
                            <div className="flex items-center text-sm text-slate-600 border-b border-slate-50 pb-2">
                                <GraduationCap size={16} className="mr-3 text-brand-500"/>
                                <span className="flex-1">职称</span>
                                <span className="font-medium text-slate-800">教授</span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600 border-b border-slate-50 pb-2">
                                <MapPin size={16} className="mr-3 text-brand-500"/>
                                <span className="flex-1">办公地点</span>
                                <span className="font-medium text-slate-800">文科楼 305</span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600 pb-2">
                                <UserIcon size={16} className="mr-3 text-brand-500"/>
                                <span className="flex-1">工号</span>
                                <span className="font-medium text-slate-800">T2008001</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsEditProfileOpen(true)}
                            className="w-full mt-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            编辑资料
                        </button>
                    </div>
                </div>
            </div>
            </div>

            {/* Right Column: Detailed Info Sections */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-8">
                {/* Section: Account Stats */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                        <UserIcon size={20} className="text-brand-500"/> 教学概况
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-500 text-xs uppercase font-bold">本学期课程</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">3 门</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-500 text-xs uppercase font-bold">指导学生</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">45 人</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-500 text-xs uppercase font-bold">待审核作业</p>
                            <p className="text-2xl font-bold text-brand-600 mt-1">12 份</p>
                        </div>
                    </div>
                </div>

                {/* Section: Security Settings */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-brand-500"/> 安全设置
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                    <Lock size={18}/>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">账户密码</p>
                                    <p className="text-slate-500 text-xs mt-0.5">建议定期更换密码以保障账户安全</p>
                                </div>
                            </div>
                            <button className="text-brand-600 hover:text-brand-800 text-sm font-medium px-4 py-2 hover:bg-brand-50 rounded-md transition-colors">修改</button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                                    <AlertCircle size={18}/>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">密保问题</p>
                                    <p className="text-slate-500 text-xs mt-0.5">未设置密保问题</p>
                                </div>
                            </div>
                            <button className="text-brand-600 hover:text-brand-800 text-sm font-medium px-4 py-2 hover:bg-brand-50 rounded-md transition-colors">设置</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                                    className="w-full border-slate-300 rounded-md p-2.5 border focus:ring-2 focus:ring-brand-500"
                                    value={profileForm.name}
                                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">所属院系</label>
                                <input 
                                    type="text" 
                                    className="w-full border-slate-300 rounded-md p-2.5 border focus:ring-2 focus:ring-brand-500"
                                    value={profileForm.department}
                                    placeholder="例如：社会学系"
                                    onChange={e => setProfileForm({...profileForm, department: e.target.value})}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditProfileOpen(false)} 
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium"
                                >
                                    取消
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-brand-500 text-white rounded-md text-sm font-medium hover:bg-brand-600 flex items-center gap-2"
                                >
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

  if (activeTab === 'grading') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 relative">
        {/* Preview Modal (Read Only) */}
        {previewSubmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div 
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                    onClick={() => setPreviewSubmission(null)}
                />
                <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">作业预览</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{previewSubmission.studentName} - {TASK_TYPE_CN[previewSubmission.taskType]}</p>
                        </div>
                        <button 
                            onClick={() => setPreviewSubmission(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20}/>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                         <div className="prose prose-slate prose-sm max-w-none text-slate-700">
                            {previewSubmission.content ? (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">提交内容:</h4>
                                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200 whitespace-pre-line">
                                        {previewSubmission.content}
                                    </div>
                                </div>
                            ) : previewSubmission.fileUrl ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <FileText size={48} className="mb-4 text-brand-300"/>
                                    <p className="text-slate-600 font-medium">学生已提交附件文件</p>
                                    <p className="text-xs mt-1 mb-4">{previewSubmission.fileUrl}</p>
                                    <button className="px-4 py-2 bg-brand-500 text-white rounded-md text-sm flex items-center gap-2 hover:bg-brand-600 transition-colors">
                                        <Download size={16}/> 下载/预览附件
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">无内容</div>
                            )}
                         </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <button 
                            onClick={() => setPreviewSubmission(null)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-md transition-colors"
                        >
                            关闭
                        </button>
                        <button 
                            onClick={() => {
                                setSelectedSubmission(previewSubmission);
                                setPreviewSubmission(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-md shadow-sm transition-colors flex items-center gap-2"
                        >
                            <PenTool size={16}/>
                            前往审核
                        </button>
                    </div>
                </div>
            </div>
        )}

        {selectedSubmission ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
               <div>
                 <h3 className="text-2xl font-bold text-slate-800">正在审核: {selectedSubmission.studentName}</h3>
                 <p className="text-slate-500 text-sm mt-1">学号: {selectedSubmission.studentId} | 提交时间: {selectedSubmission.submittedAt}</p>
               </div>
               <button onClick={() => setSelectedSubmission(null)} className="text-slate-500 hover:text-slate-800 px-4 py-2 rounded-md hover:bg-slate-100 transition-colors">
                 关闭
               </button>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grading - Content View */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 h-[600px] flex flex-col">
                  <h4 className="font-bold text-slate-700 mb-4 flex items-center">
                    <FileText className="mr-2 text-brand-500" size={20} /> 作业内容
                  </h4>
                  <div className="flex-1 bg-white border border-slate-300 rounded-md p-6 overflow-y-auto shadow-inner">
                    <div className="mb-4 space-y-2">
                        <div className="flex items-center text-sm">
                            <span className="w-20 font-semibold text-slate-600">任务类型:</span>
                            <span className="text-slate-800">{TASK_TYPE_CN[selectedSubmission.taskType]}</span>
                        </div>
                        {selectedSubmission.theme && (
                            <div className="flex items-center text-sm">
                                <span className="w-20 font-semibold text-slate-600">调查主题:</span>
                                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded text-xs font-medium">{selectedSubmission.theme}</span>
                            </div>
                        )}
                    </div>
                    <hr className="my-6 border-slate-100"/>
                    <div className="prose prose-slate text-slate-800 whitespace-pre-line">
                      {selectedSubmission.content ? (
                          selectedSubmission.content
                      ) : (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/50 rounded-md border border-dashed border-slate-200">
                              <FileText size={32} className="mb-2"/>
                              <p>该学生提交了附件文件</p>
                              <p className="text-xs mb-3 text-brand-600 underline cursor-pointer">{selectedSubmission.fileUrl}</p>
                              <button className="text-xs bg-white border border-slate-300 px-3 py-1 rounded shadow-sm hover:bg-slate-50">点击预览附件</button>
                          </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grading - Action Panel */}
                <div className="space-y-6">
                   <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-700 mb-4 flex items-center">
                        <MessageCircle className="mr-2 text-brand-500" size={20} /> 审核评分
                      </h4>
                      
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">评分 (0-100)</label>
                          <div className="relative">
                            <input 
                                type="number" 
                                className="w-full border-slate-300 rounded-md shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-lg font-mono"
                                value={score}
                                placeholder="85"
                                onChange={(e) => setScore(e.target.value)}
                            />
                            <span className="absolute right-4 top-3.5 text-slate-400 text-sm">分</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">评语与建议</label>
                          <textarea 
                            className="w-full border-slate-300 rounded-md shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 h-40 resize-none"
                            placeholder="请输入具体的修改意见..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                        </div>
                        <div className="flex space-x-4 pt-4">
                           <button 
                             onClick={() => handleReview(selectedSubmission.id, TaskStatus.APPROVED)}
                             className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-3 px-4 rounded-md flex items-center justify-center gap-2 font-medium shadow-sm transition-all"
                           >
                             <Check size={18}/> 通过并评分
                           </button>
                           <button 
                             onClick={() => handleReview(selectedSubmission.id, TaskStatus.REJECTED)}
                             className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 px-4 rounded-md flex items-center justify-center gap-2 font-medium shadow-sm transition-all"
                           >
                             <X size={18}/> 驳回需修改
                           </button>
                        </div>
                      </div>
                   </div>
                   
                   <div className="bg-brand-50 border border-brand-100 p-4 rounded-lg">
                        <h5 className="text-brand-800 font-semibold text-sm mb-1">AI 辅助分析建议</h5>
                        <p className="text-brand-700 text-xs leading-relaxed">
                            {selectedSubmission.score && selectedSubmission.score > 85 
                                ? "该学生表现优异，逻辑清晰，建议给予鼓励。"
                                : "该学生提交的内容结构完整，但数据分析部分稍显薄弱。建议引导其增加定量分析图表。"}
                        </p>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-4">
                   <h3 className="text-lg font-bold text-slate-800">作业待办列表</h3>
                   <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">{submissions.length} 项任务</span>
               </div>
               <div className="flex gap-2">
                   <div className="relative">
                       <Search size={16} className="absolute left-3 top-2.5 text-slate-400"/>
                       <input type="text" placeholder="搜索学生..." className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-48 transition-all"/>
                   </div>
                   <button className="p-2 border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600"><Filter size={18}/></button>
               </div>
             </div>
             <table className="w-full">
               <thead className="bg-white border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">学生姓名</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">任务类型</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">提交时间</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">分数</th>
                   <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {submissions.map((sub) => (
                   <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{sub.studentName}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{TASK_TYPE_CN[sub.taskType]}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{sub.submittedAt}</td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full border 
                         ${sub.status === TaskStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' : 
                           sub.status === TaskStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' : 
                           sub.status === TaskStatus.REVIEWING ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                           'bg-blue-50 text-blue-700 border-blue-200'}`}>
                         {sub.status === TaskStatus.APPROVED ? '已通过' :
                          sub.status === TaskStatus.REJECTED ? '需修改' :
                          sub.status === TaskStatus.REVIEWING ? '审核中' : '已提交'}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">{sub.score || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => setPreviewSubmission(sub)}
                                className="text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
                                title="快速预览"
                            >
                                <Eye size={16}/> <span className="text-xs">预览</span>
                            </button>
                            <button 
                                onClick={() => setSelectedSubmission(sub)}
                                className="text-brand-600 hover:text-brand-800 flex items-center gap-1 font-semibold transition-colors"
                            >
                                <PenTool size={16}/> 审核
                            </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'insights') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">作业提交率</h4>
             <p className="text-3xl font-extrabold text-slate-800 mt-2">85%</p>
             <p className="text-sm text-green-600 mt-2 flex items-center font-medium"><Check size={14} className="mr-1"/> 较上周提升 5%</p>
           </div>
           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">平均分</h4>
             <p className="text-3xl font-extrabold text-slate-800 mt-2">82.4</p>
             <p className="text-sm text-brand-600 mt-2 font-medium">班级平均水平</p>
           </div>
           <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">及格率</h4>
             <p className="text-3xl font-extrabold text-slate-800 mt-2">94%</p>
             <p className="text-sm text-green-600 mt-2 font-medium">表现优异</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-96">
            <h4 className="text-lg font-bold text-slate-800 mb-6">成绩分布</h4>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={MOCK_GRADES}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-96">
            <h4 className="text-lg font-bold text-slate-800 mb-6">完成状态概览</h4>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={MOCK_STATS}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {MOCK_STATS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other tabs
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <div className="p-6 bg-slate-100 rounded-full mb-4 shadow-inner">
         <Settings size={48} className="text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-600">模块开发中</h3>
      <p className="mt-2 text-slate-500">当前模块: {activeTab}</p>
    </div>
  );
};