'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, UploadCloud, Loader2, Trash2, FileText, ArrowLeft } from 'lucide-react'
import { CHECKLIST_DOCUMENTOS, useDocumentosCorretora, useUploadDocumento, useDeleteDocumento } from '@/hooks/use-documentos'
import Link from 'next/link'

export default function DocumentosCadastroPage() {
  const { data: documentos, isLoading } = useDocumentosCorretora()
  const uploadDoc = useUploadDocumento()
  const deleteDoc = useDeleteDocumento()

  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedItem, setSelectedItem] = useState<{ id: string; tipo: string } | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedItem) return
    setUploadingId(selectedItem.id)
    uploadDoc.mutate(
      { file, idName: selectedItem.id, tipo: selectedItem.tipo },
      {
        onSettled: () => {
          setUploadingId(null)
          setSelectedItem(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
      }
    )
  }

  const triggerUpload = (id: string, tipo: string) => {
    setSelectedItem({ id, tipo })
    fileInputRef.current?.click()
  }

  const getDocStatus = (idName: string) => documentos?.find((d: any) => d.nome === idName)

  const uploadedCount = documentos?.length ?? 0
  const total = CHECKLIST_DOCUMENTOS.length
  const progress = Math.round((uploadedCount / total) * 100)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760, margin: '0 auto' }}>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/configuracoes" style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 6, border: '1px solid var(--rz-line)', background: 'var(--rz-white)',
          color: 'var(--rz-ink)', textDecoration: 'none',
        }}>
          <ArrowLeft size={15} />
        </Link>
        <div>
          <div className="rz-eyebrow" style={{ marginBottom: 2 }}>Configurações</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0, color: 'var(--rz-ink)', fontWeight: 400, lineHeight: 1.1 }}>
            Ficha de Cadastro
          </h1>
        </div>
      </div>

      {/* Progress banner */}
      <div className="rz-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rz-ink)' }}>
              {uploadedCount} de {total} documentos enviados
            </div>
            <div style={{ fontSize: 11, color: 'var(--rz-text-2)', marginTop: 2 }}>
              Formatos aceitos: PDF, JPG, PNG · Máximo 5 MB por arquivo
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-serif)', fontSize: 32,
            color: progress === 100 ? 'var(--rz-moss)' : 'var(--rz-ink)',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>{progress}%</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--rz-fog)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress === 100 ? 'var(--rz-moss)' : 'var(--rz-lime)',
            borderRadius: 999,
            transition: 'width 500ms ease',
          }} />
        </div>
      </div>

      {/* Document list */}
      <div className="rz-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--rz-line-2)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="rz-skeleton" style={{ width: 20, height: 20, borderRadius: 999 }} />
              <div className="rz-skeleton" style={{ height: 13, width: 220, borderRadius: 4 }} />
            </div>
          ))
        ) : (
          CHECKLIST_DOCUMENTOS.map((item, i) => {
            const uploaded = getDocStatus(item.id)
            const isUploading = uploadingId === item.id
            const isLast = i === CHECKLIST_DOCUMENTOS.length - 1

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '16px 20px',
                  borderBottom: isLast ? 'none' : '1px solid var(--rz-line-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Status icon */}
                  <div style={{ marginTop: 1, flexShrink: 0 }}>
                    {uploaded ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--rz-moss)' }} />
                    ) : (
                      <div style={{
                        width: 18, height: 18, borderRadius: 999,
                        border: '2px dashed var(--rz-line)',
                      }} />
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rz-ink)' }}>{item.label}</div>
                    {uploaded ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 500,
                          background: '#dff0e8', color: 'var(--rz-moss)',
                        }}>Enviado</span>
                        <a
                          href={uploaded.arquivo_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 11, color: 'var(--rz-pine)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <FileText size={11} /> Ver arquivo
                        </a>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--rz-text-3)', marginTop: 3 }}>Pendente</div>
                    )}
                  </div>
                </div>

                {/* Action */}
                {uploaded ? (
                  <button
                    onClick={() => deleteDoc.mutate(uploaded.id)}
                    disabled={deleteDoc.isPending}
                    style={{
                      width: 32, height: 32, borderRadius: 6, border: '1px solid var(--rz-line)',
                      background: 'var(--rz-white)', color: 'var(--rz-danger)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => triggerUpload(item.id, item.tipo)}
                    disabled={isLoading || isUploading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      height: 34, padding: '0 14px', borderRadius: 6, border: 'none',
                      background: isUploading ? 'var(--rz-pine)' : 'var(--rz-deep)',
                      color: 'var(--rz-paper)', fontSize: 12, fontWeight: 500,
                      fontFamily: 'inherit', cursor: isUploading ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {isUploading ? (
                      <><Loader2 size={13} className="animate-spin" /> Enviando…</>
                    ) : (
                      <><UploadCloud size={13} /> Anexar</>
                    )}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
