// campus fixit backend
// TODO clean this up later
const express = require('express')
const { Pool } = require('pg')
const crypto = require('crypto')

const app = express()
app.use(express.json())

// db
const pool = new Pool({
  connectionString: 'postgresql://fixit_admin:fixit_pass_2026@localhost:5432/campus_fixit'
})

// for signing staff tokens
const JWT_SECRET = 'fixit-super-secret-key-do-not-share-8f3k2j'

const PORT = 3000

const STATUSES = ['open', 'in_progress', 'resolved']
const CATEGORIES = ['electrical', 'plumbing', 'furniture', 'cleaning', 'network', 'other']

// ---------- helpers ----------
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url')
  return body + '.' + sig
}

function verify(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(parts[0]).digest('base64url')
  if (sig !== parts[1]) return null
  try { return JSON.parse(Buffer.from(parts[0], 'base64url').toString()) } catch (e) { return null }
}

function validateRequest(b) {
  const errors = []
  if (!b) { errors.push('body missing'); return errors }
  if (!b.location || typeof b.location !== 'string' || b.location.trim().length < 2) errors.push('location is required')
  if (b.location && b.location.length > 80) errors.push('location too long')
  if (!b.issue || typeof b.issue !== 'string' || b.issue.trim().length < 5) errors.push('issue must be at least 5 characters')
  if (b.issue && b.issue.length > 500) errors.push('issue too long')
  if (b.category && CATEGORIES.indexOf(b.category) === -1) errors.push('category must be one of ' + CATEGORIES.join(', '))
  return errors
}

// ---------- setup ----------
async function setupDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    location VARCHAR(80) NOT NULL,
    issue TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'other',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
}

// ---------- routes ----------
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (e) {
    console.log(e)
    res.status(503).json({ status: 'unavailable', dependency: 'database' })
  }
})

// staff login (demo only)
app.post('/staff/login', (req, res) => {
  const { username, password } = req.body || {}
  // hardcoded caretaker for demo
  if (username === 'caretaker' && password === 'caretaker123') {
    return res.json({ token: sign({ user: 'caretaker', role: 'staff' }) })
  }
  res.status(401).json({ error: 'invalid credentials' })
})

// list requests
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

// get one
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

// create
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

// update status (staff only)
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

// summary for caretaker dashboard
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

module.exports = { app, validateRequest, pool }

if (require.main === module) {
  setupDb().then(() => {
    app.listen(PORT, () => console.log('campus fixit running on port ' + PORT))
  }).catch((e) => {
    console.log('db setup failed', e)
    process.exit(1)
  })
}
