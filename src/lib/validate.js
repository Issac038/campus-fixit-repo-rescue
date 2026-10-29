const CATEGORIES = ['electrical', 'plumbing', 'furniture', 'cleaning', 'network', 'other']

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

module.exports = validateRequest
