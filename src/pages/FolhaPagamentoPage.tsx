import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  folhaPagamentoService,
  type FolhaPagamentoDetalhe,
  type FolhaPagamentoFormData,
  type FolhaPagamentoResumo,
  type FolhaPagamentoStatus,
} from '../services/folhaPagamentoService'
import { getHttpErrorMessage } from '../services/httpError'

const formStatusOptions: FolhaPagamentoStatus[] = ['aberta', 'fechada', 'paga']

function getCurrentCompetencia() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function buildInitialFormData(competencia: string): FolhaPagamentoFormData {
  return {
    competencia,
    salario_base_snapshot: 0,
    valor_hora_extra_snapshot: 0,
    vale_alimentacao_snapshot: 0,
    outros_descontos_snapshot: 0,
    dias_faltas: 0,
    dias_atestado: 0,
    dias_ferias: 0,
    dias_afastamento: 0,
    horas_extras_50: 0,
    horas_extras_100: 0,
    horas_adicional_noturno: 0,
    bonus: 0,
    comissoes: 0,
    outros_proventos: 0,
    adiantamentos: 0,
    desconto_inss: 0,
    desconto_irrf: 0,
    desconto_vale_transporte: 0,
    descontos_manuais: 0,
    observacoes: '',
    status: 'aberta',
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function FolhaPagamentoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [competencia, setCompetencia] = useState(searchParams.get('competencia') ?? getCurrentCompetencia())
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [items, setItems] = useState<FolhaPagamentoResumo[]>([])
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState(searchParams.get('funcionario') ?? '')
  const [detail, setDetail] = useState<FolhaPagamentoDetalhe | null>(null)
  const [formData, setFormData] = useState<FolhaPagamentoFormData>(() => buildInitialFormData(competencia))
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const totalLiquido = useMemo(() => items.reduce((sum, item) => sum + (item.salario_liquido ?? 0), 0), [items])
  const totalProventos = useMemo(() => items.reduce((sum, item) => sum + (item.total_proventos ?? 0), 0), [items])
  const totalDescontos = useMemo(() => items.reduce((sum, item) => sum + (item.total_descontos ?? 0), 0), [items])
  const totalPagas = useMemo(() => items.filter((item) => item.status_folha === 'paga').length, [items])

  async function loadList() {
    try {
      setIsLoadingList(true)
      setFeedback('')
      const response = await folhaPagamentoService.list({ competencia, search, status })
      setItems(response.data)
    } catch (error) {
      setFeedback(getHttpErrorMessage(error, 'Nao foi possivel carregar a folha de pagamento.'))
    } finally {
      setIsLoadingList(false)
    }
  }

  async function loadDetail(funcionarioId: string) {
    try {
      setIsLoadingDetail(true)
      setFeedback('')
      const response = await folhaPagamentoService.getByFuncionario(funcionarioId, competencia)
      setDetail(response.data)
      setFormData(response.data.folha)
    } catch (error) {
      setDetail(null)
      setFormData(buildInitialFormData(competencia))
      setFeedback(getHttpErrorMessage(error, 'Nao foi possivel carregar os detalhes da folha do funcionario.'))
    } finally {
      setIsLoadingDetail(false)
    }
  }

  useEffect(() => {
    void loadList()
  }, [competencia, status])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    nextParams.set('competencia', competencia)
    if (selectedFuncionarioId) {
      nextParams.set('funcionario', selectedFuncionarioId)
    }
    if (search) {
      nextParams.set('search', search)
    }
    if (status) {
      nextParams.set('status', status)
    }
    setSearchParams(nextParams, { replace: true })
  }, [competencia, search, selectedFuncionarioId, setSearchParams, status])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedFuncionarioId('')
      setDetail(null)
      setFormData(buildInitialFormData(competencia))
      return
    }

    if (selectedFuncionarioId && items.some((item) => item.funcionario_id === selectedFuncionarioId)) {
      return
    }

    setSelectedFuncionarioId(items[0].funcionario_id)
  }, [competencia, items, selectedFuncionarioId])

  useEffect(() => {
    if (!selectedFuncionarioId) {
      return
    }

    void loadDetail(selectedFuncionarioId)
  }, [competencia, selectedFuncionarioId])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target

    const integerFields = new Set(['dias_faltas', 'dias_atestado', 'dias_ferias', 'dias_afastamento'])
    const numericFields = new Set([
      'salario_base_snapshot',
      'valor_hora_extra_snapshot',
      'vale_alimentacao_snapshot',
      'outros_descontos_snapshot',
      'horas_extras_50',
      'horas_extras_100',
      'horas_adicional_noturno',
      'bonus',
      'comissoes',
      'outros_proventos',
      'adiantamentos',
      'desconto_inss',
      'desconto_irrf',
      'desconto_vale_transporte',
      'descontos_manuais',
    ])

    if (integerFields.has(name) || numericFields.has(name)) {
      setFormData((current) => ({ ...current, [name]: Number(value || 0) }))
      return
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFuncionarioId) {
      return
    }

    try {
      setIsSaving(true)
      setFeedback('')
      const response = await folhaPagamentoService.save(selectedFuncionarioId, { ...formData, competencia })
      setDetail(response.data)
      setFormData(response.data.folha)
      await loadList()
      setFeedback('Folha do funcionario salva com sucesso.')
    } catch (error) {
      setFeedback(getHttpErrorMessage(error, 'Nao foi possivel salvar a folha do funcionario.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Financeiro</p>
          <h1 className="dashboard-title">Folha de pagamento</h1>
          <p className="dashboard-subtitle">
            Controle mensal por competencia, com faltas, ferias, horas extras, descontos e memoria de calculo do salario final.
          </p>
        </div>
      </header>

      <div className="entity-kpi-grid entity-kpi-grid--4">
        <article className="entity-kpi">
          <span>Total de funcionarios</span>
          <strong>{items.length}</strong>
        </article>
        <article className="entity-kpi">
          <span>Total de proventos</span>
          <strong>{formatCurrency(totalProventos)}</strong>
        </article>
        <article className="entity-kpi">
          <span>Total de descontos</span>
          <strong>{formatCurrency(totalDescontos)}</strong>
        </article>
        <article className="entity-kpi">
          <span>Folhas pagas</span>
          <strong>{totalPagas}</strong>
        </article>
      </div>

      <div className="entity-toolbar">
        <div className="entity-toolbar__field">
          <label htmlFor="folha-competencia">Competencia</label>
          <input id="folha-competencia" type="month" value={competencia} onChange={(event) => setCompetencia(event.target.value)} />
        </div>
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="folha-search">Buscar funcionario</label>
          <input id="folha-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, cargo ou setor" />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="folha-status">Status do funcionario</label>
          <select id="folha-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="ferias">Ferias</option>
            <option value="afastado">Afastado</option>
            <option value="desligado">Desligado</option>
          </select>
        </div>
        <button className="entity-action entity-action--secondary" type="button" onClick={() => void loadList()}>
          Filtrar
        </button>
      </div>

      {feedback ? <p className={feedback.includes('sucesso') ? 'entity-feedback entity-feedback--success' : 'entity-feedback entity-feedback--error'}>{feedback}</p> : null}

      <div className="folha-layout">
        <article className="entity-card folha-panel">
          <div className="entity-card__header">
            <div>
              <h2>Equipe na competencia</h2>
              <p>Liquido estimado: {formatCurrency(totalLiquido)}</p>
            </div>
          </div>

          {isLoadingList ? (
            <div className="entity-empty-state">Carregando folha mensal...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhum funcionario encontrado para os filtros informados.</div>
          ) : (
            <div className="folha-list">
              {items.map((item) => (
                <button
                  key={item.funcionario_id}
                  className={`folha-list__item ${item.funcionario_id === selectedFuncionarioId ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedFuncionarioId(item.funcionario_id)}
                >
                  <div className="folha-list__header">
                    <div>
                      <strong>{item.nome}</strong>
                      <small>{item.cargo || 'Cargo nao informado'} · {item.setor || 'Setor nao informado'}</small>
                    </div>
                    <span className={`entity-status entity-status--${item.status_folha}`}>{formatStatusLabel(item.status_folha)}</span>
                  </div>
                  <div className="folha-list__meta">
                    <span>Liquido</span>
                    <strong>{formatCurrency(item.salario_liquido)}</strong>
                  </div>
                  <div className="folha-list__metrics">
                    <small>Faltas: {item.dias_faltas}</small>
                    <small>Ferias: {item.dias_ferias}</small>
                    <small>HE 50%: {item.horas_extras_50}</small>
                    <small>HE 100%: {item.horas_extras_100}</small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="entity-card folha-panel">
          <div className="entity-card__header">
            <div>
              <h2>Detalhe da folha</h2>
              <p>{detail?.funcionario.nome ?? 'Selecione um funcionario para editar a competencia'}</p>
            </div>
          </div>

          {!selectedFuncionarioId ? (
            <div className="entity-empty-state">Selecione um funcionario para ver a memoria de calculo.</div>
          ) : isLoadingDetail || !detail ? (
            <div className="entity-empty-state">Carregando detalhe da folha...</div>
          ) : (
            <form className="entity-form" onSubmit={handleSave}>
              <div className="entity-kpi-grid entity-kpi-grid--4">
                <article className="entity-kpi">
                  <span>Liquido</span>
                  <strong>{formatCurrency(detail.calculo.salario_liquido)}</strong>
                </article>
                <article className="entity-kpi">
                  <span>Proventos</span>
                  <strong>{formatCurrency(detail.calculo.total_proventos)}</strong>
                </article>
                <article className="entity-kpi">
                  <span>Descontos</span>
                  <strong>{formatCurrency(detail.calculo.total_descontos)}</strong>
                </article>
                <article className="entity-kpi">
                  <span>Status</span>
                  <strong>{formatStatusLabel(formData.status)}</strong>
                </article>
              </div>

              <article className="entity-card folha-subcard">
                <div className="entity-card__header">
                  <div>
                    <h2>Base mensal</h2>
                    <p>Valores preservados por competencia.</p>
                  </div>
                </div>
                <div className="entity-form__grid entity-form__grid--4">
                  <label className="entity-field">
                    <span>Salario base</span>
                    <input name="salario_base_snapshot" type="number" min="0" step="0.01" value={formData.salario_base_snapshot} onChange={handleChange} placeholder="2500" />
                  </label>
                  <label className="entity-field">
                    <span>Hora extra 50%</span>
                    <input name="valor_hora_extra_snapshot" type="number" min="0" step="0.01" value={formData.valor_hora_extra_snapshot} onChange={handleChange} placeholder="25" />
                  </label>
                  <label className="entity-field">
                    <span>Vale alimentacao</span>
                    <input name="vale_alimentacao_snapshot" type="number" min="0" step="0.01" value={formData.vale_alimentacao_snapshot} onChange={handleChange} placeholder="600" />
                  </label>
                  <label className="entity-field">
                    <span>Descontos fixos</span>
                    <input name="outros_descontos_snapshot" type="number" min="0" step="0.01" value={formData.outros_descontos_snapshot} onChange={handleChange} placeholder="0" />
                  </label>
                </div>
              </article>

              <article className="entity-card folha-subcard">
                <div className="entity-card__header">
                  <div>
                    <h2>Jornada e ausencias</h2>
                    <p>Variacoes mensais que impactam o salario.</p>
                  </div>
                </div>
                <div className="entity-form__grid entity-form__grid--4">
                  <label className="entity-field">
                    <span>Dias de falta</span>
                    <input name="dias_faltas" type="number" min="0" value={formData.dias_faltas} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Dias de atestado</span>
                    <input name="dias_atestado" type="number" min="0" value={formData.dias_atestado} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Dias de ferias</span>
                    <input name="dias_ferias" type="number" min="0" value={formData.dias_ferias} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Dias de afastamento</span>
                    <input name="dias_afastamento" type="number" min="0" value={formData.dias_afastamento} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Horas extras 50%</span>
                    <input name="horas_extras_50" type="number" min="0" step="0.01" value={formData.horas_extras_50} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Horas extras 100%</span>
                    <input name="horas_extras_100" type="number" min="0" step="0.01" value={formData.horas_extras_100} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Horas adicional noturno</span>
                    <input name="horas_adicional_noturno" type="number" min="0" step="0.01" value={formData.horas_adicional_noturno} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Status da folha</span>
                    <select name="status" value={formData.status} onChange={handleChange}>
                      {formStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatStatusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>

              <article className="entity-card folha-subcard">
                <div className="entity-card__header">
                  <div>
                    <h2>Proventos e descontos variaveis</h2>
                    <p>Ajustes financeiros da competencia.</p>
                  </div>
                </div>
                <div className="entity-form__grid entity-form__grid--4">
                  <label className="entity-field">
                    <span>Bonus</span>
                    <input name="bonus" type="number" min="0" step="0.01" value={formData.bonus} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Comissoes</span>
                    <input name="comissoes" type="number" min="0" step="0.01" value={formData.comissoes} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Outros proventos</span>
                    <input name="outros_proventos" type="number" min="0" step="0.01" value={formData.outros_proventos} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Adiantamentos</span>
                    <input name="adiantamentos" type="number" min="0" step="0.01" value={formData.adiantamentos} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Desconto INSS</span>
                    <input name="desconto_inss" type="number" min="0" step="0.01" value={formData.desconto_inss} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Desconto IRRF</span>
                    <input name="desconto_irrf" type="number" min="0" step="0.01" value={formData.desconto_irrf} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Vale transporte</span>
                    <input name="desconto_vale_transporte" type="number" min="0" step="0.01" value={formData.desconto_vale_transporte} onChange={handleChange} placeholder="0" />
                  </label>
                  <label className="entity-field">
                    <span>Descontos manuais</span>
                    <input name="descontos_manuais" type="number" min="0" step="0.01" value={formData.descontos_manuais} onChange={handleChange} placeholder="0" />
                  </label>
                </div>
              </article>

              <article className="entity-card folha-subcard">
                <div className="entity-card__header">
                  <div>
                    <h2>Memoria de calculo</h2>
                    <p>Conferencia dos principais componentes do salario.</p>
                  </div>
                </div>
                <div className="folha-breakdown">
                  <div className="folha-breakdown__item"><span>Valor dia</span><strong>{formatCurrency(detail.calculo.valor_dia)}</strong></div>
                  <div className="folha-breakdown__item"><span>Valor hora</span><strong>{formatCurrency(detail.calculo.valor_hora)}</strong></div>
                  <div className="folha-breakdown__item"><span>Horas extras 50%</span><strong>{formatCurrency(detail.calculo.valor_hora_extra_50)}</strong></div>
                  <div className="folha-breakdown__item"><span>Horas extras 100%</span><strong>{formatCurrency(detail.calculo.valor_hora_extra_100)}</strong></div>
                  <div className="folha-breakdown__item"><span>Adicional noturno</span><strong>{formatCurrency(detail.calculo.valor_adicional_noturno)}</strong></div>
                  <div className="folha-breakdown__item"><span>Valor de ferias</span><strong>{formatCurrency(detail.calculo.valor_ferias)}</strong></div>
                  <div className="folha-breakdown__item"><span>1/3 de ferias</span><strong>{formatCurrency(detail.calculo.terco_ferias)}</strong></div>
                  <div className="folha-breakdown__item"><span>Desconto de faltas</span><strong>{formatCurrency(detail.calculo.desconto_faltas)}</strong></div>
                  <div className="folha-breakdown__item"><span>Desconto de afastamento</span><strong>{formatCurrency(detail.calculo.desconto_afastamento)}</strong></div>
                  <div className="folha-breakdown__item"><span>Desconto de ferias</span><strong>{formatCurrency(detail.calculo.desconto_ferias)}</strong></div>
                </div>
              </article>

              <label className="entity-field">
                <span>Observacoes da folha</span>
                <textarea name="observacoes" rows={6} value={formData.observacoes} onChange={handleChange} placeholder="Observacoes da competencia, ajustes e justificativas" />
              </label>

              <div className="entity-form__actions">
                <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar folha do funcionario'}
                </button>
              </div>
            </form>
          )}
        </article>
      </div>
    </section>
  )
}
