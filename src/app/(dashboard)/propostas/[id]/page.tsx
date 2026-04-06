'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useProposta } from '@/hooks/use-propostas'
import { PROPOSTA_STAGES, PRIORIDADES, formatBRL, formatDateBR, getSLADaysRemaining, getSLAColor } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, Calendar, DollarSign, FileText, Shield } from 'lucide-react'

export default function PropostaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: proposta, isLoading } = useProposta(id)

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-muted-foreground">Proposta não encontrada</p>
      </div>
    )
  }

  const stageConfig = PROPOSTA_STAGES.find((s) => s.id === proposta.status)
  const prioConfig = PRIORIDADES.find((p) => p.id === proposta.prioridade)
  const slaRemaining = getSLADaysRemaining(proposta.sla_inicio, proposta.sla_dias)
  const slaColor = getSLAColor(slaRemaining)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{proposta.numero_proposta}</h1>
            <Badge style={{ backgroundColor: stageConfig?.color, color: '#fff' }}>
              {stageConfig?.label}
            </Badge>
            <Badge variant="outline" style={{ borderColor: prioConfig?.color, color: prioConfig?.color }}>
              {prioConfig?.label}
            </Badge>
            <span className="text-sm font-bold" style={{ color: slaColor }}>
              SLA: {slaRemaining > 0 ? `${slaRemaining} dias` : 'Estourado!'}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{proposta.objeto}</p>
        </div>
      </div>

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tomador */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Tomador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-medium">{proposta.tomador?.razao_social}</p>
                <p className="text-sm text-muted-foreground">{proposta.tomador?.cnpj}</p>
              </CardContent>
            </Card>

            {/* Seguradora + Modalidade */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Seguro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-medium">{proposta.modalidade?.nome}</p>
                {proposta.seguradora && (
                  <p className="text-sm text-muted-foreground">{proposta.seguradora.nome}</p>
                )}
              </CardContent>
            </Card>

            {/* Valores */}
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
                    <p className="font-medium">{formatBRL(proposta.importancia_segurada)}</p>
                  </div>
                  {proposta.premio && (
                    <div>
                      <span className="text-muted-foreground">Prêmio:</span>
                      <p className="font-medium">{formatBRL(proposta.premio)}</p>
                    </div>
                  )}
                  {proposta.taxa && (
                    <div>
                      <span className="text-muted-foreground">Taxa:</span>
                      <p className="font-medium">{(proposta.taxa * 100).toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vigência */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Vigência
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {proposta.vigencia_inicio && (
                  <p>Início: {formatDateBR(proposta.vigencia_inicio)}</p>
                )}
                {proposta.vigencia_fim && (
                  <p>Fim: {formatDateBR(proposta.vigencia_fim)}</p>
                )}
                {proposta.prazo_dias && <p>{proposta.prazo_dias} dias</p>}
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          {(proposta.numero_licitacao || proposta.numero_contrato || proposta.orgao_publico || proposta.observacoes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {proposta.numero_licitacao && <p>Licitação: {proposta.numero_licitacao}</p>}
                {proposta.numero_contrato && <p>Contrato: {proposta.numero_contrato}</p>}
                {proposta.orgao_publico && <p>Órgão: {proposta.orgao_publico}</p>}
                {proposta.observacoes && (
                  <>
                    <Separator />
                    <p className="text-muted-foreground">{proposta.observacoes}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Upload de documentos será implementado na próxima versão.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Timeline de atividades será implementada na próxima versão.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
