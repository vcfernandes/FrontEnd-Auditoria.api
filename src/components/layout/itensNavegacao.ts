import { ClipboardList, UserRound, Users, type LucideIcon } from 'lucide-react'

export interface ItemNavegacao {
  rotulo: string
  caminho: string
  icone: LucideIcon
}

export const itensNavegacao: ItemNavegacao[] = [
  { rotulo: 'Auditorias', caminho: '/auditorias', icone: ClipboardList },
  { rotulo: 'Clientes', caminho: '/clientes', icone: Users },
  { rotulo: 'Conta', caminho: '/conta', icone: UserRound },
]
