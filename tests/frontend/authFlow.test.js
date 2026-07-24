import test from 'node:test'
import assert from 'node:assert/strict'

import {
    buildAccountSanction,
    formatSanctionDate,
    getHomeForRole,
    getProtectedRouteDecision,
    parseLoginFailure,
} from '../../src/utils/authFlow.js'

test('cada rol inicia en su panel correcto', () => {
    assert.equal(getHomeForRole('owner'), '/dashboard')
    assert.equal(getHomeForRole('clinic'), '/clinic/dashboard')
    assert.equal(getHomeForRole('business'), '/business/dashboard')
    assert.equal(getHomeForRole('shelter'), '/shelter/dashboard')
    assert.equal(getHomeForRole('unknown'), '/comunidad')
})

test('una ruta protegida conserva el loader mientras se valida la sesión', () => {
    assert.deepEqual(getProtectedRouteDecision({ loading: true }), { kind: 'loading' })
})


test('una falla temporal al verificar la sesión no expulsa al usuario', () => {
    assert.deepEqual(
        getProtectedRouteDecision({ user: null, authError: 'No hay conexión.' }),
        { kind: 'auth_unavailable', message: 'No hay conexión.' },
    )
})

test('un visitante sin sesión es enviado al login', () => {
    assert.deepEqual(getProtectedRouteDecision({ user: null }), { kind: 'redirect', to: '/login' })
})

test('una cuenta profesional pendiente ve la pantalla de aprobación', () => {
    assert.deepEqual(
        getProtectedRouteDecision({ user: { role: 'clinic', is_approved: false } }),
        { kind: 'pending_approval', role: 'clinic' },
    )
})

test('un dueño no puede abrir el panel administrador', () => {
    assert.deepEqual(
        getProtectedRouteDecision({ user: { role: 'owner' }, permission: 'admin' }),
        { kind: 'redirect', to: '/' },
    )
})

test('un administrador puede abrir el panel administrador', () => {
    assert.deepEqual(
        getProtectedRouteDecision({ user: { role: 'owner', is_staff: true }, permission: 'admin' }),
        { kind: 'allow' },
    )
})

test('un moderador puede abrir la moderación sin ser administrador', () => {
    assert.deepEqual(
        getProtectedRouteDecision({ user: { role: 'owner', can_moderate_community: true }, permission: 'moderator' }),
        { kind: 'allow' },
    )
})

test('un rol incorrecto vuelve a su propio panel', () => {
    assert.deepEqual(
        getProtectedRouteDecision({ user: { role: 'business', is_approved: true }, role: 'clinic' }),
        { kind: 'redirect', to: '/business/dashboard' },
    )
})

test('el rol correcto puede abrir la ruta protegida', () => {
    assert.deepEqual(
        getProtectedRouteDecision({ user: { role: 'owner', is_approved: true }, role: 'owner' }),
        { kind: 'allow' },
    )
})

test('el login reconoce una suspensión y conserva su información', () => {
    const data = {
        code: 'account_suspended',
        detail: 'Cuenta suspendida.',
        account_sanction: { reason: 'Spam', ends_at: '2026-08-01T12:00:00Z' },
    }
    assert.deepEqual(buildAccountSanction(data), {
        code: 'account_suspended',
        detail: 'Cuenta suspendida.',
        sanction: data.account_sanction,
    })
    assert.equal(parseLoginFailure(data).error, '')
    assert.equal(parseLoginFailure(data).sanction.code, 'account_suspended')
})

test('un error de login normal no se presenta como sanción', () => {
    assert.deepEqual(parseLoginFailure({ detail: 'Usuario o contraseña incorrectos.' }), {
        sanction: null,
        error: 'Usuario o contraseña incorrectos.',
    })
    assert.equal(buildAccountSanction({ code: 'other_error' }), null)
})

test('la fecha de sanción inválida no rompe la pantalla', () => {
    assert.equal(formatSanctionDate('fecha-invalida'), '')
    assert.notEqual(formatSanctionDate('2026-08-01T12:00:00Z'), '')
})
