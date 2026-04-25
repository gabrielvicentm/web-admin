import axios from 'axios'
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
const ufOptions = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' },
  { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' },
  { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const

type ViaCepResponse = {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

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
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [feedback, setFeedback] = useState('')

  const pageTitle = useMemo(() => (isEditing ? 'Editar motorista' : 'Novo motorista'), [isEditing])
  const displayedPhotoUrl = photoPreviewUrl || currentPhotoUrl

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    }
  }, [photoPreviewUrl])

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
    if (name === 'endereco_cep') {
      const normalizedCep = value.replace(/\D/g, '').slice(0, 8)
      const formattedCep = normalizedCep.replace(/^(\d{5})(\d{0,3}).*/, (_, prefix, suffix: string) =>
        suffix ? `${prefix}-${suffix}` : prefix,
      )

      setFormData((current) => ({ ...current, endereco_cep: formattedCep }))
      return
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleCepBlur() {
    const cep = formData.endereco_cep.replace(/\D/g, '')

    if (cep.length !== 8) {
      return
    }

    try {
      setIsFetchingCep(true)
      setFeedback('')

      const response = await axios.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`)

      if (response.data.erro) {
        setFeedback('CEP nao encontrado.')
        return
      }

      setFormData((current) => ({
        ...current,
        endereco_cep: response.data.cep ?? current.endereco_cep,
        endereco_logradouro: response.data.logradouro ?? current.endereco_logradouro,
        endereco_complemento: current.endereco_complemento || response.data.complemento || '',
        endereco_bairro: response.data.bairro ?? current.endereco_bairro,
        endereco_cidade: response.data.localidade ?? current.endereco_cidade,
        endereco_uf: response.data.uf ?? current.endereco_uf,
      }))
    } catch {
      setFeedback('Nao foi possivel consultar o CEP agora.')
    } finally {
      setIsFetchingCep(false)
    }
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null

    setFotoFile(nextFile)

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl)
    }

    if (nextFile) {
      setPhotoPreviewUrl(URL.createObjectURL(nextFile))
      return
    }

    setPhotoPreviewUrl('')
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
              <select name="endereco_uf" value={formData.endereco_uf} onChange={handleChange}>
                <option value="">Selecione</option>
                {ufOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>CEP</span>
              <input
                name="endereco_cep"
                value={formData.endereco_cep}
                onChange={handleChange}
                onBlur={() => void handleCepBlur()}
                placeholder="00000-000"
              />
              <small>{isFetchingCep ? 'Buscando endereco pelo CEP...' : 'Ao sair do campo, o endereco sera preenchido automaticamente.'}</small>
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
              {displayedPhotoUrl ? (
                <img className="entity-photo-uploader__preview" src={displayedPhotoUrl} alt="Pre-visualizacao da foto do motorista" />
              ) : null}
              <label className="entity-field">
                <span>Foto do motorista</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
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
