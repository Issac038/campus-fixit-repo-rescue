const test = require('node:test')
const assert = require('node:assert')
const request = require('supertest')
const app = require('../src/app')
const validateRequest = require('../src/lib/validate')
const pool = require('../src/db/pool')

test('valid request has no errors', () => {
  assert.deepStrictEqual(validateRequest({ location: 'Block C, Room 214', issue: 'Tube light flickering', category: 'electrical' }), [])
})

test('missing location and short issue are rejected', () => {
  const errors = validateRequest({ issue: 'tap' })
  assert.ok(errors.includes('location is required'))
  assert.ok(errors.includes('issue must be at least 5 characters'))
})

test('unknown category is rejected', () => {
  const errors = validateRequest({ location: 'Lab 2', issue: 'Desk wobbling badly', category: 'magic' })
  assert.strictEqual(errors.length, 1)
})

test('POST /requests with a bad body returns 400 without touching the database', async () => {
  const res = await request(app).post('/requests').send({ issue: 'x' })
  assert.strictEqual(res.status, 400)
  assert.ok(Array.isArray(res.body.errors))
})

test.after(() => pool.end())
