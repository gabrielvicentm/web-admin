import { useEffect, useMemo, useState } from 'react'
import { abastecimentoService, type AbastecimentoItem } from '../services/abastecimentoService'
import { motoristaService, type MotoristaListItem } from '../services/motoristaService'
import { veiculoService, type VeiculoListItem } from '../services/veiculoService'
import './AbastecimentosListPage.css'

type LoadOverrides = {
  veiculoId?: string
  motoristaId?: string
  page?: number
  limit?: number
}

function formatCurrency(value: string | number) {
  const parsed = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isNaN(parsed) ? 0 : parsed)
}

function formatNumber(value: string | number, suffix = '') {
  const parsed = Number(value ?? 0)
  const formatted = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number.isNaN(parsed) ? 0 : parsed)
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatFuelType(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function AbastecimentosListPage() {
  const [items, setItems] = useState<AbastecimentoItem[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [motoristas, setMotoristas] = useState<MotoristaListItem[]>([])
  const [veiculoId, setVeiculoId] = useState('')
  const [motoristaId, setMotoristaId] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [selectedItem, setSelectedItem] = useState<AbastecimentoItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.litros += Number(item.litros || 0)
        acc.valor += Number(item.valor_total || 0)
        return acc
      },
      { litros: 0, valor: 0 },
    )
  }, [items])

  async function loadFilters() {
    try {
      const [veiculosResponse, motoristasResponse] = await Promise.all([
        veiculoService.list({ page: 1, limit: 100 }),
        motoristaService.list({ page: 1, limit: 100 }),
      ])

      setVeiculos(veiculosResponse.data)
      setMotoristas(motoristasResponse.data)
    } catch {
      setErrorMessage('Nao foi possivel carregar os filtros de veiculos e motoristas.')
    }
  }

  async function loadAbastecimentos(overrides: LoadOverrides = {}) {
    const nextVeiculoId = overrides.veiculoId ?? veiculoId
    const nextMotoristaId = overrides.motoristaId ?? motoristaId
    const nextPage = overrides.page ?? page
    const nextLimit = overrides.limit ?? limit

    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await abastecimentoService.list({
        veiculo_id: nextVeiculoId,
        motorista_id: nextMotoristaId,
        page: nextPage,
        limit: nextLimit,
      })

      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedItem((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null)
    } catch {
      setErrorMessage('Nao foi possivel carregar os abastecimentos.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilter() {
    setPage(1)
    void loadAbastecimentos({ page: 1 })
  }

  function handleClearFilters() {
    setVeiculoId('')
    setMotoristaId('')
    setPage(1)
    void loadAbastecimentos({ veiculoId: '', motoristaId: '', page: 1 })
  }

  useEffect(() => {
    void loadFilters()
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadAbastecimentos()
    })
    // Filters are applied by the Filtrar button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  return (
    <section className="entity-page abastecimentos-page">
      <header className="entity-page__hero abastecimentos-hero">
        <div>
          <p className="dashboard-eyebrow">Operacao</p>
          <h1 className="dashboard-title">Abastecimentos</h1>
          <p className="dashboard-subtitle">
            Consulte abastecimentos registrados pelos motoristas, filtrando por veiculo ou motorista.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadAbastecimentos()}>
            Atualizar lista
          </button>
        </div>
      </header>

      <div className="entity-toolbar abastecimentos-toolbar">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="abastecimento-veiculo">Veiculo</label>
          <select id="abastecimento-veiculo" value={veiculoId} onChange={(event) => setVeiculoId(event.target.value)}>
            <option value="">Todos os veiculos</option>
            {veiculos.map((veiculo) => (
              <option key={veiculo.id} value={veiculo.id}>
                {veiculo.placa} - {veiculo.modelo}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="abastecimento-motorista">Motorista</label>
          <select id="abastecimento-motorista" value={motoristaId} onChange={(event) => setMotoristaId(event.target.value)}>
            <option value="">Todos os motoristas</option>
            {motoristas.map((motorista) => (
              <option key={motorista.id} value={motorista.id}>
                {motorista.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="abastecimento-limit">Por pagina</label>
          <select
            id="abastecimento-limit"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value))
              setPage(1)
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </div>
        <button className="entity-action entity-action--secondary" type="button" onClick={handleFilter}>
          Filtrar
        </button>
        <button className="entity-action entity-action--ghost" type="button" onClick={handleClearFilters}>
          Limpar
        </button>
      </div>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <div className="entity-grid abastecimentos-grid">
        <article className="entity-card entity-card--table">
          <div className="entity-card__header">
            <div>
              <h2>Lista de abastecimentos</h2>
              <p>{total} registros encontrados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando abastecimentos...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhum abastecimento encontrado para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="abastecimentos-table__head">
                  <span>Registro</span>
                  <span>Veiculo</span>
                  <span>Motorista</span>
                  <span>Combustivel</span>
                  <span>Valores</span>
                </div>

                {items.map((item) => (
                  <button
                    className={`abastecimentos-table__row ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                  >
                    <span>
                      <strong>{formatDateTime(item.registrado_em)}</strong>
                      <small>{item.fornecedor || 'Fornecedor nao informado'}</small>
                    </span>
                    <span>
                      <strong>{item.veiculo_placa || `Veiculo #${item.veiculo_id}`}</strong>
                      <small>{item.veiculo_modelo || 'Modelo nao informado'}</small>
                    </span>
                    <span>
                      <strong>{item.motorista_nome || `Motorista #${item.motorista_id}`}</strong>
                      <small>{item.viagem_id ? `Viagem ${item.viagem_id}` : 'Sem viagem vinculada'}</small>
                    </span>
                    <span>
                      <strong>{formatFuelType(item.tipo_combustivel)}</strong>
                      <small>{formatNumber(item.litros, 'L')} · KM {formatNumber(item.km_atual)}</small>
                    </span>
                    <span>
                      <strong className="abastecimentos-table__value">{formatCurrency(item.valor_total)}</strong>
                      <small>{formatCurrency(item.valor_por_litro)} / L</small>
                    </span>
                  </button>
                ))}
              </div>

              <div className="entity-pagination">
                <button disabled={page <= 1} type="button" onClick={() => setPage((current) => current - 1)}>
                  Anterior
                </button>
                <span>
                  Pagina {page} de {totalPages}
                </span>
                <button disabled={page >= totalPages} type="button" onClick={() => setPage((current) => current + 1)}>
                  Proxima
                </button>
              </div>
            </>
          )}
        </article>

        <aside className="entity-card entity-card--aside abastecimentos-summary">
          <div className="entity-card__header">
            <div>
              <h2>Resumo</h2>
              <p>{selectedItem ? selectedItem.fornecedor || selectedItem.veiculo_placa || 'Abastecimento selecionado' : 'Selecione um abastecimento'}</p>
            </div>
          </div>

          <div className="entity-aside">
            <div className="entity-kpi-grid">
              <div className="entity-kpi abastecimentos-kpi">
                <span>Total da pagina</span>
                <strong>{formatCurrency(totals.valor)}</strong>
              </div>
              <div className="entity-kpi abastecimentos-kpi">
                <span>Litros da pagina</span>
                <strong>{formatNumber(totals.litros, 'L')}</strong>
              </div>
            </div>

            {!selectedItem ? (
              <div className="entity-empty-state">Selecione um registro para visualizar os detalhes.</div>
            ) : (
              <div className="entity-timeline">
                <div>
                  <h3>Detalhes</h3>
                  <div className="entity-timeline__item">
                    <strong>{selectedItem.veiculo_placa || `Veiculo #${selectedItem.veiculo_id}`}</strong>
                    <span>{selectedItem.veiculo_modelo || 'Modelo nao informado'}</span>
                  </div>
                  <div className="entity-timeline__item">
                    <strong>{selectedItem.motorista_nome || `Motorista #${selectedItem.motorista_id}`}</strong>
                    <span>{formatDateTime(selectedItem.registrado_em)}</span>
                  </div>
                  <div className="entity-timeline__item">
                    <strong>{formatCurrency(selectedItem.valor_total)}</strong>
                    <span>
                      {formatNumber(selectedItem.litros, 'L')} a {formatCurrency(selectedItem.valor_por_litro)} por litro
                    </span>
                  </div>
                  {selectedItem.foto_url ? (
                    <a className="entity-action entity-action--secondary" href={selectedItem.foto_url} target="_blank" rel="noreferrer">
                      Ver foto
                    </a>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
