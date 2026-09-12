import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure as Code & Containerization Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('validates production Dockerfile structure and security hardening', () => {
    const dockerfilePath = path.join(rootDir, 'Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(content).toContain('FROM node:20-alpine AS base');
    expect(content).toContain('FROM base AS builder');
    expect(content).toContain('FROM node:20-alpine AS runner');
    expect(content).toContain('USER nextjs');
    expect(content).toContain('HEALTHCHECK');
    expect(content).toContain('EXPOSE 3000');
  });

  it('validates docker-compose.yml multi-service orchestration', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('tukubi-db');
    expect(content).toContain('tukubi-redis');
    expect(content).toContain('tukubi-web');
    expect(content).toContain('tukubi-creator-studio');
    expect(content).toContain('tukubi-business-studio');
    expect(content).toContain('tukubi-net');
  });

  it('validates Terraform IaC cloud declarations', () => {
    const tfDir = path.join(rootDir, 'infra/terraform');
    expect(fs.existsSync(path.join(tfDir, 'main.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tfDir, 'variables.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tfDir, 'outputs.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tfDir, 'supabase.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tfDir, 'upstash.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tfDir, 'vercel.tf'))).toBe(true);

    const mainTf = fs.readFileSync(path.join(tfDir, 'main.tf'), 'utf-8');
    expect(mainTf).toContain('required_providers');
    expect(mainTf).toContain('supabase');
    expect(mainTf).toContain('upstash');
    expect(mainTf).toContain('vercel');
  });
});
