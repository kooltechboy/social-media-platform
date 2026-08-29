// k6 load profile for the feed hot path — TUKUBI Phase 9
// Run: k6 run tests/performance/k6-feed.js
// Targets come from docs/operations/performance-budgets.md

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    feed_read: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400', 'p(99)<800'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/v1/feed?mode=following&limit=25`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'feed is cursor-paginated': (r) => {
      if (r.status !== 200) return false;
      try {
        const body = r.json();
        return Array.isArray(body.items) && (body.nextCursor === null || typeof body.nextCursor === 'string');
      } catch {
        return false;
      }
    },
  });
  sleep(1);
}
