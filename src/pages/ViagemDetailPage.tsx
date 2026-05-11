import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { clienteService, type Cliente } from '../services/clienteService'
import { motoristaService, type MotoristaListItem } from '../services/motoristaService'
import { tipoCargaService, type TipoCarga } from '../services/tipoCargaService'
import { veiculoService, type VeiculoListItem } from '../services/veiculoService'
import {
  viagemService,
  type ViagemAbastecimento,
  type ViagemDetalhe,
  type ViagemDocumento,
  type ViagemFinalizacao,
  type ViagemFormData,
  type ViagemOcorrencia,
  type ViagemStatus,
  type ViagemTimelineItem,
} from '../services/viagemService'

const statusOptions: Array<{ value: ViagemStatus; label: string }> = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluida' },
  { value: 'cancelada', label: 'Cancelada' },
]

const ufOptions = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

const initialFormState: ViagemFormData = {
  cliente_id: '',
  motorista_id: '',
  veiculo_id: '',
  tipo_carga_id: '',
  origem_cidade: '',
  origem_uf: '',
  destino_cidade: '',
  destino_uf: '',
  data_saida: '',
  data_chegada_prevista: '',
  distancia_km: '',
  peso_carga_kg: '',
  valor_frete: '',
  km_inicial: '',
  status: 'pendente',
  observacoes: '',
}

type ActivePanel = 'timeline' | 'documentos' | 'finalizacoes' | 'ocorrencias' | 'abastecimentos'

function formatLabel(text?: string) {
  if (!text) {
    return 'Sem status'
  }

  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCurrency(value?: number | string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
}

function formatNumber(value?: number | string, suffix = '') {
  const formatted = new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
  return suffix ? `${formatted} ${suffix}` : formatted
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Sem data'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function splitApiDateTime(value?: string) {
  if (!value) {
    return { date: '', time: '' }
  }

  const normalized = value.trim()
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)

  if (!match) {
    return { date: '', time: '' }
  }

  const [, year, month, day, hour, minute] = match
  return {
    date: `${day}/${month}/${year}`,
    time: `${hour}:${minute}`,
  }
}

function formatBrazilianDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function formatTimeValue(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function buildApiDateTime(date: string, time: string) {
  const dateMatch = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const timeMatch = time.match(/^(\d{2}):(\d{2})$/)

  if (!dateMatch || !timeMatch) {
    return ''
  }

  const [, day, month, year] = dateMatch
  const [, hour, minute] = timeMatch

  return `${year}-${month}-${day}T${hour}:${minute}`
}

function getNowDateTimeParts() {
  const now = new Date()
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  return { date, time }
}

function buildFormState(viagem: ViagemDetalhe): ViagemFormData {
  return {
    cliente_id: String(viagem.cliente_id ?? ''),
    motorista_id: String(viagem.motorista_id ?? ''),
    veiculo_id: String(viagem.veiculo_id ?? ''),
    tipo_carga_id: String(viagem.tipo_carga_id ?? ''),
    origem_cidade: viagem.origem_cidade ?? '',
    origem_uf: viagem.origem_uf ?? '',
    destino_cidade: viagem.destino_cidade ?? '',
    destino_uf: viagem.destino_uf ?? '',
    data_saida: viagem.data_saida ?? '',
    data_chegada_prevista: viagem.data_chegada_prevista ?? '',
    distancia_km: String(viagem.distancia_km ?? ''),
    peso_carga_kg: String(viagem.peso_carga_kg ?? ''),
    valor_frete: String(viagem.valor_frete ?? ''),
    km_inicial: String(viagem.km_inicial ?? ''),
    status: viagem.status ?? 'pendente',
    observacoes: viagem.observacoes ?? '',
  }
}

function fallbackTimeline(viagem: ViagemDetalhe | null): ViagemTimelineItem[] {
  if (!viagem) {
    return []
  }

  return [
    {
      id: 'saida-planejada',
      titulo: 'Saida planejada',
      descricao: `${viagem.origem_cidade}/${viagem.origem_uf} para ${viagem.destino_cidade}/${viagem.destino_uf}`,
      status: viagem.status,
      data_evento: viagem.data_saida,
    },
    {
      id: 'previsao-chegada',
      titulo: 'Previsao de chegada',
      descricao: viagem.tipo_carga_nome || 'Carga sem descricao',
      status: 'previsto',
      data_evento: viagem.data_chegada_prevista,
    },
  ]
}

export function ViagemDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const nowParts = useMemo(() => getNowDateTimeParts(), [])
  const [viagem, setViagem] = useState<ViagemDetalhe | null>(null)
  const [formData, setFormData] = useState<ViagemFormData>(initialFormState)
  const [dataSaidaDate, setDataSaidaDate] = useState('')
  const [dataSaidaTime, setDataSaidaTime] = useState('')
  const [dataChegadaDate, setDataChegadaDate] = useState('')
  const [dataChegadaTime, setDataChegadaTime] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [motoristas, setMotoristas] = useState<MotoristaListItem[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [tiposCarga, setTiposCarga] = useState<TipoCarga[]>([])
  const [clienteSearch, setClienteSearch] = useState('')
  const [motoristaSearch, setMotoristaSearch] = useState('')
  const [veiculoSearch, setVeiculoSearch] = useState('')
  const [tipoCargaSearch, setTipoCargaSearch] = useState('')
  const [timeline, setTimeline] = useState<ViagemTimelineItem[]>([])
  const [documentos, setDocumentos] = useState<ViagemDocumento[]>([])
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const [finalizacoes, setFinalizacoes] = useState<ViagemFinalizacao[]>([])
  const [ocorrencias, setOcorrencias] = useState<ViagemOcorrencia[]>([])
  const [abastecimentos, setAbastecimentos] = useState<ViagemAbastecimento[]>([])
  const [activePanel, setActivePanel] = useState<ActivePanel>('timeline')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizacaoKMFinal, setFinalizacaoKMFinal] = useState('')
  const [finalizacaoDate, setFinalizacaoDate] = useState(nowParts.date)
  const [finalizacaoTime, setFinalizacaoTime] = useState(nowParts.time)
  const [finalizacaoObservacao, setFinalizacaoObservacao] = useState('')
  const [feedback, setFeedback] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const selectedCliente = useMemo(
    () => clientes.find((item) => String(item.id) === formData.cliente_id),
    [clientes, formData.cliente_id],
  )
  const selectedMotorista = useMemo(
    () => motoristas.find((item) => String(item.id) === formData.motorista_id),
    [motoristas, formData.motorista_id],
  )
  const selectedVeiculo = useMemo(
    () => veiculos.find((item) => String(item.id) === formData.veiculo_id),
    [veiculos, formData.veiculo_id],
  )
  const selectedTipoCarga = useMemo(
    () => tiposCarga.find((item) => String(item.id) === formData.tipo_carga_id),
    [tiposCarga, formData.tipo_carga_id],
  )

  const displayTimeline = timeline.length > 0 ? timeline : fallbackTimeline(viagem)
  const hasSelectedClienteOption = clientes.some((item) => String(item.id) === formData.cliente_id)
  const hasSelectedMotoristaOption = motoristas.some((item) => String(item.id) === formData.motorista_id)
  const hasSelectedVeiculoOption = veiculos.some((item) => String(item.id) === formData.veiculo_id)
  const hasSelectedTipoCargaOption = tiposCarga.some((item) => String(item.id) === formData.tipo_carga_id)
  const editableStatusOptions = viagem?.status === 'concluida'
    ? statusOptions
    : statusOptions.filter((option) => option.value !== 'concluida')

  const loadOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true)

      const [clientesResponse, motoristasResponse, veiculosResponse, tiposCargaResponse] = await Promise.all([
        clienteService.list({ search: clienteSearch, page: 1, limit: 30 }),
        motoristaService.list({ search: motoristaSearch, page: 1, limit: 30 }),
        veiculoService.list({ search: veiculoSearch, page: 1, limit: 30 }),
        tipoCargaService.list({ search: tipoCargaSearch, page: 1, limit: 30 }),
      ])

      setClientes(clientesResponse.data)
      setMotoristas(motoristasResponse.data)
      setVeiculos(veiculosResponse.data)
      setTiposCarga(tiposCargaResponse.data)
    } catch {
      setFeedback('Nao foi possivel carregar as opcoes de vinculo da viagem.')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [clienteSearch, motoristaSearch, tipoCargaSearch, veiculoSearch])

  const loadViagem = useCallback(async () => {
    if (!id) {
      return
    }

    try {
      setIsLoading(true)
      setFeedback('')
      setSuccessMessage('')

      const response = await viagemService.getById(id)
      setViagem(response.data)
      setFormData(buildFormState(response.data))
      setTimeline(response.data.timeline ?? [])
      setDocumentos(response.data.documentos ?? [])
      setFinalizacoes([])
      setOcorrencias(response.data.ocorrencias ?? [])
      setAbastecimentos(response.data.abastecimentos ?? [])

      const finalizacaoParts = splitApiDateTime(response.data.data_chegada_real)
      setFinalizacaoKMFinal(response.data.km_final ?? '')
      setFinalizacaoDate(finalizacaoParts.date || nowParts.date)
      setFinalizacaoTime(finalizacaoParts.time || nowParts.time)

      const [timelineResponse, documentosResponse, finalizacoesResponse, ocorrenciasResponse, abastecimentosResponse] = await Promise.allSettled([
        viagemService.getTimeline(id),
        viagemService.getDocumentos(id),
        viagemService.getFinalizacoes(id),
        viagemService.getOcorrencias(id),
        viagemService.getAbastecimentos(id),
      ])

      if (timelineResponse.status === 'fulfilled') {
        setTimeline(timelineResponse.value.data)
      }

      if (documentosResponse.status === 'fulfilled') {
        setDocumentos(documentosResponse.value.data)
      }

      if (finalizacoesResponse.status === 'fulfilled') {
        setFinalizacoes(finalizacoesResponse.value.data)
      }

      if (ocorrenciasResponse.status === 'fulfilled') {
        setOcorrencias(ocorrenciasResponse.value.data)
      }

      if (abastecimentosResponse.status === 'fulfilled') {
        setAbastecimentos(abastecimentosResponse.value.data)
      }
    } catch {
      setFeedback('Nao foi possivel carregar esta viagem.')
    } finally {
      setIsLoading(false)
    }
  }, [id, nowParts.date, nowParts.time])

  useEffect(() => {
    queueMicrotask(() => {
      void loadViagem()
    })
  }, [loadViagem])

  useEffect(() => {
    queueMicrotask(() => {
      void loadOptions()
    })
  }, [loadOptions])

  useEffect(() => {
    const saida = splitApiDateTime(formData.data_saida)
    setDataSaidaDate(saida.date)
    setDataSaidaTime(saida.time)

    const chegada = splitApiDateTime(formData.data_chegada_prevista)
    setDataChegadaDate(chegada.date)
    setDataChegadaTime(chegada.time)
  }, [formData.data_saida, formData.data_chegada_prevista])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleDateTimeFieldChange(field: 'data_saida' | 'data_chegada_prevista', part: 'date' | 'time', value: string) {
    const formattedValue = part === 'date' ? formatBrazilianDate(value) : formatTimeValue(value)

    if (field === 'data_saida') {
      const nextDate = part === 'date' ? formattedValue : dataSaidaDate
      const nextTime = part === 'time' ? formattedValue : dataSaidaTime

      if (part === 'date') {
        setDataSaidaDate(formattedValue)
      } else {
        setDataSaidaTime(formattedValue)
      }

      setFormData((current) => ({
        ...current,
        data_saida: buildApiDateTime(nextDate, nextTime),
      }))

      return
    }

    const nextDate = part === 'date' ? formattedValue : dataChegadaDate
    const nextTime = part === 'time' ? formattedValue : dataChegadaTime

    if (part === 'date') {
      setDataChegadaDate(formattedValue)
    } else {
      setDataChegadaTime(formattedValue)
    }

    setFormData((current) => ({
      ...current,
      data_chegada_prevista: buildApiDateTime(nextDate, nextTime),
    }))
  }

  function handleDocumentFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDocumentFiles(Array.from(event.target.files ?? []))
  }

  async function handleUploadDocuments() {
    if (!id || documentFiles.length === 0) {
      setFeedback('Selecione ao menos um PDF ou XML para anexar.')
      return
    }

    try {
      setIsUploadingDocuments(true)
      setFeedback('')
      setSuccessMessage('')

      const response = await viagemService.uploadDocumentos(id, documentFiles)
      setDocumentos((current) => [...response.data, ...current])
      setDocumentFiles([])
      setSuccessMessage('Documento(s) anexado(s) com sucesso.')
      setActivePanel('documentos')
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        setFeedback(error.response.data.message)
        return
      }

      setFeedback('Nao foi possivel anexar os documentos da viagem.')
    } finally {
      setIsUploadingDocuments(false)
    }
  }

  async function handleDownloadDocument(item: ViagemDocumento) {
    if (!id) {
      return
    }

    try {
      setFeedback('')
      await viagemService.downloadDocumento(id, item.id, item.nome)
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        setFeedback(error.response.data.message)
        return
      }

      setFeedback('Nao foi possivel baixar o documento da viagem.')
    }
  }

  async function handleFinalizeTrip() {
    if (!id) {
      return
    }

    const dataChegadaReal = buildApiDateTime(finalizacaoDate, finalizacaoTime)
    if (!dataChegadaReal || !finalizacaoKMFinal.trim()) {
      setFeedback('Informe KM final e data/hora real de chegada para finalizar a viagem.')
      return
    }

    try {
      setIsFinalizing(true)
      setFeedback('')
      setSuccessMessage('')

      const response = await viagemService.finalize(id, {
        km_final: finalizacaoKMFinal.trim(),
        data_chegada_real: dataChegadaReal,
        observacao_admin: finalizacaoObservacao.trim(),
      })

      setViagem(response.data)
      setFormData(buildFormState(response.data))
      await loadViagem()
      setSuccessMessage('Viagem finalizada com sucesso.')
      setActivePanel('finalizacoes')
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        setFeedback(error.response.data.message)
        return
      }

      setFeedback('Nao foi possivel finalizar a viagem.')
    } finally {
      setIsFinalizing(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    try {
      setIsSaving(true)
      setFeedback('')
      setSuccessMessage('')
      const response = await viagemService.update(id, formData)
      setViagem(response.data)
      setFormData(buildFormState(response.data))
      setSuccessMessage('Viagem atualizada com sucesso.')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage =
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : 'Nao foi possivel atualizar a viagem.'

        setFeedback(apiMessage)
      } else {
        setFeedback('Nao foi possivel atualizar a viagem. Revise os dados e tente novamente.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando viagem...</section>
  }

  if (!viagem) {
    return (
      <section className="entity-page">
        <div className="entity-empty-state">Viagem nao encontrada.</div>
        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/viagens/listar">
            Voltar para listagem
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Operacao</p>
          <h1 className="dashboard-title">Viagem #{viagem.id}</h1>
          <p className="dashboard-subtitle">
            {viagem.origem_cidade}/{viagem.origem_uf} para {viagem.destino_cidade}/{viagem.destino_uf} com acompanhamento de timeline, documentos, ocorrencias e abastecimentos vinculados.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadViagem()}>
            Atualizar dados
          </button>
          {viagem.status !== 'concluida' && viagem.status !== 'cancelada' ? (
            <button className="entity-action entity-action--primary" type="button" onClick={() => setActivePanel('finalizacoes')}>
              Finalizar viagem
            </button>
          ) : null}
          <Link className="entity-action entity-action--secondary" to="/dashboard/viagens/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}
      {successMessage ? <p className="entity-feedback entity-feedback--success">{successMessage}</p> : null}

      <div className="trip-detail-layout">
        <form className="entity-form" onSubmit={handleSubmit}>
          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Resumo operacional</h2>
                <p>Status, rota, agenda e indicadores principais.</p>
              </div>
              <span className={`entity-status entity-status--${formData.status}`}>{formatLabel(formData.status)}</span>
            </div>

            <div className="entity-kpi-grid entity-kpi-grid--4">
              <div className="entity-kpi">
                <span>Frete</span>
                <strong>{formatCurrency(formData.valor_frete)}</strong>
              </div>
              <div className="entity-kpi">
                <span>Distancia</span>
                <strong>{formatNumber(formData.distancia_km, 'km')}</strong>
              </div>
              <div className="entity-kpi">
                <span>Peso</span>
                <strong>{formatNumber(formData.peso_carga_kg, 'kg')}</strong>
              </div>
              <div className="entity-kpi">
                <span>Abastecimentos</span>
                <strong>{abastecimentos.length}</strong>
              </div>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Vinculos da viagem</h2>
                <p>Cliente, motorista, veiculo e tipo de carga associados.</p>
              </div>
              <button className="entity-action entity-action--secondary" type="button" onClick={() => void loadOptions()}>
                {isLoadingOptions ? 'Buscando...' : 'Atualizar buscas'}
              </button>
            </div>

            <div className="entity-form__grid entity-form__grid--4">
              <label className="entity-field">
                <span>Buscar cliente</span>
                <input value={clienteSearch} onChange={(event) => setClienteSearch(event.target.value)} placeholder="Nome, documento ou e-mail" />
              </label>
              <label className="entity-field">
                <span>Cliente</span>
                <select name="cliente_id" value={formData.cliente_id} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {formData.cliente_id && !hasSelectedClienteOption ? (
                    <option value={formData.cliente_id}>{viagem.cliente_nome ?? `Cliente #${viagem.cliente_id}`}</option>
                  ) : null}
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} - {cliente.cpf_cnpj}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-field">
                <span>Buscar motorista</span>
                <input value={motoristaSearch} onChange={(event) => setMotoristaSearch(event.target.value)} placeholder="Nome, CPF ou CNH" />
              </label>
              <label className="entity-field">
                <span>Motorista</span>
                <select name="motorista_id" value={formData.motorista_id} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {formData.motorista_id && !hasSelectedMotoristaOption ? (
                    <option value={formData.motorista_id}>{viagem.motorista_nome ?? `Motorista #${viagem.motorista_id}`}</option>
                  ) : null}
                  {motoristas.map((motorista) => (
                    <option key={motorista.id} value={motorista.id}>
                      {motorista.nome} - CNH {motorista.tipo_cnh}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-field">
                <span>Buscar veiculo</span>
                <input value={veiculoSearch} onChange={(event) => setVeiculoSearch(event.target.value)} placeholder="Placa, modelo ou marca" />
              </label>
              <label className="entity-field">
                <span>Veiculo</span>
                <select name="veiculo_id" value={formData.veiculo_id} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {formData.veiculo_id && !hasSelectedVeiculoOption ? (
                    <option value={formData.veiculo_id}>{viagem.veiculo_placa ?? `Veiculo #${viagem.veiculo_id}`}</option>
                  ) : null}
                  {veiculos.map((veiculo) => (
                    <option key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa} - {veiculo.modelo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-field">
                <span>Buscar tipo de carga</span>
                <input value={tipoCargaSearch} onChange={(event) => setTipoCargaSearch(event.target.value)} placeholder="Nome ou descricao" />
              </label>
              <label className="entity-field">
                <span>Tipo de carga</span>
                <select name="tipo_carga_id" value={formData.tipo_carga_id} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {formData.tipo_carga_id && !hasSelectedTipoCargaOption ? (
                    <option value={formData.tipo_carga_id}>{viagem.tipo_carga_nome ?? `Tipo #${viagem.tipo_carga_id}`}</option>
                  ) : null}
                  {tiposCarga.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="trip-selection-grid">
              <div className="trip-selection">
                <span>Cliente</span>
                <strong>{selectedCliente?.nome ?? viagem.cliente_nome ?? `Cliente #${viagem.cliente_id}`}</strong>
                <small>{selectedCliente?.email ?? 'Faturamento vinculado'}</small>
              </div>
              <div className="trip-selection">
                <span>Motorista</span>
                <strong>{selectedMotorista?.nome ?? viagem.motorista_nome ?? `Motorista #${viagem.motorista_id}`}</strong>
                <small>{selectedMotorista ? `${selectedMotorista.telefone} - ${selectedMotorista.status}` : 'Responsavel pela viagem'}</small>
              </div>
              <div className="trip-selection">
                <span>Veiculo</span>
                <strong>{selectedVeiculo?.placa ?? viagem.veiculo_placa ?? `Veiculo #${viagem.veiculo_id}`}</strong>
                <small>{selectedVeiculo ? `${selectedVeiculo.modelo} - ${selectedVeiculo.tipo}` : viagem.veiculo_modelo ?? 'Veiculo vinculado'}</small>
              </div>
              <div className="trip-selection">
                <span>Carga</span>
                <strong>{selectedTipoCarga?.nome ?? viagem.tipo_carga_nome ?? `Tipo #${viagem.tipo_carga_id}`}</strong>
                <small>{selectedTipoCarga?.descricao || viagem.tipo_carga_nome || 'Classificacao operacional'}</small>
              </div>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Rota e agenda</h2>
                <p>Origem, destino, datas previstas e status operacional.</p>
              </div>
            </div>

            <div className="entity-form__grid entity-form__grid--4">
              <label className="entity-field">
                <span>Origem - cidade</span>
                <input name="origem_cidade" value={formData.origem_cidade} onChange={handleChange} required />
              </label>
              <label className="entity-field">
                <span>Origem - UF</span>
                <select name="origem_uf" value={formData.origem_uf} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {ufOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-field">
                <span>Destino - cidade</span>
                <input name="destino_cidade" value={formData.destino_cidade} onChange={handleChange} required />
              </label>
              <label className="entity-field">
                <span>Destino - UF</span>
                <select name="destino_uf" value={formData.destino_uf} onChange={handleChange} required>
                  <option value="">Selecione</option>
                  {ufOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-field">
                <span>Data de saida</span>
                <input
                  name="data_saida_data"
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={dataSaidaDate}
                  onChange={(event) => handleDateTimeFieldChange('data_saida', 'date', event.target.value)}
                  required
                />
                <small>Formato brasileiro: dia/mes/ano</small>
              </label>
              <label className="entity-field">
                <span>Hora de saida</span>
                <input
                  name="data_saida_hora"
                  type="text"
                  inputMode="numeric"
                  placeholder="08:30"
                  value={dataSaidaTime}
                  onChange={(event) => handleDateTimeFieldChange('data_saida', 'time', event.target.value)}
                  required
                />
                <small>Use o formato 24 horas</small>
              </label>
              <label className="entity-field">
                <span>Previsao de chegada</span>
                <input
                  name="data_chegada_prevista_data"
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={dataChegadaDate}
                  onChange={(event) => handleDateTimeFieldChange('data_chegada_prevista', 'date', event.target.value)}
                  required
                />
                <small>Formato brasileiro: dia/mes/ano</small>
              </label>
              <label className="entity-field">
                <span>Hora prevista de chegada</span>
                <input
                  name="data_chegada_prevista_hora"
                  type="text"
                  inputMode="numeric"
                  placeholder="17:45"
                  value={dataChegadaTime}
                  onChange={(event) => handleDateTimeFieldChange('data_chegada_prevista', 'time', event.target.value)}
                  required
                />
                <small>Use o formato 24 horas</small>
              </label>
              <label className="entity-field">
                <span>Distancia (km)</span>
                <input name="distancia_km" type="number" min="0" step="0.01" value={formData.distancia_km} onChange={handleChange} />
              </label>
              <label className="entity-field">
                <span>KM inicial</span>
                <input name="km_inicial" type="number" min="0" step="0.01" value={formData.km_inicial} onChange={handleChange} required />
              </label>
              <label className="entity-field">
                <span>Status</span>
                <select name="status" value={formData.status} onChange={handleChange}>
                  {editableStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Carga e valores</h2>
                <p>Dados comerciais, carga transportada e observacoes internas.</p>
              </div>
            </div>

            <div className="entity-form__grid entity-form__grid--4">
              <label className="entity-field">
                <span>Peso da carga (kg)</span>
                <input name="peso_carga_kg" type="number" min="0" step="0.01" value={formData.peso_carga_kg} onChange={handleChange} />
              </label>
              <label className="entity-field">
                <span>Valor do frete</span>
                <input name="valor_frete" type="number" min="0" step="0.01" value={formData.valor_frete} onChange={handleChange} />
              </label>
              <label className="entity-field entity-field--span-2">
                <span>Observacoes internas</span>
                <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={5} />
              </label>
            </div>
          </article>

          <div className="entity-form__actions">
            <button className="entity-action entity-action--ghost" type="button" onClick={() => navigate('/dashboard/viagens/listar')}>
              Cancelar
            </button>
            <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar viagem'}
            </button>
          </div>
        </form>

        <aside className="trip-linked-panel">
          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Registros vinculados</h2>
                <p>Movimentacoes operacionais desta viagem.</p>
              </div>
            </div>

            <div className="trip-detail-tabs" role="tablist" aria-label="Registros da viagem">
              <button className={activePanel === 'timeline' ? 'is-active' : ''} type="button" onClick={() => setActivePanel('timeline')}>
                Timeline
              </button>
              <button className={activePanel === 'documentos' ? 'is-active' : ''} type="button" onClick={() => setActivePanel('documentos')}>
                Documentos
              </button>
              <button className={activePanel === 'finalizacoes' ? 'is-active' : ''} type="button" onClick={() => setActivePanel('finalizacoes')}>
                Finalizacao
              </button>
              <button className={activePanel === 'ocorrencias' ? 'is-active' : ''} type="button" onClick={() => setActivePanel('ocorrencias')}>
                Ocorrencias
              </button>
              <button className={activePanel === 'abastecimentos' ? 'is-active' : ''} type="button" onClick={() => setActivePanel('abastecimentos')}>
                Abastecimentos
              </button>
            </div>

            {activePanel === 'timeline' ? (
              <div className="trip-detail-list">
                {displayTimeline.map((item) => (
                  <div className="entity-timeline__item trip-timeline-item" key={item.id}>
                    <span className="trip-timeline-item__marker" />
                    <div>
                      <strong>{item.titulo ?? item.tipo ?? 'Evento'}</strong>
                      <small>{formatDateTime(item.data_evento)} · {formatLabel(item.status)}</small>
                      <span>{item.descricao ?? 'Sem detalhes registrados.'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {activePanel === 'documentos' ? (
              <div className="trip-detail-list">
                <div className="entity-timeline__item">
                  <strong>Anexar documentos</strong>
                  <small>Os arquivos enviados aqui sao armazenados na pasta `docs` do R2.</small>
                  <div className="entity-form__grid">
                    <label className="entity-field">
                      <span>PDF ou XML</span>
                      <input type="file" accept=".pdf,.xml,application/pdf,text/xml,application/xml" multiple onChange={handleDocumentFilesChange} />
                    </label>
                    <button className="entity-action entity-action--primary" type="button" onClick={() => void handleUploadDocuments()} disabled={isUploadingDocuments}>
                      {isUploadingDocuments ? 'Enviando...' : 'Enviar documentos'}
                    </button>
                  </div>
                </div>

                {documentos.length === 0 ? (
                  <p className="entity-empty-inline">Sem documentos vinculados.</p>
                ) : (
                  documentos.map((item) => (
                    <div className="entity-timeline__item" key={item.id}>
                      <strong>{item.nome ?? item.tipo ?? 'Documento'}</strong>
                      <span>{(item.tipo ?? 'arquivo').toUpperCase()} · {formatNumber(item.tamanho_bytes ?? 0, 'bytes')}</span>
                      <small>Enviado em {formatDateTime(item.created_at)}</small>
                      <button className="entity-action entity-action--secondary" type="button" onClick={() => void handleDownloadDocument(item)}>
                        Baixar documento
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activePanel === 'finalizacoes' ? (
              <div className="trip-detail-list">
                {viagem.status !== 'concluida' && viagem.status !== 'cancelada' ? (
                  <div className="entity-timeline__item">
                    <strong>Finalizar viagem como administrador</strong>
                    <small>Esse fluxo encerra a viagem, libera o veiculo e registra o fechamento no historico.</small>
                    <div className="entity-form__grid entity-form__grid--2">
                      <label className="entity-field">
                        <span>KM final</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={finalizacaoKMFinal}
                          onChange={(event) => setFinalizacaoKMFinal(event.target.value)}
                        />
                      </label>
                      <label className="entity-field">
                        <span>Data real de chegada</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="dd/mm/aaaa"
                          value={finalizacaoDate}
                          onChange={(event) => setFinalizacaoDate(formatBrazilianDate(event.target.value))}
                        />
                      </label>
                      <label className="entity-field">
                        <span>Hora real de chegada</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="18:40"
                          value={finalizacaoTime}
                          onChange={(event) => setFinalizacaoTime(formatTimeValue(event.target.value))}
                        />
                      </label>
                      <label className="entity-field">
                        <span>Observacao administrativa</span>
                        <textarea value={finalizacaoObservacao} onChange={(event) => setFinalizacaoObservacao(event.target.value)} rows={4} />
                      </label>
                    </div>
                    <button className="entity-action entity-action--primary" type="button" onClick={() => void handleFinalizeTrip()} disabled={isFinalizing}>
                      {isFinalizing ? 'Finalizando...' : 'Confirmar finalizacao'}
                    </button>
                  </div>
                ) : null}

                {finalizacoes.length === 0 ? (
                  <p className="entity-empty-inline">Sem registros de finalizacao para esta viagem.</p>
                ) : (
                  finalizacoes.map((item) => (
                    <div className="entity-timeline__item" key={item.id}>
                      <strong>KM final {item.km_final}</strong>
                      <span>{formatLabel(item.status)} · solicitado em {formatDateTime(item.solicitado_em)}</span>
                      <small>
                        {item.observacao_admin || item.observacao_motorista || 'Sem observacoes registradas.'}
                        {item.respondido_em ? ` · respondido em ${formatDateTime(item.respondido_em)}` : ''}
                      </small>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activePanel === 'ocorrencias' ? (
              <div className="trip-detail-list">
                {ocorrencias.length === 0 ? (
                  <p className="entity-empty-inline">Sem ocorrencias vinculadas.</p>
                ) : (
                  ocorrencias.map((item) => (
                    <div className="entity-timeline__item" key={item.id}>
                      <strong>{item.titulo ?? 'Ocorrencia'}</strong>
                      <span>{formatLabel(item.status)} · {formatLabel(item.severidade)} · {formatDateTime(item.data_ocorrencia)}</span>
                      <small>{item.responsavel_nome ?? 'Sem responsavel'} · {item.descricao ?? 'Sem descricao'}</small>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activePanel === 'abastecimentos' ? (
              <div className="trip-detail-list">
                {abastecimentos.length === 0 ? (
                  <p className="entity-empty-inline">Sem abastecimentos vinculados.</p>
                ) : (
                  abastecimentos.map((item) => (
                    <div className="entity-timeline__item" key={item.id}>
                      <strong>{item.posto ?? 'Abastecimento'} · {formatCurrency(item.valor_total)}</strong>
                      <span>{formatNumber(item.litros, 'l')} · {item.combustivel ?? 'Combustivel'} · km {formatNumber(item.km_atual)}</span>
                      <small>{item.veiculo_placa ?? viagem.veiculo_placa ?? 'Veiculo'} · {formatDateTime(item.data_abastecimento)} · {formatCurrency(item.valor_litro)}/l</small>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </article>
        </aside>
      </div>
    </section>
  )
}
