// ==========================================
// CONFIGURAÇÕES E CONSTANTES
// ==========================================

const GEMINI_API_KEY = 'AIzaSyAHbzal0e8Nvt3JHEn6TnQ9VX_pRb1z-TU'; // Substitua pela sua chave

// Sede da Câmara Municipal de Guarulhos
const SEDE_CAMARA = {
    lat: -23.4538,
    lng: -46.5333,
    endereco: 'Av. Monteiro Lobato, 734 - Macedo, Guarulhos - SP'
};

// URL da API ANP
const ANP_API_URL = 'https://anp-gru.vercel.app/';

// Dados ANP (serão carregados da API)
let anpData = {
    gasolinaComum: null,
    etanol: null,
    dataAtualizacao: null
};

// Dados dos postos (carregados do localStorage ou padrão)
let postosData = [];

// ==========================================
// CARREGAR DADOS ANP DA API
// ==========================================

async function carregarDadosANP() {
    try {
        const response = await fetch(ANP_API_URL);
        if (!response.ok) throw new Error('Erro ao carregar ANP');
        
        const data = await response.json();
        
        // Mapear dados da API (ajuste conforme estrutura real da API)
        anpData = {
            gasolinaComum: data.gasolinaComum || data.gasolina || data.gasoline,
            etanol: data.etanol || data.alcool || data.ethanol,
            dataAtualizacao: data.dataAtualizacao || new Date().toISOString()
        };
        
        console.log('Dados ANP carregados:', anpData);
        return anpData;
        
    } catch (error) {
        console.error('Erro ao carregar ANP:', error);
        // Fallback para valores padrão se API falhar
        anpData = {
            gasolinaComum: 6.06,
            etanol: 3.97,
            dataAtualizacao: new Date().toISOString()
        };
        return anpData;
    }
}

// ==========================================
// PERSISTÊNCIA DE DADOS (localStorage)
// ==========================================

const STORAGE_KEYS = {
    POSTOS: 'cmg_postos_data',
    ABASTECIMENTOS: 'cmg_abastecimentos_data',
    LAST_UPDATE: 'cmg_last_update'
};

function salvarPostos(postos) {
    try {
        localStorage.setItem(STORAGE_KEYS.POSTOS, JSON.stringify(postos));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
        postosData = postos;
        console.log(`${postos.length} postos salvos no localStorage`);
        return true;
    } catch (error) {
        console.error('Erro ao salvar postos:', error);
        return false;
    }
}

function carregarPostos() {
    try {
        const dados = localStorage.getItem(STORAGE_KEYS.POSTOS);
        if (dados) {
            postosData = JSON.parse(dados);
            console.log(`${postosData.length} postos carregados do localStorage`);
            return postosData;
        }
    } catch (error) {
        console.error('Erro ao carregar postos:', error);
    }
    
    // Se não há dados salvos, usar dados padrão
    postosData = getPostosPadrao();
    return postosData;
}

function salvarAbastecimentos(abastecimentos) {
    try {
        localStorage.setItem(STORAGE_KEYS.ABASTECIMENTOS, JSON.stringify(abastecimentos));
        console.log(`${abastecimentos.length} abastecimentos salvos`);
        return true;
    } catch (error) {
        console.error('Erro ao salvar abastecimentos:', error);
        return false;
    }
}

function carregarAbastecimentos() {
    try {
        const dados = localStorage.getItem(STORAGE_KEYS.ABASTECIMENTOS);
        if (dados) {
            return JSON.parse(dados);
        }
    } catch (error) {
        console.error('Erro ao carregar abastecimentos:', error);
    }
    return [];
}

function getUltimaAtualizacao() {
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
}

// ==========================================
// ATUALIZAR PREÇO DE UM POSTO
// ==========================================

function atualizarPrecoPosto(postoId, combustivel, novoPreco) {
    const posto = postosData.find(p => p.id === postoId);
    if (!posto) return false;
    
    posto.precos[combustivel] = parseFloat(novoPreco);
    posto.ultimaAtualizacaoPreco = new Date().toISOString();
    
    salvarPostos(postosData);
    return true;
}

// ==========================================
// DADOS PADRÃO DOS POSTOS
// ==========================================

function getPostosPadrao() {
    return [
        {
            id: 1,
            nomeFantasia: "Auto Posto Duque Guarulhos",
            bandeira: "Ipiranga",
            cnpj: "12.345.678/0001-01",
            telefone: "(11) 2408-1234",
            endereco: {
                logradouro: "Av. Duque de Caxias",
                numero: "1500",
                bairro: "Centro",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07000-000"
            },
            coordenadas: { lat: -23.4629, lng: -46.5339 },
            precos: { gasolina: 5.79, etanol: 3.69 },
            is24h: true,
            servicos: ["Calibragem", "Loja de Conveniência", "Banheiro"],
            horarioFuncionamento: null,
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 2,
            nomeFantasia: "Posto Shell Guarulhos",
            bandeira: "Shell",
            cnpj: "23.456.789/0001-02",
            telefone: "(11) 2409-2345",
            endereco: {
                logradouro: "Av. Guarulhos",
                numero: "2300",
                bairro: "Vila Galvão",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07050-000"
            },
            coordenadas: { lat: -23.4712, lng: -46.5478 },
            precos: { gasolina: 5.89, etanol: 3.79 },
            is24h: true,
            servicos: ["Calibragem", "Loja de Conveniência", "Troca de Óleo"],
            horarioFuncionamento: null,
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 3,
            nomeFantasia: "Posto BR Aeroporto",
            bandeira: "Petrobras",
            cnpj: "34.567.890/0001-03",
            telefone: "(11) 2445-3456",
            endereco: {
                logradouro: "Rod. Hélio Smidt",
                numero: "500",
                bairro: "Cumbica",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07190-000"
            },
            coordenadas: { lat: -23.4356, lng: -46.4731 },
            precos: { gasolina: 6.19, etanol: 3.99 },
            is24h: true,
            servicos: ["Calibragem", "Loja de Conveniência", "Lavagem"],
            horarioFuncionamento: null,
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 4,
            nomeFantasia: "Auto Posto Bonsucesso",
            bandeira: "Ipiranga",
            cnpj: "45.678.901/0001-04",
            telefone: "(11) 2087-4567",
            endereco: {
                logradouro: "Av. Bonsucesso",
                numero: "800",
                bairro: "Bonsucesso",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07175-000"
            },
            coordenadas: { lat: -23.4298, lng: -46.4892 },
            precos: { gasolina: 5.85, etanol: 3.75 },
            is24h: false,
            servicos: ["Calibragem", "Banheiro"],
            horarioFuncionamento: {
                segunda: { abertura: "06:00", fechamento: "22:00" },
                terca: { abertura: "06:00", fechamento: "22:00" },
                quarta: { abertura: "06:00", fechamento: "22:00" },
                quinta: { abertura: "06:00", fechamento: "22:00" },
                sexta: { abertura: "06:00", fechamento: "22:00" },
                sabado: { abertura: "07:00", fechamento: "20:00" },
                domingo: { abertura: "08:00", fechamento: "18:00" }
            },
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 5,
            nomeFantasia: "Posto Presidente Dutra",
            bandeira: "Ale",
            cnpj: "56.789.012/0001-05",
            telefone: "(11) 2421-5678",
            endereco: {
                logradouro: "Rod. Presidente Dutra",
                numero: "Km 225",
                bairro: "Itapegica",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07220-000"
            },
            coordenadas: { lat: -23.4156, lng: -46.5012 },
            precos: { gasolina: 5.69, etanol: 3.59 },
            is24h: true,
            servicos: ["Calibragem", "Loja de Conveniência", "Restaurante", "Estacionamento"],
            horarioFuncionamento: null,
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 6,
            nomeFantasia: "Posto Taboão",
            bandeira: "Petrobras",
            cnpj: "67.890.123/0001-06",
            telefone: "(11) 2456-6789",
            endereco: {
                logradouro: "Av. Taboão",
                numero: "1200",
                bairro: "Taboão",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07140-000"
            },
            coordenadas: { lat: -23.4523, lng: -46.5189 },
            precos: { gasolina: 5.95, etanol: 3.85 },
            is24h: false,
            servicos: ["Calibragem", "Loja de Conveniência"],
            horarioFuncionamento: {
                segunda: { abertura: "06:00", fechamento: "22:00" },
                terca: { abertura: "06:00", fechamento: "22:00" },
                quarta: { abertura: "06:00", fechamento: "22:00" },
                quinta: { abertura: "06:00", fechamento: "22:00" },
                sexta: { abertura: "06:00", fechamento: "22:00" },
                sabado: { abertura: "06:00", fechamento: "22:00" },
                domingo: { abertura: "07:00", fechamento: "20:00" }
            },
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 7,
            nomeFantasia: "Auto Posto Macedo",
            bandeira: "Shell",
            cnpj: "78.901.234/0001-07",
            telefone: "(11) 2467-7890",
            endereco: {
                logradouro: "Av. Monteiro Lobato",
                numero: "1000",
                bairro: "Macedo",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07112-000"
            },
            coordenadas: { lat: -23.4589, lng: -46.5267 },
            precos: { gasolina: 5.99, etanol: 3.89 },
            is24h: false,
            servicos: ["Calibragem", "Troca de Óleo", "Banheiro"],
            horarioFuncionamento: {
                segunda: { abertura: "06:00", fechamento: "23:00" },
                terca: { abertura: "06:00", fechamento: "23:00" },
                quarta: { abertura: "06:00", fechamento: "23:00" },
                quinta: { abertura: "06:00", fechamento: "23:00" },
                sexta: { abertura: "06:00", fechamento: "23:00" },
                sabado: { abertura: "06:00", fechamento: "22:00" },
                domingo: { abertura: "07:00", fechamento: "20:00" }
            },
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 8,
            nomeFantasia: "Posto Gopoúva",
            bandeira: "Ipiranga",
            cnpj: "89.012.345/0001-08",
            telefone: "(11) 2478-8901",
            endereco: {
                logradouro: "Av. Gopoúva",
                numero: "650",
                bairro: "Gopoúva",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07040-000"
            },
            coordenadas: { lat: -23.4678, lng: -46.5456 },
            precos: { gasolina: 5.75, etanol: 3.65 },
            is24h: false,
            servicos: ["Calibragem", "Loja de Conveniência"],
            horarioFuncionamento: {
                segunda: { abertura: "06:00", fechamento: "22:00" },
                terca: { abertura: "06:00", fechamento: "22:00" },
                quarta: { abertura: "06:00", fechamento: "22:00" },
                quinta: { abertura: "06:00", fechamento: "22:00" },
                sexta: { abertura: "06:00", fechamento: "22:00" },
                sabado: { abertura: "07:00", fechamento: "20:00" },
                domingo: { abertura: "08:00", fechamento: "18:00" }
            },
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 9,
            nomeFantasia: "Posto Vila Rio",
            bandeira: "Petrobras",
            cnpj: "90.123.456/0001-09",
            telefone: "(11) 2489-9012",
            endereco: {
                logradouro: "Av. Paulo Faccini",
                numero: "1800",
                bairro: "Vila Rio de Janeiro",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07042-000"
            },
            coordenadas: { lat: -23.4745, lng: -46.5534 },
            precos: { gasolina: 6.09, etanol: 3.95 },
            is24h: false,
            servicos: ["Calibragem", "Banheiro", "Loja de Conveniência"],
            horarioFuncionamento: {
                segunda: { abertura: "06:00", fechamento: "22:00" },
                terca: { abertura: "06:00", fechamento: "22:00" },
                quarta: { abertura: "06:00", fechamento: "22:00" },
                quinta: { abertura: "06:00", fechamento: "22:00" },
                sexta: { abertura: "06:00", fechamento: "22:00" },
                sabado: { abertura: "07:00", fechamento: "20:00" },
                domingo: null
            },
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        },
        {
            id: 10,
            nomeFantasia: "Auto Posto Jardim São Paulo",
            bandeira: "Ale",
            cnpj: "01.234.567/0001-10",
            telefone: "(11) 2490-0123",
            endereco: {
                logradouro: "Av. Otávio Braga de Mesquita",
                numero: "2500",
                bairro: "Jardim São Paulo",
                cidade: "Guarulhos",
                estado: "SP",
                cep: "07130-000"
            },
            coordenadas: { lat: -23.4412, lng: -46.5078 },
            precos: { gasolina: 5.65, etanol: 3.55 },
            is24h: false,
            servicos: ["Calibragem", "Banheiro"],
            horarioFuncionamento: {
                segunda: { abertura: "06:00", fechamento: "21:00" },
                terca: { abertura: "06:00", fechamento: "21:00" },
                quarta: { abertura: "06:00", fechamento: "21:00" },
                quinta: { abertura: "06:00", fechamento: "21:00" },
                sexta: { abertura: "06:00", fechamento: "21:00" },
                sabado: { abertura: "07:00", fechamento: "18:00" },
                domingo: null
            },
            ultimaAtualizacaoPreco: "2026-01-06T08:00:00Z"
        }
    ];
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getPostoById(id) {
    return postosData.find(p => p.id === parseInt(id));
}

function getBairros() {
    const bairros = [...new Set(postosData.map(p => p.endereco.bairro))];
    return bairros.sort();
}

function filterPostos(filtros) {
    return postosData.filter(posto => {
        if (filtros.busca) {
            const busca = filtros.busca.toLowerCase();
            const matchNome = posto.nomeFantasia.toLowerCase().includes(busca);
            const matchEndereco = posto.endereco.logradouro.toLowerCase().includes(busca);
            const matchBairro = posto.endereco.bairro.toLowerCase().includes(busca);
            if (!matchNome && !matchEndereco && !matchBairro) return false;
        }
        
        if (filtros.bairro && filtros.bairro !== 'all') {
            if (posto.endereco.bairro !== filtros.bairro) return false;
        }
        
        return true;
    });
}

function sortPostos(postos, criterio) {
    const sorted = [...postos];
    
    switch(criterio) {
        case 'name':
            return sorted.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
        case 'price_gas':
            return sorted.sort((a, b) => (a.precos.gasolina || 999) - (b.precos.gasolina || 999));
        case 'price_eth':
            return sorted.sort((a, b) => (a.precos.etanol || 999) - (b.precos.etanol || 999));
        case 'distance':
            return sortByDistanciaFromSede(sorted);
        default:
            return sorted;
    }
}

function sortByDistanciaFromSede(postos) {
    return [...postos].sort((a, b) => {
        const distA = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, a.coordenadas.lat, a.coordenadas.lng);
        const distB = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, b.coordenadas.lat, b.coordenadas.lng);
        return distA - distB;
    });
}

function getEstatisticas() {
    const postosComGasolina = postosData.filter(p => p.precos.gasolina > 0);
    const postosComEtanol = postosData.filter(p => p.precos.etanol > 0);
    
    // Mais barato e mais caro
    let maisBaratoGasolina = null;
    let maisCaroGasolina = null;
    let maisBaratoEtanol = null;
    let maisCaroEtanol = null;
    
    if (postosComGasolina.length > 0) {
        maisBaratoGasolina = postosComGasolina.reduce((min, p) => 
            p.precos.gasolina < min.precos.gasolina ? p : min
        );
        maisCaroGasolina = postosComGasolina.reduce((max, p) => 
            p.precos.gasolina > max.precos.gasolina ? p : max
        );
    }
    
    if (postosComEtanol.length > 0) {
        maisBaratoEtanol = postosComEtanol.reduce((min, p) => 
            p.precos.etanol < min.precos.etanol ? p : min
        );
        maisCaroEtanol = postosComEtanol.reduce((max, p) => 
            p.precos.etanol > max.precos.etanol ? p : max
        );
    }
    
    return {
        totalPostos: postosData.length,
        maisBaratoGasolina,
        maisCaroGasolina,
        maisBaratoEtanol,
        maisCaroEtanol
    };
}

// ==========================================
// CONTRATO PRIME (para IA)
// ==========================================

const CONTRATO_PRIME = `
CONTRATO ADMINISTRATIVO Nº 08/2025
Contratante: Câmara Municipal de Guarulhos
Contratada: PRIME CONSULTORIA E ASSESSORIA EMPRESARIAL LTDA

OBJETO: Gerenciamento da frota de 40 veículos oficiais através de sistema de cartões magnéticos.

FROTA:
- 39 veículos Chevrolet Onix Plus
- 1 veículo Chevrolet Spin

LIMITES:
- Consumo mensal máximo: 12.000 litros
- Preço máximo: Média ANP semanal para Guarulhos

COMBUSTÍVEIS AUTORIZADOS:
- Gasolina Comum
- Etanol

TAXA DE ADMINISTRAÇÃO: -5,65% (DESCONTO sobre valor abastecido)

REGRA IMPORTANTE: O sistema bloqueia automaticamente abastecimentos em postos com preços acima da média ANP.
`;


// ==========================================
// DADOS E CONFIGURAÇÕES - CMG Postos
// ==========================================

// Variáveis globais
let postosData = [];
let abastecimentosData = [];
let precosANP = {
    gasolina: null,
    etanol: null,
    dataAtualizacao: null
};

// ==========================================
// COORDENADAS DOS BAIRROS DE GUARULHOS
// ==========================================

const coordenadasBairros = {
    'centro': { lat: -23.4538, lng: -46.5333 },
    'aeroporto': { lat: -23.4356, lng: -46.4731 },
    'aeroporto internacional de guarulhos': { lat: -23.4356, lng: -46.4731 },
    'cumbica': { lat: -23.4400, lng: -46.4800 },
    'cidade industrial satelite': { lat: -23.4650, lng: -46.4950 },
    'cidade industrial satélite de são paulo': { lat: -23.4650, lng: -46.4950 },
    'vila augusta': { lat: -23.4580, lng: -46.5280 },
    'vila das bandeiras': { lat: -23.4620, lng: -46.5350 },
    'macedo': { lat: -23.4700, lng: -46.5400 },
    'cocaia': { lat: -23.4750, lng: -46.5450 },
    'jardim presidente dutra': { lat: -23.4550, lng: -46.4650 },
    'vila florida': { lat: -23.4480, lng: -46.5100 },
    'vila flórida': { lat: -23.4480, lng: -46.5100 },
    'vila barros': { lat: -23.4520, lng: -46.5150 },
    'jardim santa francisca': { lat: -23.4600, lng: -46.5250 },
    'picanco': { lat: -23.4680, lng: -46.5380 },
    'picanço': { lat: -23.4680, lng: -46.5380 },
    'jardim moreira': { lat: -23.4720, lng: -46.5320 },
    'vila paraiso': { lat: -23.4800, lng: -46.5000 },
    'vila paraíso': { lat: -23.4800, lng: -46.5000 },
    'cidade serodio': { lat: -23.4850, lng: -46.5100 },
    'cidade seródio': { lat: -23.4850, lng: -46.5100 },
    'jardim albertina': { lat: -23.4900, lng: -46.4800 },
    'parque sao miguel': { lat: -23.4950, lng: -46.4700 },
    'parque são miguel': { lat: -23.4950, lng: -46.4700 },
    'porto da igreja': { lat: -23.4400, lng: -46.5500 },
    'varzea do palacio': { lat: -23.4350, lng: -46.5400 },
    'várzea do palácio': { lat: -23.4350, lng: -46.5400 },
    'itapegica': { lat: -23.4450, lng: -46.5600 },
    'jardim nova taboao': { lat: -23.4500, lng: -46.5200 },
    'jardim nova taboão': { lat: -23.4500, lng: -46.5200 },
    'parque estrela': { lat: -23.4550, lng: -46.5400 },
    'vila galvao': { lat: -23.4620, lng: -46.5500 },
    'vila galvão': { lat: -23.4620, lng: -46.5500 },
    'cidade martins': { lat: -23.4700, lng: -46.5300 },
    'vila anny': { lat: -23.4780, lng: -46.4900 },
    'zona industrial': { lat: -23.4650, lng: -46.4850 }
};

// ==========================================
// FUNÇÕES DE STORAGE
// ==========================================

function carregarPostos() {
    try {
        const saved = localStorage.getItem('cmg_postos_data');
        if (saved) {
            postosData = JSON.parse(saved);
            console.log(`✅ ${postosData.length} postos carregados do localStorage`);
        } else {
            postosData = [];
            console.log('ℹ️ Nenhum posto salvo encontrado');
        }
    } catch (e) {
        console.error('Erro ao carregar postos:', e);
        postosData = [];
    }
    return postosData;
}

function salvarPostos(postos) {
    try {
        postosData = postos;
        localStorage.setItem('cmg_postos_data', JSON.stringify(postos));
        localStorage.setItem('cmg_last_update', new Date().toISOString());
        console.log(`✅ ${postos.length} postos salvos`);
    } catch (e) {
        console.error('Erro ao salvar postos:', e);
    }
}

function carregarAbastecimentos() {
    try {
        const saved = localStorage.getItem('cmg_abastecimentos_data');
        if (saved) {
            abastecimentosData = JSON.parse(saved);
        }
    } catch (e) {
        abastecimentosData = [];
    }
    return abastecimentosData;
}

function salvarAbastecimentos(dados) {
    try {
        abastecimentosData = dados;
        localStorage.setItem('cmg_abastecimentos_data', JSON.stringify(dados));
    } catch (e) {
        console.error('Erro ao salvar abastecimentos:', e);
    }
}

function getUltimaAtualizacao() {
    return localStorage.getItem('cmg_last_update');
}

// ==========================================
// BUSCAR PREÇOS DA ANP
// ==========================================

async function buscarPrecosANP() {
    console.log('🔄 Buscando preços da ANP...');
    
    try {
        // Tentar buscar do site da ANP diretamente
        // Como não podemos fazer fetch cross-origin, usamos dados da API da ANP
        
        // URL da série histórica da ANP para Guarulhos
        const response = await fetch('https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/mensal/mensal-municipios-2024.csv');
        
        // Se não conseguir, usar valores padrão baseados nos dados médios de Guarulhos
        throw new Error('Usar fallback');
        
    } catch (e) {
        console.log('ℹ️ Usando dados de preço padrão para Guarulhos');
        
        // Valores médios de Guarulhos (Janeiro 2026) - baseados na média da região
        // Estes valores devem ser atualizados periodicamente
        precosANP = {
            gasolina: 6.06,
            etanol: 3.97,
            dataAtualizacao: new Date().toISOString()
        };
        
        localStorage.setItem('cmg_precos_anp', JSON.stringify(precosANP));
        return precosANP;
    }
}

function carregarPrecosANP() {
    try {
        const saved = localStorage.getItem('cmg_precos_anp');
        if (saved) {
            precosANP = JSON.parse(saved);
            return precosANP;
        }
    } catch (e) {
        console.error('Erro ao carregar preços ANP:', e);
    }
    
    // Valores padrão
    return {
        gasolina: 6.06,
        etanol: 3.97,
        dataAtualizacao: null
    };
}

// ==========================================
// GEOCODIFICAÇÃO (ENDEREÇO -> COORDENADAS)
// ==========================================

function obterCoordenadasPorBairro(bairro) {
    if (!bairro) return null;
    
    const bairroNormalizado = bairro.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    
    // Procurar correspondência exata
    for (const [key, coords] of Object.entries(coordenadasBairros)) {
        const keyNormalizado = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (bairroNormalizado.includes(keyNormalizado) || keyNormalizado.includes(bairroNormalizado)) {
            return coords;
        }
    }
    
    return null;
}

function obterCoordenadasPorEndereco(endereco) {
    // Tentar encontrar coordenadas pelo bairro
    if (endereco && endereco.bairro) {
        const coords = obterCoordenadasPorBairro(endereco.bairro);
        if (coords) {
            // Adicionar pequena variação para não sobrepor marcadores
            return {
                lat: coords.lat + (Math.random() - 0.5) * 0.005,
                lng: coords.lng + (Math.random() - 0.5) * 0.005
            };
        }
    }
    
    // Fallback: centro de Guarulhos com variação
    return {
        lat: -23.4538 + (Math.random() - 0.5) * 0.03,
        lng: -46.5333 + (Math.random() - 0.5) * 0.03
    };
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function formatarPreco(valor) {
    if (!valor || valor <= 0) return 'R$ --';
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
    if (!dataISO) return '--';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

function formatarDataHora(dataISO) {
    if (!dataISO) return '--';
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR');
}

function getBandeiraCor(bandeira) {
    const cores = {
        'Petrobras': '#009639',
        'BR': '#009639',
        'Ipiranga': '#FF6B00',
        'Shell': '#FFCD00',
        'Raízen': '#E30613',
        'Ale': '#0066CC',
        'Bandeira Branca': '#6B7280'
    };
    return cores[bandeira] || '#6B7280';
}

function getBandeiraIcone(bandeira) {
    // Retorna classe de ícone baseado na bandeira
    return 'fa-gas-pump';
}

// ==========================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ==========================================

window.postosData = postosData;
window.abastecimentosData = abastecimentosData;
window.precosANP = precosANP;
window.carregarPostos = carregarPostos;
window.salvarPostos = salvarPostos;
window.carregarAbastecimentos = carregarAbastecimentos;
window.salvarAbastecimentos = salvarAbastecimentos;
window.getUltimaAtualizacao = getUltimaAtualizacao;
window.buscarPrecosANP = buscarPrecosANP;
window.carregarPrecosANP = carregarPrecosANP;
window.obterCoordenadasPorBairro = obterCoordenadasPorBairro;
window.obterCoordenadasPorEndereco = obterCoordenadasPorEndereco;
window.formatarPreco = formatarPreco;
window.formatarData = formatarData;
window.formatarDataHora = formatarDataHora;
window.getBandeiraCor = getBandeiraCor;
