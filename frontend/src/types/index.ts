export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Note {
  id: string;
  subject_id?: string;
  title: string;
  content: string;
  summary?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyTask {
  id: string;
  subject_id?: string;
  title: string;
  due_date?: string;
  estimated_minutes: number;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  task_type: 'study' | 'exam' | 'assignment' | 'revision';
  created_at: string;
}

export interface Flashcard {
  id: string;
  subject_id?: string;
  note_id?: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  created_at: string;
}

export interface MindmapNodeData {
  id: string;
  label: string;
  description?: string;
  category: 'core_topic' | 'subtopic' | 'formula' | 'example' | 'warning';
  parent_id?: string;
  [key: string]: any;
}

export interface MindmapEdgeData {
  id: string;
  source: string;
  target: string;
  relation?: string;
}

export interface MindmapResponse {
  id?: string;
  title: string;
  central_topic: string;
  nodes: MindmapNodeData[];
  edges: MindmapEdgeData[];
}

export interface StudyWeek {
  week_number: number;
  theme: string;
  topics: string[];
  deliverables_or_exams?: string;
  recommended_study_hours: number;
}

export interface ExamMilestone {
  title: string;
  estimated_week?: number;
  weight?: string;
  topics_covered: string[];
}

export interface SyllabusParseResponse {
  course_name: string;
  professor?: string;
  semester_weeks: number;
  key_objectives: string[];
  weekly_schedule: StudyWeek[];
  exams_and_deadlines: ExamMilestone[];
  suggested_reading: string[];
}

export interface ActionableTask {
  title: string;
  estimated_minutes: number;
  priority: 'low' | 'medium' | 'high';
}

export interface NoteSummaryResponse {
  title: string;
  bullet_summary: string[];
  key_formulas_or_definitions: string[];
  action_items: ActionableTask[];
  follow_up_questions: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AIStatus {
  active_provider: string;
  environment: string;
  gemini_model?: string;
  local_llm_model?: string;
  is_mock: boolean;
}
