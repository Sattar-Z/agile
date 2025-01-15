import { type User, userRoles } from '@/stores/user'

const STORAGE_KEY = 'user'

/**
 * Get the stored user object from localStorage
 * @returns User object or null if not found/invalid
 */
function getStoredUser(): User | null {
  try {
    const userString = localStorage.getItem(STORAGE_KEY)
    if (!userString)
      return null

    return JSON.parse(userString) as User
  }
  catch (error) {
    console.error('Error parsing user data:', error)

    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getStoredUser() !== null
}

/**
 * Check if user has a specific role
 * @param roleIndex Index in userRoles array
 */
function hasRole(roleIndex: number): boolean {
  if (!isAuthenticated())
    return false

  const user = getStoredUser()
  if (!user)
    return false

  const targetRole = userRoles[roleIndex]
  const userRole = userRoles[user.role_id - 1] // Adjust for 1-based IDs from API

  return userRole === targetRole
}

// Role-specific checks
export const isAdmin = () => hasRole(0)
export const isOfficer = () => hasRole(1)
export const isAccountant = () => hasRole(2)
export const isCoordinator = () => hasRole(3)
export const isHeadOfFinance = () => hasRole(4)

/**
 * Generic role check by name
 * @param roleName Name of the role to check
 */
export function hasRoleByName(roleName: typeof userRoles[number]): boolean {
  if (!isAuthenticated())
    return false

  const user = getStoredUser()
  if (!user)
    return false

  const roleIndex = userRoles.indexOf(roleName)
  if (roleIndex === -1)
    return false

  return user.role_id === roleIndex + 1 // Adjust for 1-based IDs from API
}
