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
const ANP_API_URL = 'https://anp-gru.vercel.app/';

// Dados globais
let postosData = [];
let abastecimentosData = [];
let anpData = {
    gasolinaComum: 6.02,
    etanol: 4.26,
    dataAtualizacao: null,
    semana: null,
    fonte: 'fallback'
};

// ==========================================
// COORDENADAS DOS BAIRROS DE GUARULHOS
// ==========================================

const coordenadasBairros = {
    'centro': { lat: -23.4538, lng: -46.5333 },
    'aeroporto': { lat: -23.4356, lng: -46.4731 },
    'cumbica': { lat: -23.4400, lng: -46.4800 },
    'cocaia': { lat: -23.4750, lng: -46.5450 },
    'vila barros': { lat: -23.4520, lng: -46.5150 },
    'vila augusta': { lat: -23.4580, lng: -46.5280 },
    'macedo': { lat: -23.4700, lng: -46.5400 },
    'jardim presidente dutra': { lat: -23.4550, lng: -46.4650 },
    'vila florida': { lat: -23.4480, lng: -46.5100 },
    'jardim santa francisca': { lat: -23.4600, lng: -46.5250 },
    'picanco': { lat: -23.4680, lng: -46.5380 },
    'picanço': { lat: -23.4680, lng: -46.5380 },
    'vila paraiso': { lat: -23.4800, lng: -46.5000 },
    'vila paraíso': { lat: -23.4800, lng: -46.5000 },
    'cidade serodio': { lat: -23.4850, lng: -46.5100 },
    'jardim albertina': { lat: -23.4900, lng: -46.4800 },
    'porto da igreja': { lat: -23.4400, lng: -46.5500 },
    'itapegica': { lat: -23.4450, lng: -46.5600 },
    'vila galvao': { lat: -23.4620, lng: -46.5500 },
    'vila galvão': { lat: -23.4620, lng: -46.5500 },
    'taboao': { lat: -23.4500, lng: -46.5200 },
    'taboão': { lat: -23.4500, lng: -46.5200 },
    'gopouva': { lat: -23.4650, lng: -46.5300 },
    'bom clima': { lat: -23.4420, lng: -46.5180 },
    'jardim zaira': { lat: -23.4380, lng: -46.5420 },
    'torres tibagy': { lat: -23.4550, lng: -46.5100 },
    'jardim sao joao': { lat: -23.4720, lng: -46.4950 },
    'jardim são joão': { lat: -23.4720, lng: -46.4950 },
    'cidade industrial satelite': { lat: -23.4650, lng: -46.4950 },
    'dutra': { lat: -23.4400, lng: -46.4600 },
    'presidente dutra': { lat: -23.4400, lng: -46.4600 },
    'guarulhos': { lat: -23.4538, lng: -46.5333 },
    'candeias': { lat: -23.4650, lng: -46.5100 },
    'tiradentes': { lat: -23.4700, lng: -46.5200 },
    'rotary': { lat: -23.4550, lng: -46.5300 },
    'santa helena': { lat: -23.4600, lng: -46.5050 }
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
// PROCESSAR CSV DE ABASTECIMENTOS
// ==========================================

function processarAbastecimentosCSV(csvContent) {
    console.log('📊 Iniciando processamento do CSV...');
    
    if (!csvContent || typeof csvContent !== 'string') {
        console.error('CSV vazio ou inválido');
        return [];
    }
    
    // Dividir em linhas
    const linhas = csvContent.split('\n');
    console.log(`📄 Total de linhas no CSV: ${linhas.length}`);
    
    const abastecimentos = [];
    
    // Encontrar linha de cabeçalho
    let headerIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(10, linhas.length); i++) {
        const linha = linhas[i];
        if (linha && (linha.includes('Data') && linha.includes('Nome_Posto')) || 
            (linha.includes('Data') && linha.includes('Combustivel'))) {
            headerIndex = i;
            headers = parseCSVLine(linha);
            console.log(`📋 Cabeçalho encontrado na linha ${i}:`, headers);
            break;
        }
    }
    
    if (headerIndex === -1) {
        // Tentar usar primeira linha com dados como cabeçalho
        for (let i = 0; i < Math.min(5, linhas.length); i++) {
            if (linhas[i] && linhas[i].includes(',') && !linhas[i].startsWith('SEP')) {
                headers = parseCSVLine(linhas[i]);
                if (headers.length > 5) {
                    headerIndex = i;
                    console.log(`📋 Usando linha ${i} como cabeçalho:`, headers);
                    break;
                }
            }
        }
    }
    
    if (headerIndex === -1 || headers.length === 0) {
        console.error('❌ Não foi possível encontrar o cabeçalho do CSV');
        return [];
    }
    
    // Normalizar headers para lowercase
    const headersLower = headers.map(h => h.toLowerCase().trim().replace(/["\s]/g, ''));
    console.log('Headers normalizados:', headersLower);
    
    // Mapear índices das colunas
    const colMap = {
        data: findColumnIndex(headersLower, ['data']),
        hora: findColumnIndex(headersLower, ['hora']),
        combustivel: findColumnIndex(headersLower, ['combustivel', 'combustível', 'tipo_combustivel']),
        qtde: findColumnIndex(headersLower, ['qtde_combustivel_abastecido', 'qtde', 'quantidade', 'litros']),
        valor: findColumnIndex(headersLower, ['valor_abastecimento', 'valor', 'valor_total']),
        cidade: findColumnIndex(headersLower, ['cidade_posto', 'cidade']),
        nomePosto: findColumnIndex(headersLower, ['nome_posto', 'posto', 'estabelecimento']),
        endereco: findColumnIndex(headersLower, ['endereco_posto', 'endereco', 'endereço']),
        placa: findColumnIndex(headersLower, ['placa']),
        condutor: findColumnIndex(headersLower, ['nome_condutor', 'condutor'])
    };
    
    console.log('🗺️ Mapeamento de colunas:', colMap);
    
    // Verificar colunas obrigatórias
    if (colMap.nomePosto === -1) {
        console.error('❌ Coluna Nome_Posto não encontrada');
        return [];
    }
    
    // Processar linhas de dados
    for (let i = headerIndex + 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha || linha.startsWith('SEP')) continue;
        
        try {
            const valores = parseCSVLine(linha);
            if (valores.length < 5) continue;
            
            const cidade = getValorColuna(valores, colMap.cidade) || 'GUARULHOS';
            
            // Filtrar apenas Guarulhos
            if (!cidade.toUpperCase().includes('GUARULHOS')) continue;
            
            const qtdeStr = getValorColuna(valores, colMap.qtde);
            const valorStr = getValorColuna(valores, colMap.valor);
            
            const qtde = parseNumero(qtdeStr);
            const valor = parseNumero(valorStr);
            
            // Validar quantidade e valor
            if (qtde <= 0 || valor <= 0) continue;
            
            const precoLitro = valor / qtde;
            
            // Validar preço (entre R$ 3 e R$ 15)
            if (precoLitro < 3 || precoLitro > 15) {
                console.warn(`⚠️ Preço inválido ignorado: R$ ${precoLitro.toFixed(2)}/L`);
                continue;
            }
            
            const abastecimento = {
                data: getValorColuna(valores, colMap.data),
                hora: getValorColuna(valores, colMap.hora),
                combustivel: normalizarCombustivel(getValorColuna(valores, colMap.combustivel)),
                quantidade: qtde,
                valorTotal: valor,
                precoLitro: precoLitro,
                nomePosto: getValorColuna(valores, colMap.nomePosto),
                endereco: getValorColuna(valores, colMap.endereco),
                cidade: cidade,
                placa: getValorColuna(valores, colMap.placa),
                condutor: getValorColuna(valores, colMap.condutor)
            };
            
            abastecimentos.push(abastecimento);
            
        } catch (e) {
            console.warn(`⚠️ Erro ao processar linha ${i}:`, e.message);
        }
    }
    
    console.log(`✅ ${abastecimentos.length} abastecimentos processados com sucesso`);
    
    return abastecimentos;
}

function parseCSVLine(linha) {
    const resultado = [];
    let atual = '';
    let dentroAspas = false;
    
    for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
        
        if (char === '"') {
            dentroAspas = !dentroAspas;
        } else if (char === ',' && !dentroAspas) {
            resultado.push(atual.trim().replace(/^"|"$/g, ''));
            atual = '';
        } else {
            atual += char;
        }
    }
    
    resultado.push(atual.trim().replace(/^"|"$/g, ''));
    return resultado;
}

function findColumnIndex(headers, possibleNames) {
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        for (const name of possibleNames) {
            if (header === name || header.includes(name)) {
                return i;
            }
        }
    }
    return -1;
}

function getValorColuna(valores, index) {
    if (index === -1 || index >= valores.length) return '';
    return (valores[index] || '').trim().replace(/^"|"$/g, '');
}

function parseNumero(str) {
    if (!str) return 0;
    // Remover aspas e espaços
    str = String(str).replace(/["\s]/g, '');
    // Trocar vírgula por ponto
    str = str.replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function normalizarCombustivel(combustivel) {
    if (!combustivel) return 'GASOLINA';
    const c = combustivel.toUpperCase().trim();
    if (c.includes('ALCOOL') || c.includes('ÁLCOOL') || c.includes('ETANOL')) {
        return 'ETANOL';
    }
    return 'GASOLINA';
}

// ==========================================
// ATUALIZAR PREÇOS DOS POSTOS - ÚLTIMO PREÇO
// ==========================================

function atualizarPrecosComAbastecimentos(abastecimentos) {
    console.log('📊 Atualizando preços dos postos com último abastecimento...');
    
    if (!abastecimentos || abastecimentos.length === 0) {
        console.warn('Nenhum abastecimento para processar');
        return postosData;
    }
    
    // Ordenar por data/hora (mais recente primeiro)
    const abastecimentosOrdenados = [...abastecimentos].sort((a, b) => {
        const dataA = parseDataBR(a.data, a.hora);
        const dataB = parseDataBR(b.data, b.hora);
        return dataB - dataA; // Mais recente primeiro
    });
    
    // Agrupar por posto - pegar apenas o último preço de cada combustível
    const ultimosPrecoPorPosto = {};
    
    abastecimentosOrdenados.forEach(ab => {
        const nomePosto = normalizarNomePosto(ab.nomePosto);
        
        if (!ultimosPrecoPorPosto[nomePosto]) {
            ultimosPrecoPorPosto[nomePosto] = {
                nome: ab.nomePosto,
                endereco: ab.endereco,
                gasolina: null,
                etanol: null,
                ultimaData: ab.data
            };
        }
        
        // Guardar apenas o primeiro (mais recente) de cada tipo
        if (ab.combustivel === 'GASOLINA' && !ultimosPrecoPorPosto[nomePosto].gasolina) {
            ultimosPrecoPorPosto[nomePosto].gasolina = {
                preco: ab.precoLitro,
                data: ab.data
            };
            console.log(`⛽ ${ab.nomePosto} - Gasolina: R$ ${ab.precoLitro.toFixed(2)} (${ab.data})`);
        }
        
        if (ab.combustivel === 'ETANOL' && !ultimosPrecoPorPosto[nomePosto].etanol) {
            ultimosPrecoPorPosto[nomePosto].etanol = {
                preco: ab.precoLitro,
                data: ab.data
            };
            console.log(`⛽ ${ab.nomePosto} - Etanol: R$ ${ab.precoLitro.toFixed(2)} (${ab.data})`);
        }
    });
    
    console.log(`📍 ${Object.keys(ultimosPrecoPorPosto).length} postos com preços atualizados`);
    
    // Atualizar ou criar postos
    Object.entries(ultimosPrecoPorPosto).forEach(([nomeKey, dados]) => {
        // Buscar posto existente
        let posto = postosData.find(p => {
            const nomePostoNorm = normalizarNomePosto(p.nomeFantasia);
            return nomePostoNorm === nomeKey;
        });
        
        // Se não existe, criar novo
        if (!posto) {
            const coords = obterCoordenadasPorEndereco({ logradouro: dados.endereco });
            
            posto = {
                id: Date.now() + Math.random() * 1000,
                terminal: null,
                nomeFantasia: dados.nome,
                endereco: {
                    logradouro: dados.endereco || '',
                    numero: '',
                    bairro: extrairBairroDoEndereco(dados.endereco),
                    cidade: 'Guarulhos',
                    estado: 'SP'
                },
                coordenadas: coords,
                precos: { gasolina: 0, etanol: 0 },
                bandeira: 'BANDEIRA BRANCA',
                ativo: true
            };
            
            postosData.push(posto);
            console.log(`➕ Novo posto criado: ${dados.nome}`);
        }
        
        // Atualizar preços com o último valor
        if (dados.gasolina) {
            posto.precos.gasolina = dados.gasolina.preco;
            posto.ultimaAtualizacaoGasolina = dados.gasolina.data;
        }
        
        if (dados.etanol) {
            posto.precos.etanol = dados.etanol.preco;
            posto.ultimaAtualizacaoEtanol = dados.etanol.data;
        }
        
        posto.ultimaAtualizacaoPreco = dados.ultimaData;
    });
    
    // Salvar postos atualizados
    salvarPostos(postosData);
    
    // Salvar abastecimentos
    abastecimentosData = abastecimentos;
    salvarAbastecimentos(abastecimentos);
    
    console.log(`✅ Total: ${postosData.length} postos no sistema`);
    
    return postosData;
}

function normalizarNomePosto(nome) {
    if (!nome) return '';
    return nome.toUpperCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/AUTO POSTO/g, 'AP')
        .replace(/POSTO DE SERVICOS/g, 'PS')
        .replace(/LTDA\.?/g, '')
        .trim();
}

function parseDataBR(dataStr, horaStr) {
    if (!dataStr) return new Date(0);
    
    try {
        // Formato DD/MM/YYYY
        const partes = dataStr.split('/');
        if (partes.length === 3) {
            const dia = parseInt(partes[0]);
            const mes = parseInt(partes[1]) - 1;
            const ano = parseInt(partes[2]);
            
            let hora = 0, min = 0, seg = 0;
            if (horaStr) {
                const partesHora = horaStr.split(':');
                hora = parseInt(partesHora[0]) || 0;
                min = parseInt(partesHora[1]) || 0;
                seg = parseInt(partesHora[2]) || 0;
            }
            
            return new Date(ano, mes, dia, hora, min, seg);
        }
    } catch (e) {
        console.warn('Erro ao parsear data:', dataStr);
    }
    
    return new Date(0);
}

function extrairBairroDoEndereco(endereco) {
    if (!endereco) return 'Centro';
    
    const endLower = endereco.toLowerCase();
    
    for (const [bairro, coords] of Object.entries(coordenadasBairros)) {
        if (endLower.includes(bairro)) {
            return bairro.charAt(0).toUpperCase() + bairro.slice(1);
        }
    }
    
    return 'Centro';
}

// ==========================================
// BUSCAR PREÇOS DA ANP
// ==========================================

async function carregarDadosANP() {
    console.log('🔄 Buscando preços da ANP...');
    
    // Valores de fallback atualizados
    anpData = {
        gasolinaComum: 6.02,
        etanol: 4.26,
        semana: '28/12/2025 a 03/01/2026',
        dataAtualizacao: new Date().toISOString(),
        fonte: 'fallback'
    };
    
    localStorage.setItem(STORAGE_KEYS.ANP_DATA, JSON.stringify(anpData));
    return anpData;
}

// ==========================================
// CARREGAR POSTOS DO JSON
// ==========================================

async function carregarPostosDoJSON() {
    console.log('🔄 Carregando postos do JSON...');
    
    try {
        const response = await fetch(API_POSTOS_URL);
        if (!response.ok) throw new Error('Erro ao carregar JSON');
        
        const json = await response.json();
        
        if (json.success && json.data) {
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
                    ativo: posto.ativo !== false,
                    ultimaAtualizacaoPreco: null
                };
            });
            
            console.log(`✅ ${postosData.length} postos carregados do JSON`);
            salvarPostos(postosData);
            return postosData;
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar JSON:', error.message);
    }
    
    return carregarPostos();
}

// ==========================================
// FUNÇÕES DE STORAGE
// ==========================================

function carregarPostos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.POSTOS);
        if (saved) {
            postosData = JSON.parse(saved);
            console.log(`✅ ${postosData.length} postos do localStorage`);
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
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    postosData = [];
    abastecimentosData = [];
    anpData = { gasolinaComum: 6.02, etanol: 4.26 };
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
    
    // Tentar extrair bairro do logradouro
    if (endereco && endereco.logradouro) {
        const endLower = endereco.logradouro.toLowerCase();
        for (const [bairro, coords] of Object.entries(coordenadasBairros)) {
            if (endLower.includes(bairro)) {
                return {
                    lat: coords.lat + (Math.random() - 0.5) * 0.008,
                    lng: coords.lng + (Math.random() - 0.5) * 0.008
                };
            }
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
        maisCaroEtanol,
        totalAbastecimentos: abastecimentosData.length
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
        'BANDEIRA BRANCA': '#6B7280'
    };
    
    return cores[b] || '#6B7280';
}

function atualizarPrecoPosto(postoId, combustivel, novoPreco) {
    const posto = postosData.find(p => p.id === postoId || p.id === parseInt(postoId));
    if (!posto) return false;
    
    posto.precos[combustivel] = parseFloat(novoPreco);
    posto.ultimaAtualizacaoPreco = new Date().toISOString();
    
    salvarPostos(postosData);
    return true;
}

// ==========================================
// EXPORTAR PARA GLOBAL - IMPORTANTE!
// ==========================================

// Variáveis globais
window.postosData = postosData;
window.abastecimentosData = abastecimentosData;
window.anpData = anpData;
window.SEDE_CAMARA = SEDE_CAMARA;
window.coordenadasBairros = coordenadasBairros;
window.ANP_API_URL = ANP_API_URL;

// Funções principais - TODAS EXPORTADAS
window.processarAbastecimentosCSV = processarAbastecimentosCSV;
window.atualizarPrecosComAbastecimentos = atualizarPrecosComAbastecimentos;
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

console.log('✅ data.js carregado - processarAbastecimentosCSV disponível');
