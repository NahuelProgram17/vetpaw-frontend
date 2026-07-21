export const canAccessAdmin = (user) => Boolean(
  user?.can_access_admin || user?.is_staff || user?.is_superuser
)

export const canModerateCommunity = (user) => Boolean(
  user?.can_moderate_community || canAccessAdmin(user)
)
