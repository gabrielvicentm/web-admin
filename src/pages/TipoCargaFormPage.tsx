import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { tipoCargaService, type TipoCargaFormData } from '../services/tipoCargaService'

const initialFormState: TipoCargaFormData = {
  nome: '',
  descricao: '',
}

export function TipoCargaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState<TipoCargaFormData>(initialFormState)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const pageTitle = useMemo(() => (isEditing ? 'Editar tipo de carga' : 'Novo tipo de carga'), [isEditing])

  useEffect(() => {
    if (!id) {
      return
    }

    const tipoId = id

    async function loadTipoCarga() {
      try {
        setIsLoading(true)
        const response = await tipoCargaService.getById(tipoId)
        setFormData(response.data)
      } catch {
        setFeedback('Nao foi possivel carregar os dados do tipo de carga.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadTipoCarga()
  }, [id])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setFeedback('')

      if (isEditing && id) {
        await tipoCargaService.update(id, formData)
      } else {
        await tipoCargaService.create(formData)
      }

      navigate('/dashboard/tipos-carga/listar', { replace: true })
    } catch {
      setFeedback('Nao foi possivel salvar o tipo de carga. Revise os dados e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando cadastro do tipo de carga...</section>
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Catalogo</p>
          <h1 className="dashboard-title">{pageTitle}</h1>
          <p className="dashboard-subtitle">
            Cadastro padronizado para classificacao operacional e uso direto nos selects da area de viagens.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/tipos-carga/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Dados do tipo de carga</h2>
              <p>Informacoes de classificacao usadas no planejamento e na operacao.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--2">
            <label className="entity-field entity-field--span-2">
              <span>Nome</span>
              <input name="nome" value={formData.nome} onChange={handleChange} required />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Descricao</span>
              <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={8} />
            </label>
          </div>
        </article>

        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/tipos-carga/listar">
            Cancelar
          </Link>
          <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar tipo'}
          </button>
        </div>
      </form>
    </section>
  )
}
