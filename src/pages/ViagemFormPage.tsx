import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clienteService, type Cliente } from '../services/clienteService'
import { motoristaService, type MotoristaListItem } from '../services/motoristaService'
import { tipoCargaService, type TipoCarga } from '../services/tipoCargaService'
import { veiculoService, type VeiculoListItem } from '../services/veiculoService'
import { viagemService, type ViagemFormData, type ViagemStatus } from '../services/viagemService'

const statusOptions: ViagemStatus[] = ['planejada', 'em_andamento', 'concluida', 'cancelada']

const initialFormState: ViagemFormData = {
  cliente_id: '',
  motorista_id: '',
  veiculo_id: '',
  tipo_carga_id: '',
  origem: '',
  destino: '',
  data_saida: '',
  data_previsao_chegada: '',
  distancia_km: '',
  peso_carga_kg: '',
  valor_frete: '',
  status: 'planejada',
  descricao_carga: '',
  observacoes: '',
}

export function ViagemFormPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<ViagemFormData>(initialFormState)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [motoristas, setMotoristas] = useState<MotoristaListItem[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [tiposCarga, setTiposCarga] = useState<TipoCarga[]>([])
  const [clienteSearch, setClienteSearch] = useState('')
  const [motoristaSearch, setMotoristaSearch] = useState('')
  const [veiculoSearch, setVeiculoSearch] = useState('')
  const [tipoCargaSearch, setTipoCargaSearch] = useState('')
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const selectedCliente = useMemo(
    () => clientes.find((item) => String(item.id) === formData.cliente_id),
    [clientes, formData.cliente_id],
  )
  const selectedMotorista = useMemo(
    () => motoristas.find((item) => String(item.id) === formData.motorista_id),
    [motoristas, formData.motorista_id],
  )
  const selectedVeiculo = useMemo(
    () => veiculos.find((item) => String(item.id) === formData.veiculo_id),
    [veiculos, formData.veiculo_id],
  )
  const selectedTipoCarga = useMemo(
    () => tiposCarga.find((item) => String(item.id) === formData.tipo_carga_id),
    [tiposCarga, formData.tipo_carga_id],
  )

  const loadOptions = useCallback(async () => {
    try {
      setIsLoadingOptions(true)
      setFeedback('')

      const [clientesResponse, motoristasResponse, veiculosResponse, tiposCargaResponse] = await Promise.all([
        clienteService.list({ search: clienteSearch, page: 1, limit: 20 }),
        motoristaService.list({ search: motoristaSearch, status: 'ativo', page: 1, limit: 20 }),
        veiculoService.list({ search: veiculoSearch, status: 'disponivel', page: 1, limit: 20 }),
        tipoCargaService.list({ search: tipoCargaSearch, page: 1, limit: 20 }),
      ])

      setClientes(clientesResponse.data)
      setMotoristas(motoristasResponse.data)
      setVeiculos(veiculosResponse.data)
      setTiposCarga(tiposCargaResponse.data)
    } catch {
      setFeedback('Nao foi possivel carregar as opcoes de motorista, veiculo, cliente e tipo de carga.')
    } finally {
      setIsLoadingOptions(false)
    }
  }, [clienteSearch, motoristaSearch, tipoCargaSearch, veiculoSearch])

  useEffect(() => {
    queueMicrotask(() => {
      void loadOptions()
    })
  }, [loadOptions])

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setFeedback('')
      await viagemService.create(formData)
      navigate('/dashboard/viagens/listar', { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage =
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : 'Nao foi possivel cadastrar a viagem.'

        setFeedback(apiMessage)
      } else {
        setFeedback('Nao foi possivel cadastrar a viagem. Revise os dados e tente novamente.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Operacao</p>
          <h1 className="dashboard-title">Nova viagem</h1>
          <p className="dashboard-subtitle">
            Cadastre a rota, vincule cliente, motorista, veiculo e tipo de carga, e registre os dados comerciais da viagem.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/viagens/listar">
            Voltar para listagem
          </Link>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Vinculos da viagem</h2>
              <p>Busque e selecione os registros que serao usados no planejamento operacional.</p>
            </div>
            <button className="entity-action entity-action--secondary" type="button" onClick={() => void loadOptions()}>
              {isLoadingOptions ? 'Buscando...' : 'Atualizar buscas'}
            </button>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Buscar cliente</span>
              <input
                value={clienteSearch}
                onChange={(event) => setClienteSearch(event.target.value)}
                placeholder="Nome, documento ou e-mail"
              />
            </label>
            <label className="entity-field">
              <span>Cliente</span>
              <select name="cliente_id" value={formData.cliente_id} onChange={handleChange} required>
                <option value="">Selecione</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome} - {cliente.cpf_cnpj}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Buscar motorista</span>
              <input
                value={motoristaSearch}
                onChange={(event) => setMotoristaSearch(event.target.value)}
                placeholder="Nome, CPF ou CNH"
              />
            </label>
            <label className="entity-field">
              <span>Motorista</span>
              <select name="motorista_id" value={formData.motorista_id} onChange={handleChange} required>
                <option value="">Selecione</option>
                {motoristas.map((motorista) => (
                  <option key={motorista.id} value={motorista.id}>
                    {motorista.nome} - CNH {motorista.tipo_cnh}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Buscar veiculo</span>
              <input
                value={veiculoSearch}
                onChange={(event) => setVeiculoSearch(event.target.value)}
                placeholder="Placa, modelo ou marca"
              />
            </label>
            <label className="entity-field">
              <span>Veiculo</span>
              <select name="veiculo_id" value={formData.veiculo_id} onChange={handleChange} required>
                <option value="">Selecione</option>
                {veiculos.map((veiculo) => (
                  <option key={veiculo.id} value={veiculo.id}>
                    {veiculo.placa} - {veiculo.modelo}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Buscar tipo de carga</span>
              <input
                value={tipoCargaSearch}
                onChange={(event) => setTipoCargaSearch(event.target.value)}
                placeholder="Nome ou descricao"
              />
            </label>
            <label className="entity-field">
              <span>Tipo de carga</span>
              <select name="tipo_carga_id" value={formData.tipo_carga_id} onChange={handleChange} required>
                <option value="">Selecione</option>
                {tiposCarga.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="trip-selection-grid">
            <div className="trip-selection">
              <span>Cliente</span>
              <strong>{selectedCliente?.nome ?? 'Nao selecionado'}</strong>
              <small>{selectedCliente?.email ?? 'Escolha um cliente para faturamento'}</small>
            </div>
            <div className="trip-selection">
              <span>Motorista</span>
              <strong>{selectedMotorista?.nome ?? 'Nao selecionado'}</strong>
              <small>{selectedMotorista ? `${selectedMotorista.telefone} - ${selectedMotorista.status}` : 'Somente motoristas ativos aparecem na busca'}</small>
            </div>
            <div className="trip-selection">
              <span>Veiculo</span>
              <strong>{selectedVeiculo?.placa ?? 'Nao selecionado'}</strong>
              <small>{selectedVeiculo ? `${selectedVeiculo.modelo} - ${selectedVeiculo.tipo}` : 'Somente veiculos disponiveis aparecem na busca'}</small>
            </div>
            <div className="trip-selection">
              <span>Carga</span>
              <strong>{selectedTipoCarga?.nome ?? 'Nao selecionado'}</strong>
              <small>{selectedTipoCarga?.descricao || 'Classificacao operacional da carga'}</small>
            </div>
          </div>
        </article>

        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Rota e agenda</h2>
              <p>Origem, destino, datas previstas e distancia planejada.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field entity-field--span-2">
              <span>Origem</span>
              <input name="origem" value={formData.origem} onChange={handleChange} required />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Destino</span>
              <input name="destino" value={formData.destino} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Data de saida</span>
              <input name="data_saida" type="datetime-local" value={formData.data_saida} onChange={handleChange} required />
            </label>
            <label className="entity-field">
              <span>Previsao de chegada</span>
              <input
                name="data_previsao_chegada"
                type="datetime-local"
                value={formData.data_previsao_chegada}
                onChange={handleChange}
                required
              />
            </label>
            <label className="entity-field">
              <span>Distancia (km)</span>
              <input name="distancia_km" type="number" min="0" step="0.01" value={formData.distancia_km} onChange={handleChange} />
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
              <h2>Carga e valores</h2>
              <p>Detalhes usados para conferencia, faturamento e acompanhamento da operacao.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field">
              <span>Peso da carga (kg)</span>
              <input name="peso_carga_kg" type="number" min="0" step="0.01" value={formData.peso_carga_kg} onChange={handleChange} />
            </label>
            <label className="entity-field">
              <span>Valor do frete</span>
              <input name="valor_frete" type="number" min="0" step="0.01" value={formData.valor_frete} onChange={handleChange} />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Descricao da carga</span>
              <textarea name="descricao_carga" value={formData.descricao_carga} onChange={handleChange} rows={5} />
            </label>
            <label className="entity-field entity-field--span-2">
              <span>Observacoes internas</span>
              <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={5} />
            </label>
          </div>
        </article>

        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/viagens/listar">
            Cancelar
          </Link>
          <button className="entity-action entity-action--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Cadastrar viagem'}
          </button>
        </div>
      </form>
    </section>
  )
}
