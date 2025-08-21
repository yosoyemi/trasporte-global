"use client"

import { useEffect, useState } from "react"

/**
 * Imagen tolerante a errores para usar en Server Components.
 * Si no hay src o falla la carga, muestra fallback "Sin imagen".
 */
export default function UnitImage({
  src,
  alt = "",
  className = "h-full w-full object-cover",
  fallbackClassName = "h-full w-full",
}: {
  src?: string | null
  alt?: string
  className?: string
  fallbackClassName?: string
}) {
  // normaliza: evita pasar "" al <img src>
  const normalized = src && src.trim().length > 0 ? src : undefined

  const [ok, setOk] = useState<boolean>(!!normalized)

  // Si cambia el src desde afuera, revalida estado local
  useEffect(() => {
    const has = !!(src && src.trim().length > 0)
    setOk(has)
  }, [src])

  if (!normalized || !ok) {
    return (
      <div className={`flex items-center justify-center text-[10px] text-muted-foreground ${fallbackClassName}`}>
        Sin imagen
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={normalized} alt={alt} className={className} onError={() => setOk(false)} />
}
