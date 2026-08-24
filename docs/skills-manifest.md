# Skills Manifest — ANTILIA

_Curated engineering skillset. Do not install skills blindly; evaluate maintenance status and overlap first. Record every addition here._

## Installed / In Use

| Skill | Source | Purpose | Owning Agent |
| :--- | :--- | :--- | :--- |
| (none installed via `npx skills add` yet) | — | — | — |

## Planned (evaluate before install, per Master Build Prompt §52)

| Skill | Source | Purpose | Owning Agent |
| :--- | :--- | :--- | :--- |
| nextjs / vercel agent skills | `vercel-labs/agent-skills` | Next.js 15 App Router, RSC patterns | frontend |
| react-native performance | `vercel-labs/agent-skills` (vercel-react-native-skills) | list rendering, navigation, perf | mobile |
| expo + tailwind | `expo/skills` (expo-tailwind-setup) | Tailwind v4 / NativeWind universal styling | mobile |
| supabase (official collection) | Supabase | Postgres, Auth, Realtime, Storage patterns | database |
| playwright | `microsoft/playwright` | E2E browser automation | qa |
| ai-sdk | `vercel/ai` (ai-sdk) | model providers, structured output, RAG, streaming | ai |

## Installed / In Use

| Skill | Source | Purpose | Owning Agent |
| :--- | :--- | :--- | :--- |
| ai-sdk | vercel/ai (ai-sdk) | model providers, structured output, RAG, streaming for Caribbean AI services | ai |
| redis development | `redis/agent-skills` | caching, sessions, rate limiting | backend / performance |
| cloudflare | `cloudflare/skills` | Workers, R2, Stream, WAF, DDoS | devops |
| security audit | `cloudflare/security-audit-skill` | edge/security audit methodology | security |
| owasp security check | `sergiodxa/agent-skills` | OWASP application/API review | security |

## Rules
1. One skill per concern; remove overlap before adding.
2. Verify the skill source is official or highly maintained before install.
3. Update this manifest (skill, source, version, purpose, agent) in the same change that installs it.
