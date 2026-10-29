const requiredSettings = ['DATABASE_URL', 'JWT_SECRET', 'CARETAKER_PASSWORD']
const missingSettings = requiredSettings.filter((name) => !process.env[name])

if (missingSettings.length > 0) {
  console.error('Missing required settings: ' + missingSettings.join(', '))
  process.exit(1)
}

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CARETAKER_PASSWORD: process.env.CARETAKER_PASSWORD,
  PORT: Number(process.env.PORT || 3000)
}
