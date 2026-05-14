import type { Profile, Course, Enrollment, Message } from "@/lib/supabase/types";

export type Tab = "overview" | "students" | "teachers" | "courses" | "lessons" | "messages" | "material" | "waitlist" | "applications";

export type ApplicationRow = {
  id: string;
  course_id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  experience: string | null;
  status: string;
  admin_notes: string | null;
  redirect_course_id: string | null;
  created_at: string;
  course: { id: string; title: string } | null;
  redirect_course: { id: string; title: string } | null;
  payment_status?: "paid" | "pending" | "cancelled" | "refunded" | null;
};

export type WaitlistRow = {
  id: string;
  course_id: string;
  name: string;
  email: string;
  phone: string;
  level_description: string | null;
  created_at: string;
  course: { id: string; title: string } | null;
};

export type EnrollmentRow = Enrollment & {
  student: Pick<Profile, "id" | "full_name" | "email"> | null;
  course: Pick<Course, "id" | "title"> | null;
};

export type MessageRow = Message & {
  sender: Pick<Profile, "full_name" | "email"> | null;
  recipient: Pick<Profile, "full_name" | "email"> | null;
};

export type MaterialRow = {
  id: string;
  title: string;
  type: string | null;
  url: string | null;
  file_size_bytes: number | null;
  created_at: string;
  course_id: string;
  lesson_id: string | null;
  course: { id: string; title: string } | null;
  lesson: { id: string; title: string } | null;
};

export type DaySchedule = { enabled: boolean; time: string };

export type LessonRow = {
  id: string;
  title: string;
  scheduled_at: string | null;
  meeting_link: string | null;
  course_id?: string;
  course: { title: string } | null;
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Mellannivå",
  advanced: "Avancerad",
};

export const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent";
export const btnPrimary = "px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all";
export const btnSecondary = "px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all";
