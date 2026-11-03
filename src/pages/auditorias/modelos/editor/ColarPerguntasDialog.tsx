import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { lerPerguntasColadas } from '@/lib/colarPerguntas'
import { contagem } from './formulario'

function Conteudo({ onCriar }: { onCriar: (textos: string[]) => void }) {
  const [texto, setTexto] = useState('')
  const perguntas = lerPerguntasColadas(texto)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="perguntas-coladas">Perguntas</Label>
          <Textarea
            id="perguntas-coladas"
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={'1. As mãos dos manipuladores estão limpas?\n2) Os alimentos estão protegidos?\na) O lixo tem tampa?'}
            className="max-h-[40dvh] min-h-40"
          />
        </div>
        {perguntas.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Como vão ficar</p>
            <ol className="flex list-inside list-decimal flex-col divide-y rounded-lg border text-sm">
              {perguntas.map((pergunta, i) => (
                <li key={i} className="px-3 py-2">
                  {pergunta}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button
          type="button"
          size="lg"
          className="h-11"
          disabled={perguntas.length === 0}
          onClick={() => onCriar(perguntas)}
        >
          {perguntas.length === 0 ? 'Criar perguntas' : `Criar ${contagem(perguntas.length, 'pergunta', 'perguntas')}`}
        </Button>
      </DialogFooter>
    </>
  )
}

export function ColarPerguntasDialog({
  aberto,
  tituloSecao,
  onAbertoChange,
  onCriar,
}: {
  aberto: boolean
  tituloSecao: string
  onAbertoChange: (aberto: boolean) => void
  onCriar: (textos: string[]) => void
}) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colar perguntas</DialogTitle>
          <DialogDescription>
            Uma pergunta por linha{tituloSecao ? `, em “${tituloSecao}”` : ''}. Linhas vazias são ignoradas e numerações
            como “1.”, “1)” ou “a)” saem do começo.
          </DialogDescription>
        </DialogHeader>
        {aberto && <Conteudo onCriar={onCriar} />}
      </DialogContent>
    </Dialog>
  )
}
