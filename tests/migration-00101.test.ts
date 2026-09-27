import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration 00101: Polls and Quizzes Enhancements', () => {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/00101_polls_and_quizzes_enhancements.sql');

  it('verifies migration file existence', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('defines required schema alterations and constraints', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Polls table extensions
    expect(sql).toContain('is_quiz');
    expect(sql).toContain('quiz_explanation');
    expect(sql).toContain('correct_option_id');
    expect(sql).toMatch(/REFERENCES\s+public\.poll_options\s*\(\s*id\s*\)\s+ON\s+DELETE\s+SET\s+NULL/i);

    // Poll options table extension
    expect(sql).toContain('image_url');

    // Poll votes table extension
    expect(sql).toContain('is_correct');
  });

  it('updates handle_poll_vote_insert trigger function with tamper-proof logic', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Function definition and security settings
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.handle_poll_vote_insert()');
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toContain('search_path = public');

    // Expiration check
    expect(sql).toMatch(/expires_at\s*<=\s*now\(\)/i);

    // Quiz correctness evaluation
    expect(sql).toMatch(/is_quiz/);
    expect(sql).toMatch(/NEW\.is_correct\s*:=\s*\(NEW\.option_id\s*=\s*v_poll\.correct_option_id\)/i);

    // Atomic increments
    expect(sql).toMatch(/UPDATE\s+public\.poll_options/i);
    expect(sql).toMatch(/votes_count\s*=\s*votes_count\s*\+\s*1/i);
    expect(sql).toMatch(/UPDATE\s+public\.polls/i);
    expect(sql).toMatch(/total_votes\s*=\s*total_votes\s*\+\s*1/i);

    // Trigger binding on poll_votes
    expect(sql).toContain('trg_poll_vote_insert');
    expect(sql).toMatch(/BEFORE\s+INSERT\s+ON\s+public\.poll_votes/i);
  });

  it('verifies RLS coverage and security on polls, poll_options, and poll_votes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toMatch(/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/FORCE\s+ROW\s+LEVEL\s+SECURITY/i);
  });
});
