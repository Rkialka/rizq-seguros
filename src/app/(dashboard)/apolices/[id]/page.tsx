'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useApolice } from '@/hooks/use-apolices'
import { APOLICE_STATUS, formatBRL, formatDateBR } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Building2, Calendar, DollarSign, Shield, FileText, Link2 } from 'lucide-react'
import Link from 'next/link'

export default function ApoliceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: apolice, isLoading } = useApolice(id)

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!apolice) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-muted-foreground">Apólice não encontrada</p>
      </div>
    )
  }

  const statusConfig = APOLICE_STATUS.find((s) => s.id === apolice.status)
  const daysToExpiry = Math.ceil(
    (new Date(apolice.vigencia_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{apolice.numero_apolice}</h1>
            <Badge
              variant="outline"
              style={{ borderColor: statusConfig?.color, color: statusConfig?.color }}
            >
              {statusConfig?.label}
            </Badge>
            {apolice.status === 'vigente' && daysToExpiry <= 60 && (
              <Badge variant={daysToExpiry <= 30 ? 'destructive' : 'secondary'}>
                Vence em {daysToExpiry} dias
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{apolice.objeto}</p>
        </div>
      </div>

      {/* Linked Proposta */}
      {apolice.proposta && (
        <Card className="border-dashed">
          <CardContent className="p-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Originada da proposta:</span>
            <Link
              href={`/propostas/${apolice.proposta.id}`}
              className="text-sm text-primary underline"
            >
              {(apolice.proposta as any)?.numero_proposta}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Tomador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{(apolice.tomador as any)?.razao_social}</p>
            <p className="text-sm text-muted-foreground">{(apolice.tomador as any)?.cnpj}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" /> Seguro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{(apolice.seguradora as any)?.nome}</p>
            <Badge variant="outline">{(apolice.modalidade as any)?.nome}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">IS:</span>
                <p className="font-medium">{formatBRL(apolice.importancia_segurada)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Prêmio:</span>
                <p className="font-medium">{formatBRL(apolice.premio)}</p>
              </div>
              {apolice.taxa && (
                <div>
                  <span className="text-muted-foreground">Taxa:</span>
                  <p className="font-medium">{(apolice.taxa * 100).toFixed(2)}%</p>
                </div>
              )}
              {apolice.comissao_percentual && (
                <div>
                  <span className="text-muted-foreground">Comissão:</span>
                  <p className="font-medium">{apolice.comissao_percentual}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Vigência
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Início: {formatDateBR(apolice.vigencia_inicio)}</p>
            <p>Fim: {formatDateBR(apolice.vigencia_fim)}</p>
            {apolice.data_emissao && <p>Emissão: {formatDateBR(apolice.data_emissao)}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      {(apolice.favorecido || apolice.numero_licitacao || apolice.numero_contrato || apolice.observacoes) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" /> Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {apolice.favorecido && <p>Favorecido: {apolice.favorecido}</p>}
            {apolice.numero_licitacao && <p>Licitação: {apolice.numero_licitacao}</p>}
            {apolice.numero_contrato && <p>Contrato: {apolice.numero_contrato}</p>}
            {apolice.orgao_publico && <p>Órgão: {apolice.orgao_publico}</p>}
            {apolice.observacoes && (
              <>
                <Separator />
                <p className="text-muted-foreground">{apolice.observacoes}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 2 placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Endossos', 'Sinistros', 'Boletos'].map((section) => (
          <Card key={section}>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p className="text-sm">{section}</p>
              <p className="text-xs mt-1">Em breve</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
