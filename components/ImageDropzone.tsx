'use client'

import { useRef, useState } from 'react'
import { Icon } from './Icon'

export default function ImageDropzone({ value, onFile, uploading, alt, maxMb = 5 }: {
  value: string
  onFile: (file: File) => void
  uploading?: boolean
  alt?: string
  maxMb?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={'dropzone' + (drag ? ' drag' : '') + (value ? ' has-image' : '')}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      role="button"
      aria-label="Subir imagen"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
      />
      {value ? (
        <>
          <img src={value} alt={alt} />
          <div className={'dropzone-overlay' + (uploading ? ' show' : '')}>{uploading ? 'Subiendo…' : 'Cambiar'}</div>
        </>
      ) : (
        <div className="dropzone-empty">
          <div className="dz-icon"><Icon.Upload /></div>
          <div className="dropzone-cta">{uploading ? 'Subiendo…' : 'Arrastrá o hacé clic'}</div>
          <div className="dropzone-hint">PNG · JPG · WEBP · máx {maxMb} MB</div>
        </div>
      )}
    </div>
  )
}
