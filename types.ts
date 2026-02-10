export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export enum TaskType {
  THEME_SELECTION = 'Theme Selection',
  PROCESS_MATERIAL = 'Process Material',
  FINAL_REPORT = 'Final Report'
}

export enum TaskStatus {
  PENDING = 'Pending',
  SUBMITTED = 'Submitted',
  REVIEWING = 'Reviewing',
  APPROVED = 'Approved',
  REJECTED = 'Rejected' // Needs Revision
}

export enum SurveyTheme {
  POLITICS = 'Politics',
  ECONOMY = 'Economy',
  CULTURE = 'Culture',
  SOCIETY = 'Society',
  ECOLOGY = 'Ecology'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  // Student specific
  studentId?: string;
  grade?: string;
  class?: string;
  major?: string;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  taskType: TaskType;
  status: TaskStatus;
  submittedAt: string;
  theme?: SurveyTheme;
  content?: string; // Abstract or file description
  fileUrl?: string; // Mock URL
  score?: number;
  feedback?: string;
}

export interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}