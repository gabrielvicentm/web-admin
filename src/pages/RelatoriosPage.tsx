import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  formatCurrency,
  formatNumber,
  reportDirectoryItems,
  useFleetRankings,
} from './relatoriosShared'

export function RelatoriosPage() {
  const [fleetSearch, setFleetSearch] = useState('')
  const { consumoRanking, custosRanking, fleetRankingStatus } = useFleetRankings(fleetSearch)

  return (
    <section className="dashboard-home reports-page">
      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Relatorios</p>
          <h1 className="dashboard-title">Central de relatorios</h1>
          <p className="dashboard-subtitle">
            Escolha um fluxo especifico para abrir a pagina dedicada do relatorio, aplicar filtros e exportar com mais
            organizacao.
          </p>
        </div>

        <div className="dashboard-chip-row">
          <span className="dashboard-chip dashboard-chip--success">Microservico Python ativo</span>
          <span className="dashboard-chip">{reportDirectoryItems.length} relatorios separados</span>
          <span className="dashboard-chip">CSV e XLSX</span>
        </div>
      </header>

      <div className="dashboard-layout-grid">
        <article className="dashboard-panel dashboard-panel--span-8 reports-directory">
          <div className="dashboard-panel__header">
            <div>
              <h2>Abrir relatorio</h2>
              <p>Cada opcao leva para uma tela propria, com filtros e preview focados no contexto daquele relatorio.</p>
            </div>
          </div>

          <div className="reports-directory-grid">
            {reportDirectoryItems.map(({ title, description, to, tone, icon: Icon, chips }) => (
              <Link className={`reports-directory-card reports-directory-card--${tone}`} key={to} to={to}>
                <span className="reports-directory-card__icon">
                  <Icon width={24} height={24} />
                </span>
                <div className="reports-directory-card__content">
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
                <div className="reports-directory-card__chips">
                  {chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
                <span className="reports-directory-card__action">Abrir pagina</span>
              </Link>
            ))}
          </div>
        </article>

        <aside className="dashboard-panel dashboard-panel--span-4 reports-sidepanel">
          <div className="dashboard-panel__header">
            <div>
              <h2>Como ficou</h2>
              <p>A central agora serve como indice, e os relatorios grandes saem desta pagina unica.</p>
            </div>
          </div>

          <div className="dashboard-metric-stack">
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">1</div>
              <div>
                <p>Navegacao</p>
                <strong>Uma pagina por relatorio</strong>
                <span>Viagens, folha, combustivel, manutencoes, custos, desempenho e lucro por viagem.</span>
              </div>
            </div>
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">2</div>
              <div>
                <p>Filtros</p>
                <strong>Contexto mais limpo</strong>
                <span>Cada tela mostra apenas os filtros e exportacoes relevantes para aquele caso.</span>
              </div>
            </div>
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">3</div>
              <div>
                <p>Infraestrutura</p>
                <strong>Mesmo backend de relatorios</strong>
                <span>O frontend continua chamando o microservico Python pelo proxy em <code>/reports-api</code>.</span>
              </div>
            </div>
          </div>
        </aside>

        <article className="dashboard-panel dashboard-panel--span-12 reports-fleet">
          <div className="dashboard-panel__header">
            <div>
              <h2>Ranking da frota</h2>
              <p>Visao rapida para apoiar a escolha do relatorio certo antes de entrar no detalhe.</p>
            </div>
            <div className="reports-fleet__actions">
              <label className="entity-field reports-fleet__search">
                <span>Buscar veiculo</span>
                <input value={fleetSearch} onChange={(event) => setFleetSearch(event.target.value)} placeholder="Placa ou modelo" />
              </label>
            </div>
          </div>

          <div className="reports-fleet-grid">
            <section className="reports-fleet-panel">
              <div className="dashboard-panel__header">
                <div>
                  <h2>Top consumo medio</h2>
                  <p>Maior eficiencia km/l da frota.</p>
                </div>
              </div>

              {fleetRankingStatus === 'loading' ? (
                <div className="entity-empty-state">Carregando consumo medio...</div>
              ) : consumoRanking.length === 0 ? (
                <div className="entity-empty-state">Nenhum dado de consumo medio encontrado.</div>
              ) : (
                <div className="reports-preview-table">
                  <div className="reports-preview-table__head reports-preview-table__head--fleet">
                    <span>Veiculo</span>
                    <span>Consumo</span>
                    <span>Base</span>
                  </div>

                  {consumoRanking.map((item) => (
                    <div className="reports-preview-table__row reports-preview-table__row--fleet" key={item.veiculo_id}>
                      <span>
                        <strong>{item.placa}</strong>
                        <small>{item.modelo}</small>
                      </span>
                      <span>{formatNumber(item.consumo_km_por_litro, 'km/l')}</span>
                      <span>{formatNumber(item.total_abastecimentos)} abastecimentos</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="reports-fleet-panel">
              <div className="dashboard-panel__header">
                <div>
                  <h2>Maiores custos totais</h2>
                  <p>Consolidado de combustivel e manutencao por veiculo.</p>
                </div>
              </div>

              {fleetRankingStatus === 'loading' ? (
                <div className="entity-empty-state">Carregando custos totais...</div>
              ) : custosRanking.length === 0 ? (
                <div className="entity-empty-state">Nenhum dado de custo total encontrado.</div>
              ) : (
                <div className="reports-preview-table">
                  <div className="reports-preview-table__head reports-preview-table__head--fleet">
                    <span>Veiculo</span>
                    <span>Custo total</span>
                    <span>Manutencao</span>
                  </div>

                  {custosRanking.map((item) => (
                    <div className="reports-preview-table__row reports-preview-table__row--fleet" key={item.veiculo_id}>
                      <span>
                        <strong>{item.placa}</strong>
                        <small>{item.modelo}</small>
                      </span>
                      <span>{formatCurrency(item.custo_total)}</span>
                      <span>{formatCurrency(item.custo_manutencao)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </article>
      </div>
    </section>
  )
}
