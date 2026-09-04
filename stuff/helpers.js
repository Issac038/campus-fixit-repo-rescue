// some helper functions, not sure if used anywhere
function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

module.exports = { formatDate, capitalize }
