import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props extends ComponentProps<'input'> {
  rotulo: string
  erro?: string
}

export function CampoTexto({ rotulo, erro, id, ...props }: Props) {
  const campoId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={campoId} className="text-sm">
        {rotulo}
      </Label>
      <Input
        id={campoId}
        className="h-12 text-base"
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${campoId}-erro` : undefined}
        {...props}
      />
      {erro && (
        <p id={`${campoId}-erro`} className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  )
}
