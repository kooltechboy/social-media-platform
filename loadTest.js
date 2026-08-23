const TARGET_URL = 'https://social-media-platform-web-two.vercel.app/';
const CONCURRENCY = 10;
const TOTAL_REQUESTS = 100;

async function fetchUrl(id) {
  const start = performance.now();
  try {
    const res = await fetch(TARGET_URL);
    const end = performance.now();
    return { id, status: res.status, time: end - start, error: null };
  } catch (err) {
    const end = performance.now();
    return { id, status: null, time: end - start, error: err.message };
  }
}

async function runLoadTest() {
  console.log(`Starting load test against ${TARGET_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}, Total Requests: ${TOTAL_REQUESTS}`);

  let active = 0;
  let completed = 0;
  let results = [];
  
  return new Promise((resolve) => {
    function spawnNext() {
      if (completed >= TOTAL_REQUESTS) {
        resolve(results);
        return;
      }
      
      while (active < CONCURRENCY && (active + completed) < TOTAL_REQUESTS) {
        active++;
        const requestId = active + completed;
        fetchUrl(requestId).then(res => {
          results.push(res);
          active--;
          completed++;
          process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS}`);
          spawnNext();
        });
      }
    }
    spawnNext();
  });
}

runLoadTest().then(results => {
  console.log('\n\n--- Load Test Results ---');
  const success = results.filter(r => r.status === 200).length;
  const errors = results.filter(r => r.error !== null).length;
  const avgTime = results.reduce((acc, r) => acc + r.time, 0) / results.length;
  console.log(`Successful requests (200 OK): ${success}`);
  console.log(`Failed/Error requests: ${errors}`);
  console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
  
  if (success === TOTAL_REQUESTS) {
    console.log('\n✅ Load test passed. Platform is stable under traffic.');
  } else {
    console.log('\n❌ Load test encountered errors.');
    process.exit(1);
  }
});
