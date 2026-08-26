export interface ActionResponse {
  error: string | null;
  success: string | null;
  data?: Record<string, unknown>;
}

export const STAFF_ROLE_TITLES: Record<string, string> = {
  super_admin: 'Super Admin',
  superadmin: 'Super Admin',
  admin: 'Administrator',
  management: 'Management',
  moderator: 'Trust & Safety Moderator',
  support: 'Support Specialist',
  content_manager: 'Content Manager',
  analyst: 'Data Analyst',
};
