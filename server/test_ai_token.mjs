import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '6b944ef93a1e6031f6d7572833737156d1e0b9f2cc1a324aea0c2d8c3dbcabbe4639760494f0941aefa85917b40088a48f2652f4373d9d1f57aac9b07767c694';

const token = jwt.sign(
  { id: 'demo-user', companyId: 'demo-company', role: 'admin', type: 'access' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Generated test JWT token:');
console.log(token);
console.log('\nTest with:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/v1/ai/status`);
