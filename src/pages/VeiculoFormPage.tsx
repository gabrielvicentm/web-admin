import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

export function VeiculoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState<VeiculoFormData>(initialFormState)
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
        setFormData({ ...initialFormState, ...response.data })
      } catch {
        setFeedback('Nao foi possivel carregar os dados do veiculo.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadVeiculo()
  }, [id])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
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
      if (axios.isAxiosError(error)) {
        const apiMessage =
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : 'Nao foi possivel salvar o veiculo.'

        setFeedback(apiMessage)
      } else {
        setFeedback('Nao foi possivel salvar o veiculo. Revise os dados e tente novamente.')
      }
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
              <input name="placa" value={formData.placa} onChange={handleChange} maxLength={10} required />
            </label>
            <label className="entity-field">
              <span>Modelo</span>
              <input name="modelo" value={formData.modelo} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Marca</span>
              <input name="marca" value={formData.marca} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Ano</span>
              <input name="ano" type="number" value={formData.ano} onChange={handleChange} required />
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
                value={formData.capacidade_carga_kg}
                onChange={handleChange}
              />
            </label>
            <label className="entity-field">
              <span>KM atual</span>
              <input name="km_atual" type="number" value={formData.km_atual} onChange={handleChange} />
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
              <input name="renavam" value={formData.renavam} onChange={handleChange} maxLength={11} />
            </label>
            <label className="entity-field">
              <span>Seguradora</span>
              <input name="seguradora" value={formData.seguradora} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Numero da apolice</span>
              <input name="numero_apolice" value={formData.numero_apolice} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Vencimento do seguro</span>
              <input
                name="vencimento_seguro"
                type="date"
                value={formData.vencimento_seguro}
                onChange={handleChange}
              />
            </label>
            <label className="entity-field">
              <span>Vencimento licenciamento</span>
              <input
                name="vencimento_licenciamento"
                type="date"
                value={formData.vencimento_licenciamento}
                onChange={handleChange}
              />
            </label>
            <label className="entity-field">
              <span>Vencimento IPVA</span>
              <input name="vencimento_ipva" type="date" value={formData.vencimento_ipva} onChange={handleChange} />
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
            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={8} />
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
