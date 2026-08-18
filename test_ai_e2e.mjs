import jwt from 'jsonwebtoken';
const JWT_SECRET = '6b944ef93a1e6031f6d7572833737156d1e0b9f2cc1a324aea0c2d8c3dbcabbe4639760494f0941aefa85917b40088a48f2652f4373d9d1f57aac9b07767c694';
const DEMO_USER = { id: 'demo-user', email: 'demo@example.com', companyId: 'demo-company', role: 'admin' };
function generateToken() {
  return jwt.sign({ id: DEMO_USER.id, companyId: DEMO_USER.companyId, role: DEMO_USER.role, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
}
const TOKEN = generateToken();
const BASE_URL = 'http://localhost:5000/api/v1';
async function testEndpoint(name, endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}`, ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data, name };
}
const results = { passed: 0, failed: 0 };
async function runTest(name, testFn) {
  try {
    await testFn();
    results.passed++;
    console.log(`? PASS: ${name}`);
  } catch (error) {
    results.failed++;
    console.log(`? FAIL: ${name} - ${error.message}`);
  }
}
async function main() {
  console.log('?? AI Features E2E Test Suite');
  console.log('='.repeat(60));
  await runTest('AI Status', async () => {
    const res = await testEndpoint('/ai/status');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    console.log(`   ? Configured: ${res.data.data?.configured}`);
  });
  await runTest('AI Chat - Create', async () => {
    const res = await testEndpoint('/ai/chat/sessions', { method: 'POST', body: JSON.stringify({ title: 'Test' }) });
    if (!res.ok && res.status !== 201) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Chat - List', async () => {
    const res = await testEndpoint('/ai/chat/sessions');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Reports - Generate', async () => {
    const res = await testEndpoint('/ai/reports/generate', { method: 'POST', body: JSON.stringify({ type: 'CUSTOM', title: 'Test', prompt: 'Test' }) });
    if (!res.ok && res.status !== 201) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Reports - List', async () => {
    const res = await testEndpoint('/ai/reports');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI OCR - Process', async () => {
    const res = await testEndpoint('/ai/ocr/process', { method: 'POST', body: JSON.stringify({ fileName: 'test.pdf' }) });
    if (!res.ok && res.status !== 201) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI OCR - List', async () => {
    const res = await testEndpoint('/ai/ocr');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Analytics - Analyze', async () => {
    const res = await testEndpoint('/ai/analytics', { method: 'POST', body: JSON.stringify({ query: 'Test' }) });
    if (!res.ok && res.status !== 201) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Analytics - Raw', async () => {
    const res = await testEndpoint('/ai/analytics/raw');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Insights - Generate', async () => {
    const res = await testEndpoint('/ai/insights/generate', { method: 'POST', body: JSON.stringify({}) });
    if (!res.ok && res.status !== 201) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Insights - List', async () => {
    const res = await testEndpoint('/ai/insights');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Insights - Stats', async () => {
    const res = await testEndpoint('/ai/insights/stats');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Suggestions - Generate', async () => {
    const res = await testEndpoint('/ai/suggestions/generate', { method: 'POST', body: JSON.stringify({}) });
    if (!res.ok && res.status !== 201) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Suggestions - List', async () => {
    const res = await testEndpoint('/ai/suggestions');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Suggestions - Stats', async () => {
    const res = await testEndpoint('/ai/suggestions/stats');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Usage', async () => {
    const res = await testEndpoint('/ai/usage');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  await runTest('AI Usage - Features', async () => {
    const res = await testEndpoint('/ai/usage/features');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  console.log('='.repeat(60));
  console.log(`?? Total: ${results.passed + results.failed} | Passed: ${results.passed} ? | Failed: ${results.failed} ?`);
  console.log('='.repeat(60));
  if (results.failed === 0) console.log('?? All AI features working!');
}
main().catch(console.error);
