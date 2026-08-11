export const navItems = [
  { label: 'Início', href: '/', icon: 'home' },
  { label: 'Meu Dia', href: '/operacoes', icon: 'calendar' },
  { label: 'Clientes', href: '/clientes', icon: 'briefcase' },
  { label: 'Campanhas', href: '/campanhas', icon: 'megaphone' },
  { label: 'Influenciadores', href: '/influenciadores', icon: 'users' },
  { label: 'Contratos', href: '/contratos', icon: 'file' },
  { label: 'Arquivos', href: '/arquivos', icon: 'folder' },
];

export const clients = [
  {
    id: 'vans',
    name: 'Vans',
    category: 'Moda & Streetwear',
    initials: 'VA',
    activeCampaigns: 2,
    influencers: 34,
    pending: 9,
    owner: 'Marina Souza',
    nextDeadline: '12 ago',
  },
  {
    id: 'marca-nova',
    name: 'Marca Nova',
    category: 'Beleza',
    initials: 'MN',
    activeCampaigns: 1,
    influencers: 18,
    pending: 4,
    owner: 'Rafael Lima',
    nextDeadline: '14 ago',
  },
  {
    id: 'studio-lab',
    name: 'Studio Lab',
    category: 'Lifestyle',
    initials: 'SL',
    activeCampaigns: 1,
    influencers: 11,
    pending: 2,
    owner: 'Camila Rocha',
    nextDeadline: '18 ago',
  },
];

export const campaigns = [
  {
    id: 'knu-skool-ago-26',
    client: 'Vans',
    name: 'Knu Skool — Agosto',
    status: 'Em execução',
    phase: 'Contratação e logística',
    progress: 58,
    mapped: 30,
    sent: 15,
    approved: 8,
    contracted: 7,
    published: 3,
    deadline: '28 ago',
  },
  {
    id: 'back-to-school-26',
    client: 'Vans',
    name: 'Back to School 2026',
    status: 'Planejamento',
    phase: 'Casting',
    progress: 24,
    mapped: 22,
    sent: 8,
    approved: 3,
    contracted: 0,
    published: 0,
    deadline: '12 set',
  },
  {
    id: 'launch-glow',
    client: 'Marca Nova',
    name: 'Glow Launch',
    status: 'Em execução',
    phase: 'Conteúdo',
    progress: 72,
    mapped: 18,
    sent: 12,
    approved: 9,
    contracted: 9,
    published: 5,
    deadline: '22 ago',
  },
];

export const influencers = [
  { id:'ana-silva', name:'Ana Silva', handle:'@anasilva', niche:'Streetwear', followers:'248k', city:'São Paulo, SP', status:'Em campanha', client:'Vans', campaign:'Knu Skool — Agosto', contract:'Assinado', score:'Preferido' },
  { id:'bruno-mota', name:'Bruno Mota', handle:'@brunomota', niche:'Skate', followers:'181k', city:'São Paulo, SP', status:'Aguardando contrato', client:'Vans', campaign:'Knu Skool — Agosto', contract:'Pendente', score:'Já aprovado' },
  { id:'carla-nunes', name:'Carla Nunes', handle:'@carlanunes', niche:'Lifestyle', followers:'392k', city:'Rio de Janeiro, RJ', status:'Aguardando cliente', client:'Vans', campaign:'Back to School 2026', contract:'—', score:'Novo' },
  { id:'diego-reis', name:'Diego Reis', handle:'@diegoreis', niche:'Moda', followers:'127k', city:'Curitiba, PR', status:'Em campanha', client:'Marca Nova', campaign:'Glow Launch', contract:'Assinado', score:'Bom histórico' },
  { id:'fernanda-lima', name:'Fernanda Lima', handle:'@fe.lima', niche:'Beauty', followers:'510k', city:'Campinas, SP', status:'Cadastro incompleto', client:'—', campaign:'—', contract:'—', score:'Novo' },
];

export const tasks = [
  { id:1, title:'Preparar contrato — Bruno Mota', type:'Contrato', client:'Vans', campaign:'Knu Skool — Agosto', assignee:'Pedro', due:'Hoje, 16:00', priority:'Alta', status:'Hoje', waitingFor:'Interno' },
  { id:2, title:'Cobrar aprovação do casting', type:'Aprovação', client:'Vans', campaign:'Back to School 2026', assignee:'Marina', due:'Atrasada 1 dia', priority:'Alta', status:'Atrasada', waitingFor:'Cliente' },
  { id:3, title:'Enviar produto — Ana Silva', type:'Logística', client:'Vans', campaign:'Knu Skool — Agosto', assignee:'Pedro', due:'Hoje, 17:30', priority:'Média', status:'Hoje', waitingFor:'Interno' },
  { id:4, title:'Revisar V1 — Diego Reis', type:'Conteúdo', client:'Marca Nova', campaign:'Glow Launch', assignee:'Camila', due:'Hoje, 18:00', priority:'Média', status:'Hoje', waitingFor:'Interno' },
  { id:5, title:'Solicitar NF — Ana Silva', type:'Financeiro', client:'Vans', campaign:'Knu Skool — Agosto', assignee:'Rafael', due:'Amanhã', priority:'Baixa', status:'Próxima', waitingFor:'Influenciador' },
  { id:6, title:'Revisar novo cadastro — Fernanda Lima', type:'Cadastro', client:'—', campaign:'—', assignee:'Pedro', due:'Hoje, 19:00', priority:'Média', status:'Hoje', waitingFor:'Interno' },
];

export const campaignCreators = [
  { name:'Ana Silva', handle:'@anasilva', stage:'Confirmado', contract:'Assinado', product:'Enviado', content:'V1 recebida', publication:'28 ago', fee:'R$ 8.500' },
  { name:'Bruno Mota', handle:'@brunomota', stage:'Aprovado', contract:'Pendente', product:'Aguardando', content:'Não iniciado', publication:'30 ago', fee:'R$ 6.000' },
  { name:'Luiza Torres', handle:'@luizatorres', stage:'Negociação', contract:'—', product:'—', content:'—', publication:'—', fee:'R$ 7.200' },
  { name:'Rafa Costa', handle:'@rafacosta', stage:'Enviado ao cliente', contract:'—', product:'—', content:'—', publication:'—', fee:'A definir' },
  { name:'Bia Martins', handle:'@biamartins', stage:'Reprovado', contract:'—', product:'—', content:'—', publication:'—', fee:'—' },
];
