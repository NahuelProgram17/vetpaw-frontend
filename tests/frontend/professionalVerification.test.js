import test from 'node:test'
import assert from 'node:assert/strict'

import {
    PROFESSIONAL_ACTION_OPTIONS,
    PROFESSIONAL_STATUS_META,
    canVerifyProfessionalProfile,
    getDefaultProfessionalAction,
    getProfessionalProfileUrl,
    requiresProfessionalPublicNote,
} from '../../src/utils/professionalVerification.js'

test('la insignia verificada mantiene su estado público', () => {
    assert.equal(PROFESSIONAL_STATUS_META.verified.label, 'Verificada')
    assert.equal(PROFESSIONAL_STATUS_META.verified.icon, '✅')
    assert.equal(PROFESSIONAL_ACTION_OPTIONS.find((item) => item.value === 'verify').targetStatus, 'verified')
})

test('solo una cuenta aprobada puede verificarse', () => {
    assert.equal(canVerifyProfessionalProfile({ is_approved: true }), true)
    assert.equal(canVerifyProfessionalProfile({ is_approved: false }), false)
    assert.equal(canVerifyProfessionalProfile(null), false)
})

test('una cuenta pendiente pasa primero a revisión', () => {
    assert.equal(getDefaultProfessionalAction({ status: 'pending', is_approved: true }), 'review')
})

test('una cuenta revisada y aprobada puede verificarse', () => {
    assert.equal(getDefaultProfessionalAction({ status: 'in_review', is_approved: true }), 'verify')
    assert.equal(getDefaultProfessionalAction({ status: 'corrections', is_approved: true }), 'verify')
})

test('una cuenta no aprobada nunca salta directamente a verificada', () => {
    assert.equal(getDefaultProfessionalAction({ status: 'in_review', is_approved: false }), 'review')
})

test('una cuenta verificada propone retirar la insignia', () => {
    assert.equal(getDefaultProfessionalAction({ status: 'verified', is_approved: true }), 'withdraw')
})

test('correcciones, rechazo y retiro exigen un motivo público', () => {
    assert.equal(requiresProfessionalPublicNote('request_corrections'), true)
    assert.equal(requiresProfessionalPublicNote('reject'), true)
    assert.equal(requiresProfessionalPublicNote('withdraw'), true)
    assert.equal(requiresProfessionalPublicNote('verify'), false)
})

test('el panel abre el perfil público correspondiente a cada rol', () => {
    assert.equal(getProfessionalProfileUrl({ role: 'clinic', profile_slug: 'vet-central' }), '/clinicas/vet-central')
    assert.equal(getProfessionalProfileUrl({ role: 'business', profile_slug: 'pet-shop' }), '/negocios/pet-shop')
    assert.equal(getProfessionalProfileUrl({ role: 'shelter', profile_slug: 'huellitas' }), '/refugios/huellitas')
    assert.equal(getProfessionalProfileUrl({ role: 'owner', profile_slug: 'nahuel' }), '')
})
