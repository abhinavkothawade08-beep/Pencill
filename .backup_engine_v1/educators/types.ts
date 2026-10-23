import { z } from 'zod';

export interface MasterEducatorRecord {
  Educator_ID: string;
  Educator_Name: string;
  Educator_Type: string;
  YouTube_Channel_Name: string;
  YouTube_Channel_ID: string;
  Official_Channel_URL: string;
  Official_Website: string;
  Primary_Domain: string;
  Subdomain: string;
  Subjects: string;
  Relevant_Examinations: string;
  Country: string;
  Primary_Language: string;
  Additional_Languages: string;
  Teaching_Level: string;
  Teaching_Specialization: string;
  Available_Resource_Types: string;
  Complete_Course_Available: 'Yes' | 'No' | string;
  Playlist_Available: 'Yes' | 'No' | string;
  Subject_Expertise_Evidence: string;
  Educational_Credibility: string;
  Quality_Assessment: string;
  Verification_Status: 'VERIFIED' | 'CANDIDATE' | 'REQUIRES_REVIEW' | 'REJECTED' | 'INACTIVE' | string;
  Active_Status: 'Active' | 'Inactive' | string;
  Last_Verified_Date: string;
  Source_URLs: string;
  Research_Notes: string;
}

export const MasterEducatorSchema = z.object({
  Educator_ID: z.string().min(1, 'Educator_ID is required'),
  Educator_Name: z.string().min(1, 'Educator_Name is required'),
  Educator_Type: z.string().default('Individual Educator'),
  YouTube_Channel_Name: z.string().min(1, 'YouTube_Channel_Name is required'),
  YouTube_Channel_ID: z.string().default(''),
  Official_Channel_URL: z.string().min(1, 'Official_Channel_URL is required'),
  Official_Website: z.string().default(''),
  Primary_Domain: z.string().min(1, 'Primary_Domain is required'),
  Subdomain: z.string().default(''),
  Subjects: z.string().min(1, 'Subjects is required'),
  Relevant_Examinations: z.string().default(''),
  Country: z.string().default('India'),
  Primary_Language: z.string().min(1, 'Primary_Language is required'),
  Additional_Languages: z.string().default(''),
  Teaching_Level: z.string().default(''),
  Teaching_Specialization: z.string().default(''),
  Available_Resource_Types: z.string().default('Playlists'),
  Complete_Course_Available: z.string().default('No'),
  Playlist_Available: z.string().default('Yes'),
  Subject_Expertise_Evidence: z.string().default(''),
  Educational_Credibility: z.string().default(''),
  Quality_Assessment: z.string().default('High'),
  Verification_Status: z.enum(['VERIFIED', 'CANDIDATE', 'REQUIRES_REVIEW', 'REJECTED', 'INACTIVE']).or(z.string()).default('VERIFIED'),
  Active_Status: z.enum(['Active', 'Inactive']).or(z.string()).default('Active'),
  Last_Verified_Date: z.string().default('2026-10-18'),
  Source_URLs: z.string().default(''),
  Research_Notes: z.string().default(''),
});

export interface DomainTaxonomyRecord {
  Domain_ID: string;
  Domain_Name: string;
  Parent_Domain: string;
  Subdomain: string;
  Subject: string;
  Relevant_Learning_Levels: string;
  Country_or_Region: string;
  Coverage_Status: string;
  Research_Notes: string;
}

export interface ExaminationBlueprintRecord {
  Exam_ID: string;
  Examination_Name: string;
  Country: string;
  State_or_Region: string;
  Exam_Category: string;
  Conducting_Authority: string;
  Official_Website: string;
  Official_Syllabus_URL: string;
  Subjects: string;
  Exam_Status: string;
  Applicable_Year_or_Version: string;
  Relevant_Educator_IDs: string;
  Verification_Status: string;
  Last_Verified_Date: string;
}

export interface VerifiedLearningResourceRecord {
  Resource_ID: string;
  Educator_ID: string;
  YouTube_Channel_ID: string;
  Resource_Title: string;
  Resource_URL: string;
  YouTube_Video_ID_or_Playlist_ID: string;
  Resource_Type: string;
  Primary_Domain: string;
  Subject: string;
  Covered_Topics: string;
  Learning_Level: string;
  Language: string;
  Complete_Course_Status: string;
  Playlist_Completeness: string;
  Syllabus_Coverage: string;
  Publication_Date: string;
  Last_Verified_Date: string;
  Availability_Status: string;
  Evidence_URL: string;
  Research_Notes: string;
}

export interface QualityVerificationRecord {
  Educator_ID: string;
  YouTube_Channel_ID: string;
  Subject: string;
  Examination: string;
  Subject_Relevance: string;
  Educational_Accuracy: string;
  Teaching_Clarity: string;
  Course_Completeness: string;
  Practical_Instruction_Quality: string;
  Learner_Feedback_Evidence: string;
  Content_Freshness: string;
  Overall_Assessment: string;
  Assessment_Method: string;
  Evidence_URLs: string;
  Verification_Status: string;
  Reviewer_Notes: string;
}

export interface CoverageGapRecord {
  Domain: string;
  Subject_or_Exam: string;
  Country_or_Region: string;
  Missing_Educator_Specializations: string;
  Missing_Complete_Courses: string;
  Missing_Languages: string;
  Verification_Problems: string;
  Recommended_Next_Action: string;
  Research_Status: string;
}

export interface EducatorMatchContext {
  courseTitle: string;
  moduleTitle?: string;
  moduleObjectives?: string[];
  subject?: string;
  specificTopic?: string;
  subtopics?: string[];
  academicLevel?: string;
  examination?: string;
  country?: string;
  curriculum?: string;
  preferredLanguage?: string;
  requiredDepth?: 'foundation' | 'intermediate' | 'rigorous' | 'exam-prep';
  desiredResourceType?: 'full_course' | 'youtube_playlist' | 'video_lecture' | 'all';
  prerequisites?: string[];
}

export interface EducatorMatchScoreBreakdown {
  subjectRelevance: number; // 0 - 100
  topicSpecialization: number; // 0 - 100
  examinationAlignment: number; // 0 - 100
  curriculumLevelMatch: number; // 0 - 100
  languageCompatibility: number; // 0 - 100
  credibilityAndVerification: number; // 0 - 100
  completeCourseBonus: number; // 0 - 100
  totalScore: number; // 0 - 100
}

export interface EducatorMatchResult {
  educator: MasterEducatorRecord;
  score: EducatorMatchScoreBreakdown;
  confidence: 'high' | 'medium' | 'low';
  matchingReasons: string[];
  isTopicalAuthority: boolean;
  hasCompleteCourse: boolean;
  hasStructuredPlaylist: boolean;
}

export interface ChannelIdentityVerification {
  isVerifiedEducator: boolean;
  matchedEducator?: MasterEducatorRecord;
  confidence: 'verified_channel_id' | 'verified_handle' | 'verified_channel_title' | 'unverified';
  evidence: string;
}
