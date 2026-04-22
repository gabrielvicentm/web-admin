import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  motoristaService,
  type MotoristaFormData,
  type MotoristaStatus,
  type TipoCnh,
} from '../services/motoristaService'

const cnhOptions: TipoCnh[] = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE']
const statusOptions: MotoristaStatus[] = ['ativo', 'inativo', 'ferias', 'afastado']

const initialFormState: MotoristaFormData = {
  nome: '',
  cpf: '',
  numero_cnh: '',
  tipo_cnh: 'B',
  validade_cnh: '',
  telefone: '',
  email: '',
  endereco_logradouro: '',
  endereco_numero: '',
  endereco_complemento: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_uf: '',
  endereco_cep: '',
  data_admissao: '',
  status: 'ativo',
  observacoes: '',
  senha_inicial: '',
  nova_senha: '',
}

export function MotoristaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState<MotoristaFormData>(initialFormState)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const pageTitle = useMemo(() => (isEditing ? 'Editar motorista' : 'Novo motorista'), [isEditing])

  useEffect(() => {
    if (!id) {
      return
    }

    const motoristaId = id

    async function loadMotorista() {
      try {
        setIsLoading(true)
        const response = await motoristaService.getById(motoristaId)
        setFormData({
          ...initialFormState,
          ...response.data,
          senha_inicial: '',
          nova_senha: '',
        })
        setCurrentPhotoUrl(response.data.foto_url ?? '')
      } catch {
        setFeedback('Nao foi possivel carregar os dados do motorista.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMotorista()
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

      const payload: MotoristaFormData = {
        ...formData,
        senha_inicial: isEditing ? undefined : formData.senha_inicial,
        nova_senha: isEditing ? formData.nova_senha || undefined : undefined,
      }

      const response = isEditing && id
        ? await motoristaService.update(id, payload)
        : await motoristaService.create(payload)

      if (fotoFile) {
        await motoristaService.uploadPhoto(response.data.id, fotoFile)
      }

      navigate('/dashboard/motoristas/listar', { replace: true })
    } catch {
      setFeedback('Nao foi possivel salvar o motorista. Revise os dados e tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando cadastro do motorista...</section>
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Cadastro</p>
          <h1 className="dashboard-title">{pageTitle}</h1>
          <p className="dashboard-subtitle">
            Registro completo do motorista, com dados pessoais, documentos, endereco, situacao e foto.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/motoristas/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Dados principais</h2>
              <p>Informacoes utilizadas no cadastro administrativo e operacional.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--3">
            <label className="entity-field">
              <span>Nome completo</span>
              <input name="nome" value={formData.nome} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>CPF</span>
              <input name="cpf" value={formData.cpf} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Telefone</span>
              <input name="telefone" value={formData.telefone} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>E-mail</span>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Data de admissao</span>
              <input name="data_admissao" type="date" value={formData.data_admissao} onChange={handleChange} required />
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
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Documentacao e acesso</h2>
              <p>Dados sigilosos e credenciais iniciais do motorista.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Numero da CNH</span>
              <input name="numero_cnh" value={formData.numero_cnh} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Categoria CNH</span>
              <select name="tipo_cnh" value={formData.tipo_cnh} onChange={handleChange}>
                {cnhOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Validade da CNH</span>
              <input name="validade_cnh" type="date" value={formData.validade_cnh} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>{isEditing ? 'Nova senha' : 'Senha inicial'}</span>
              <input
                name={isEditing ? 'nova_senha' : 'senha_inicial'}
                type="password"
                value={isEditing ? formData.nova_senha ?? '' : formData.senha_inicial ?? ''}
                onChange={handleChange}
                required={!isEditing}
              />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Endereco</h2>
              <p>Endereco residencial ou de referencia do motorista.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field entity-field--span-2">
              <span>Logradouro</span>
              <input name="endereco_logradouro" value={formData.endereco_logradouro} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Numero</span>
              <input name="endereco_numero" value={formData.endereco_numero} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Complemento</span>
              <input name="endereco_complemento" value={formData.endereco_complemento} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Bairro</span>
              <input name="endereco_bairro" value={formData.endereco_bairro} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Cidade</span>
              <input name="endereco_cidade" value={formData.endereco_cidade} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>UF</span>
              <input name="endereco_uf" value={formData.endereco_uf} onChange={handleChange} maxLength={2} />
            </label>
            <label className="entity-field">
              <span>CEP</span>
              <input name="endereco_cep" value={formData.endereco_cep} onChange={handleChange} />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Foto e observacoes</h2>
              <p>Arquivo da foto do motorista e observacoes internas do RH e da operacao.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--2">
            <div className="entity-photo-uploader">
              {currentPhotoUrl ? <img className="entity-photo-uploader__preview" src={currentPhotoUrl} alt="" /> : null}
              <label className="entity-field">
                <span>Foto do motorista</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFotoFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <label className="entity-field">
              <span>Observacoes</span>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={8} />
            </label>
          </div>
        </article>

        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/motoristas/listar">
            Cancelar
          </Link>
          <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar motorista'}
          </button>
        </div>
      </form>
    </section>
  )
}
