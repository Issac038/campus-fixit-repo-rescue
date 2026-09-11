// quick manual test, run with node test2_final_FINAL.js while server is running
const http = require('http')

const data = JSON.stringify({ location: 'Hostel A, Room 101', issue: 'Light not working', category: 'electrical' })
const req = http.request({ hostname: 'localhost', port: 3000, path: '/requests', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
  let body = ''
  res.on('data', (c) => (body += c))
  res.on('end', () => console.log(res.statusCode, body))
})
req.write(data)
req.end()
