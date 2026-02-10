import React, { useState, useRef, useEffect } from 'react';
import { TaskType, TaskStatus, SurveyTheme, User } from '../../types';
import { checkFormat } from '../../services/geminiService';
import { 
  FileUp, Clock, AlertCircle, CheckCircle2, Shield, User as UserIcon, Book, 
  Loader2, Edit3, Lock, GraduationCap, MapPin, UploadCloud, File, X, 
  Mic, Image, Database, Paperclip, Save, Search, Download, ExternalLink, FileText,
  Eye, Users, Plus, UserPlus, LogOut, MessageSquare, MonitorPlay, ChevronLeft, Calendar,
  Send, MoreHorizontal, Settings, CornerUpLeft, Camera, CheckSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

interface StudentDashboardProps {
  activeTab: string;
  user: User;
  onUpdateUser: (u: Partial<User>) => void;
}

// --- MOCK DATA ---
const MOCK_TASKS = [
  { id: 't1', type: TaskType.THEME_SELECTION, status: TaskStatus.PENDING, deadline: '2026-04-15', description: '从五大主题中选取你的调查方向，并上传初步调查方案。' },
  { id: 't2', type: TaskType.PROCESS_MATERIAL, status: TaskStatus.PENDING, deadline: '2026-05-01', description: '上传访谈录音、问卷数据、多媒体资料及过程说明。' },
  { id: 't3', type: TaskType.FINAL_REPORT, status: TaskStatus.PENDING, deadline: '2026-07-10', description: '撰写并提交最终的社会调查分析报告。' },
];

const MOCK_HISTORY = [
    { name: '作业 1', score: 85 },
    { name: '作业 2', score: 90 },
    { name: '期中', score: 78 },
    { name: '社会调查', score: 92 },
];

const MOCK_RESOURCES = [
    { id: 1, name: '社会调查方法论.pdf', size: '2.4 MB', date: '2026-01-15' },
    { id: 2, name: '问卷设计模板.docx', size: '1.1 MB', date: '2026-01-20' },
    { id: 3, name: '往届优秀报告范例.pdf', size: '5.6 MB', date: '2026-01-01' },
];

const MOCK_SUBMITTED_ASSIGNMENTS = [
  { 
      id: '101', 
      title: '调查选题', 
      submitTime: '2026-01-14 14:30', 
      status: TaskStatus.APPROVED, 
      score: 95, 
      feedback: '选题切入点很好，具有很高的社会研究价值。建议后续在访谈提纲设计上多下功夫，特别是提问方式需要更加通俗易懂。',
      content: '调查题目：社会主义基本经济制度\n主题：经济 (Ecology)\n\n摘要：\n本项目旨在通过对XX社区的实地走访，了解居民对社会主义基本经济制度的认知...',
      attachments: ['调查报告.pdf'] 
  },
  { 
      id: '102', 
      title: '过程性材料提交', 
      submitTime: '2026-01-01 09:15', 
      status: TaskStatus.REVIEWING, 
      score: null, 
      feedback: null,
      content: '已上传访谈录音与初步数据统计表格。',
      attachments: ['录音01.mp3', '数据统计表.xlsx']
  },
];

const MOCK_GROUP = {
    id: 'g1',
    name: '社会调查先锋队',
    slogan: '深入基层，探寻真相',
    members: [
        { id: 'm1', name: '我 (组长)', role: 'Leader', major: '思想政治教育', avatar: 'Me' },
        { id: 'm2', name: '张伟', role: 'Member', major: '思想政治教育', avatar: 'Z' },
        { id: 'm3', name: '王芳', role: 'Member', major: '思想政治教育', avatar: 'W' },
        { id: 'm4', name: '李强', role: 'Member', major: '思想政治教育', avatar: 'L' },
    ]
};

const MOCK_CHAT_MESSAGES = [
    { id: 1, sender: '张伟', text: '大家觉得我们这周五去做访谈怎么样？', time: '10:30', isMe: false, avatar: 'Z' },
    { id: 2, sender: '王芳', text: '我周五上午有课，下午可以。', time: '10:32', isMe: false, avatar: 'W' },
    { id: 3, sender: '我', text: '那就定在周五下午2点吧，大家在北门集合。', time: '10:35', isMe: true, avatar: 'Me' },
    { id: 4, sender: '李强', text: '收到，我会带上录音笔。', time: '10:36', isMe: false, avatar: 'L' },
];

// Definition for flowchart steps
const FLOW_STEPS = [
    { id: 't1', taskLabel: '任务一', title: '调查选题' },
    { id: 't2', taskLabel: '任务二', title: '过程性材料' },
    { id: 't3', taskLabel: '任务三', title: '调查报告' },
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab, user, onUpdateUser }) => {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  // Add state for the flowchart navigation
  const [activeTaskStep, setActiveTaskStep] = useState<string>(MOCK_TASKS[0].id);

  // Group States
  const [group, setGroup] = useState(MOCK_GROUP);
  const [groupView, setGroupView] = useState<'overview' | 'chat' | 'edit'>('overview');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteMajor, setInviteMajor] = useState(''); // New state for Major
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [editForm, setEditForm] = useState({ name: group.name, slogan: group.slogan });
  
  // Group Avatar State
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);

  // Profile States
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
      name: user.name,
      major: user.major || '',
      class: user.class || ''
  });

  // AI & Form States
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formatText, setFormatText] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // State for Query Tab Detail View
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // --- Effects ---
  useEffect(() => {
      if (groupView === 'chat') {
          scrollToBottom();
      }
  }, [groupView, chatMessages]);

  useEffect(() => {
      setProfileForm({
          name: user.name,
          major: user.major || '',
          class: user.class || ''
      });
  }, [user]);

  const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Handlers ---
  const handleFormChange = (taskId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  };

  const handleTaskSubmit = (taskId: string) => {
    const currentData = formData[taskId];
    const hasData = currentData && Object.values(currentData).some(val => val !== null && val !== '');
    
    if (!hasData) {
        alert("请至少填写一项内容或上传一个文件后提交");
        return;
    }
    setTimeout(() => {
        setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, status: TaskStatus.SUBMITTED } : t
        ));
        alert("作业提交成功！\n\n在教师审核通过前，您可以随时修改并重新提交。");
    }, 800);
  };

  const handleFormatCheck = async () => {
    if (!formatText) return;
    setIsAnalyzing(true);
    const result = await checkFormat(formatText);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  // Group Handlers
  const handleInviteMember = (e: React.FormEvent) => {
      e.preventDefault();
      if(!inviteInput.trim()) return;
      
      const newMember = {
          id: `m${Date.now()}`,
          name: inviteInput,
          role: 'Member',
          major: inviteMajor || '未知专业', 
          avatar: inviteInput.charAt(0).toUpperCase()
      };
      
      setGroup(prev => ({
          ...prev,
          members: [...prev.members, newMember]
      }));
      setInviteInput('');
      setInviteMajor('');
      setInviteModalOpen(false);
      alert(`成功邀请成员: ${newMember.name}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      const newMsg = {
          id: Date.now(),
          sender: '我',
          text: chatInput,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: true,
          avatar: 'Me'
      };
      setChatMessages([...chatMessages, newMsg]);
      setChatInput('');
  };

  const handleSaveGroupInfo = (e: React.FormEvent) => {
      e.preventDefault();
      setGroup(prev => ({ ...prev, name: editForm.name, slogan: editForm.slogan }));
      setGroupView('overview');
      alert('小组信息更新成功！');
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

  const handleGroupAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setGroupAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateUser({
          name: profileForm.name,
          major: profileForm.major,
          class: profileForm.class
      });
      setIsEditProfileOpen(false);
      alert('个人资料已更新');
  };

  // --- Components ---
  const FileInput = ({ label, icon: Icon, file, onChange, onDelete, disabled }: any) => (
    <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1">
            {label}
        </label>
        {!file ? (
        <div className="relative group">
            <input 
                type="file" 
                className="hidden" 
                disabled={disabled}
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        onChange(e.target.files[0]);
                    }
                }} 
            />
            <div 
                onClick={(e) => !disabled && (e.currentTarget.previousSibling as HTMLInputElement).click()}
                className={`flex flex-col items-center justify-center gap-3 px-4 py-8 bg-brand-50/50 border-2 border-dashed rounded-xl transition-all h-32
                    ${disabled 
                        ? 'border-slate-200 cursor-not-allowed opacity-60' 
                        : 'border-brand-200 cursor-pointer hover:bg-brand-50 hover:border-brand-400 group-hover:shadow-md'}`}
            >
                <div className={`p-2.5 rounded-full shadow-sm transition-all border
                    ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-brand-300 group-hover:text-brand-600 border-brand-100 group-hover:border-brand-200 group-hover:scale-110'}`}>
                    {Icon ? <Icon size={24} /> : <UploadCloud size={24}/>}
                </div>
                <div className="text-center">
                    <span className={`text-sm font-semibold decoration-2 underline-offset-2
                        ${disabled ? 'text-slate-400' : 'text-brand-600 group-hover:underline'}`}>
                        {disabled ? '禁止上传' : '点击上传'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">支持 PDF, Word, MP3, JPG</p>
                </div>
            </div>
        </div>
        ) : (
        <div className="relative group overflow-hidden bg-white border border-brand-200 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center p-3 gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 border border-brand-100">
                    {Icon ? <Icon size={20}/> : <FileText size={20}/>}
                </div>
                <div className="flex-1 min-w-0">
                     <p 
                        onClick={() => handleViewFile(file)}
                        className="text-sm font-bold text-slate-700 truncate cursor-pointer hover:text-brand-600 transition-colors" 
                        title="点击查看文件详情"
                     >
                         {file.name}
                     </p>
                     <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        {formatFileSize(file.size)}
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-brand-600 cursor-pointer hover:underline" onClick={() => handleViewFile(file)}>查看</span>
                     </p>
                </div>
                {!disabled && (
                    <button 
                        onClick={onDelete} 
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除文件"
                    >
                        <X size={18}/>
                    </button>
                )}
            </div>
            <div className="h-1 w-full bg-slate-100">
                <div className="h-full bg-brand-500 w-full"></div>
            </div>
        </div>
        )}
    </div>
  );

  // --- RENDER LOGIC ---

  if (activeTab === 'tasks') {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">任务中心</h3>
            <div className="text-sm text-brand-700 bg-brand-50 px-4 py-2 rounded-full shadow-sm border border-brand-200 flex items-center gap-2">
                <Clock size={16}/> 本学期共 <span className="font-bold">{tasks.length}</span> 个阶段任务
            </div>
        </div>

        {/* FLOWCHART NAVIGATION */}
        <div className="flex w-full mb-6 filter drop-shadow-sm select-none">
            {FLOW_STEPS.map((step, index) => {
                const isActive = activeTaskStep === step.id;
                // Clip-path calculations to create interlocking arrows
                // First item: Arrow point on right, flat left
                // Middle items: Arrow point on right, arrow notch on left
                // Last item: Flat right, arrow notch on left
                let clipPathStyle = {};
                if (index === 0) {
                    clipPathStyle = { clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)' };
                } else if (index === FLOW_STEPS.length - 1) {
                    clipPathStyle = { clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)', marginLeft: '-20px' };
                } else {
                    clipPathStyle = { clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)', marginLeft: '-20px' };
                }

                return (
                    <div 
                        key={step.id}
                        onClick={() => setActiveTaskStep(step.id)}
                        className={`flex-1 h-20 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative z-${10-index} 
                            ${isActive 
                                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white' 
                                : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        style={clipPathStyle}
                    >
                        <span className={`text-[10px] uppercase tracking-widest mb-1 font-bold opacity-80 ${isActive ? 'text-brand-100' : 'text-slate-400'}`}>
                            {step.taskLabel}
                        </span>
                        <span className="text-lg font-bold tracking-tight">
                            {step.title}
                        </span>
                    </div>
                );
            })}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {tasks.filter(t => t.id === activeTaskStep).map((task) => {
            const data = formData[task.id] || {};
            const isLocked = task.status === TaskStatus.APPROVED;

            return (
            <div key={task.id} className="bg-white border border-brand-100/50 rounded-2xl p-0 shadow-sm transition-all relative overflow-hidden flex flex-col lg:flex-row group animate-in fade-in slide-in-from-bottom-2 duration-300">
               {/* Left Status Strip */}
               <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 ${
                 task.status === TaskStatus.APPROVED ? 'bg-emerald-500' :
                 task.status === TaskStatus.SUBMITTED ? 'bg-brand-500' :
                 task.status === TaskStatus.REJECTED ? 'bg-red-500' :
                 'bg-slate-300'
               }`}></div>

               {/* Task Info */}
               <div className="lg:w-1/3 p-8 border-b lg:border-b-0 lg:border-r border-brand-100 bg-slate-50">
                 <div className="flex items-start justify-between gap-4 mb-4">
                    <h4 className="text-lg font-bold text-slate-800 leading-tight">
                        {task.type === TaskType.THEME_SELECTION ? '1. 调查选题确认' :
                         task.type === TaskType.PROCESS_MATERIAL ? '2. 过程性材料' : '3. 调查报告'}
                    </h4>
                    <span className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide border
                        ${task.status === TaskStatus.PENDING ? 'bg-slate-100 text-slate-500 border-slate-200' :
                        task.status === TaskStatus.SUBMITTED ? 'bg-brand-50 text-brand-700 border-brand-200' :
                        task.status === TaskStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {task.status === TaskStatus.PENDING ? '待提交' :
                        task.status === TaskStatus.SUBMITTED ? '已提交' :
                        task.status === TaskStatus.APPROVED ? '已通过' : '需修改'}
                    </span>
                 </div>
                 <p className="text-slate-600 text-sm leading-relaxed mb-6">{task.description}</p>
                 <div className="flex items-center text-xs text-brand-700 font-medium bg-white px-3 py-2 rounded-lg border border-brand-100 inline-flex shadow-sm">
                   <Clock size={14} className="mr-2 text-brand-500"/> 截止日期: {task.deadline}
                 </div>
                 {task.status !== TaskStatus.PENDING && (
                     <div className="mt-6 pt-6 border-t border-brand-200/60">
                         <p className="text-xs font-semibold text-slate-500 mb-1">审核状态</p>
                         <p className={`text-sm font-medium ${
                             task.status === TaskStatus.APPROVED ? 'text-emerald-600' : 
                             task.status === TaskStatus.REJECTED ? 'text-red-600' : 'text-brand-600'
                         }`}>
                             {task.status === TaskStatus.APPROVED ? '恭喜，作业已通过审核！' :
                              task.status === TaskStatus.REJECTED ? '请根据反馈修改后重新提交。' :
                              '正在等待教师审核...'}
                         </p>
                     </div>
                 )}
               </div>

               {/* Task Form */}
               <div className="flex-1 p-8 bg-white">
                  {task.type === TaskType.THEME_SELECTION && (
                      <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">调查题目</label>
                                  <input 
                                    type="text" 
                                    disabled={isLocked}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 transition-all shadow-sm"
                                    placeholder="请输入您的调查题目"
                                    value={data.title || ''}
                                    onChange={(e) => handleFormChange(task.id, 'title', e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">主题类型</label>
                                  <div className="relative">
                                    <select 
                                        disabled={isLocked}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3.5 appearance-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 transition-all shadow-sm"
                                        value={data.theme || ''}
                                        onChange={(e) => handleFormChange(task.id, 'theme', e.target.value)}
                                    >
                                        <option value="">请选择主题类型...</option>
                                        <option value={SurveyTheme.POLITICS}>政治</option>
                                        <option value={SurveyTheme.ECONOMY}>经济</option>
                                        <option value={SurveyTheme.CULTURE}>文化</option>
                                        <option value={SurveyTheme.SOCIETY}>社会</option>
                                        <option value={SurveyTheme.ECOLOGY}>生态</option>
                                    </select>
                                    <div className="absolute right-4 top-4 text-slate-400 pointer-events-none">▼</div>
                                  </div>
                              </div>
                          </div>
                          <div>
                                <FileInput 
                                    label="调查方案文件 (PDF/Word)" 
                                    file={data.schemeFile}
                                    disabled={isLocked}
                                    onChange={(f: File) => handleFormChange(task.id, 'schemeFile', f)}
                                    onDelete={() => !isLocked && handleFormChange(task.id, 'schemeFile', null)}
                                />
                          </div>
                      </div>
                  )}

                  {task.type === TaskType.PROCESS_MATERIAL && (
                      <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <FileInput 
                                icon={Mic}
                                label="访谈记录" 
                                file={data.interviewFile}
                                disabled={isLocked}
                                onChange={(f: File) => handleFormChange(task.id, 'interviewFile', f)}
                                onDelete={() => !isLocked && handleFormChange(task.id, 'interviewFile', null)}
                              />
                              <FileInput 
                                icon={Image}
                                label="照片/视频" 
                                file={data.mediaFile}
                                disabled={isLocked}
                                onChange={(f: File) => handleFormChange(task.id, 'mediaFile', f)}
                                onDelete={() => !isLocked && handleFormChange(task.id, 'mediaFile', null)}
                              />
                              <FileInput 
                                icon={Database}
                                label="问卷数据" 
                                file={data.dataFile}
                                disabled={isLocked}
                                onChange={(f: File) => handleFormChange(task.id, 'dataFile', f)}
                                onDelete={() => !isLocked && handleFormChange(task.id, 'dataFile', null)}
                              />
                              <FileInput 
                                icon={Paperclip}
                                label="其他材料" 
                                file={data.otherFile}
                                disabled={isLocked}
                                onChange={(f: File) => handleFormChange(task.id, 'otherFile', f)}
                                onDelete={() => !isLocked && handleFormChange(task.id, 'otherFile', null)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">材料说明与备注</label>
                              <textarea 
                                disabled={isLocked}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3.5 h-24 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-all shadow-sm"
                                placeholder="请简要说明您上传的材料内容..."
                                value={data.description || ''}
                                onChange={(e) => handleFormChange(task.id, 'description', e.target.value)}
                              />
                          </div>
                      </div>
                  )}

                  {task.type === TaskType.FINAL_REPORT && (
                      <div className="space-y-6">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">报告标题</label>
                              <input 
                                type="text" 
                                disabled={isLocked}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 transition-all shadow-sm"
                                placeholder="请输入最终报告标题"
                                value={data.reportTitle || ''}
                                onChange={(e) => handleFormChange(task.id, 'reportTitle', e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">报告摘要</label>
                              <textarea 
                                disabled={isLocked}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3.5 h-24 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-all shadow-sm"
                                placeholder="请输入报告摘要 (300字以内)"
                                value={data.abstract || ''}
                                onChange={(e) => handleFormChange(task.id, 'abstract', e.target.value)}
                              />
                          </div>
                          <div>
                                <FileInput 
                                    label="上传最终报告 (PDF)" 
                                    file={data.reportFile}
                                    disabled={isLocked}
                                    onChange={(f: File) => handleFormChange(task.id, 'reportFile', f)}
                                    onDelete={() => !isLocked && handleFormChange(task.id, 'reportFile', null)}
                                />
                          </div>
                      </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                      {isLocked ? (
                          <button disabled className="px-6 py-2.5 bg-slate-100 text-slate-400 rounded-lg font-medium text-sm flex items-center gap-2 cursor-not-allowed">
                              <Lock size={16}/> 已锁定 (已通过审核)
                          </button>
                      ) : (
                          <button 
                            onClick={() => handleTaskSubmit(task.id)}
                            className="px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
                          >
                             {task.status === TaskStatus.SUBMITTED || task.status === TaskStatus.REJECTED ? (
                                 <><Edit3 size={18}/> 更新提交</>
                             ) : (
                                 <><Save size={18}/> 提交作业</>
                             )}
                          </button>
                      )}
                  </div>
               </div>
            </div>
          )})}
        </div>
      </div>
    );
  }

  // --- MY GROUP MODULE ---
  if (activeTab === 'group') {
      if (groupView === 'chat') {
          return (
              <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setGroupView('overview')}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                          >
                              <ChevronLeft size={20}/>
                          </button>
                          <div>
                              <h3 className="font-bold text-slate-800">{group.name}</h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span> 讨论组 ({group.members.length}人)
                              </p>
                          </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                          <MoreHorizontal size={20}/>
                      </button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-6">
                      {chatMessages.map(msg => (
                          <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center font-bold text-sm shadow-sm">
                                  {msg.avatar}
                              </div>
                              <div className={`max-w-[70%] space-y-1 ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <span>{msg.sender}</span>
                                      <span>{msg.time}</span>
                                  </div>
                                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                      msg.isMe 
                                      ? 'bg-brand-600 text-white rounded-tr-none' 
                                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                  }`}>
                                      {msg.text}
                                  </div>
                              </div>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 bg-white border-t border-slate-100">
                      <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                          <input 
                              type="text" 
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all pr-12"
                              placeholder="输入消息参与讨论..."
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                          />
                          <button 
                            type="submit"
                            disabled={!chatInput.trim()}
                            className="absolute right-2 top-1.5 p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                              <Send size={18}/>
                          </button>
                      </form>
                  </div>
              </div>
          )
      }

      if (groupView === 'edit') {
          return (
              <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <h3 className="text-xl font-bold text-slate-800">编辑小组信息</h3>
                          <button 
                            onClick={() => setGroupView('overview')}
                            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
                          >
                              <X size={20}/>
                          </button>
                      </div>
                      <form onSubmit={handleSaveGroupInfo} className="p-8 space-y-6">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">小组名称</label>
                              <input 
                                type="text" 
                                required
                                className="w-full border-slate-300 rounded-lg p-3 border focus:ring-2 focus:ring-brand-500 transition-all"
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">小组口号 (Slogan)</label>
                              <input 
                                type="text" 
                                required
                                className="w-full border-slate-300 rounded-lg p-3 border focus:ring-2 focus:ring-brand-500 transition-all"
                                value={editForm.slogan}
                                onChange={e => setEditForm({...editForm, slogan: e.target.value})}
                              />
                          </div>
                          <div className="pt-4 flex justify-end gap-3">
                              <button 
                                type="button" 
                                onClick={() => setGroupView('overview')}
                                className="px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                              >
                                  取消
                              </button>
                              <button 
                                type="submit" 
                                className="px-6 py-2.5 text-white bg-brand-600 hover:bg-brand-700 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
                              >
                                  <Save size={18}/> 保存更改
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )
      }

      return (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Invite Modal */}
            {inviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">邀请新成员</h3>
                            <button onClick={() => setInviteModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        <form onSubmit={handleInviteMember} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">用户名 / 学号</label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="w-full border-slate-300 rounded-lg p-3 border focus:ring-2 focus:ring-brand-500"
                                    placeholder="请输入对方的用户名或学号"
                                    value={inviteInput}
                                    onChange={e => setInviteInput(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">专业</label>
                                <input 
                                    type="text" 
                                    className="w-full border-slate-300 rounded-lg p-3 border focus:ring-2 focus:ring-brand-500"
                                    placeholder="例如：社会学"
                                    value={inviteMajor}
                                    onChange={e => setInviteMajor(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setInviteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">取消</button>
                                <button type="submit" disabled={!inviteInput.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">发送邀请</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-bold text-slate-800 tracking-tight">我的小组</h3>
                   <p className="text-slate-500 text-sm mt-1">组队协作完成社会调查，最多支持5人组队。</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setGroupView('chat')}
                        className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm font-semibold hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <MessageSquare size={16}/> 小组讨论
                    </button>
                    <button 
                        onClick={() => {
                            setEditForm({ name: group.name, slogan: group.slogan });
                            setGroupView('edit');
                        }}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors shadow-md flex items-center gap-2"
                    >
                        <Edit3 size={16}/> 编辑信息
                    </button>
                </div>
             </div>

             {/* Group Info Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-brand-200 overflow-hidden relative group">
                 <div className="h-32 bg-gradient-to-r from-brand-700 to-brand-500 relative overflow-hidden">
                     <div className="absolute inset-0 bg-black/10"></div>
                 </div>
                 <div className="px-8 pb-8">
                     <div className="flex justify-between items-end -mt-10 mb-6 relative z-10">
                         <div className="bg-white p-1.5 rounded-2xl shadow-lg relative group cursor-pointer">
                             <input 
                                type="file" 
                                ref={groupAvatarInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleGroupAvatarChange}
                             />
                             <div 
                                onClick={() => groupAvatarInputRef.current?.click()}
                                className="h-20 w-20 bg-brand-50 rounded-xl flex items-center justify-center text-3xl border border-brand-100 text-slate-700 overflow-hidden relative"
                             >
                                 {groupAvatar ? (
                                     <img src={groupAvatar} alt="Group" className="w-full h-full object-cover" />
                                 ) : (
                                     "👥"
                                 )}
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                     <Camera size={24}/>
                                 </div>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold border border-brand-200 shadow-sm">
                                <Users size={12}/> 成员 {group.members.length} / 5
                             </div>
                         </div>
                     </div>
                     <div>
                         <h2 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-3">
                             {group.name}
                         </h2>
                         <p className="text-slate-500 text-sm italic">"{group.slogan}"</p>
                     </div>
                 </div>
             </div>

             {/* Members Grid */}
             <div>
                 <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <UserIcon size={20} className="text-brand-600"/> 小组成员
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {group.members.map(member => (
                         <div key={member.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex items-center gap-4 group">
                             <div className="h-14 w-14 rounded-full bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold text-xl group-hover:bg-brand-600 group-hover:text-white transition-colors flex-shrink-0 overflow-hidden">
                                 {member.avatar}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start">
                                    <h5 className="font-bold text-slate-800 truncate">{member.name}</h5>
                                    {member.role === 'Leader' && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">组长</span>
                                    )}
                                 </div>
                                 <p className="text-sm text-slate-500 truncate">{member.major}</p>
                             </div>
                         </div>
                     ))}
                     
                     {/* Add Member Slot */}
                     {group.members.length < 5 && (
                         <div 
                            onClick={() => setInviteModalOpen(true)}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-all cursor-pointer min-h-[100px] group"
                         >
                             <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-brand-100 transition-colors">
                                 <Plus size={24}/>
                             </div>
                             <span className="text-sm font-semibold group-hover:underline">邀请新成员</span>
                         </div>
                     )}
                 </div>
             </div>
          </div>
      );
  }

  // --- QUERY / ASSIGNMENT HISTORY ---
  if (activeTab === 'query') {
    if (selectedAssignment) {
      // Detail View
      return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
           {/* Header with Back Button */}
           <button onClick={() => setSelectedAssignment(null)} className="mb-4 flex items-center text-slate-500 hover:text-brand-600 transition-colors">
             <ChevronLeft size={16} className="mr-1"/> 返回列表
           </button>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header Banner */}
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedAssignment.title}</h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                        <span className="font-mono">ID: {selectedAssignment.id}</span>
                        <span>•</span>
                        <span>提交于 {selectedAssignment.submitTime}</span>
                    </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    selectedAssignment.status === TaskStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedAssignment.status === TaskStatus.REVIEWING ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                 }`}>
                    {selectedAssignment.status === TaskStatus.APPROVED ? '已通过' :
                     selectedAssignment.status === TaskStatus.REVIEWING ? '审核中' : '已提交'}
                 </div>
              </div>

              <div className="p-8 space-y-8">
                 {/* Score & Feedback Section (Only if graded) */}
                 {(selectedAssignment.score || selectedAssignment.feedback) && (
                    <div className="bg-brand-50 rounded-xl border border-brand-100 p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-400"></div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <CheckSquare size={20} className="text-brand-600"/> 教师反馈
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            {selectedAssignment.score && (
                                <div className="flex-shrink-0 text-center px-6 py-4 bg-white rounded-lg border border-brand-100 shadow-sm">
                                    <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">最终得分</span>
                                    <span className="block text-4xl font-extrabold text-brand-600 mt-1">{selectedAssignment.score}</span>
                                </div>
                            )}
                            <div className="flex-1">
                                {selectedAssignment.feedback ? (
                                    <p className="text-slate-600 text-sm leading-relaxed italic">
                                        "{selectedAssignment.feedback}"
                                    </p>
                                ) : (
                                    <p className="text-slate-400 text-sm italic">暂无文字评语</p>
                                )}
                            </div>
                        </div>
                    </div>
                 )}

                 {/* Submission Content */}
                 <div>
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <FileText size={20} className="text-slate-400"/> 提交内容
                     </h3>
                     <div className="bg-slate-50 rounded-xl p-6 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200 font-mono">
                         {selectedAssignment.content}
                     </div>
                 </div>

                 {/* Attachments */}
                 {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                     <div>
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Paperclip size={20} className="text-slate-400"/> 附件列表
                         </h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {selectedAssignment.attachments.map((file: string, idx: number) => (
                                 <div key={idx} className="flex items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:shadow-sm transition-all group cursor-pointer">
                                     <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center mr-3 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                         <File size={18}/>
                                     </div>
                                     <div className="flex-1 overflow-hidden">
                                         <p className="text-sm font-medium text-slate-700 truncate group-hover:text-brand-700">{file}</p>
                                         <p className="text-xs text-slate-400">点击下载</p>
                                     </div>
                                     <Download size={16} className="text-slate-300 group-hover:text-brand-500"/>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
              </div>
           </div>
        </div>
      );
    }

    // List View
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-bold text-slate-800 tracking-tight">作业查询</h3>
                   <p className="text-slate-500 text-sm mt-1">查看历史提交记录、审核状态及教师反馈。</p>
                </div>
            </div>

            <div className="grid gap-4">
                {MOCK_SUBMITTED_ASSIGNMENTS.map((assignment) => (
                    <div key={assignment.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{assignment.title}</h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                    assignment.status === TaskStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200' :
                                    assignment.status === TaskStatus.REVIEWING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    {assignment.status === TaskStatus.APPROVED ? '已通过' :
                                     assignment.status === TaskStatus.REVIEWING ? '审核中' : '已提交'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Calendar size={14}/> {assignment.submitTime}</span>
                                {assignment.score && <span className="flex items-center gap-1 font-semibold text-brand-600"><CheckSquare size={14}/> 得分: {assignment.score}</span>}
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedAssignment(assignment)}
                            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-brand-600 hover:border-brand-300 transition-all flex items-center gap-2 shadow-sm"
                        >
                            查看详情 <ChevronLeft size={16} className="rotate-180"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // ... (Other tabs 'resources', 'format', 'profile' logic remains same)
  if (activeTab === 'resources') {
      return (
          <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">资料中心</h3>
                    <p className="text-slate-500 text-sm mt-1">下载教师发布的指导材料、参考模板及优秀范例。</p>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MOCK_RESOURCES.map(file => (
                      <div key={file.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col justify-between group">
                          <div>
                              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                                  <FileText size={24}/>
                              </div>
                              <h4 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2">{file.name}</h4>
                              <p className="text-slate-500 text-xs font-medium">{file.size} • {file.date}</p>
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                              <button className="flex-1 py-2 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                                  <Download size={16}/> 下载
                              </button>
                              <button className="py-2 px-3 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors" title="预览">
                                  <Eye size={16}/>
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  if (activeTab === 'format') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 size={24} className="text-brand-600"/> 格式智能检验
          </h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            请在下方粘贴您的报告摘要或正文片段。系统将通过 AI 分析其学术语调、逻辑结构及格式规范性，助您提升报告质量。
          </p>
          
          <div className="relative">
            <textarea
                className="w-full h-56 rounded-xl border-slate-300 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 p-5 text-sm font-mono leading-relaxed transition-all resize-none"
                placeholder="在此处粘贴文本..."
                value={formatText}
                onChange={(e) => setFormatText(e.target.value)}
            ></textarea>
            <div className="absolute bottom-4 right-4">
                <button
                onClick={handleFormatCheck}
                disabled={isAnalyzing || !formatText}
                className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-95"
                >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <Shield size={18}/>}
                {isAnalyzing ? '正在分析...' : '开始检测'}
                </button>
            </div>
          </div>
        </div>

        {aiAnalysis && (
           <div className="bg-white border-l-4 border-brand-500 p-8 rounded-r-xl shadow-md animate-in fade-in slide-in-from-bottom-4">
             <h4 className="font-bold text-slate-800 mb-4 text-lg">分析报告</h4>
             <div className="prose prose-slate prose-sm text-slate-600 max-w-none">
               {aiAnalysis.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
             </div>
           </div>
        )}
      </div>
    );
  }

  // Personal Profile - Left Sidebar + Right Content Layout
  if (activeTab === 'profile') {
    return (
      <div className="grid grid-cols-12 gap-8 h-full">
        {/* Left Column: Avatar & Basic Info Card */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-0">
             <div className="h-24 bg-brand-600"></div>
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
                    <p className="text-slate-500 text-sm mt-1">{user.major ? `${user.major} • 学生` : '学生'}</p>
                    
                    <div className="mt-6 space-y-4 text-left">
                        <div className="flex items-center text-sm text-slate-600 border-b border-slate-50 pb-2">
                            <GraduationCap size={16} className="mr-3 text-brand-500"/>
                            <span className="flex-1">年级/班级</span>
                            <span className="font-medium text-slate-800">{user.class || '未设置'}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600 border-b border-slate-50 pb-2">
                            <MapPin size={16} className="mr-3 text-brand-500"/>
                            <span className="flex-1">院系</span>
                            <span className="font-medium text-slate-800">{user.major || '未设置'}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600 pb-2">
                            <UserIcon size={16} className="mr-3 text-brand-500"/>
                            <span className="flex-1">学号</span>
                            <span className="font-medium text-slate-800">{user.studentId || '2023001'}</span>
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
            {/* Section: Study Stats */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                    <Book size={20} className="text-brand-500"/> 学习概况
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase font-bold">已提交作业</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">2 份</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase font-bold">平均得分</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">92.5</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase font-bold">所属小组</p>
                        <p className="text-2xl font-bold text-brand-600 mt-1 truncate">{group.name}</p>
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
                                className="w-full border-slate-300 rounded-md p-2.5 border focus:ring-2 focus:ring-brand-500"
                                value={profileForm.name}
                                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">专业</label>
                            <input 
                                type="text" 
                                className="w-full border-slate-300 rounded-md p-2.5 border focus:ring-2 focus:ring-brand-500"
                                value={profileForm.major}
                                placeholder="例如：社会学"
                                onChange={e => setProfileForm({...profileForm, major: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">班级</label>
                            <input 
                                type="text" 
                                className="w-full border-slate-300 rounded-md p-2.5 border focus:ring-2 focus:ring-brand-500"
                                value={profileForm.class}
                                placeholder="例如：2班"
                                onChange={e => setProfileForm({...profileForm, class: e.target.value})}
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

  // Fallback
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