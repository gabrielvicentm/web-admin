import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type ViagemStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

export type ViagemFormData = {
  cliente_id: string
  motorista_id: string
  veiculo_id: string
  tipo_carga_id: string
  origem_cidade: string
  origem_uf: string
  destino_cidade: string
  destino_uf: string
  data_saida: string
  data_chegada_prevista: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  km_inicial: string
  status: ViagemStatus
  observacoes: string
}

export type Viagem = {
  id: string
  cliente_id: string
  motorista_id: string
  veiculo_id: string
  tipo_carga_id: string
  origem_cidade: string
  origem_uf: string
  destino_cidade: string
  destino_uf: string
  data_saida: string
  data_chegada_prevista: string
  data_chegada_real?: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  km_inicial: string
  km_final?: string
  status: ViagemStatus
  observacoes: string
}

export type ViagemListItem = Viagem & {
  cliente_nome?: string
  motorista_nome?: string
  veiculo_placa?: string
  veiculo_modelo?: string
  tipo_carga_nome?: string
}

export type ViagemTimelineItem = {
  id: string | number
  titulo?: string
  descricao?: string
  tipo?: string
  status?: string
  data_evento?: string
}

export type ViagemDocumento = {
  id: string | number
  nome?: string
  tipo?: string
  tamanho_bytes?: number
  created_at?: string
  url?: string
}

export type ViagemOcorrencia = {
  id: string | number
  titulo?: string
  descricao?: string
  status?: string
  severidade?: string
  data_ocorrencia?: string
  responsavel_nome?: string
}

export type ViagemAbastecimento = {
  id: string | number
  veiculo_placa?: string
  posto?: string
  combustivel?: string
  litros?: number | string
  valor_total?: number | string
  valor_litro?: number | string
  km_atual?: number | string
  data_abastecimento?: string
}

export type ViagemDetalhe = ViagemListItem & {
  timeline?: ViagemTimelineItem[]
  documentos?: ViagemDocumento[]
  ocorrencias?: ViagemOcorrencia[]
  abastecimentos?: ViagemAbastecimento[]
}

export type ViagemFinalizacao = {
  id: string | number
  viagem_id: string
  km_final: string
  status: string
  observacao_motorista?: string
  observacao_admin?: string
  solicitado_em?: string
  respondido_em?: string
}

type ListViagensParams = {
  search?: string
  status?: string
  data_saida_de?: string
  data_saida_ate?: string
  exclude_concluidas?: boolean
  page?: number
  limit?: number
}

type ViagemPayload = {
  cliente_id?: string
  motorista_id: string
  veiculo_id: string
  tipo_carga_id?: string
  origem_cidade: string
  origem_uf: string
  destino_cidade: string
  destino_uf: string
  data_saida: string
  data_chegada_prevista: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  km_inicial: string
  status?: ViagemStatus
  observacoes: string
}

type ViagemFinalizarPayload = {
  km_final: string
  data_chegada_real: string
  observacao_admin: string
}

type ApiViagemHistoricoItem = {
  id: string | number
  usuario_tipo?: string
  campo_alterado?: string
  valor_novo?: string
  descricao?: string
  created_at?: string
}

function normalizeViagemPayload(payload: ViagemFormData): ViagemPayload {
  return {
    cliente_id: payload.cliente_id || undefined,
    motorista_id: payload.motorista_id,
    veiculo_id: payload.veiculo_id,
    tipo_carga_id: payload.tipo_carga_id || undefined,
    origem_cidade: payload.origem_cidade.trim(),
    origem_uf: payload.origem_uf.trim().toUpperCase(),
    destino_cidade: payload.destino_cidade.trim(),
    destino_uf: payload.destino_uf.trim().toUpperCase(),
    data_saida: payload.data_saida,
    data_chegada_prevista: payload.data_chegada_prevista,
    distancia_km: payload.distancia_km.trim(),
    peso_carga_kg: payload.peso_carga_kg.trim(),
    valor_frete: payload.valor_frete.trim(),
    km_inicial: payload.km_inicial.trim(),
    status: payload.status,
    observacoes: payload.observacoes.trim(),
  }
}

export const viagemService = {
  async list(params: ListViagensParams) {
    const response = await api.get<PaginatedApiResponse<ViagemListItem[]>>('/admin/viagens', { params })
    return response.data
  },

  async getById(id: string | number) {
    const response = await api.get<ApiResponse<ViagemDetalhe>>(`/admin/viagens/${id}`)
    return response.data
  },

  async create(payload: ViagemFormData) {
    const response = await api.post<ApiResponse<Viagem>>('/admin/viagens', normalizeViagemPayload(payload))
    return response.data
  },

  async update(id: string | number, payload: ViagemFormData) {
    const response = await api.put<ApiResponse<ViagemDetalhe>>(`/admin/viagens/${id}`, normalizeViagemPayload(payload))
    return response.data
  },

  async remove(id: string | number) {
    const response = await api.delete<ApiResponse<null>>(`/admin/viagens/${id}`)
    return response.data
  },

  async getTimeline(id: string | number) {
    const response = await api.get<ApiResponse<ApiViagemHistoricoItem[]>>(`/admin/viagens/${id}/historico`)

    return {
      ...response.data,
      data: response.data.data.map((item) => ({
        id: item.id,
        titulo: item.campo_alterado ? item.campo_alterado.replace(/_/g, ' ') : `Acao ${item.usuario_tipo ?? 'sistema'}`,
        descricao: item.descricao,
        status: item.campo_alterado === 'status' ? item.valor_novo : item.usuario_tipo,
        data_evento: item.created_at,
      })),
    }
  },

  async getDocumentos(id: string | number) {
    const response = await api.get<ApiResponse<ViagemDocumento[]>>(`/admin/viagens/${id}/documentos`)
    return response.data
  },

  async uploadDocumentos(id: string | number, files: File[]) {
    const formData = new FormData()
    for (const file of files) {
      formData.append('documentos', file)
    }

    const response = await api.post<ApiResponse<ViagemDocumento[]>>(`/admin/viagens/${id}/documentos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async downloadDocumento(viagemId: string | number, documentoId: string | number, fallbackName?: string) {
    const response = await api.get<ArrayBuffer>(`/admin/viagens/${viagemId}/documentos/${documentoId}`, {
      responseType: 'arraybuffer',
    })

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    })

    const contentDisposition = response.headers['content-disposition'] || ''
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
    const filename = filenameMatch?.[1] || fallbackName || 'documento-viagem'

    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    window.document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)
  },

  async getFinalizacoes(id: string | number) {
    const response = await api.get<ApiResponse<ViagemFinalizacao[]>>(`/admin/viagens/${id}/finalizacoes`)
    return response.data
  },

  async finalize(id: string | number, payload: ViagemFinalizarPayload) {
    const response = await api.post<ApiResponse<ViagemDetalhe>>(`/admin/viagens/${id}/finalizar`, payload)
    return response.data
  },

  async getOcorrencias(id: string | number) {
    const response = await api.get<ApiResponse<ViagemOcorrencia[]>>(`/admin/viagens/${id}/ocorrencias`)
    return response.data
  },

  async getAbastecimentos(id: string | number) {
    const response = await api.get<ApiResponse<ViagemAbastecimento[]>>(`/admin/viagens/${id}/abastecimentos`)
    return response.data
  },
}
