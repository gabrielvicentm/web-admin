import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getHttpErrorMessage } from '../services/httpError'
import {
  manutencaoService,
  type ManutencaoFormData,
  type ManutencaoStatus,
  type ManutencaoTipo,
} from '../services/manutencaoService'
import { veiculoService, type VeiculoListItem } from '../services/veiculoService'

const statusOptions: ManutencaoStatus[] = ['agendada', 'em_andamento', 'concluida', 'cancelada']
const tipoOptions: ManutencaoTipo[] = ['preventiva', 'corretiva', 'revisao']

const initialFormState: ManutencaoFormData = {
  veiculo_id: '',
  tipo: 'preventiva',
  status: 'agendada',
  descricao: '',
  oficina: '',
  km_na_manutencao: '',
  km_proxima_manutencao: '',
  data_agendada: '',
  data_conclusao: '',
  custo: '',
  observacoes: '',
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

function formatApiDate(value: string) {
  if (!value) {
    return ''
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return ''
  }

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function buildApiDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    return ''
  }

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function formatLabel(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ManutencaoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState<ManutencaoFormData>(initialFormState)
  const [dataAgendadaInput, setDataAgendadaInput] = useState('')
  const [dataConclusaoInput, setDataConclusaoInput] = useState('')
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const pageTitle = useMemo(() => (isEditing ? 'Editar manutencao' : 'Nova manutencao'), [isEditing])

  useEffect(() => {
    async function loadVeiculos() {
      try {
        const response = await veiculoService.list({ page: 1, limit: 100 })
        setVeiculos(response.data)
      } catch {
        setVeiculos([])
      }
    }

    void loadVeiculos()
  }, [])

  useEffect(() => {
    if (!id) {
      return
    }

    const manutencaoId = id

    async function loadManutencao() {
      try {
        setIsLoading(true)
        const response = await manutencaoService.getById(manutencaoId)
        setFormData({ ...initialFormState, ...response.data })
      } catch (error) {
        setFeedback(getHttpErrorMessage(error, 'Nao foi possivel carregar os dados da manutencao.'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadManutencao()
  }, [id])

  useEffect(() => {
    setDataAgendadaInput(formatApiDate(formData.data_agendada))
    setDataConclusaoInput(formatApiDate(formData.data_conclusao))
  }, [formData.data_agendada, formData.data_conclusao])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleDateFieldChange(field: 'data_agendada' | 'data_conclusao', value: string) {
    const formattedValue = formatBrazilianDate(value)

    if (field === 'data_agendada') {
      setDataAgendadaInput(formattedValue)
    } else {
      setDataConclusaoInput(formattedValue)
    }

    setFormData((current) => ({
      ...current,
      [field]: buildApiDate(formattedValue),
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setFeedback('')

      if (isEditing && id) {
        await manutencaoService.update(id, formData)
      } else {
        await manutencaoService.create(formData)
      }

      navigate('/dashboard/manutencoes/listar', { replace: true })
    } catch (error) {
      setFeedback(getHttpErrorMessage(error, 'Nao foi possivel salvar a manutencao. Revise os dados e tente novamente.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando cadastro da manutencao...</section>
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Cadastro</p>
          <h1 className="dashboard-title">{pageTitle}</h1>
          <p className="dashboard-subtitle">
            Registro administrativo das manutencoes com agenda, oficina, custo e previsao de proxima intervencao.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/manutencoes/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Planejamento da manutencao</h2>
              <p>Defina o veiculo, o tipo de servico e o fluxo operacional da manutencao.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field entity-field--span-2">
              <span>Veiculo</span>
              <select name="veiculo_id" value={formData.veiculo_id} onChange={handleChange} required>
                <option value="">Selecione um veiculo</option>
                {veiculos.map((veiculo) => (
                  <option key={veiculo.id} value={String(veiculo.id)}>
                    {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Tipo</span>
              <select name="tipo" value={formData.tipo} onChange={handleChange}>
                {tipoOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Status</span>
              <select name="status" value={formData.status} onChange={handleChange}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Oficina</span>
              <input name="oficina" value={formData.oficina} onChange={handleChange} placeholder="Nome da oficina ou fornecedor" />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Descricao</span>
              <input name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Troca de oleo, filtros e revisao geral" required />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Custos, quilometragem e agenda</h2>
              <p>Campos usados para acompanhamento preventivo, financeiro e operacional da frota.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>KM atual da manutencao</span>
              <input name="km_na_manutencao" type="number" min="0" step="0.01" value={formData.km_na_manutencao} onChange={handleChange} placeholder="125000" />
            </label>
            <label className="entity-field">
              <span>KM da proxima manutencao</span>
              <input
                name="km_proxima_manutencao"
                type="number"
                min="0"
                step="0.01"
                value={formData.km_proxima_manutencao}
                onChange={handleChange}
                placeholder="135000"
              />
            </label>
            <label className="entity-field">
              <span>Custo</span>
              <input name="custo" type="number" min="0" step="0.01" value={formData.custo} onChange={handleChange} placeholder="1500" />
            </label>
            <label className="entity-field">
              <span>Data agendada</span>
              <input
                name="data_agendada_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={dataAgendadaInput}
                onChange={(event) => handleDateFieldChange('data_agendada', event.target.value)}
              />
              <small>Formato brasileiro: dia/mes/ano</small>
            </label>
            <label className="entity-field">
              <span>Data de conclusao</span>
              <input
                name="data_conclusao_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={dataConclusaoInput}
                onChange={(event) => handleDateFieldChange('data_conclusao', event.target.value)}
              />
              <small>Formato brasileiro: dia/mes/ano</small>
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Observacoes</h2>
              <p>Notas internas sobre pecas, prazo, ocorrencias e alinhamento com a oficina.</p>
            </div>
          </div>

          <label className="entity-field">
            <span>Observacoes internas</span>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={8} placeholder="Pecas usadas, prazo combinado e observacoes da oficina" />
          </label>
        </article>

        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/manutencoes/listar">
            Cancelar
          </Link>
          <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar manutencao'}
          </button>
        </div>
      </form>
    </section>
  )
}
