'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApolices } from '@/hooks/use-apolices'
import { useSeguradoras, useModalidades } from '@/hooks/use-propostas'
import { APOLICE_STATUS, formatBRL, formatDateBR } from '@/lib/constants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'

export function ApolicesTable() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [seguradoraFilter, setSeguradoraFilter] = useState<string>('')

  const { data: apolices, isLoading } = useApolices({
    search: search || undefined,
    status: statusFilter || undefined,
    seguradora_id: seguradoraFilter || undefined,
  })
  const { data: seguradoras } = useSeguradoras()

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por apólice ou tomador..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v ?? '')}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {APOLICE_STATUS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={seguradoraFilter} onValueChange={(v) => setSeguradoraFilter(v === 'all' ? '' : v ?? '')}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Seguradora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {seguradoras?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apólice</TableHead>
                <TableHead className="hidden sm:table-cell">Tomador</TableHead>
                <TableHead className="hidden md:table-cell">Seguradora</TableHead>
                <TableHead className="hidden lg:table-cell">Modalidade</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-right">Prêmio</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apolices?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma apólice encontrada
                  </TableCell>
                </TableRow>
              )}
              {apolices?.map((apolice) => {
                const statusConfig = APOLICE_STATUS.find((s) => s.id === apolice.status)
                const daysToExpiry = Math.ceil(
                  (new Date(apolice.vigencia_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <TableRow
                    key={apolice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/apolices/${apolice.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{apolice.numero_apolice}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {(apolice.tomador as any)?.razao_social}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <p className="text-sm truncate max-w-[200px]">
                        {(apolice.tomador as any)?.razao_social}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {(apolice.seguradora as any)?.nome}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {(apolice.modalidade as any)?.nome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p>{formatDateBR(apolice.vigencia_inicio)}</p>
                        <p className="text-muted-foreground">até {formatDateBR(apolice.vigencia_fim)}</p>
                        {apolice.status === 'vigente' && daysToExpiry <= 30 && (
                          <span className="text-orange-600 font-medium">{daysToExpiry}d</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatBRL(apolice.premio)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{ borderColor: statusConfig?.color, color: statusConfig?.color }}
                      >
                        {statusConfig?.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
