"use client"

import { useState } from "react"
import { uploadUnitImageAction, deleteUnitImage } from "@/lib/actions/units"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import UnitImage from "@/components/unit-image"

export default function ChangeUnitImage({
  unitId,
  currentUrl,
}: {
  unitId: string
  currentUrl?: string | null
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function onUpload(formData: FormData) {
    setLoading(true)
    try {
      const res = await uploadUnitImageAction(formData)
      if (res.success) {
        toast.success("Imagen actualizada")
        setFile(null)
        setPreview(null)
        router.refresh() // <-- fuerza recarga de datos del Server Component
      } else {
        toast.error(res.error || "No se pudo subir la imagen")
      }
    } finally {
      setLoading(false)
    }
  }

  async function onDelete() {
    setLoading(true)
    try {
      const res = await deleteUnitImage(unitId)
      if (res.success) {
        toast.success("Imagen eliminada")
        setFile(null)
        setPreview(null)
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo eliminar")
      }
    } finally {
      setLoading(false)
    }
  }

  const displaySrc = preview ?? currentUrl ?? undefined

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-28 overflow-hidden rounded-md border bg-muted">
        <UnitImage
          src={displaySrc}
          alt="unit"
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
        />
      </div>

      <form action={onUpload} className="flex items-center gap-2">
        <input type="hidden" name="unitId" value={unitId} />
        <Input type="file" name="file" accept="image/*" onChange={onFile} />
        <Button type="submit" disabled={!file || loading}>
          {loading ? "Guardando..." : "Guardar imagen"}
        </Button>
      </form>

      {(currentUrl || preview) && (
        <Button type="button" variant="outline" disabled={loading} onClick={onDelete}>
          Quitar
        </Button>
      )}
    </div>
  )
}
