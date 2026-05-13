import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getHttpErrorMessage } from '../services/httpError'
import { formatPlateInput, formatRenavamInput } from '../services/inputFormatters'
import {
  veiculoService,
  type VeiculoFormData,
  type VeiculoStatus,
  type VeiculoTipo,
} from '../services/veiculoService'

const statusOptions: VeiculoStatus[] = ['disponivel', 'em_uso', 'manutencao', 'inativo']
const tipoOptions: VeiculoTipo[] = ['truck', 'bitruck', 'carreta', 'toco', 'vuc', 'van', 'utilitario', 'outro']

const initialFormState: VeiculoFormData = {
  placa: '',
  modelo: '',
  marca: '',
  ano: '',
  tipo: 'truck',
  capacidade_carga_kg: '',
  renavam: '',
  km_atual: '',
  status: 'disponivel',
  vencimento_seguro: '',
  vencimento_licenciamento: '',
  vencimento_ipva: '',
  seguradora: '',
  numero_apolice: '',
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

export function VeiculoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState<VeiculoFormData>(initialFormState)
  const [vencimentoSeguroInput, setVencimentoSeguroInput] = useState('')
  const [vencimentoLicenciamentoInput, setVencimentoLicenciamentoInput] = useState('')
  const [vencimentoIpvaInput, setVencimentoIpvaInput] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const pageTitle = useMemo(() => (isEditing ? 'Editar veiculo' : 'Novo veiculo'), [isEditing])

  useEffect(() => {
    if (!id) {
      return
    }

    const veiculoId = id

    async function loadVeiculo() {
      try {
        setIsLoading(true)
        const response = await veiculoService.getById(veiculoId)
        setFormData({
          ...initialFormState,
          ...response.data,
          placa: formatPlateInput(response.data.placa),
          renavam: formatRenavamInput(response.data.renavam),
        })
      } catch (error) {
        setFeedback(getHttpErrorMessage(error, 'Nao foi possivel carregar os dados do veiculo.'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadVeiculo()
  }, [id])

  useEffect(() => {
    setVencimentoSeguroInput(formatApiDate(formData.vencimento_seguro))
    setVencimentoLicenciamentoInput(formatApiDate(formData.vencimento_licenciamento))
    setVencimentoIpvaInput(formatApiDate(formData.vencimento_ipva))
  }, [formData.vencimento_seguro, formData.vencimento_licenciamento, formData.vencimento_ipva])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target

    if (name === 'placa') {
      setFormData((current) => ({ ...current, placa: formatPlateInput(value) }))
      return
    }

    if (name === 'renavam') {
      setFormData((current) => ({ ...current, renavam: formatRenavamInput(value) }))
      return
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleDateFieldChange(
    field: 'vencimento_seguro' | 'vencimento_licenciamento' | 'vencimento_ipva',
    value: string,
  ) {
    const formattedValue = formatBrazilianDate(value)

    if (field === 'vencimento_seguro') {
      setVencimentoSeguroInput(formattedValue)
    } else if (field === 'vencimento_licenciamento') {
      setVencimentoLicenciamentoInput(formattedValue)
    } else {
      setVencimentoIpvaInput(formattedValue)
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
        await veiculoService.update(id, formData)
      } else {
        await veiculoService.create(formData)
      }

      navigate('/dashboard/veiculos/listar', { replace: true })
    } catch (error) {
      setFeedback(getHttpErrorMessage(error, 'Nao foi possivel salvar o veiculo. Revise os dados e tente novamente.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando cadastro do veiculo...</section>
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Cadastro</p>
          <h1 className="dashboard-title">{pageTitle}</h1>
          <p className="dashboard-subtitle">
            Registro completo da frota com documentacao, capacidade, vencimentos e controle de seguro.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/veiculos/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Dados do veiculo</h2>
              <p>Identificacao da frota e caracteristicas operacionais.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Placa</span>
              <input name="placa" value={formData.placa} onChange={handleChange} placeholder="ABC-1D23" maxLength={8} required />
            </label>
            <label className="entity-field">
              <span>Modelo</span>
              <input name="modelo" value={formData.modelo} onChange={handleChange} placeholder="FH 540" required />
            </label>
            <label className="entity-field">
              <span>Marca</span>
              <input name="marca" value={formData.marca} onChange={handleChange} placeholder="Volvo" required />
            </label>
            <label className="entity-field">
              <span>Ano</span>
              <input name="ano" type="number" value={formData.ano} onChange={handleChange} min="1950" max="2100" step="1" placeholder="2024" required />
            </label>
            <label className="entity-field">
              <span>Tipo</span>
              <select name="tipo" value={formData.tipo} onChange={handleChange}>
                {tipoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Status</span>
              <select name="status" value={formData.status} onChange={handleChange}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Capacidade de carga (kg)</span>
              <input
                name="capacidade_carga_kg"
                type="number"
                min="0"
                step="0.01"
                value={formData.capacidade_carga_kg}
                onChange={handleChange}
                placeholder="25000"
              />
            </label>
            <label className="entity-field">
              <span>KM atual</span>
              <input name="km_atual" type="number" min="0" step="0.01" value={formData.km_atual} onChange={handleChange} placeholder="120000" />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Documentacao e seguros</h2>
              <p>Campos usados para compliance, seguro e renovacoes da frota.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>RENAVAM</span>
              <input name="renavam" value={formData.renavam} onChange={handleChange} inputMode="numeric" placeholder="00000000000" maxLength={11} />
            </label>
            <label className="entity-field">
              <span>Seguradora</span>
              <input name="seguradora" value={formData.seguradora} onChange={handleChange} placeholder="Porto Seguro" />
            </label>
            <label className="entity-field">
              <span>Numero da apolice</span>
              <input name="numero_apolice" value={formData.numero_apolice} onChange={handleChange} placeholder="123456789" />
            </label>
            <label className="entity-field">
              <span>Vencimento do seguro</span>
              <input
                name="vencimento_seguro_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={vencimentoSeguroInput}
                onChange={(event) => handleDateFieldChange('vencimento_seguro', event.target.value)}
              />
              <small>Formato brasileiro: dia/mes/ano</small>
            </label>
            <label className="entity-field">
              <span>Vencimento licenciamento</span>
              <input
                name="vencimento_licenciamento_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={vencimentoLicenciamentoInput}
                onChange={(event) => handleDateFieldChange('vencimento_licenciamento', event.target.value)}
              />
              <small>Formato brasileiro: dia/mes/ano</small>
            </label>
            <label className="entity-field">
              <span>Vencimento IPVA</span>
              <input
                name="vencimento_ipva_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={vencimentoIpvaInput}
                onChange={(event) => handleDateFieldChange('vencimento_ipva', event.target.value)}
              />
              <small>Formato brasileiro: dia/mes/ano</small>
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Observacoes</h2>
              <p>Informacoes adicionais para a equipe operacional e administrativa.</p>
            </div>
          </div>

          <label className="entity-field">
            <span>Observacoes internas</span>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={8} placeholder="Observacoes sobre uso, historico ou cuidados do veiculo" />
          </label>
        </article>

        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/veiculos/listar">
            Cancelar
          </Link>
          <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar veiculo'}
          </button>
        </div>
      </form>
    </section>
  )
}
