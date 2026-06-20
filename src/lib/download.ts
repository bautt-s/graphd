// Small helpers for triggering downloads and unique ids.

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

let _counter = 0
/** Reasonably-unique id without Date.now()/Math.random dependence issues. */
export function uid(prefix = 'o'): string {
  _counter += 1
  const rand = Math.floor(performance.now() * 1000) % 1000000
  return `${prefix}${rand.toString(36)}${_counter.toString(36)}`
}
