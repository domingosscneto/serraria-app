import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Plus, BarChart3, ChevronLeft, ChevronRight, X, Trash2, AlertTriangle, Edit2, Filter } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const CLIENTES = ['AÇODEC', 'AÇOS PRIMAVERA', 'AÇOTUBO', 'AMR PINTER', 'ARTEX', 'ATIVA', 'BELLA UNION', 'BOX STEEL', 'BRASMETAL', 'CBBA', 'COPERFIL', 'CORT LINE', 'CSA', 'DORBINOX', 'ELINOX', 'EXTRUTECH', 'FATIMA FERRA E AÇO', 'FER ALVAREZ I', 'FER ALVAREZ II', 'FERCOI', 'FERROLENE SP', 'FERROLENE MG', 'FORMILINE', 'INCONEL', 'KOFAR', 'KORT AÇO', 'KORT GERAL', 'KORT METAL', 'KORT TOTAL', 'LAPEFER', 'LHR', 'MAPEFER', 'MEBRAS', 'MG CENTRO DE SERVIÇOS', 'MIL AÇOS', 'MULTIAÇO', 'MULTIAÇO ITU', 'NACIONAL TUBOS', 'NEO LIDER', 'NEW PORT STEEL', 'NOVA FATIMA', 'PAULIFER', 'PERFILADOS NARDI', 'PERTECH', 'RETINOX', 'SENASERV', 'SOLUAÇO', 'STAMPSTEEL', 'TRADE STEEL', 'TUBOS ABC', 'URIFER', 'USINA', 'WALCORTE'];

const LINHAS_PRODUCAO = ['Serra Fita Setenta', 'Serra Fita Jardim', 'Bloqueadeira', 'Aproveitamento'];

const EQUIPAMENTOS_MOTIVOS = {
  'Bitolador': ['Substituição do botão do bitolador', 'Substituição do relé do bitolador', 'Manutenção no fio elétrico do bitolador', 'Outro'],
  'Cava': ['Substituição da arruela', 'Outro'],
  'Destopadeira': ['Substituição do motor', 'Substituição da flange', 'Manutenção correia do motor', 'Manutenção no grampo de aperto do trilho', 'Outro'],
  'Esteira': ['Esteira de entrada rompida', 'Substituição do motor da esteira', 'Outro'],
  'Grampeador de toras': ['Substituição da mangueira de ar comprimido do grampeador de toras', 'Outro'],
  'Guincho': ['Manutenção no freio do guincho', 'Manutenção na base do guincho', 'Substituição da mangueira hidráulica de guincho', 'Outro'],
  'Linha Completa': ['Falta de Energia Elétrica', 'Falta de Mão de Obra', 'Outro'],
  'Painel elétrico': ['Manutenção no painel elétrico', 'Outro'],
  'Picador': ['Esteira de entrada 01 rompida', 'Esteira de entrada 02 rompida', 'Esteira de saída 01 rompida', 'Esteira de saída 02 rompida', 'Substituição do mancal do rolo de entrada', 'Outro'],
  'Refiladeira': ['Substituição do rolamento', 'Substituição do eixo', 'Manutenção do disjuntor geral do painel', 'Outro'],
  'Serrafita': ['Substituição de rolamento', 'Queima de motor', 'Troca de correia','Manutenção na Guia', 'Outro'],
  'Virador de toras LE': ['Manutenção no virador de toras', 'Manutenção na corrente do virador de toras', 'Outro'],
  'Virador de toras LD': ['Manutenção no virador de toras', 'Manutenção na corrente do virador de toras', 'Outro'],
};

const META_DIARIA = 30;
const META_VALOR = 1200;

const App = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [producoes, setProducoes] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showParadaForm, setShowParadaForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [ordenacaoRanking, setOrdenacaoRanking] = useState('quantidade');
  const [ordenacaoHistorico, setOrdenacaoHistorico] = useState('quantidade');

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    linhaProducao: 'Serra fita Setenta',
    cliente: CLIENTES[0],
    volume: ''
  });

  const [paradaData, setParadaData] = useState({
    data: new Date().toISOString().split('T')[0],
    linhaProducao: 'Serra fita Setenta',
    horarioInicial: '',
    horarioFinal: '',
    equipamento: 'Esteira',
    motivo: 'Esteira de entrada rompida',
    observacao: ''
  });

  const [filtrosDashboard, setFiltrosDashboard] = useState({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    linhaProducao: 'Todas',
    cliente: 'Todos'
  });

  const [filtrosParadas, setFiltrosParadas] = useState({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    linhaProducao: 'Todas',
    equipamento: 'Todos'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const producoesSnapshot = await getDocs(collection(db, 'producoes'));
      const producoesData = producoesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducoes(producoesData);

      const paradasSnapshot = await getDocs(collection(db, 'paradas'));
      const paradasData = paradasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParadas(paradasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados. Verifique sua conexão com Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const saveProducao = async (producao) => {
    try {
      if (editingItem && editingItem.tipo === 'producao') {
        await updateDoc(doc(db, 'producoes', editingItem.id), producao);
        setProducoes(producoes.map(p => p.id === editingItem.id ? { id: editingItem.id, ...producao } : p));
      } else {
        const docRef = await addDoc(collection(db, 'producoes'), producao);
        setProducoes([...producoes, { id: docRef.id, ...producao }]);
      }
    } catch (error) {
      console.error('Erro ao salvar produção:', error);
      alert('Erro ao salvar produção. Tente novamente.');
    }
  };

  const saveParada = async (parada) => {
    try {
      if (editingItem && editingItem.tipo === 'parada') {
        await updateDoc(doc(db, 'paradas', editingItem.id), parada);
        setParadas(paradas.map(p => p.id === editingItem.id ? { id: editingItem.id, ...parada } : p));
      } else {
        const docRef = await addDoc(collection(db, 'paradas'), parada);
        setParadas([...paradas, { id: docRef.id, ...parada }]);
      }
    } catch (error) {
      console.error('Erro ao salvar parada:', error);
      alert('Erro ao salvar parada. Tente novamente.');
    }
  };

  const handleSubmit = () => {
    if (!formData.cliente || !formData.volume) {
      alert('Preencha todos os campos');
      return;
    }

    const producao = {
      data: formData.data,
      linhaProducao: formData.linhaProducao,
      cliente: formData.cliente,
      volume: parseFloat(formData.volume)
    };

    saveProducao(producao);
    setFormData({
      data: new Date().toISOString().split('T')[0],
      linhaProducao: 'Serra fita Setenta',
      cliente: CLIENTES[0],
      volume: ''
    });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleParadaSubmit = () => {
    if (!paradaData.horarioInicial || !paradaData.horarioFinal) {
      alert('Preencha todos os campos');
      return;
    }

    const parada = {
      data: paradaData.data,
      linhaProducao: paradaData.linhaProducao,
      horarioInicial: paradaData.horarioInicial,
      horarioFinal: paradaData.horarioFinal,
      equipamento: paradaData.equipamento,
      motivo: paradaData.motivo,
      observacao: paradaData.observacao
    };

    saveParada(parada);
    setParadaData({
      data: new Date().toISOString().split('T')[0],
      linhaProducao: 'Serra fita Setenta',
      horarioInicial: '',
      horarioFinal: '',
      equipamento: 'Esteira',
      motivo: 'Esteira de entrada rompida',
      observacao: ''
    });
    setShowParadaForm(false);
    setEditingItem(null);
  };

  const deleteProducao = async (id) => {
    if (confirm('Excluir produção?')) {
      try {
        await deleteDoc(doc(db, 'producoes', id));
        setProducoes(producoes.filter(p => p.id !== id));
      } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar. Tente novamente.');
      }
    }
  };

  const deleteParada = async (id) => {
    if (confirm('Excluir parada?')) {
      try {
        await deleteDoc(doc(db, 'paradas', id));
        setParadas(paradas.filter(p => p.id !== id));
      } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar. Tente novamente.');
      }
    }
  };

  const editProducao = (prod) => {
    setEditingItem({ ...prod, tipo: 'producao' });
    setFormData({
      data: prod.data,
      linhaProducao: prod.linhaProducao,
      cliente: prod.cliente,
      volume: prod.volume.toString()
    });
    setShowForm(true);
  };

  const editParada = (parada) => {
    setEditingItem({ ...parada, tipo: 'parada' });
    setParadaData({
      data: parada.data,
      linhaProducao: parada.linhaProducao,
      horarioInicial: parada.horarioInicial,
      horarioFinal: parada.horarioFinal,
      equipamento: parada.equipamento,
      motivo: parada.motivo,
      observacao: parada.observacao || ''
    });
    setShowParadaForm(true);
  };

  const calcularTempoParada = (hi, hf) => {
    const [h1, m1] = hi.split(':').map(Number);
    const [h2, m2] = hf.split(':').map(Number);
    let min1 = h1 * 60 + m1;
    let min2 = h2 * 60 + m2;
    let diff = min2 - min1;
    if (h1 * 60 + m1 <= 12 * 60 && h2 * 60 + m2 > 12 * 60) {
      diff -= 60;
    }
    return { horas: Math.floor(diff / 60), minutos: diff % 60, totalMinutos: diff };
  };

  const getProducoesPorData = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return producoes.filter(p => p.data === dateStr);
  };

  const getParadasPorData = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return paradas.filter(p => p.data === dateStr);
  };

  const getTotalPorData = (date) => {
    return getProducoesPorData(date).reduce((sum, p) => sum + p.volume, 0);
  };

  const getTotalParadaPorData = (date) => {
    return getParadasPorData(date).reduce((sum, p) => {
      return sum + calcularTempoParada(p.horarioInicial, p.horarioFinal).totalMinutos;
    }, 0);
  };

  const getTotalMes = () => {
    return producoes.filter(p => {
      const d = new Date(p.data);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + p.volume, 0);
  };

  const aplicarFiltrosDashboard = (items) => {
    return items.filter(item => {
      const dataItem = new Date(item.data);
      const dataInicio = new Date(filtrosDashboard.dataInicio);
      const dataFim = new Date(filtrosDashboard.dataFim);
      let passaData = dataItem >= dataInicio && dataItem <= dataFim;
      let passaLinha = filtrosDashboard.linhaProducao === 'Todas' || item.linhaProducao === filtrosDashboard.linhaProducao;
      let passaCliente = filtrosDashboard.cliente === 'Todos' || item.cliente === filtrosDashboard.cliente;
      return passaData && passaLinha && passaCliente;
    });
  };

  const aplicarFiltrosParadas = (items) => {
    return items.filter(item => {
      const dataItem = new Date(item.data);
      const dataInicio = new Date(filtrosParadas.dataInicio);
      const dataFim = new Date(filtrosParadas.dataFim);
      let passaData = dataItem >= dataInicio && dataItem <= dataFim;
      let passaLinha = filtrosParadas.linhaProducao === 'Todas' || item.linhaProducao === filtrosParadas.linhaProducao;
      let passaEquip = filtrosParadas.equipamento === 'Todos' || item.equipamento === filtrosParadas.equipamento;
      return passaData && passaLinha && passaEquip;
    });
  };

  const getEstatisticasSerraria = () => {
    const producoesFiltradas = aplicarFiltrosDashboard(producoes);
    const stats = {};
    LINHAS_PRODUCAO.forEach(linha => {
      stats[linha] = { total: 0, dias: new Set() };
    });
    producoesFiltradas.forEach(p => {
      if (stats[p.linhaProducao]) {
        stats[p.linhaProducao].total += p.volume;
        stats[p.linhaProducao].dias.add(p.data);
      }
    });
    const result = {};
    Object.keys(stats).forEach(linha => {
      result[linha] = {
        total: stats[linha].total,
        dias: stats[linha].dias.size,
        media: stats[linha].dias.size > 0 ? stats[linha].total / stats[linha].dias.size : 0
      };
    });
    return result;
  };

  const getDaysInMonth = () => new Date(currentYear, currentMonth + 1, 0).getDate();
  const getFirstDayOfMonth = () => new Date(currentYear, currentMonth, 1).getDay();

  const getProducoesPorLinha = () => {
    const producoesFiltradas = aplicarFiltrosDashboard(producoes);
    const porLinha = {};
    producoesFiltradas.forEach(p => {
      porLinha[p.linhaProducao] = (porLinha[p.linhaProducao] || 0) + p.volume;
    });
    return Object.entries(porLinha).map(([nome, volume]) => ({
      nome,
      volume: parseFloat(volume.toFixed(2))
    }));
  };

  const getUltimos30Dias = () => {
    const [anoInicio, mesInicio, diaInicio] = filtrosDashboard.dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = filtrosDashboard.dataFim.split('-').map(Number);
    const dataInicio = new Date(anoInicio, mesInicio - 1, diaInicio);
    const dataFim = new Date(anoFim, mesFim - 1, diaFim);
    const dias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;
    const dados = [];
    for (let i = 0; i < dias; i++) {
      const data = new Date(anoInicio, mesInicio - 1, diaInicio + i);
      const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      const producoesDia = aplicarFiltrosDashboard(producoes.filter(p => p.data === dataStr));
      const total = producoesDia.reduce((sum, p) => sum + p.volume, 0);
      dados.push({
        dia: data.getDate() + '/' + (data.getMonth() + 1),
        volume: parseFloat(total.toFixed(2))
      });
    }
    return dados;
  };

  const getMaiorMenorProducao = () => {
    const [anoInicio, mesInicio, diaInicio] = filtrosDashboard.dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = filtrosDashboard.dataFim.split('-').map(Number);
    const dataInicio = new Date(anoInicio, mesInicio - 1, diaInicio);
    const dataFim = new Date(anoFim, mesFim - 1, diaFim);
    const dias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;
    const producoesPorDia = {};
    for (let i = 0; i < dias; i++) {
      const data = new Date(anoInicio, mesInicio - 1, diaInicio + i);
      const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      const producoesDia = aplicarFiltrosDashboard(producoes.filter(p => p.data === dataStr));
      const total = producoesDia.reduce((sum, p) => sum + p.volume, 0);
      if (total > 0) {
        producoesPorDia[data.getDate()] = total;
      }
    }
    const entries = Object.entries(producoesPorDia).map(([dia, volume]) => ({ dia: parseInt(dia), volume }));
    if (entries.length === 0) return { maior: null, menor: null };
    const maior = entries.reduce((max, p) => p.volume > max.volume ? p : max);
    const menor = entries.reduce((min, p) => p.volume < min.volume ? p : min);
    return { maior, menor };
  };

  const getTopClientes = () => {
    const producoesFiltradas = aplicarFiltrosDashboard(producoes);
    const porCliente = {};
    producoesFiltradas.forEach(p => {
      porCliente[p.cliente] = (porCliente[p.cliente] || 0) + p.volume;
    });
    return Object.entries(porCliente)
      .map(([cliente, volume]) => ({ cliente, volume: parseFloat(volume.toFixed(2)) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  };

  const getParadasFiltradas = () => {
    return aplicarFiltrosParadas(paradas);
  };

  const getEstatisticasParadasPorQtd = () => {
    const paradasFiltradas = getParadasFiltradas();
    const stats = {};
    paradasFiltradas.forEach(p => {
      if (!stats[p.equipamento]) stats[p.equipamento] = { quantidade: 0, tempoTotal: 0 };
      stats[p.equipamento].quantidade++;
      stats[p.equipamento].tempoTotal += calcularTempoParada(p.horarioInicial, p.horarioFinal).totalMinutos;
    });
    return Object.entries(stats).map(([equipamento, data]) => ({
      equipamento,
      quantidade: data.quantidade,
      tempoTotal: data.tempoTotal,
      tempoFormatado: `${Math.floor(data.tempoTotal / 60)}h ${data.tempoTotal % 60}min`
    })).sort((a, b) => b.quantidade - a.quantidade);
  };

  const getEstatisticasParadasPorTempo = () => {
    const paradasFiltradas = getParadasFiltradas();
    const stats = {};
    paradasFiltradas.forEach(p => {
      if (!stats[p.equipamento]) stats[p.equipamento] = { quantidade: 0, tempoTotal: 0 };
      stats[p.equipamento].quantidade++;
      stats[p.equipamento].tempoTotal += calcularTempoParada(p.horarioInicial, p.horarioFinal).totalMinutos;
    });
    return Object.entries(stats).map(([equipamento, data]) => ({
      equipamento,
      quantidade: data.quantidade,
      tempoTotal: data.tempoTotal,
      tempoFormatado: `${Math.floor(data.tempoTotal / 60)}h ${data.tempoTotal % 60}min`
    })).sort((a, b) => b.tempoTotal - a.tempoTotal);
  };

  const getRankingHistoricoPorQtd = () => {
    const stats = {};
    paradas.forEach(p => {
      if (!stats[p.equipamento]) stats[p.equipamento] = { quantidade: 0, tempoTotal: 0 };
      stats[p.equipamento].quantidade++;
      stats[p.equipamento].tempoTotal += calcularTempoParada(p.horarioInicial, p.horarioFinal).totalMinutos;
    });
    return Object.entries(stats).map(([equipamento, data]) => ({
      equipamento,
      quantidade: data.quantidade,
      tempoTotal: data.tempoTotal,
      tempoFormatado: `${Math.floor(data.tempoTotal / 60)}h ${data.tempoTotal % 60}min`
    })).sort((a, b) => b.quantidade - a.quantidade);
  };

  const getRankingHistoricoPorTempo = () => {
    const stats = {};
    paradas.forEach(p => {
      if (!stats[p.equipamento]) stats[p.equipamento] = { quantidade: 0, tempoTotal: 0 };
      stats[p.equipamento].quantidade++;
      stats[p.equipamento].tempoTotal += calcularTempoParada(p.horarioInicial, p.horarioFinal).totalMinutos;
    });
    return Object.entries(stats).map(([equipamento, data]) => ({
      equipamento,
      quantidade: data.quantidade,
      tempoTotal: data.tempoTotal,
      tempoFormatado: `${Math.floor(data.tempoTotal / 60)}h ${data.tempoTotal % 60}min`
    })).sort((a, b) => b.tempoTotal - a.tempoTotal);
  };

  const getParadas30Dias = () => {
    const [anoInicio, mesInicio, diaInicio] = filtrosParadas.dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = filtrosParadas.dataFim.split('-').map(Number);
    const dataInicio = new Date(anoInicio, mesInicio - 1, diaInicio);
    const dataFim = new Date(anoFim, mesFim - 1, diaFim);
    const dias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;
    const dados = [];
    for (let i = 0; i < dias; i++) {
      const data = new Date(anoInicio, mesInicio - 1, diaInicio + i);
      const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      const paradasDia = aplicarFiltrosParadas(paradas.filter(p => p.data === dataStr));
      const result = { dia: data.getDate() + '/' + (data.getMonth() + 1) };
      LINHAS_PRODUCAO.forEach(linha => {
        result[linha] = paradasDia.filter(p => p.linhaProducao === linha).length;
      });
      dados.push(result);
    }
    return dados;
  };

  const getTempoParada30Dias = () => {
    const [anoInicio, mesInicio, diaInicio] = filtrosParadas.dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = filtrosParadas.dataFim.split('-').map(Number);
    const dataInicio = new Date(anoInicio, mesInicio - 1, diaInicio);
    const dataFim = new Date(anoFim, mesFim - 1, diaFim);
    const dias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1;
    const dados = [];
    for (let i = 0; i < dias; i++) {
      const data = new Date(anoInicio, mesInicio - 1, diaInicio + i);
      const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      const paradasDia = aplicarFiltrosParadas(paradas.filter(p => p.data === dataStr));
      const result = { dia: data.getDate() + '/' + (data.getMonth() + 1) };
      LINHAS_PRODUCAO.forEach(linha => {
        const tempo = paradasDia.filter(p => p.linhaProducao === linha)
          .reduce((sum, p) => sum + calcularTempoParada(p.horarioInicial, p.horarioFinal).totalMinutos, 0);
        result[linha] = Math.round(tempo / 60 * 10) / 10;
      });
      dados.push(result);
    }
    return dados;
  };

  const calcularImpactoParadas = () => {
    const paradasFiltradas = getParadasFiltradas();
    const tempoTotalMinutos = paradasFiltradas.reduce((sum, p) => {
      return sum + calcularTempoParada(p.horarioInicial, p.horarioFinal).totalMinutos;
    }, 0);
    const horasParadas = tempoTotalMinutos / 60;
    const diasParados = horasParadas / 10;
    const volumePerdido = diasParados * META_DIARIA;
    const impactoFinanceiro = volumePerdido * META_VALOR;
    return {
      tempoTotal: `${Math.floor(tempoTotalMinutos / 60)}h ${tempoTotalMinutos % 60}min`,
      diasParados: diasParados.toFixed(2),
      volumePerdido: volumePerdido.toFixed(2),
      impactoFinanceiro: impactoFinanceiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24 bg-gray-50"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const total = getTotalPorData(date);
      const totalParada = getTotalParadaPorData(date);
      const isToday = date.toDateString() === new Date().toDateString();
      days.push(
        <div
          key={day}
          onClick={() => { setSelectedDate(date); setShowModal(true); }}
          className={`h-20 sm:h-24 border border-gray-200 p-1 sm:p-2 cursor-pointer hover:bg-blue-50 transition ${isToday ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
        >
          <div className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
          {total > 0 && (
            <div className="mt-1 text-[10px] sm:text-xs bg-green-100 text-green-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded font-semibold">
              {total.toFixed(1)} m³
            </div>
          )}
          {totalParada > 0 && (
            <div className="mt-1 text-[10px] sm:text-xs bg-red-100 text-red-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded font-semibold">
              {Math.floor(totalParada / 60)}h {totalParada % 60}m
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-xl">Carregando...</div></div>;

  const stats = getEstatisticasSerraria();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-6 shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold">Controle de Produção - Serraria</h1>
        <p className="text-blue-100 mt-1 text-sm sm:text-base">Sistema de gerenciamento com Firebase</p>
      </div>

      <div className="bg-white shadow-sm border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1">
            {[
              { id: 'calendar', icon: Calendar, label: 'Calendário' },
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'paradas', icon: AlertTriangle, label: 'Paradas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {activeTab === 'calendar' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <button onClick={() => { setEditingItem(null); setShowForm(!showForm); }} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition shadow-md">
                <Plus size={20} /><span>Nova Produção</span>
              </button>
              <button onClick={() => { setEditingItem(null); setShowParadaForm(!showParadaForm); }} className="bg-red-600 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-700 transition shadow-md">
                <Plus size={20} /><span>Nova Parada</span>
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-xl font-bold mb-4">{editingItem ? 'Editar' : 'Registrar'} Produção</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linha de Produção</label>
                    <select value={formData.linhaProducao} onChange={(e) => setFormData({ ...formData, linhaProducao: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                      {LINHAS_PRODUCAO.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select value={formData.cliente} onChange={(e) => setFormData({ ...formData, cliente: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                      {CLIENTES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume (m³)</label>
                    <input type="number" step="0.01" value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row gap-2">
                    <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Salvar</button>
                    <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {showParadaForm && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6 border-2 border-red-200">
                <h2 className="text-xl font-bold mb-4 text-red-600">{editingItem ? 'Editar' : 'Registrar'} Parada</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input type="date" value={paradaData.data} onChange={(e) => setParadaData({ ...paradaData, data: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linha de Produção</label>
                    <select value={paradaData.linhaProducao} onChange={(e) => setParadaData({ ...paradaData, linhaProducao: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500">
                      {LINHAS_PRODUCAO.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário Inicial</label>
                    <input type="time" value={paradaData.horarioInicial} onChange={(e) => setParadaData({ ...paradaData, horarioInicial: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário Final</label>
                    <input type="time" value={paradaData.horarioFinal} onChange={(e) => setParadaData({ ...paradaData, horarioFinal: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
                    <select value={paradaData.equipamento} onChange={(e) => {
                      const newEquip = e.target.value;
                      setParadaData({ ...paradaData, equipamento: newEquip, motivo: EQUIPAMENTOS_MOTIVOS[newEquip][0] });
                    }} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500">
                      {Object.keys(EQUIPAMENTOS_MOTIVOS).map(eq => <option key={eq}>{eq}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                    <select value={paradaData.motivo} onChange={(e) => setParadaData({ ...paradaData, motivo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500">
                      {EQUIPAMENTOS_MOTIVOS[paradaData.equipamento].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                    <textarea value={paradaData.observacao} onChange={(e) => setParadaData({ ...paradaData, observacao: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500" rows="2" placeholder="Detalhes adicionais..."></textarea>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-2">
                    <button onClick={handleParadaSubmit} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">Salvar</button>
                    <button onClick={() => { setShowParadaForm(false); setEditingItem(null); }} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => {
                  if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                  else setCurrentMonth(currentMonth - 1);
                }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{monthNames[currentMonth]} {currentYear}</h2>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">Total: {getTotalMes().toFixed(2)} m³</div>
                </div>
                <button onClick={() => {
                  if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                  else setCurrentMonth(currentMonth + 1);
                }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronRight size={24} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2 text-xs sm:text-sm">{day}</div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Dashboard de Produção</h2>
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Filter size={18} />
                  <span>Filtros</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                    <input type="date" value={filtrosDashboard.dataInicio} onChange={(e) => setFiltrosDashboard({ ...filtrosDashboard, dataInicio: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                    <input type="date" value={filtrosDashboard.dataFim} onChange={(e) => setFiltrosDashboard({ ...filtrosDashboard, dataFim: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linha de Produção</label>
                    <select value={filtrosDashboard.linhaProducao} onChange={(e) => setFiltrosDashboard({ ...filtrosDashboard, linhaProducao: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Todas</option>
                      {LINHAS_PRODUCAO.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select value={filtrosDashboard.cliente} onChange={(e) => setFiltrosDashboard({ ...filtrosDashboard, cliente: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Todos</option>
                      {CLIENTES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats).map(([linha, stat]) => (
                <div key={linha} className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-sm text-gray-600">{linha}</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">{stat.total.toFixed(2)} m³</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.dias} dias de produção</div>
                  <div className="text-sm text-gray-500">Média: {stat.media.toFixed(2)} m³/dia</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const { maior, menor } = getMaiorMenorProducao();
                return (
                  <>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                      <div className="text-sm text-gray-600">Maior Produção</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        {maior ? maior.volume.toFixed(2) : '0.00'} m³
                      </div>
                      {maior && <div className="text-sm text-gray-500 mt-1">Dia {maior.dia}</div>}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                      <div className="text-sm text-gray-600">Menor Produção</div>
                      <div className="text-3xl font-bold text-orange-600 mt-2">
                        {menor ? menor.volume.toFixed(2) : '0.00'} m³
                      </div>
                      {menor && <div className="text-sm text-gray-500 mt-1">Dia {menor.dia}</div>}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4">Volume por Linha de Produção</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getProducoesPorLinha()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4">Top 5 Clientes</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={getTopClientes()} dataKey="volume" nameKey="cliente" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.cliente}: ${e.volume} m³`}>
                      {getTopClientes().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-2">
                <h3 className="text-lg font-bold mb-4">Gráfico de Produção</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getUltimos30Dias()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'paradas' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-red-600">Dashboard de Paradas</h2>
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Filter size={18} />
                  <span>Filtros</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                    <input type="date" value={filtrosParadas.dataInicio} onChange={(e) => setFiltrosParadas({ ...filtrosParadas, dataInicio: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                    <input type="date" value={filtrosParadas.dataFim} onChange={(e) => setFiltrosParadas({ ...filtrosParadas, dataFim: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linha de Produção</label>
                    <select value={filtrosParadas.linhaProducao} onChange={(e) => setFiltrosParadas({ ...filtrosParadas, linhaProducao: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Todas</option>
                      {LINHAS_PRODUCAO.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
                    <select value={filtrosParadas.equipamento} onChange={(e) => setFiltrosParadas({ ...filtrosParadas, equipamento: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Todos</option>
                      {Object.keys(EQUIPAMENTOS_MOTIVOS).map(eq => <option key={eq}>{eq}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const impacto = calcularImpactoParadas();
              return (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg shadow-lg border-2 border-red-200">
                  <h3 className="text-lg font-bold mb-4 text-red-700">Impacto das Paradas (Meta: {META_DIARIA}m³/dia - R${META_VALOR}/m³)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Tempo Total Parado</div>
                      <div className="text-2xl font-bold text-red-600">{impacto.tempoTotal}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Dias Parados (Equiv.)</div>
                      <div className="text-2xl font-bold text-orange-600">{impacto.diasParados} dias</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Volume Não Produzido</div>
                      <div className="text-2xl font-bold text-red-700">{impacto.volumePerdido} m³</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Impacto Financeiro</div>
                      <div className="text-2xl font-bold text-red-800">{impacto.impactoFinanceiro}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4">Lista de Paradas</h3>
              {getParadasFiltradas().length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma parada no período</p>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Linha</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Equipamento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Motivo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getParadasFiltradas().sort((a, b) => new Date(a.data) - new Date(b.data)).map(p => {
                        const tempo = calcularTempoParada(p.horarioInicial, p.horarioFinal);
                        return (
                          <tr key={p.id}>
                            <td className="px-4 py-2 text-sm">{new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-2 text-sm">{p.linhaProducao}</td>
                            <td className="px-4 py-2 text-sm">{p.equipamento}</td>
                            <td className="px-4 py-2 text-sm">{p.motivo}</td>
                            <td className="px-4 py-2 text-sm">{tempo.horas}h {tempo.minutos}min</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Ranking de Paradas</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Ordenar por:</span>
                  <select 
                    value={ordenacaoRanking} 
                    onChange={(e) => setOrdenacaoRanking(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                  >
                    <option value="quantidade">Quantidade de Paradas</option>
                    <option value="tempo">Tempo Parado</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {(ordenacaoRanking === 'quantidade' ? getEstatisticasParadasPorQtd() : getEstatisticasParadasPorTempo()).slice(0, 10).map((stat, index) => (
                  <div key={stat.equipamento} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <div className="font-semibold">{stat.equipamento}</div>
                        <div className="text-sm text-gray-600">{stat.quantidade} paradas</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-red-600">{stat.tempoFormatado}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Ranking Histórico de Paradas</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Ordenar por:</span>
                  <select 
                    value={ordenacaoHistorico} 
                    onChange={(e) => setOrdenacaoHistorico(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                  >
                    <option value="quantidade">Quantidade de Paradas</option>
                    <option value="tempo">Tempo Parado</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {(ordenacaoHistorico === 'quantidade' ? getRankingHistoricoPorQtd() : getRankingHistoricoPorTempo()).slice(0, 10).map((stat, index) => (
                  <div key={stat.equipamento} className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <div className="font-semibold">{stat.equipamento}</div>
                        <div className="text-sm text-gray-600">{stat.quantidade} paradas totais</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-red-600">{stat.tempoFormatado}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4">Gráfico Quantidade de Paradas</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getParadas30Dias()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {LINHAS_PRODUCAO.map((linha, idx) => (
                      <Bar key={linha} dataKey={linha} name={linha} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4">Gráfico Tempo Total Parado</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getTempoParada30Dias()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis tickFormatter={(value) => {
                      const h = Math.floor(value);
                      const m = Math.round((value - h) * 60);
                      return `${h}:${m.toString().padStart(2, '0')}`;
                    }} />
                    <Tooltip formatter={(value, name) => {
                      const h = Math.floor(value);
                      const m = Math.round((value - h) * 60);
                      return [`${h}h ${m}min`, name];
                    }} />
                    <Legend />
                    {LINHAS_PRODUCAO.map((linha, idx) => (
                      <Bar key={linha} dataKey={linha} name={linha} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(80vh - 88px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Produzido</div>
                  <div className="text-3xl font-bold text-blue-600">{getTotalPorData(selectedDate).toFixed(2)} m³</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Parado</div>
                  <div className="text-3xl font-bold text-red-600">
                    {(() => {
                      const totalMin = getTotalParadaPorData(selectedDate);
                      const horas = Math.floor(totalMin / 60);
                      const minutos = totalMin % 60;
                      return `${horas}h ${minutos}min`;
                    })()}
                  </div>
                </div>
              </div>

              {getProducoesPorData(selectedDate).length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma produção</p>
              ) : (
                <div className="space-y-3 mb-6">
                  <h3 className="font-bold text-lg">Produções</h3>
                  {getProducoesPorData(selectedDate).map(prod => (
                    <div key={prod.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-800">{prod.cliente}</div>
                        <div className="text-sm text-gray-600">{prod.linhaProducao}</div>
                        <div className="text-lg font-bold text-blue-600 mt-1">{prod.volume.toFixed(2)} m³</div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => { editProducao(prod); setShowModal(false); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => deleteProducao(prod.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {getParadasPorData(selectedDate).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-red-600">Paradas</h3>
                  {getParadasPorData(selectedDate).map(parada => {
                    const tempo = calcularTempoParada(parada.horarioInicial, parada.horarioFinal);
                    return (
                      <div key={parada.id} className="bg-red-50 p-4 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-800">{parada.equipamento}</div>
                          <div className="text-sm text-gray-600">{parada.motivo}</div>
                          <div className="text-sm text-gray-600">{parada.linhaProducao}</div>
                          {parada.observacao && <div className="text-sm text-gray-500 italic mt-1">{parada.observacao}</div>}
                          <div className="text-sm font-bold text-red-600 mt-1">{parada.horarioInicial} - {parada.horarioFinal} ({tempo.horas}h {tempo.minutos}min)</div>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => { editParada(parada); setShowModal(false); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit2 size={20} />
                          </button>
                          <button onClick={() => deleteParada(parada.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
