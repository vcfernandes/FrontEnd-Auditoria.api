import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { iniciais } from '@/lib/formatadores'

/** Nome + avatar de iniciais no cabeçalho do computador, com menu para Conta e Sair. */
export function MenuUsuario() {
  const { sessao, sair } = useAuth()
  const nome = sessao?.usuario.nome ?? ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-11 items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted">
        <span
          className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          aria-hidden
        >
          {iniciais(nome)}
        </span>
        <span className="max-w-48 truncate">{nome}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate font-medium">{nome}</span>
          <span className="truncate text-xs text-muted-foreground">{sessao?.usuario.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="h-10 cursor-pointer">
          <Link to="/conta">
            <UserRound aria-hidden />
            Conta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" className="h-10 cursor-pointer" onSelect={sair}>
          <LogOut aria-hidden />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
