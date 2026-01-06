// ==========================================
// CONFIGURAÇÕES E CONSTANTES
// ==========================================

const SEDE_CAMARA = {
    lat: -23.4538,
    lng: -46.5333,
    endereco: 'Av. Monteiro Lobato, 734 - Macedo, Guarulhos - SP'
};

const API_POSTOS_URL = './postos.json';

let postosData = [];
let abastecimentosData = [];
let anpData = {
    gasolinaComum: null,
    etanol: null,
    dataAtualizacao: null,
    semana: null,
    fonte: null
};

// ==========================================
// COORDENADAS DOS BAIRROS
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
    'cidade serodio': { lat: -23.4850, lng: -46.5100 },
    'jardim albertina': { lat: -23.4900, lng: -46.4800 },
    'porto da igreja': { lat: -23.4400, lng: -46.5500 },
    'itapegica': { lat: -23.4450, lng: -46.5600 },
    'vila galvao': { lat: -23.4620, lng: -46.5500 },
    'taboao': { lat: -23.4500, lng: -46.5200 },
    'gopouva': { lat: -23.4650, lng: -46.5300 },
    'bom clima': { lat: -23.4420, lng: -46.5180 },
    'jardim zaira': { lat: -23.4380, lng: -46.5420 },
    'torres tibagy': { lat: -23.4550, lng: -46.5100 },
    'jardim sao joao': { lat: -23.4720, lng: -46.4950 },
    'cidade industrial satelite': { lat: -23.4650, lng: -46.4950 },
    'dutra': { lat: -23.4400, lng: -46.4600 },
    'presidente dutra': { lat: -23.4400, lng: -46.4600 },
    'guarulhos': { lat: -23.4538, lng: -46.5333 },
    'cidade martins': { lat: -23.4600, lng: -46.5200 }
};

const STORAGE_KEYS = {
    POSTOS: 'cmg_postos_data',
    ABASTECIMENTOS: 'cmg_abastecimentos_data',
    LAST_UPDATE: 'cmg_last_update',
    ANP_DATA: 'cmg_anp_data'
};

// ==========================================
// BUSCAR PREÇOS ANP - VERSÃO CORRIGIDA
// ==========================================

async function carregarDadosANP() {
    console.log('🔍 Buscando preços ANP...');
    
    // Verificar cache
    const cached = localStorage.getItem(STORAGE_KEYS.ANP_DATA);
    if (cached) {
        try {
            const dados = JSON.parse(cached);
            const agora = new Date().getTime();
            const cacheTime = new Date(dados.timestamp || 0).getTime();
            
            // Cache válido por 6 horas
            if (agora - cacheTime < 6 * 60 * 60 * 1000 && dados.gasolinaComum) {
                console.log('✅ Usando cache ANP:', dados);
                anpData = dados;
                window.anpData = anpData;
                return anpData;
            }
        } catch (e) {}
    }
    
    // Buscar via API
    try {
        const response = await fetch('https://api.allorigins.win/raw?url=' + 
            encodeURIComponent('https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/semanal/municipios/sao-paulo/guarulhos'));
        
        if (response.ok) {
            const html = await response.text();
            
            // Buscar gasolina
            const regexGasolina = /gasolina[^0-9]*?(\d+)[,.](\d{2,3})/gi;
            const matchGas = regexGasolina.exec(html);
            
            // Buscar etanol
            const regexEtanol = /etanol[^0-9]*?(\d+)[,.](\d{2,3})/gi;
            const matchEtanol = regexEtanol.exec(html);
            
            if (matchGas || matchEtanol) {
                anpData = {
                    gasolinaComum: matchGas ? parseFloat(`${matchGas[1]}.${matchGas[2]}`) : 6.06,
                    etanol: matchEtanol ? parseFloat(`${matchEtanol[1]}.${matchEtanol[2]}`) : 3.97,
                    dataAtualizacao: new Date().toISOString(),
                    semana: `Semana de ${new Date().toLocaleDateString('pt-BR')}`,
                    fonte: 'ANP',
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem(STORAGE_KEYS.ANP_DATA, JSON.stringify(anpData));
                window.anpData = anpData;
                console.log('✅ Preços ANP atualizados:', anpData);
                return anpData;
            }
        }
    } catch (error) {
        console.warn('⚠️ Erro ao buscar ANP:', error);
    }
    
    // Fallback com valores de referência de Guarulhos (Janeiro 2026)
    anpData = {
        gasolinaComum: 6.06,
        etanol: 3.97,
        dataAtualizacao: new Date().toISOString(),
        semana: 'Média semanal - Guarulhos/SP',
        fonte: 'ANP (referência)',
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.ANP_DATA, JSON.stringify(anpData));
    window.anpData = anpData;
    console.log('📊 Usando preços de referência ANP:', anpData);
    
    return anpData;
}

// ==========================================
// NORMALIZAÇÃO PARA MATCHING DE NOMES
// ==========================================

function normalizarNome(texto) {
    if (!texto) return '';
    return texto
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\bAUTO\s*POSTO\b/gi, '')
        .replace(/\bPOSTO\s*DE\s*SERVICOS?\b/gi, '')
        .replace(/\bCOM\s*DE\s*COMB\b/gi, '')
        .replace(/\bCOMERCIO\b/gi, '')
        .replace(/\bCOMBUSTIVEIS\b/gi, '')
        .replace(/\bDERIVADOS\b/gi, '')
        .replace(/\bPETROLEO\b/gi, '')
        .replace(/\bLTDA\b/gi, '')
        .replace(/\bEIRELI\b/gi, '')
        .replace(/\bME\b/gi, '')
        .replace(/\bS\/?A\b/gi, '')
        .replace(/\bEPP\b/gi, '')
        .trim();
}

function encontrarPostoMatch(nomeAbastecimento, listaPostos) {
    const nomeNorm = normalizarNome(nomeAbastecimento);
    if (!nomeNorm) return null;
    
    let melhorMatch = null;
    let melhorScore = 0;
    
    for (const posto of listaPostos) {
        // Comparar com nome fantasia
        const nomeFantasiaNorm = normalizarNome(posto.nomeFantasia);
        let score = calcularSimilaridade(nomeNorm, nomeFantasiaNorm);
        
        // Comparar também com razão social
        if (posto.razaoSocial) {
            const razaoNorm = normalizarNome(posto.razaoSocial);
            const scoreRazao = calcularSimilaridade(nomeNorm, razaoNorm);
            score = Math.max(score, scoreRazao);
        }
        
        if (score > melhorScore) {
            melhorScore = score;
            melhorMatch = posto;
        }
    }
    
    // Aceitar match com score >= 0.5
    return melhorScore >= 0.5 ? { posto: melhorMatch, score: melhorScore } : null;
}

function calcularSimilaridade(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    // Se um contém o outro
    if (str1.includes(str2) || str2.includes(str1)) return 0.9;
    
    // Verificar palavras em comum
    const palavras1 = str1.split(' ').filter(p => p.length > 2);
    const palavras2 = str2.split(' ').filter(p => p.length > 2);
    
    if (palavras1.length === 0 || palavras2.length === 0) return 0;
    
    let matches = 0;
    for (const p1 of palavras1) {
        for (const p2 of palavras2) {
            if (p1 === p2) {
                matches++;
                break;
            }
            // Match parcial
            if (p1.length > 3 && p2.length > 3) {
                if (p1.includes(p2) || p2.includes(p1)) {
                    matches += 0.7;
                    break;
                }
            }
        }
    }
    
    return matches / Math.max(palavras1.length, palavras2.length);
}

// ==========================================
// PROCESSAMENTO DE CSV
// ==========================================

function processarAbastecimentosCSV(csvContent) {
    console.log('📊 Processando CSV de abastecimentos...');
    
    if (!csvContent || typeof csvContent !== 'string') {
        console.error('CSV vazio ou inválido');
        return [];
    }
    
    const linhas = csvContent.split('\n');
    const abastecimentos = [];
    
    // Encontrar linha do cabeçalho
    let headerIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(15, linhas.length); i++) {
        const linha = linhas[i].toLowerCase();
        if (linha.includes('data') && (linha.includes('posto') || linha.includes('combustivel'))) {
            headerIndex = i;
            headers = parseCSVLine(linhas[i]);
            break;
        }
    }
    
    if (headerIndex === -1) {
        console.error('Cabeçalho não encontrado');
        return [];
    }
    
    const headersLower = headers.map(h => h.toLowerCase().replace(/["\s]/g, ''));
    
    // Mapear colunas
    const colMap = {
        data: findColumn(headersLower, ['data']),
        hora: findColumn(headersLower, ['hora']),
        combustivel: findColumn(headersLower, ['combustivel', 'combustível', 'tipo']),
        qtde: findColumn(headersLower, ['qtde_combustivel', 'qtde', 'quantidade', 'litros']),
        valor: findColumn(headersLower, ['valor_abastecimento', 'valor', 'total']),
        cidade: findColumn(headersLower, ['cidade_posto', 'cidade']),
        nomePosto: findColumn(headersLower, ['nome_posto', 'posto', 'estabelecimento']),
        endereco: findColumn(headersLower, ['endereco_posto', 'endereco']),
        placa: findColumn(headersLower, ['placa']),
        condutor: findColumn(headersLower, ['nome_condutor', 'condutor'])
    };
    
    console.log('Mapeamento de colunas:', colMap);
    
    // Processar linhas de dados
    for (let i = headerIndex + 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha || linha.startsWith('SEP')) continue;
        
        try {
            const valores = parseCSVLine(linha);
            if (valores.length < 5) continue;
            
            // Verificar cidade (apenas Guarulhos)
            const cidade = getCol(valores, colMap.cidade) || '';
            if (cidade && !cidade.toUpperCase().includes('GUARULHOS')) continue;
            
            const qtde = parseFloat((getCol(valores, colMap.qtde) || '0').replace(',', '.'));
            const valor = parseFloat((getCol(valores, colMap.valor) || '0').replace(',', '.'));
            
            if (qtde <= 0 || valor <= 0) continue;
            
            const precoLitro = valor / qtde;
            if (precoLitro < 2 || precoLitro > 15) continue;
            
            const combustivel = getCol(valores, colMap.combustivel) || '';
            const tipoCombustivel = combustivel.toUpperCase().includes('ETANOL') || 
                                    combustivel.toUpperCase().includes('ALCOOL') ? 'ETANOL' : 'GASOLINA';
            
            abastecimentos.push({
                data: getCol(valores, colMap.data),
                hora: getCol(valores, colMap.hora),
                combustivel: tipoCombustivel,
                quantidade: qtde,
                valorTotal: valor,
                precoLitro: precoLitro,
                nomePosto: getCol(valores, colMap.nomePosto),
                endereco: getCol(valores, colMap.endereco),
                cidade: cidade || 'GUARULHOS',
                placa: getCol(valores, colMap.placa),
                condutor: getCol(valores, colMap.condutor)
            });
            
        } catch (e) {
            // Ignorar linha com erro
        }
    }
    
    console.log(`✅ ${abastecimentos.length} abastecimentos processados`);
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
        } else if ((char === ',' || char === ';') && !dentroAspas) {
            resultado.push(atual.trim().replace(/^"|"$/g, ''));
            atual = '';
        } else {
            atual += char;
        }
    }
    resultado.push(atual.trim().replace(/^"|"$/g, ''));
    
    return resultado;
}

function findColumn(headers, nomes) {
    for (let i = 0; i < headers.length; i++) {
        for (const nome of nomes) {
            if (headers[i].includes(nome)) return i;
        }
    }
    return -1;
}

function getCol(valores, index) {
    if (index < 0 || index >= valores.length) return '';
    return (valores[index] || '').trim().replace(/^"|"$/g, '');
}

// ==========================================
// ATUALIZAR PREÇOS DOS POSTOS
// ==========================================

function atualizarPrecosComAbastecimentos(abastecimentos) {
    console.log('📊 Atualizando preços dos postos...');
    console.log(`   Postos cadastrados: ${postosData.length}`);
    console.log(`   Abastecimentos: ${abastecimentos.length}`);
    
    if (!abastecimentos || abastecimentos.length === 0) {
        return postosData;
    }
    
    // Ordenar por data (mais recente primeiro)
    const ordenados = [...abastecimentos].sort((a, b) => {
        return parseDataBR(b.data) - parseDataBR(a.data);
    });
    
    // Agrupar por posto (último preço de cada combustível)
    const precosPorPosto = {};
    
    for (const ab of ordenados) {
        const chave = normalizarNome(ab.nomePosto);
        if (!chave) continue;
        
        if (!precosPorPosto[chave]) {
            precosPorPosto[chave] = {
                nomeOriginal: ab.nomePosto,
                endereco: ab.endereco,
                gasolina: null,
                etanol: null,
                dataGasolina: null,
                dataEtanol: null
            };
        }
        
        if (ab.combustivel === 'GASOLINA' && !precosPorPosto[chave].gasolina) {
            precosPorPosto[chave].gasolina = ab.precoLitro;
            precosPorPosto[chave].dataGasolina = ab.data;
        }
        if (ab.combustivel === 'ETANOL' && !precosPorPosto[chave].etanol) {
            precosPorPosto[chave].etanol = ab.precoLitro;
            precosPorPosto[chave].dataEtanol = ab.data;
        }
    }
    
    console.log(`   Postos únicos nos abastecimentos: ${Object.keys(precosPorPosto).length}`);
    
    // Fazer matching e atualizar preços
    let matchCount = 0;
    let novoCount = 0;
    
    for (const [chave, dados] of Object.entries(precosPorPosto)) {
        const match = encontrarPostoMatch(dados.nomeOriginal, postosData);
        
        if (match) {
            // Atualizar posto existente
            const posto = match.posto;
            
            if (dados.gasolina && dados.gasolina > 0) {
                posto.precos = posto.precos || {};
                posto.precos.gasolina = dados.gasolina;
            }
            if (dados.etanol && dados.etanol > 0) {
                posto.precos = posto.precos || {};
                posto.precos.etanol = dados.etanol;
            }
            
            posto.ultimaAtualizacaoPreco = dados.dataGasolina || dados.dataEtanol;
            
            console.log(`   ✅ Match: "${dados.nomeOriginal}" → "${posto.nomeFantasia}" (${(match.score * 100).toFixed(0)}%)`);
            matchCount++;
            
        } else {
            // Criar novo posto
            const coords = obterCoordenadasPorEndereco({ logradouro: dados.endereco });
            
            const novoPosto = {
                id: Date.now() + Math.random() * 1000,
                nomeFantasia: dados.nomeOriginal,
                endereco: {
                    logradouro: dados.endereco || '',
                    bairro: extrairBairro(dados.endereco),
                    cidade: 'Guarulhos',
                    estado: 'SP'
                },
                coordenadas: coords,
                precos: {
                    gasolina: dados.gasolina || 0,
                    etanol: dados.etanol || 0
                },
                bandeira: 'BANDEIRA BRANCA',
                ativo: true,
                ultimaAtualizacaoPreco: dados.dataGasolina || dados.dataEtanol
            };
            
            postosData.push(novoPosto);
            console.log(`   ➕ Novo posto: "${dados.nomeOriginal}"`);
            novoCount++;
        }
    }
    
    console.log(`📊 Resultado: ${matchCount} matches, ${novoCount} novos`);
    
    // Salvar
    salvarPostos(postosData);
    abastecimentosData = abastecimentos;
    salvarAbastecimentos(abastecimentos);
    
    return postosData;
}

function parseDataBR(dataStr) {
    if (!dataStr) return new Date(0);
    const partes = dataStr.split('/');
    if (partes.length === 3) {
        return new Date(partes[2], partes[1] - 1, partes[0]);
    }
    return new Date(0);
}

function extrairBairro(endereco) {
    if (!endereco) return 'Centro';
    const endLower = endereco.toLowerCase();
    
    for (const bairro of Object.keys(coordenadasBairros)) {
        if (endLower.includes(bairro)) {
            return bairro.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
    }
    return 'Centro';
}

// ==========================================
// CARREGAR POSTOS DO JSON
// ==========================================

async function carregarPostosDoJSON() {
    console.log('🔄 Carregando postos...');
    
    // Primeiro verificar localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.POSTOS);
    if (saved) {
        try {
            const dados = JSON.parse(saved);
            if (dados && dados.length > 0) {
                postosData = dados;
                window.postosData = postosData;
                console.log(`✅ ${postosData.length} postos do localStorage`);
                return postosData;
            }
        } catch (e) {}
    }
    
    // Carregar do JSON
    try {
        const response = await fetch(API_POSTOS_URL);
        if (response.ok) {
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
                        endereco: {
                            logradouro: `${posto.endereco?.logradouro || ''} ${posto.endereco?.rua || ''}`.trim(),
                            numero: posto.endereco?.numero || 'S/N',
                            bairro: bairro,
                            cidade: posto.endereco?.cidade || 'Guarulhos',
                            estado: posto.endereco?.uf || 'SP'
                        },
                        coordenadas: coords ? {
                            lat: coords.lat + (Math.random() - 0.5) * 0.008,
                            lng: coords.lng + (Math.random() - 0.5) * 0.008
                        } : {
                            lat: -23.4538 + (Math.random() - 0.5) * 0.04,
                            lng: -46.5333 + (Math.random() - 0.5) * 0.04
                        },
                        precos: { gasolina: 0, etanol: 0 },
                        bandeira: posto.bandeira || 'BANDEIRA BRANCA',
                        ativo: true
                    };
                });
                
                salvarPostos(postosData);
                console.log(`✅ ${postosData.length} postos do JSON`);
                return postosData;
            }
        }
    } catch (error) {
        console.warn('Erro ao carregar JSON:', error);
    }
    
    return [];
}

// ==========================================
// FUNÇÕES DE STORAGE
// ==========================================

function carregarPostos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.POSTOS);
        if (saved) {
            postosData = JSON.parse(saved);
            window.postosData = postosData;
            return postosData;
        }
    } catch (e) {}
    return [];
}

function salvarPostos(postos) {
    try {
        postosData = postos;
        window.postosData = postos;
        localStorage.setItem(STORAGE_KEYS.POSTOS, JSON.stringify(postos));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
        return true;
    } catch (e) {
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
    } catch (e) {}
    return [];
}

function salvarAbastecimentos(dados) {
    try {
        abastecimentosData = dados;
        localStorage.setItem(STORAGE_KEYS.ABASTECIMENTOS, JSON.stringify(dados));
        return true;
    } catch (e) {
        return false;
    }
}

function getUltimaAtualizacao() {
    return localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
}

function limparTodosDados() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    postosData = [];
    abastecimentosData = [];
    window.postosData = [];
}

// ==========================================
// GEOCODIFICAÇÃO
// ==========================================

function obterCoordenadasPorBairro(bairro) {
    if (!bairro) return null;
    const bairroLower = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    for (const [key, coords] of Object.entries(coordenadasBairros)) {
        if (bairroLower.includes(key) || key.includes(bairroLower)) {
            return coords;
        }
    }
    return null;
}

function obterCoordenadasPorEndereco(endereco) {
    if (endereco?.bairro) {
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
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getPostoById(id) {
    return postosData.find(p => p.id === parseInt(id) || p.id === id);
}

function getBairros() {
    const bairros = [...new Set(postosData.map(p => p.endereco?.bairro).filter(Boolean))];
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
            return sorted.sort((a, b) => {
                const dA = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, a.coordenadas?.lat || 0, a.coordenadas?.lng || 0);
                const dB = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, b.coordenadas?.lat || 0, b.coordenadas?.lng || 0);
                return dA - dB;
            });
        default:
            return sorted;
    }
}

function getEstatisticas() {
    const postosComGasolina = postosData.filter(p => p.precos?.gasolina > 0);
    const postosComEtanol = postosData.filter(p => p.precos?.etanol > 0);
    
    return {
        totalPostos: postosData.length,
        postosComPreco: postosComGasolina.length,
        maisBaratoGasolina: postosComGasolina.length > 0 ? 
            postosComGasolina.reduce((min, p) => p.precos.gasolina < min.precos.gasolina ? p : min) : null,
        maisCaroGasolina: postosComGasolina.length > 0 ?
            postosComGasolina.reduce((max, p) => p.precos.gasolina > max.precos.gasolina ? p : max) : null,
        maisBaratoEtanol: postosComEtanol.length > 0 ?
            postosComEtanol.reduce((min, p) => p.precos.etanol < min.precos.etanol ? p : min) : null,
        maisCaroEtanol: postosComEtanol.length > 0 ?
            postosComEtanol.reduce((max, p) => p.precos.etanol > max.precos.etanol ? p : max) : null,
        totalAbastecimentos: abastecimentosData.length
    };
}

function formatarPreco(valor) {
    if (!valor || valor <= 0) return 'R$ --';
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function formatarData(dataISO) {
    if (!dataISO) return '--';
    try {
        return new Date(dataISO).toLocaleDateString('pt-BR');
    } catch (e) {
        return dataISO;
    }
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
        'ALE': '#0066CC'
    };
    
    return cores[b] || '#6B7280';
}

// ==========================================
// EXPORTAÇÕES GLOBAIS
// ==========================================

window.postosData = postosData;
window.abastecimentosData = abastecimentosData;
window.anpData = anpData;
window.SEDE_CAMARA = SEDE_CAMARA;
window.coordenadasBairros = coordenadasBairros;

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

console.log('✅ data.js carregado');
