const NOTIFICATION_ICONS = Object.freeze({
    reaction: '🐾',
    comment: '💬',
    follow: '👥',
    comment_reaction: '🐾',
    reply: '↩️',
    mention: '📣',
    adoption_application: '🏡',
    adoption_help_offer: '🤝',
    adoption_application_update: '📋',
})

export const getCommunityNotificationIcon = (type) =>
    NOTIFICATION_ICONS[type] || '🔔'

export const getCommunityNotificationTarget = (notification = {}) =>
    typeof notification.target_url === 'string' && notification.target_url.trim()
        ? notification.target_url.trim()
        : '/comunidad'

export const isAdoptionNotification = (type) => [
    'adoption_application',
    'adoption_help_offer',
    'adoption_application_update',
].includes(type)
