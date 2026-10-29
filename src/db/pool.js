const { Pool } = require('pg')
const config = require('../config')

module.exports = new Pool({
  connectionString: config.DATABASE_URL
})
