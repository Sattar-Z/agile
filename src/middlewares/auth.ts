import { userRoles } from '@/stores/user'

function isAuthenticated() {
  const userObjectString = localStorage.getItem('user')

  return !!userObjectString
}

function isAdmin() {
  if (!isAuthenticated())
    return false

  const userObjectString = JSON.parse(localStorage.getItem('user') as string)
  const admin = userRoles[1]
  const userRole = userRoles[userObjectString.role_id]

  return userRole === admin
}

function isOfficer() {
  if (!isAuthenticated())
    return false

  const userObjectString = JSON.parse(localStorage.getItem('user') as string)
  const officer = userRoles[0]
  const userRole = userRoles[userObjectString.role_id]

  return userRole === officer
}

export { isAuthenticated, isOfficer, isAdmin }
