// Mobile Supabase Client with graceful fallback for offline / development
export interface MobileProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface MobilePost {
  id: string;
  author: string;
  location: string;
  time: string;
  body: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export const INITIAL_POSTS: MobilePost[] = [
  {
    id: 'p1',
    author: 'Dancehall Culture Hub',
    location: 'Kingston, Jamaica',
    time: '2h ago',
    body: 'Episode 14 of the podcast is live — the evolution of Reggae & Dancehall globally. Support the creator via SpotPay!',
    likes: 1240,
    comments: 84,
  },
  {
    id: 'p2',
    author: 'Ana\'s Kitchen RD',
    location: 'Santo Domingo, DR',
    time: '5h ago',
    body: 'New menu drop: mangú with los tres golpes. Delivery across the capital all weekend.',
    likes: 612,
    comments: 47,
  },
  {
    id: 'p3',
    author: 'Jamaicans in Toronto',
    location: 'Toronto, Canada',
    time: '8h ago',
    body: 'Caribana band launch tickets are live for members. Community presale ends Friday night.',
    likes: 308,
    comments: 52,
  },
];
