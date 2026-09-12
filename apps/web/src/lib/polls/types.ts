export interface PollOptionData {
  id: string;
  pollId: string;
  optionText: string;
  position: number;
  votesCount: number;
  percentage?: number;
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
}

export interface PollVoteResult {
  success: boolean;
  message?: string;
  error?: string;
  poll?: PollData;
}
