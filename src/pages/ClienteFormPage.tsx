import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { clienteService, type ClienteFormData } from '../services/clienteService'

const initialFormState: ClienteFormData = {
  nome: '',
  cpf_cnpj: '',
  telefone: '',
  email: '',
}

export function ClienteFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState<ClienteFormData>(initialFormState)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const pageTitle = useMemo(() => (isEditing ? 'Editar cliente' : 'Novo cliente'), [isEditing])

  useEffect(() => {
    if (!id) {
      return
    }

    const clienteId = id

    async function loadCliente() {
      try {
        setIsLoading(true)
        const response = await clienteService.getById(clienteId)
        setFormData(response.data)
      } catch {
        setFeedback('Nao foi possivel carregar os dados do cliente.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadCliente()
  }, [id])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setFeedback('')

      if (isEditing && id) {
        await clienteService.update(id, formData)
      } else {
        await clienteService.create(formData)
      }

      navigate('/dashboard/clientes/listar', { replace: true })
    } catch {
      setFeedback('Nao foi possivel salvar o cliente. Revise os dados e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando cadastro do cliente...</section>
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Cadastro</p>
          <h1 className="dashboard-title">{pageTitle}</h1>
          <p className="dashboard-subtitle">
            Base comercial preparada para alimentar contratos, ordens e futuras operacoes de viagem.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/clientes/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Dados do cliente</h2>
              <p>Informacoes essenciais para relacionamento comercial e faturamento.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--2">
            <label className="entity-field entity-field--span-2">
              <span>Nome</span>
              <input name="nome" value={formData.nome} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>CPF/CNPJ</span>
              <input name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Telefone</span>
              <input name="telefone" value={formData.telefone} onChange={handleChange} required />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>E-mail</span>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </label>
          </div>
        </article>

        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/clientes/listar">
            Cancelar
          </Link>
          <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </section>
  )
}
