import { useState } from 'react'
import { toast } from 'sonner'
import type { ModeloDetalhe } from '@/api/checklists'
import { EsqueletoFormulario } from '@/components/Esqueletos'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EditorModelo } from './EditorModelo'
import type { DadosModelo } from './formulario'
import { apagarRascunho, chaveRascunho, rascunhoRecuperavel } from './rascunho'

function quando(epoch: number) {
  const data = new Date(epoch)
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

/** Antes de abrir o editor, pergunta se quer recuperar o rascunho gravado neste aparelho (se houver um). */
export function EditorComRascunho({ modelo }: { modelo?: ModeloDetalhe }) {
  const [chave] = useState(() => chaveRascunho(modelo?.id))
  const [rascunho] = useState(() => rascunhoRecuperavel(chave, modelo))
  const [perguntando, setPerguntando] = useState(rascunho !== null)
  const [recuperado, setRecuperado] = useState<DadosModelo | undefined>()

  if (!perguntando) return <EditorModelo modelo={modelo} chave={chave} recuperado={recuperado} />

  return (
    <>
      <EsqueletoFormulario campos={4} />
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recuperar alterações não salvas?</AlertDialogTitle>
            <AlertDialogDescription>
              Há um rascunho {modelo ? 'deste modelo' : 'de um novo modelo'} guardado neste aparelho, de{' '}
              {rascunho && quando(rascunho.salvoEm)}. Ele não foi salvo no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-11"
              onClick={() => {
                apagarRascunho(chave)
                setPerguntando(false)
              }}
            >
              Descartar rascunho
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11"
              onClick={() => {
                setRecuperado(rascunho?.dados)
                setPerguntando(false)
                toast.success('Rascunho recuperado. Salve para guardar as alterações no modelo.')
              }}
            >
              Recuperar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
