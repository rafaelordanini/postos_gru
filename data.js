// ==========================================
// CONFIGURAÇÕES E CONSTANTES
// ==========================================

const GEMINI_API_KEY = 'AIzaSyAHbzal0e8Nvt3JHEn6TnQ9VX_pRb1z-TU';

// Sede da Câmara Municipal de Guarulhos
const SEDE_CAMARA = {
    lat: -23.4538,
    lng: -46.5333,
    endereco: 'Av. Monteiro Lobato, 734 - Macedo, Guarulhos - SP'
};

// URLs das APIs
const API_POSTOS_URL = './postos.json';
const API_PRECOS_URL = './precos-postos.json';

// Dados globais
let postosData = [];
let abastecimentosData = [];
let anpData = {
    gasolinaComum: 6.06,
    etanol: 3.97,
    dataAtualizacao: null
};

// ==========================================
// COORDENADAS DOS BAIRROS DE GUARULHOS
// ==========================================

const coordenadasBairros = {
    'centro': { lat: -23.4538, lng: -46.5333 },
    'aeroporto': { lat: -23.4356, lng: -46.4731 },
    'aeroporto internacional de guarulhos': { lat: -23.4356, lng: -46.4731 },
    'aeroporto de guarulhos': { lat: -23.4356, lng: -46.4731 },
    'cumbica': { lat: -23.4400, lng: -46.4800 },
    'cidade industrial satelite': { lat: -23.4650, lng: -46.4950 },
    'cidade industrial satélite de são paulo': { lat: -23.4650, lng: -46.4950 },
    'cidade industrial satélite': { lat: -23.4650, lng: -46.4950 },
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
// STORAGE KEYS
// ==========================================

const STORAGE_KEYS = {
    POSTOS: 'cmg_postos_data',
    ABASTECIMENTOS: 'cmg_abastecimentos_data',
    LAST_UPDATE: 'cmg_last_update',
    ANP_DATA: 'cmg_anp_data'
};

// ==========================================
// FUNÇÕES DE CARREGAMENTO
// ==========================================

async function carregarDadosANP() {
    console.log('🔄 Carregando dados ANP...');
    
    try {
        // Tentar carregar do localStorage primeiro
        const cached = localStorage.getItem(STORAGE_KEYS.ANP_DATA);
        if (cached) {
            const parsed = JSON.parse(cached);
            // Verificar se tem menos de 24h
            const cacheTime = new Date(parsed.dataAtualizacao);
            const now = new Date();
            const diffHours = (now - cacheTime) / (1000 * 60 * 60);
            
            if (diffHours < 24) {
                anpData = parsed;
                console.log('✅ Dados ANP carregados do cache');
                return anpData;
            }
        }
    } catch (e) {
        console.warn('Cache ANP inválido');
    }
    
    // Valores padrão atualizados para Guarulhos (Janeiro 2026)
    anpData = {
        gasolinaComum: 6.06,
        etanol: 3.97,
        dataAtualizacao: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.ANP_DATA, JSON.stringify(anpData));
    console.log('✅ Dados ANP definidos:', anpData);
    
    return anpData;
}

async function carregarPostosDoJSON() {
    console.log('🔄 Carregando postos do JSON...');
    
    try {
        const response = await fetch(API_POSTOS_URL);
        if (!response.ok) throw new Error('Erro ao carregar JSON');
        
        const json = await response.json();
        
        if (json.success && json.data) {
            // Processar cada posto do JSON
            postosData = json.data.map((posto, index) => {
                const bairro = posto.endereco?.bairro || 'Centro';
                const coords = obterCoordenadasPorBairro(bairro);
                
                return {
                    id: parseInt(posto.terminal) || (Date.now() + index),
                    terminal: posto.terminal,
                    nomeFantasia: posto.nomeFantasia || 'Posto',
                    razaoSocial: posto.razaoSocial,
                    cnpj: posto.cnpj,
                    telefone: posto.contato?.telefone || '',
                    email: posto.contato?.email || '',
                    endereco: {
                        logradouro: `${posto.endereco?.logradouro || ''} ${posto.endereco?.rua || ''}`.trim(),
                        numero: posto.endereco?.numero || 'S/N',
                        bairro: bairro,
                        cidade: posto.endereco?.cidade || 'Guarulhos',
                        estado: posto.endereco?.uf || 'SP',
                        cep: posto.endereco?.cep || ''
                    },
                    coordenadas: coords ? {
                        lat: coords.lat + (Math.random() - 0.5) * 0.008,
                        lng: coords.lng + (Math.random() - 0.5) * 0.008
                    } : {
                        lat: -23.4538 + (Math.random() - 0.5) * 0.04,
                        lng: -46.5333 + (Math.random() - 0.5) * 0.04
                    },
                    precos: {
                        gasolina: 0,
                        etanol: 0
                    },
                    bandeira: posto.bandeira || 'BANDEIRA BRANCA',
                    horarioFuncionamento: posto.horarioFuncionamento,
                    is24h: verificar24h(posto.horarioFuncionamento),
                    ultimaTransacao: posto.ultimaTransacao,
                    ativo: posto.ativo !== false,
                    ultimaAtualizacaoPreco: null
                };
            });
            
            console.log(`✅ ${postosData.length} postos carregados do JSON`);
            
            // Carregar preços
            await carregarPrecosDoJSON();
            
            // Salvar no localStorage
            salvarPostos(postosData);
            
            return postosData;
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar JSON, tentando localStorage:', error);
    }
    
    // Fallback para localStorage
    return carregarPostos();
}

async function carregarPrecosDoJSON() {
    console.log('🔄 Carregando preços do JSON...');
    
    try {
        const response = await fetch(API_PRECOS_URL);
        if (!response.ok) throw new Error('Erro ao carregar preços');
        
        const json = await response.json();
        
        if (json.success && json.data) {
            // Mapear preços para os postos
            json.data.forEach(precoInfo => {
                const posto = postosData.find(p => p.terminal === precoInfo.terminal);
                if (posto && precoInfo.precos) {
                    posto.precos = {
                        gasolina: precoInfo.precos.gasolina || 0,
                        etanol: precoInfo.precos.etanol || 0
                    };
                    posto.ultimaAtualizacaoPreco = precoInfo.dataUltimoAbastecimento;
                }
            });
            
            console.log('✅ Preços carregados e mapeados');
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar preços:', error);
    }
}

function verificar24h(horario) {
    if (!horario) return false;
    const h = horario.toLowerCase();
    return h.includes('24') || h.includes('24h') || h.includes('24 horas');
}

// ==========================================
// FUNÇÕES DE STORAGE
// ==========================================

function carregarPostos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.POSTOS);
        if (saved) {
            postosData = JSON.parse(saved);
            console.log(`✅ ${postosData.length} postos carregados do localStorage`);
            return postosData;
        }
    } catch (e) {
        console.error('Erro ao carregar postos:', e);
    }
    
    postosData = [];
    return postosData;
}

function salvarPostos(postos) {
    try {
        postosData = postos;
        localStorage.setItem(STORAGE_KEYS.POSTOS, JSON.stringify(postos));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
        console.log(`✅ ${postos.length} postos salvos`);
        return true;
    } catch (e) {
        console.error('Erro ao salvar postos:', e);
        return false;
    }
}

function carregarAbastecimentos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.ABASTECIMENTOS);
        if (saved) {
            abastecimentosData = JSON.parse(saved);
            return abastecimentosData;
        }
    } catch (e) {
        console.error('Erro ao carregar abastecimentos:', e);
    }
    
    abastecimentosData = [];
    return abastecimentosData;
}

function salvarAbastecimentos(dados) {
    try {
        abastecimentosData = dados;
        localStorage.setItem(STORAGE_KEYS.ABASTECIMENTOS, JSON.stringify(dados));
        console.log(`✅ ${dados.length} abastecimentos salvos`);
        return true;
    } catch (e) {
        console.error('Erro ao salvar abastecimentos:', e);
        return false;
    }
}

function getUltimaAtualizacao() {
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
}

function limparTodosDados() {
    localStorage.removeItem(STORAGE_KEYS.POSTOS);
    localStorage.removeItem(STORAGE_KEYS.ABASTECIMENTOS);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
    postosData = [];
    abastecimentosData = [];
    console.log('🗑️ Todos os dados foram limpos');
}

// ==========================================
// ATUALIZAÇÃO DE PREÇOS
// ==========================================

function atualizarPrecoPosto(postoId, combustivel, novoPreco) {
    const posto = postosData.find(p => p.id === postoId || p.id === parseInt(postoId));
    if (!posto) {
        console.warn('Posto não encontrado:', postoId);
        return false;
    }
    
    posto.precos[combustivel] = parseFloat(novoPreco);
    posto.ultimaAtualizacaoPreco = new Date().toISOString();
    
    salvarPostos(postosData);
    console.log(`✅ Preço atualizado: ${posto.nomeFantasia} - ${combustivel}: R$ ${novoPreco}`);
    return true;
}

// ==========================================
// GEOCODIFICAÇÃO
// ==========================================

function obterCoordenadasPorBairro(bairro) {
    if (!bairro) return null;
    
    const bairroNormalizado = bairro.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    
    for (const [key, coords] of Object.entries(coordenadasBairros)) {
        const keyNormalizado = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (bairroNormalizado.includes(keyNormalizado) || keyNormalizado.includes(bairroNormalizado)) {
            return coords;
        }
    }
    
    return null;
}

function obterCoordenadasPorEndereco(endereco) {
    if (endereco && endereco.bairro) {
        const coords = obterCoordenadasPorBairro(endereco.bairro);
        if (coords) {
            return {
                lat: coords.lat + (Math.random() - 0.5) * 0.008,
                lng: coords.lng + (Math.random() - 0.5) * 0.008
            };
        }
    }
    
    return {
        lat: -23.4538 + (Math.random() - 0.5) * 0.04,
        lng: -46.5333 + (Math.random() - 0.5) * 0.04
    };
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
    return postosData.find(p => p.id === parseInt(id) || p.id === id);
}

function getBairros() {
    const bairros = [...new Set(postosData.map(p => p.endereco?.bairro).filter(b => b))];
    return bairros.sort();
}

function filterPostos(filtros) {
    return postosData.filter(posto => {
        if (filtros.busca) {
            const busca = filtros.busca.toLowerCase();
            const matchNome = posto.nomeFantasia?.toLowerCase().includes(busca);
            const matchEndereco = posto.endereco?.logradouro?.toLowerCase().includes(busca);
            const matchBairro = posto.endereco?.bairro?.toLowerCase().includes(busca);
            if (!matchNome && !matchEndereco && !matchBairro) return false;
        }
        
        if (filtros.bairro && filtros.bairro !== 'all' && filtros.bairro !== '') {
            if (posto.endereco?.bairro !== filtros.bairro) return false;
        }
        
        return true;
    });
}

function sortPostos(postos, criterio) {
    const sorted = [...postos];
    
    switch(criterio) {
        case 'name':
            return sorted.sort((a, b) => (a.nomeFantasia || '').localeCompare(b.nomeFantasia || ''));
        case 'price_gas':
            return sorted.sort((a, b) => (a.precos?.gasolina || 999) - (b.precos?.gasolina || 999));
        case 'price_eth':
            return sorted.sort((a, b) => (a.precos?.etanol || 999) - (b.precos?.etanol || 999));
        case 'distance':
            return sortByDistanciaFromSede(sorted);
        default:
            return sorted;
    }
}

function sortByDistanciaFromSede(postos) {
    return [...postos].sort((a, b) => {
        const distA = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, a.coordenadas?.lat || 0, a.coordenadas?.lng || 0);
        const distB = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, b.coordenadas?.lat || 0, b.coordenadas?.lng || 0);
        return distA - distB;
    });
}

function getEstatisticas() {
    const postosComGasolina = postosData.filter(p => p.precos?.gasolina > 0);
    const postosComEtanol = postosData.filter(p => p.precos?.etanol > 0);
    
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
        postosComPreco: postosComGasolina.length,
        maisBaratoGasolina,
        maisCaroGasolina,
        maisBaratoEtanol,
        maisCaroEtanol
    };
}

function formatarPreco(valor) {
    if (!valor || valor <= 0) return 'R$ --';
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
    if (!dataISO) return '--';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

function getBandeiraCor(bandeira) {
    if (!bandeira) return '#6B7280';
    
    const b = bandeira.toUpperCase();
    const cores = {
        'PETROBRAS': '#009639',
        'BR': '#009639',
        'IPIRANGA': '#FF6B00',
        'SHELL': '#FFCD00',
        'RAIZEN': '#E30613',
        'RAÍZEN': '#E30613',
        'ALE': '#0066CC',
        'BANDEIRA BRANCA': '#6B7280',
        'N/A': '#6B7280'
    };
    
    return cores[b] || '#6B7280';
}

// ==========================================
// EXPORTAR PARA GLOBAL
// ==========================================

window.postosData = postosData;
window.abastecimentosData = abastecimentosData;
window.anpData = anpData;
window.SEDE_CAMARA = SEDE_CAMARA;
window.coordenadasBairros = coordenadasBairros;

window.carregarDadosANP = carregarDadosANP;
window.carregarPostosDoJSON = carregarPostosDoJSON;
window.carregarPostos = carregarPostos;
window.salvarPostos = salvarPostos;
window.carregarAbastecimentos = carregarAbastecimentos;
window.salvarAbastecimentos = salvarAbastecimentos;
window.getUltimaAtualizacao = getUltimaAtualizacao;
window.limparTodosDados = limparTodosDados;
window.atualizarPrecoPosto = atualizarPrecoPosto;
window.obterCoordenadasPorBairro = obterCoordenadasPorBairro;
window.obterCoordenadasPorEndereco = obterCoordenadasPorEndereco;
window.calcularDistancia = calcularDistancia;
window.getPostoById = getPostoById;
window.getBairros = getBairros;
window.filterPostos = filterPostos;
window.sortPostos = sortPostos;
window.getEstatisticas = getEstatisticas;
window.formatarPreco = formatarPreco;
window.formatarData = formatarData;
window.getBandeiraCor = getBandeiraCor;
