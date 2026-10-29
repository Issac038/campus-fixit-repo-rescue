const express = require('express')
const crypto = require('crypto')
const config = require('./config')
const pool = require('./db/pool')
const validateRequest = require('./lib/validate')

const app = express()
app.use(express.json())

const STATUSES = ['open', 'in_progress', 'resolved']

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', config.JWT_SECRET).update(body).digest('base64url')
  return body + '.' + sig
}

function verify(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const sig = crypto.createHmac('sha256', config.JWT_SECRET).update(parts[0]).digest('base64url')
  if (sig !== parts[1]) return null
  try { return JSON.parse(Buffer.from(parts[0], 'base64url').toString()) } catch (e) { return null }
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (e) {
    console.log(e)
    res.status(503).json({ status: 'unavailable', dependency: 'database' })
  }
})

app.post('/staff/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username === 'caretaker' && password === config.CARETAKER_PASSWORD) {
    return res.json({ token: sign({ user: 'caretaker', role: 'staff' }) })
  }
  res.status(401).json({ error: 'invalid credentials' })
})

app.get('/requests', async (req, res) => {
  try {
    let q = 'SELECT * FROM requests'
    const params = []
    if (req.query.status) {
      if (STATUSES.indexOf(req.query.status) === -1) return res.status(400).json({ error: 'bad status' })
      params.push(req.query.status)
      q += ' WHERE status = $1'
    }
    q += ' ORDER BY created_at DESC'
    const r = await pool.query(q, params)
    res.json(r.rows)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e.message })
  }
})

app.get('/requests/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: 'bad id' })
  try {
    const r = await pool.query('SELECT * FROM requests WHERE id = $1', [id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json(r.rows[0])
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e.message })
  }
})

app.post('/requests', async (req, res) => {
  const errors = validateRequest(req.body)
  if (errors.length) return res.status(400).json({ errors: errors })
  try {
    const r = await pool.query(
      'INSERT INTO requests (location, issue, category) VALUES ($1, $2, $3) RETURNING *',
      [req.body.location.trim(), req.body.issue.trim(), req.body.category || 'other']
    )
    res.status(201).json(r.rows[0])
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e.message })
  }
})

app.patch('/requests/:id/status', async (req, res) => {
  const auth = req.headers.authorization || ''
  const user = verify(auth.replace('Bearer ', ''))
  if (!user || user.role !== 'staff') return res.status(401).json({ error: 'staff only' })
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: 'bad id' })
  const status = req.body && req.body.status
  if (STATUSES.indexOf(status) === -1) return res.status(400).json({ error: 'status must be one of ' + STATUSES.join(', ') })
  try {
    const r = await pool.query('UPDATE requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', [status, id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json(r.rows[0])
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e.message })
  }
})

app.get('/summary', async (req, res) => {
  try {
    const r = await pool.query('SELECT status, COUNT(*)::int AS count FROM requests GROUP BY status')
    const out = { open: 0, in_progress: 0, resolved: 0 }
    r.rows.forEach(function (row) { out[row.status] = row.count })
    res.json(out)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: e.message })
  }
})

module.exports = app
