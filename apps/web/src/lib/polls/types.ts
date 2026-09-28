export interface PollOptionData {
  id: string;
  pollId: string;
  optionText: string;
  position: number;
  votesCount: number;
  percentage?: number;
  imageUrl?: string;
}

export interface PollData {
  id: string;
  postId: string;
  question: string;
  expiresAt: string;
  allowMultiple: boolean;
  totalVotes: number;
  createdAt: string;
  options: PollOptionData[];
  userVotedOptionId?: string | null;
  isExpired?: boolean;
  isQuiz?: boolean;
  quizExplanation?: string | null;
  correctOptionId?: string | null;
  userIsCorrect?: boolean | null;
}

export interface PollVoteResult {
  success: boolean;
  message?: string;
  error?: string;
  poll?: PollData;
}

export type PollOptionInput = string | { text: string; imageUrl?: string };

export interface CreatePollParams {
  postId: string;
  question: string;
  options: PollOptionInput[];
  durationHours?: number;
  allowMultiple?: boolean;
  isQuiz?: boolean;
  correctOptionIndex?: number;
  quizExplanation?: string | null;
}
