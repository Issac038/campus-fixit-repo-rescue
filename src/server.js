const app = require('./app')
const config = require('./config')
const pool = require('./db/pool')

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

setupDb().then(() => {
  app.listen(config.PORT, () => console.log('campus fixit running on port ' + config.PORT))
}).catch((error) => {
  console.error('db setup failed', error)
  process.exit(1)
})
