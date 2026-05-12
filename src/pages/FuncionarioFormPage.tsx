import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getHttpErrorMessage } from '../services/httpError'
import {
  funcionarioService,
  type FuncionarioFormData,
  type FuncionarioStatus,
  type FuncionarioTipoConta,
  type FuncionarioTipoContrato,
  type FuncionarioTipoPagamento,
} from '../services/funcionarioService'

const statusOptions: FuncionarioStatus[] = ['ativo', 'inativo', 'ferias', 'afastado', 'desligado']
const tipoContratoOptions: FuncionarioTipoContrato[] = ['clt', 'pj', 'temporario', 'estagio', 'aprendiz', 'terceirizado', 'outro']
const tipoPagamentoOptions: FuncionarioTipoPagamento[] = ['mensal', 'quinzenal', 'semanal', 'diario', 'hora']
const tipoContaOptions: FuncionarioTipoConta[] = ['corrente', 'poupanca', 'salario', 'pix']
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

const initialFormState: FuncionarioFormData = {
  nome: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  telefone: '',
  email: '',
  cep: '',
  endereco: '',
  complemento: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cargo: '',
  setor: '',
  tipo_contrato: 'clt',
  data_admissao: '',
  data_demissao: '',
  status: 'ativo',
  salario_base: 0,
  tipo_pagamento: 'mensal',
  valor_hora_extra: 0,
  adicional_noturno: 0,
  vale_alimentacao: 0,
  outros_descontos: 0,
  banco: '',
  agencia: '',
  conta: '',
  tipo_conta: 'corrente',
  chave_pix: '',
  horario_entrada: '',
  horario_saida: '',
  horario_almoco: '',
  horas_extras: 0,
  faltas: 0,
  atestados: 0,
  observacoes: '',
}

function formatBrazilianDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function formatApiDate(value: string) {
  if (!value) return ''
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ''
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function buildApiDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function formatMoneyInput(value: string) {
  const normalized = value.replace(',', '.')
  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) {
    return 0
  }
  return parsed
}

function formatCpfInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function FuncionarioFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [formData, setFormData] = useState<FuncionarioFormData>(initialFormState)
  const [dataNascimentoInput, setDataNascimentoInput] = useState('')
  const [dataAdmissaoInput, setDataAdmissaoInput] = useState('')
  const [dataDemissaoInput, setDataDemissaoInput] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('')
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isMotorista, setIsMotorista] = useState(false)

  const pageTitle = useMemo(() => (isEditing ? 'Editar funcionario' : 'Novo funcionario'), [isEditing])
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

    const funcionarioId = id

    async function loadFuncionario() {
      try {
        setIsLoading(true)
        const response = await funcionarioService.getById(funcionarioId)
        setIsMotorista(response.data.is_motorista)

        setFormData({
          ...initialFormState,
          ...response.data,
          cpf: formatCpfInput(response.data.cpf),
          telefone: formatPhoneInput(response.data.telefone),
        })
        setCurrentPhotoUrl(response.data.foto_url ?? '')
      } catch (error) {
        setFeedback(getHttpErrorMessage(error, 'Nao foi possivel carregar os dados do funcionario.'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadFuncionario()
  }, [id, navigate])

  useEffect(() => {
    setDataNascimentoInput(formatApiDate(formData.data_nascimento))
    setDataAdmissaoInput(formatApiDate(formData.data_admissao))
    setDataDemissaoInput(formatApiDate(formData.data_demissao))
  }, [formData.data_nascimento, formData.data_admissao, formData.data_demissao])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target

    if (name === 'cpf') {
      setFormData((current) => ({ ...current, cpf: formatCpfInput(value) }))
      return
    }

    if (name === 'telefone') {
      setFormData((current) => ({ ...current, telefone: formatPhoneInput(value) }))
      return
    }

    if (name === 'cep') {
      const normalizedCep = value.replace(/\D/g, '').slice(0, 8)
      const formattedCep = normalizedCep.replace(/^(\d{5})(\d{0,3}).*/, (_, prefix, suffix: string) =>
        suffix ? `${prefix}-${suffix}` : prefix,
      )
      setFormData((current) => ({ ...current, cep: formattedCep }))
      return
    }

    const numericFields = new Set([
      'salario_base',
      'valor_hora_extra',
      'adicional_noturno',
      'vale_alimentacao',
      'outros_descontos',
      'horas_extras',
      'faltas',
      'atestados',
    ])

    if (numericFields.has(name)) {
      setFormData((current) => ({
        ...current,
        [name]: name === 'faltas' || name === 'atestados' ? Number(value || 0) : formatMoneyInput(value),
      }))
      return
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleDateFieldChange(field: 'data_nascimento' | 'data_admissao' | 'data_demissao', value: string) {
    const formattedValue = formatBrazilianDate(value)

    if (field === 'data_nascimento') {
      setDataNascimentoInput(formattedValue)
    } else if (field === 'data_admissao') {
      setDataAdmissaoInput(formattedValue)
    } else {
      setDataDemissaoInput(formattedValue)
    }

    setFormData((current) => ({
      ...current,
      [field]: buildApiDate(formattedValue),
    }))
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

  async function handleCepBlur() {
    const cep = formData.cep.replace(/\D/g, '')
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
        cep: response.data.cep ?? current.cep,
        endereco: response.data.logradouro ?? current.endereco,
        complemento: current.complemento || response.data.complemento || '',
        bairro: response.data.bairro ?? current.bairro,
        cidade: response.data.localidade ?? current.cidade,
        estado: response.data.uf ?? current.estado,
      }))
    } catch {
      setFeedback('Nao foi possivel consultar o CEP agora.')
    } finally {
      setIsFetchingCep(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cpfDigits = formData.cpf.replace(/\D/g, '')
    const telefoneDigits = formData.telefone.replace(/\D/g, '')

    if (cpfDigits.length !== 11) {
      setFeedback('Informe um CPF valido com 11 digitos.')
      return
    }

    if (dataNascimentoInput && !formData.data_nascimento) {
      setFeedback('Informe a data de nascimento no formato dd/mm/aaaa.')
      return
    }

    if (!formData.data_admissao) {
      setFeedback('Informe a data de admissao no formato dd/mm/aaaa.')
      return
    }

    if (dataDemissaoInput && !formData.data_demissao) {
      setFeedback('Informe a data de demissao no formato dd/mm/aaaa.')
      return
    }

    if (formData.telefone.trim() && telefoneDigits.length < 10) {
      setFeedback('Informe um telefone valido com DDD.')
      return
    }

    try {
      setIsSaving(true)
      setFeedback('')

      const response = isEditing && id
        ? await funcionarioService.update(id, formData)
        : await funcionarioService.create(formData)

      if (fotoFile) {
        await funcionarioService.uploadPhoto(response.data.id, fotoFile)
      }

      navigate('/dashboard/funcionarios/listar', { replace: true })
    } catch (error) {
      setFeedback(getHttpErrorMessage(error, 'Nao foi possivel salvar o funcionario. Revise os dados e tente novamente.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando cadastro do funcionario...</section>
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Cadastro</p>
          <h1 className="dashboard-title">{pageTitle}</h1>
          <p className="dashboard-subtitle">
            Formulario completo para RH e operacao, organizado por blocos para facilitar o cadastro sem exigir conhecimento tecnico.
          </p>
          {isMotorista ? (
            <p className="dashboard-subtitle">
              Este colaborador tambem e motorista. Aqui voce pode completar salario, banco, ponto e demais dados funcionais sem alterar a CNH.
            </p>
          ) : null}
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/funcionarios/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Dados pessoais</h2>
              <p>Informacoes basicas de identificacao e contato.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field entity-field--span-2">
              <span>Nome completo</span>
              <input name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome completo do funcionario" required />
            </label>
            <label className="entity-field">
              <span>CPF</span>
              <input name="cpf" value={formData.cpf} onChange={handleChange} inputMode="numeric" placeholder="000.000.000-00" maxLength={14} required />
            </label>
            <label className="entity-field">
              <span>RG</span>
              <input name="rg" value={formData.rg} onChange={handleChange} placeholder="12.345.678-9" />
            </label>
            <label className="entity-field">
              <span>Data de nascimento</span>
              <input
                name="data_nascimento_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={dataNascimentoInput}
                onChange={(event) => handleDateFieldChange('data_nascimento', event.target.value)}
              />
            </label>
            <label className="entity-field">
              <span>Telefone</span>
              <input name="telefone" type="tel" value={formData.telefone} onChange={handleChange} inputMode="tel" placeholder="(00) 00000-0000" maxLength={15} />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>E-mail</span>
              <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="funcionario@empresa.com" />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Endereco</h2>
              <p>Endereco residencial com preenchimento assistido por CEP.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>CEP</span>
              <input name="cep" value={formData.cep} onChange={handleChange} onBlur={() => void handleCepBlur()} inputMode="numeric" placeholder="00000-000" maxLength={9} />
              <small>{isFetchingCep ? 'Buscando endereco pelo CEP...' : 'Ao sair do campo, o endereco sera preenchido automaticamente.'}</small>
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Endereco</span>
              <input name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Rua, avenida ou estrada" />
            </label>
            <label className="entity-field">
              <span>Numero</span>
              <input name="numero" value={formData.numero} onChange={handleChange} placeholder="123" />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Complemento</span>
              <input name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Casa, apto, bloco" />
            </label>
            <label className="entity-field">
              <span>Bairro</span>
              <input name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Centro" />
            </label>
            <label className="entity-field">
              <span>Cidade</span>
              <input name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Sao Paulo" />
            </label>
            <label className="entity-field">
              <span>Estado</span>
              <select name="estado" value={formData.estado} onChange={handleChange}>
                <option value="">Selecione</option>
                {ufOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Dados profissionais</h2>
              <p>Campos que organizam vinculo, lotacao e situacao atual do colaborador.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Cargo</span>
              <input name="cargo" value={formData.cargo} onChange={handleChange} placeholder="Assistente administrativo" required />
            </label>
            <label className="entity-field">
              <span>Setor</span>
              <input name="setor" value={formData.setor} onChange={handleChange} placeholder="Financeiro" required />
            </label>
            <label className="entity-field">
              <span>Tipo de contrato</span>
              <select name="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange}>
                {tipoContratoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Data de admissao</span>
              <input
                name="data_admissao_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={dataAdmissaoInput}
                onChange={(event) => handleDateFieldChange('data_admissao', event.target.value)}
                required
              />
            </label>
            <label className="entity-field">
              <span>Data de demissao</span>
              <input
                name="data_demissao_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={dataDemissaoInput}
                onChange={(event) => handleDateFieldChange('data_demissao', event.target.value)}
              />
            </label>
            <label className="entity-field">
              <span>Status do funcionario</span>
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
              <h2>Salario e beneficios</h2>
              <p>Base para folha, pagamentos recorrentes, extras e descontos.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Salario base</span>
              <input name="salario_base" type="number" min="0" step="0.01" value={formData.salario_base} onChange={handleChange} placeholder="2500" />
            </label>
            <label className="entity-field">
              <span>Tipo de pagamento</span>
              <select name="tipo_pagamento" value={formData.tipo_pagamento} onChange={handleChange}>
                {tipoPagamentoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Valor da hora extra</span>
              <input name="valor_hora_extra" type="number" min="0" step="0.01" value={formData.valor_hora_extra} onChange={handleChange} placeholder="25" />
            </label>
            <label className="entity-field">
              <span>Adicional noturno</span>
              <input name="adicional_noturno" type="number" min="0" step="0.01" value={formData.adicional_noturno} onChange={handleChange} placeholder="150" />
            </label>
            <label className="entity-field">
              <span>Vale alimentacao</span>
              <input name="vale_alimentacao" type="number" min="0" step="0.01" value={formData.vale_alimentacao} onChange={handleChange} placeholder="600" />
            </label>
            <label className="entity-field">
              <span>Outros descontos</span>
              <input name="outros_descontos" type="number" min="0" step="0.01" value={formData.outros_descontos} onChange={handleChange} placeholder="0" />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Dados bancarios</h2>
              <p>Conta e chave PIX para pagamento sem depender de observacoes manuais.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Banco</span>
              <input name="banco" value={formData.banco} onChange={handleChange} placeholder="Banco do Brasil" />
            </label>
            <label className="entity-field">
              <span>Agencia</span>
              <input name="agencia" value={formData.agencia} onChange={handleChange} placeholder="1234" />
            </label>
            <label className="entity-field">
              <span>Conta</span>
              <input name="conta" value={formData.conta} onChange={handleChange} placeholder="12345-6" />
            </label>
            <label className="entity-field">
              <span>Tipo da conta</span>
              <select name="tipo_conta" value={formData.tipo_conta} onChange={handleChange}>
                {tipoContaOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Chave PIX</span>
              <input name="chave_pix" value={formData.chave_pix} onChange={handleChange} placeholder="cpf, telefone, e-mail ou chave aleatoria" />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Controle de ponto</h2>
              <p>Horario padrao e marcadores simples para acompanhamento gerencial.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Horario de entrada</span>
              <input name="horario_entrada" type="time" value={formData.horario_entrada} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Horario de saida</span>
              <input name="horario_saida" type="time" value={formData.horario_saida} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Horario de almoco</span>
              <input name="horario_almoco" type="time" value={formData.horario_almoco} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Horas extras</span>
              <input name="horas_extras" type="number" min="0" step="0.01" value={formData.horas_extras} onChange={handleChange} placeholder="10" />
            </label>
            <label className="entity-field">
              <span>Faltas</span>
              <input name="faltas" type="number" min="0" step="1" value={formData.faltas} onChange={handleChange} placeholder="0" />
            </label>
            <label className="entity-field">
              <span>Atestados</span>
              <input name="atestados" type="number" min="0" step="1" value={formData.atestados} onChange={handleChange} placeholder="0" />
            </label>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Foto e observacoes</h2>
              <p>Imagem do colaborador para identificacao visual nas listagens e observacoes gerais.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--2">
            <div className="entity-photo-uploader">
              {displayedPhotoUrl ? (
                <img className="entity-photo-uploader__preview" src={displayedPhotoUrl} alt="Pre-visualizacao da foto do funcionario" />
              ) : null}
              <label className="entity-field">
                <span>Foto do funcionario</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>

            <label className="entity-field">
              <span>Observacoes gerais</span>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={8} placeholder="Informacoes adicionais para RH, financeiro ou operacao" />
            </label>
          </div>
        </article>

        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/funcionarios/listar">
            Cancelar
          </Link>
          <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Cadastrar funcionario'}
          </button>
        </div>
      </form>
    </section>
  )
}
