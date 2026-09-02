function wrapLines(context, text, maximumWidth) {
  const words = text.trim().split(/\s+/)
  const lines = []
  let current = ''

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (current && context.measureText(candidate).width > maximumWidth) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  })
  if (current) lines.push(current)
  return lines.slice(0, 3)
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}

function drawImageCover(context, image, size) {
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
  context.fillStyle = 'rgba(23, 23, 20, 0.62)'
  context.fillRect(0, 0, size, size)
}

function drawFallback(context, size) {
  context.fillStyle = '#6b5cff'
  context.fillRect(0, 0, size, size)
  context.fillStyle = '#ff6440'
  context.beginPath()
  context.arc(size * 0.88, size * 0.1, size * 0.35, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#ddff55'
  context.beginPath()
  context.arc(size * 0.08, size * 0.92, size * 0.24, 0, Math.PI * 2)
  context.fill()
}

function safeFilename(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base || 'hackaform-event'}-circle-cover.png`
}

/** Creates a square, WhatsApp-ready event cover without uploading attendee data. */
export async function downloadEventCircleCover(event) {
  const size = 1080
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser could not prepare the event cover.')

  let usedImage = false
  if (event.imageUrl) {
    try {
      const image = await loadImage(event.imageUrl)
      drawImageCover(context, image, size)
      usedImage = true
    } catch {
      // Cross-origin or unavailable artwork falls back to a branded cover.
    }
  }
  if (!usedImage) drawFallback(context, size)

  context.fillStyle = '#ffffff'
  context.font = '700 40px Arial, sans-serif'
  context.letterSpacing = '5px'
  context.fillText('HACKAFORM · EVENT CIRCLE', 80, 105)

  context.font = '900 96px Arial, sans-serif'
  const lines = wrapLines(context, event.name || 'Your next room', 900)
  lines.forEach((line, index) => context.fillText(line, 80, 580 + (index * 105)))

  context.fillStyle = usedImage ? '#ddff55' : '#171714'
  context.fillRect(80, 905, 920, 3)
  context.fillStyle = '#ffffff'
  context.font = '700 38px Arial, sans-serif'
  context.fillText([event.category, event.city || event.locationLabel].filter(Boolean).join('  ·  '), 80, 980)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Your browser could not save the event cover.')

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = safeFilename(event.name || '')
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
