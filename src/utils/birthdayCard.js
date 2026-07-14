const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350

const loadImage = (src) => new Promise((resolve, reject) => {
    if (!src) return reject(new Error('Sin imagen'))
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
})

const roundedRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + width, y, x + width, y + height, r)
    ctx.arcTo(x + width, y + height, x, y + height, r)
    ctx.arcTo(x, y + height, x, y, r)
    ctx.arcTo(x, y, x + width, y, r)
    ctx.closePath()
}

const drawContainedImage = (ctx, image, x, y, width, height) => {
    const scale = Math.min(width / image.width, height / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    const drawX = x + (width - drawWidth) / 2
    const drawY = y + (height - drawHeight) / 2
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) => {
    const words = String(text || '').split(/\s+/)
    const lines = []
    let current = ''
    for (const word of words) {
        const test = current ? `${current} ${word}` : word
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current)
            current = word
            if (lines.length === maxLines - 1) break
        } else {
            current = test
        }
    }
    if (current && lines.length < maxLines) lines.push(current)
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight))
}

export async function createBirthdayCardBlob(celebration) {
    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT
    const ctx = canvas.getContext('2d')

    const background = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    background.addColorStop(0, '#071426')
    background.addColorStop(0.48, '#10243a')
    background.addColorStop(1, '#143423')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    const glow = ctx.createRadialGradient(880, 180, 20, 880, 180, 430)
    glow.addColorStop(0, 'rgba(255,152,0,.35)')
    glow.addColorStop(1, 'rgba(255,152,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    const confetti = ['#4CAF50', '#FF9800', '#FFD54F', '#7CE0FF', '#F48FB1']
    for (let index = 0; index < 70; index += 1) {
        const x = (index * 173) % CARD_WIDTH
        const y = (index * 97) % 430
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate((index % 8) * 0.36)
        ctx.fillStyle = confetti[index % confetti.length]
        ctx.fillRect(-5, -12, 10, 24)
        ctx.restore()
    }

    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '900 42px Arial'
    ctx.fillText('VETPAW CELEBRA', CARD_WIDTH / 2, 84)
    ctx.fillStyle = '#9ADCA0'
    ctx.font = '700 25px Arial'
    ctx.fillText('Un recuerdo para guardar y compartir', CARD_WIDTH / 2, 124)

    const photoX = 120
    const photoY = 170
    const photoWidth = 840
    const photoHeight = 580
    roundedRect(ctx, photoX, photoY, photoWidth, photoHeight, 46)
    ctx.fillStyle = '#07111f'
    ctx.fill()
    ctx.save()
    roundedRect(ctx, photoX, photoY, photoWidth, photoHeight, 46)
    ctx.clip()
    try {
        const image = await loadImage(celebration.pet_photo)
        drawContainedImage(ctx, image, photoX, photoY, photoWidth, photoHeight)
    } catch {
        ctx.fillStyle = '#162b40'
        ctx.fillRect(photoX, photoY, photoWidth, photoHeight)
        ctx.font = '160px Arial'
        ctx.fillText('🐾', CARD_WIDTH / 2, photoY + 350)
    }
    ctx.restore()
    ctx.strokeStyle = 'rgba(76,175,80,.8)'
    ctx.lineWidth = 8
    roundedRect(ctx, photoX, photoY, photoWidth, photoHeight, 46)
    ctx.stroke()

    ctx.fillStyle = '#FFCA54'
    ctx.font = '900 52px Arial'
    ctx.fillText('🎉 ¡FELIZ CUMPLEAÑOS! 🎉', CARD_WIDTH / 2, 840)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '900 82px Arial'
    ctx.fillText(celebration.pet_name, CARD_WIDTH / 2, 940)

    ctx.fillStyle = '#8FE29A'
    ctx.font = '800 40px Arial'
    ctx.fillText(`${celebration.age} año${celebration.age === 1 ? '' : 's'} de amor y aventuras`, CARD_WIDTH / 2, 1003)

    ctx.fillStyle = 'rgba(255,255,255,.82)'
    ctx.font = '600 29px Arial'
    wrapText(ctx, celebration.badge?.subtitle || celebration.message, CARD_WIDTH / 2, 1070, 820, 40, 3)

    roundedRect(ctx, 190, 1210, 700, 78, 39)
    const badgeGradient = ctx.createLinearGradient(190, 1210, 890, 1288)
    badgeGradient.addColorStop(0, '#4CAF50')
    badgeGradient.addColorStop(1, '#FF9800')
    ctx.fillStyle = badgeGradient
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '900 28px Arial'
    ctx.fillText(`${celebration.badge?.emoji || '🎖️'} ${celebration.badge?.name || 'Cumpleañero VetPaw'} · ${celebration.year}`, CARD_WIDTH / 2, 1260)

    ctx.fillStyle = 'rgba(255,255,255,.5)'
    ctx.font = '600 22px Arial'
    ctx.fillText('www.vetpaw.com.ar · Tu app veterinaria de confianza', CARD_WIDTH / 2, 1325)

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar la tarjeta')), 'image/png', 1)
    })
}

export async function downloadBirthdayCard(celebration) {
    const blob = await createBirthdayCardBlob(celebration)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cumple-${celebration.pet_name}-${celebration.year}-vetpaw.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export async function shareBirthdayCard(celebration) {
    const blob = await createBirthdayCardBlob(celebration)
    const file = new File([blob], `cumple-${celebration.pet_name}-vetpaw.png`, { type: 'image/png' })
    const shareData = {
        title: `¡Feliz cumpleaños, ${celebration.pet_name}!`,
        text: `${celebration.pet_name} cumple ${celebration.age} año${celebration.age === 1 ? '' : 's'} 🎉🐾 #VetPaw`,
        files: [file],
    }
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(shareData)
        return 'shared'
    }
    await downloadBirthdayCard(celebration)
    return 'downloaded'
}
