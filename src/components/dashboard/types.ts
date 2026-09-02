export interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  hiredThisMonth: number;
  interviewsScheduled: number;
  trends: {
    activeJobs: number;
    totalApplications: number;
    hiredThisMonth: number;
    interviewsScheduled: number;
  };
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  count: number;
}

export interface FunnelPoint {
  stage: string;
  count: number;
}

export interface JobPosting {
  id: string;
  title: string;
  status: string;
  applicationsCount: number;
  daysUntilExpiry: number | null;
  publicUrl: string;
  createdAt: string;
}

export interface UpcomingInterviewItem {
  id: string;
  candidateName: string;
  jobTitle: string;
  scheduledTime: string | null;
  status: string;
  matchScore: number | null;
}

export interface TopCandidate {
  id: string;
  name: string;
  jobTitle: string;
  matchScore: number | null;
  status: string;
}

export interface RecentActivityItem {
  id: string;
  candidateName: string;
  jobTitle: string;
  previousStage: string;
  newStage: string;
  createdAt: string;
}

export interface DashboardData {
  company: {
    id: string;
    name: string;
    plan: string;
  };
  stats: DashboardStats;
  applicationsOverTime: TimeSeriesPoint[];
  hiringFunnel: FunnelPoint[];
  jobPostings: JobPosting[];
  upcomingInterviews: UpcomingInterviewItem[];
  topCandidates: TopCandidate[];
  recentActivity: RecentActivityItem[];
}

export interface CreatedJob {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  expiryDate: string | null;
  publicUrl: string;
  publicLink: string;
  status: string;
  applicationsCount: number;
  createdAt: string;
}
