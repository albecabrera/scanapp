const EAN_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

export async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1920 } },
  })
  videoEl.srcObject = stream
  await videoEl.play()
  return stream
}

export function stopCamera(stream) {
  stream?.getTracks().forEach(t => t.stop())
}

// BarcodeDetector (Chrome/Edge/Safari 17+)
async function startNativeScan(videoEl, onFound) {
  const supported = await BarcodeDetector.getSupportedFormats()
  const formats = EAN_FORMATS.filter(f => supported.includes(f))
  if (!formats.length) return null

  const detector = new BarcodeDetector({ formats })
  let running = true

  const loop = async () => {
    if (!running) return
    try {
      const barcodes = await detector.detect(videoEl)
      const found = barcodes.find(b => EAN_FORMATS.includes(b.format))
      if (found) { onFound(found.rawValue); return }
    } catch (_) {}
    requestAnimationFrame(loop)
  }
  loop()
  return () => { running = false }
}

// ZXing fallback (lazy-loaded)
async function startZXingScan(videoEl, onFound) {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()
  const controls = await reader.decodeFromVideoDevice(null, videoEl, (result, err) => {
    if (result) onFound(result.getText())
  })
  return () => controls.stop()
}

export async function startScan(videoEl, onFound) {
  if (typeof BarcodeDetector !== 'undefined') {
    const stop = await startNativeScan(videoEl, onFound)
    if (stop) return stop
  }
  return startZXingScan(videoEl, onFound)
}

export async function requestCameraPermission() {
  try {
    const status = await navigator.permissions.query({ name: 'camera' })
    if (status.state === 'denied') return false
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(t => t.stop())
    return true
  } catch {
    return false
  }
}
