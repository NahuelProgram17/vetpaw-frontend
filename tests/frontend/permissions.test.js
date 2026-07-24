import test from 'node:test'
import assert from 'node:assert/strict'

import { canAccessAdmin, canModerateCommunity } from '../../src/utils/permissions.js'

test('los permisos administrativos aceptan las tres señales válidas', () => {
    assert.equal(canAccessAdmin({ can_access_admin: true }), true)
    assert.equal(canAccessAdmin({ is_staff: true }), true)
    assert.equal(canAccessAdmin({ is_superuser: true }), true)
    assert.equal(canAccessAdmin({ role: 'owner' }), false)
})

test('un administrador también puede moderar la Comunidad', () => {
    assert.equal(canModerateCommunity({ can_moderate_community: true }), true)
    assert.equal(canModerateCommunity({ is_staff: true }), true)
    assert.equal(canModerateCommunity({ role: 'owner' }), false)
})
