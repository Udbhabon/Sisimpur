/**
 * Centralised API client for the Sisimpur Django backend.
 * All requests go through Next.js rewrites (/api/* → Django) so
 * session cookies work on the same origin (localhost:3000).
 */

import axios from "axios";
import type {
  OtpResponse,
  MyQuizzesResponse,
  ProcessDocumentResponse,
  JobStatusResponse,
  QuizResultsResponse,
  StartExamResponse,
  ExamSessionResponse,
  AnswerResponse,
  SubmitExamResponse,
  ExamResultResponse,
  StartFlashcardResponse,
  FlashcardSessionResponse,
  AdvanceFlashcardResponse,
  LeaderboardResponse,
} from "./types";

// ----------------------------------------------------------------
// Axios instance
// ----------------------------------------------------------------
const api = axios.create({
  baseURL: "", // use relative URLs so Next.js rewrites handle proxying
  withCredentials: true, // send session + csrftoken cookies
  headers: { "Content-Type": "application/json" },
});

// Read csrftoken cookie and attach it as X-CSRFToken header
api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1];
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }
  return config;
});

// ----------------------------------------------------------------
// CSRF initialisation
// ----------------------------------------------------------------
/** Hit any safe GET endpoint so Django sets the csrftoken cookie. */
export async function initCsrf() {
  try {
    await api.get("/api/brain/jobs/");
  } catch {
    // Ignore errors – we just want the Set-Cookie header
  }
}

// ----------------------------------------------------------------
// Auth
// ----------------------------------------------------------------
export async function sendOtp(email: string): Promise<OtpResponse> {
  const { data } = await api.post<OtpResponse>("/api/auth/send-otp/", { email });
  return data;
}

export async function verifyOtp(email: string, otp_code: string): Promise<OtpResponse> {
  const { data } = await api.post<OtpResponse>("/api/auth/verify-otp/", { email, otp_code });
  return data;
}

export async function login(email: string, password: string): Promise<OtpResponse> {
  const { data } = await api.post<OtpResponse>("/api/auth/login/", {
    email,
    password,
    action: "login",
  });
  return data;
}

export async function signup(
  email: string,
  password: string,
  password_confirm: string
): Promise<OtpResponse> {
  const { data } = await api.post<OtpResponse>("/api/auth/signup/", {
    email,
    password,
    password_confirm,
    action: "signup",
  });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout/");
}

// ----------------------------------------------------------------
// Brain / Documents
// ----------------------------------------------------------------
export async function processDocument(formData: FormData): Promise<ProcessDocumentResponse> {
  const { data } = await api.post<ProcessDocumentResponse>(
    "/api/brain/process/document/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function getJobStatus(jobId: number): Promise<JobStatusResponse> {
  const { data } = await api.get<JobStatusResponse>(`/api/brain/jobs/${jobId}/status/`);
  return data;
}

export async function deleteJob(jobId: number): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/api/brain/jobs/${jobId}/delete/`);
  return data;
}

export async function downloadResults(jobId: number): Promise<void> {
  window.open(`/api/brain/jobs/${jobId}/download/`, "_blank");
}

// ----------------------------------------------------------------
// Dashboard – Quizzes
// ----------------------------------------------------------------
export async function getMyQuizzes(): Promise<MyQuizzesResponse> {
  const { data } = await api.get<MyQuizzesResponse>("/api/dashboard/my-quizzes/");
  return data;
}

export async function getQuizResults(jobId: number): Promise<QuizResultsResponse> {
  const { data } = await api.get<QuizResultsResponse>(
    `/api/dashboard/quiz-results/${jobId}/?format=json`
  );
  return data;
}

// ----------------------------------------------------------------
// Dashboard – Exams
// ----------------------------------------------------------------
export async function startExam(jobId: number): Promise<StartExamResponse> {
  const { data } = await api.post<StartExamResponse>(
    `/api/dashboard/exam/start/${jobId}/`
  );
  return data;
}

export async function getExamSession(sessionId: string): Promise<ExamSessionResponse> {
  const { data } = await api.get<ExamSessionResponse>(
    `/api/dashboard/exam/session/${sessionId}/`
  );
  return data;
}

export async function answerQuestion(
  sessionId: string,
  answer: string,
  action: "next" | "previous" | "submit"
): Promise<AnswerResponse> {
  const { data } = await api.post<AnswerResponse>(
    `/api/dashboard/exam/answer/${sessionId}/`,
    { answer, action }
  );
  return data;
}

export async function submitExam(sessionId: string): Promise<SubmitExamResponse> {
  const { data } = await api.post<SubmitExamResponse>(
    `/api/dashboard/exam/submit/${sessionId}/`
  );
  return data;
}

export async function getExamResult(sessionId: string): Promise<ExamResultResponse> {
  const { data } = await api.get<ExamResultResponse>(
    `/api/dashboard/exam/result/${sessionId}/`
  );
  return data;
}

// ----------------------------------------------------------------
// Dashboard – Flashcards
// ----------------------------------------------------------------
export async function startFlashcard(jobId: number): Promise<StartFlashcardResponse> {
  const { data } = await api.post<StartFlashcardResponse>(
    `/api/dashboard/flashcard/start/${jobId}/`
  );
  return data;
}

export async function getFlashcardSession(sessionId: string): Promise<FlashcardSessionResponse> {
  const { data } = await api.get<FlashcardSessionResponse>(
    `/api/dashboard/flashcard/session/${sessionId}/`
  );
  return data;
}

export async function advanceFlashcard(
  sessionId: string,
  action: "next" | "skip"
): Promise<AdvanceFlashcardResponse> {
  const { data } = await api.post<AdvanceFlashcardResponse>(
    `/api/dashboard/flashcard/advance/${sessionId}/`,
    { action }
  );
  return data;
}

// ----------------------------------------------------------------
// Dashboard – Leaderboard
// ----------------------------------------------------------------
export async function getLeaderboard(
  filter: "all" | "week" | "month" | "year" = "all"
): Promise<LeaderboardResponse> {
  const { data } = await api.get<LeaderboardResponse>(
    `/api/dashboard/leaderboard/?filter=${filter}`
  );
  return data;
}
