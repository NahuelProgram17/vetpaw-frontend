import test from 'node:test'
import assert from 'node:assert/strict'

import {
    getCommunityNotificationIcon,
    getCommunityNotificationTarget,
    isAdoptionNotification,
} from '../../src/utils/communityNotifications.js'

test('cada notificación de adopción tiene un icono propio', () => {
    assert.equal(getCommunityNotificationIcon('adoption_application'), '🏡')
    assert.equal(getCommunityNotificationIcon('adoption_help_offer'), '🤝')
    assert.equal(getCommunityNotificationIcon('adoption_application_update'), '📋')
})

test('las notificaciones sociales conocidas conservan sus iconos', () => {
    assert.equal(getCommunityNotificationIcon('reaction'), '🐾')
    assert.equal(getCommunityNotificationIcon('comment'), '💬')
    assert.equal(getCommunityNotificationIcon('follow'), '👥')
    assert.equal(getCommunityNotificationIcon('unknown'), '🔔')
})

test('una notificación abre exactamente su destino', () => {
    assert.equal(
        getCommunityNotificationTarget({ target_url: '/refugio/adopciones?section=applications&highlight=15' }),
        '/refugio/adopciones?section=applications&highlight=15',
    )
})

test('una notificación sin destino vuelve a Comunidad', () => {
    assert.equal(getCommunityNotificationTarget({}), '/comunidad')
    assert.equal(getCommunityNotificationTarget({ target_url: '   ' }), '/comunidad')
})

test('solo los tres eventos de adopción se identifican como adopciones', () => {
    assert.equal(isAdoptionNotification('adoption_application'), true)
    assert.equal(isAdoptionNotification('adoption_help_offer'), true)
    assert.equal(isAdoptionNotification('adoption_application_update'), true)
    assert.equal(isAdoptionNotification('comment'), false)
})
