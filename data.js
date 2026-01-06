// ==========================================
// CONFIGURAÇÕES E CONSTANTES
// ==========================================

const GEMINI_API_KEY = 'AIzaSyAHbzal0e8Nvt3JHEn6TnQ9VX_pRb1z-TU';

const SEDE_CAMARA = {
    lat: -23.4538,
    lng: -46.5333,
    endereco: 'Av. Monteiro Lobato, 734 - Macedo, Guarulhos - SP'
};

const API_POSTOS_URL = './postos.json';

let postosData = [];
let abastecimentosData = [];
let anpData = {
    gasolinaComum: 6.06,
    etanol: 3.97,
    dataAtualizacao: null,
    semana: null,
    fonte: 'fallback'
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
    'cidade martins': { lat: -23.4600, lng: -46.5200 },
    'jardim cumbica': { lat: -23.4450, lng: -46.4750 },
    'agua chata': { lat: -23.4300, lng: -46.4900 },
    'bonsucesso': { lat: -23.4800, lng: -46.4600 },
    'pimentas': { lat: -23.4900, lng: -46.4400 },
    'lavras': { lat: -23.4200, lng: -46.4500 },
    'fortaleza': { lat: -23.4100, lng: -46.4600 },
    'morros': { lat: -23.4650, lng: -46.5450 },
    'ponte grande': { lat: -23.4550, lng: -46.5550 },
    'jardim santa mena': { lat: -23.4700, lng: -46.5150 },
    'continental': { lat: -23.4580, lng: -46.5080 },
    'parque cecap': { lat: -23.4400, lng: -46.5250 },
    'cecap': { lat: -23.4400, lng: -46.5250 },
    'tranquilidade': { lat: -23.4650, lng: -46.4850 },
    'paraventi': { lat: -23.4750, lng: -46.5050 },
    'jardim adriana': { lat: -23.4850, lng: -46.4750 },
    'sadokim': { lat: -23.4500, lng: -46.4550 },
    'sao roque': { lat: -23.4350, lng: -46.5000 }
};

const STORAGE_KEYS = {
    POSTOS: 'cmg_postos_data',
    ABASTECIMENTOS: 'cmg_abastecimentos_data',
    LAST_UPDATE: 'cmg_last_update',
    ANP_DATA: 'cmg_anp_data'
};

// ==========================================
// NORMALIZAÇÃO DE NOMES PARA MATCHING
// ==========================================

function normalizarParaComparacao(texto) {
    if (!texto) return '';
    return texto
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, ' ')
        .replace(/\bAUTO\s*POSTO\b/g, '')
        .replace(/\bPOSTO\s*DE\s*SERVICOS?\b/g, '')
        .replace(/\bCOMERCIO\s*DE\s*COMBUSTIVEIS?\b/g, '')
        .replace(/\bDERIVADOS\s*DE\s*PETROLEO\b/g, '')
        .replace(/\bLTDA\b/g, '')
        .replace(/\bEIRELI\b/g, '')
        .replace(/\bME\b/g, '')
        .replace(/\bS\s*A\b/g, '')
        .replace(/\bCIA\b/g, '')
        .trim();
}

function calcularSimilaridade(str1, str2) {
    const s1 = normalizarParaComparacao(str1);
    const s2 = normalizarParaComparacao(str2);
    
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    
    // Verificar se um contém o outro
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Verificar palavras em comum
    const palavras1 = s1.split(' ').filter(p => p.length > 2);
    const palavras2 = s2.split(' ').filter(p => p.length > 2);
    
    let matches = 0;
    for (const p1 of palavras1) {
        for (const p2 of palavras2) {
            if (p1 === p2 || p1.includes(p2) || p2.includes(p1)) {
                matches++;
                break;
            }
        }
    }
    
    const maxPalavras = Math.max(palavras1.length, palavras2.length);
    if (maxPalavras === 0) return 0;
    
    return matches / maxPalavras;
}

function encontrarPostoMaisProximo(nomeAbastecimento, enderecoAbastecimento) {
    let melhorMatch = null;
    let melhorScore = 0;
    
    for (const posto of postosData) {
        // Comparar nome
        let score = calcularSimilaridade(nomeAbastecimento, posto.nomeFantasia);
        
        // Comparar também com razão social se existir
        if (posto.razaoSocial) {
            const scoreRazao = calcularSimilaridade(nomeAbastecimento, posto.razaoSocial);
            score = Math.max(score, scoreRazao);
        }
        
        // Bonus por endereço similar
        if (enderecoAbastecimento && posto.endereco?.logradouro) {
            const scoreEndereco = calcularSimilaridade(enderecoAbastecimento, posto.endereco.logradouro);
            if (scoreEndereco > 0.5) {
                score += 0.2;
            }
        }
        
        if (score > melhorScore) {
            melhorScore = score;
            melhorMatch = posto;
        }
    }
    
    // Só aceitar match com score > 0.4
    return melhorScore > 0.4 ? { posto: melhorMatch, score: melhorScore } : null;
}

// ==========================================
// PROCESSAR CSV DE ABASTECIMENTOS
// ==========================================

function processarAbastecimentosCSV(csvContent) {
    console.log('📊 Iniciando processamento do CSV...');
    
    if (!csvContent || typeof csvContent !== 'string') {
        console.error('CSV vazio ou inválido');
        return [];
    }
    
    const linhas = csvContent.split('\n');
    console.log(`📄 Total de linhas: ${linhas.length}`);
    
    const abastecimentos = [];
    let headerIndex = -1;
    let headers = [];
    
    // Encontrar cabeçalho
    for (let i = 0; i < Math.min(15, linhas.length); i++) {
        const linha = linhas[i];
        if (linha && (
            (linha.toLowerCase().includes('data') && linha.toLowerCase().includes('posto')) ||
            (linha.toLowerCase().includes('data') && linha.toLowerCase().includes('combustivel'))
        )) {
            headerIndex = i;
            headers = parseCSVLine(linha);
            console.log(`📋 Cabeçalho linha ${i}:`, headers);
            break;
        }
    }
    
    if (headerIndex === -1) {
        // Usar primeira linha válida como cabeçalho
        for (let i = 0; i < 5; i++) {
            if (linhas[i] && linhas[i].includes(',') && !linhas[i].startsWith('SEP')) {
                headers = parseCSVLine(linhas[i]);
                if (headers.length >= 5) {
                    headerIndex = i;
                    break;
                }
            }
        }
    }
    
    if (headers.length === 0) {
        console.error('❌ Cabeçalho não encontrado');
        return [];
    }
    
    const headersLower = headers.map(h => h.toLowerCase().trim().replace(/["\s]/g, ''));
    console.log('Headers:', headersLower);
    
    const colMap = {
        data: findColumnIndex(headersLower, ['data']),
        hora: findColumnIndex(headersLower, ['hora']),
        combustivel: findColumnIndex(headersLower, ['combustivel', 'combustível', 'tipo']),
        qtde: findColumnIndex(headersLower, ['qtde_combustivel_abastecido', 'qtde', 'quantidade', 'litros']),
        valor: findColumnIndex(headersLower, ['valor_abastecimento', 'valor', 'total']),
        cidade: findColumnIndex(headersLower, ['cidade_posto', 'cidade']),
        nomePosto: findColumnIndex(headersLower, ['nome_posto', 'posto', 'estabelecimento']),
        endereco: findColumnIndex(headersLower, ['endereco_posto', 'endereco', 'endereço']),
        placa: findColumnIndex(headersLower, ['placa']),
        condutor: findColumnIndex(headersLower, ['nome_condutor', 'condutor'])
    };
    
    console.log('🗺️ Mapeamento:', colMap);
    
    // Processar dados
    for (let i = headerIndex + 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha || linha.startsWith('SEP')) continue;
        
        try {
            const valores = parseCSVLine(linha);
            if (valores.length < 5) continue;
            
            const cidade = getValorColuna(valores, colMap.cidade) || 'GUARULHOS';
            if (!cidade.toUpperCase().includes('GUARULHOS')) continue;
            
            const qtde = parseNumero(getValorColuna(valores, colMap.qtde));
            const valor = parseNumero(getValorColuna(valores, colMap.valor));
            
            if (qtde <= 0 || valor <= 0) continue;
            
            const precoLitro = valor / qtde;
            if (precoLitro < 2 || precoLitro > 15) continue;
            
            abastecimentos.push({
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
            });
            
        } catch (e) {
            console.warn(`Erro linha ${i}:`, e.message);
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

function findColumnIndex(headers, possibleNames) {
    for (let i = 0; i < headers.length; i++) {
        for (const name of possibleNames) {
            if (headers[i] === name || headers[i].includes(name)) {
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
    str = String(str).replace(/["\s]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function normalizarCombustivel(combustivel) {
    if (!combustivel) return 'GASOLINA';
    const c = combustivel.toUpperCase();
    if (c.includes('ALCOOL') || c.includes('ÁLCOOL') || c.includes('ETANOL')) {
        return 'ETANOL';
    }
    return 'GASOLINA';
}

// ==========================================
// ATUALIZAR PREÇOS - VERSÃO CORRIGIDA
// ==========================================

function atualizarPrecosComAbastecimentos(abastecimentos) {
    console.log('📊 Atualizando preços com abastecimentos...');
    console.log(`📍 Postos cadastrados: ${postosData.length}`);
    console.log(`⛽ Abastecimentos: ${abastecimentos.length}`);
    
    if (!abastecimentos || abastecimentos.length === 0) {
        console.warn('Nenhum abastecimento');
        return postosData;
    }
    
    // Ordenar por data (mais recente primeiro)
    const ordenados = [...abastecimentos].sort((a, b) => {
        const dataA = parseDataBR(a.data, a.hora);
        const dataB = parseDataBR(b.data, b.hora);
        return dataB - dataA;
    });
    
    // Mapear últimos preços por nome de posto do abastecimento
    const ultimosPrecos = {};
    
    ordenados.forEach(ab => {
        const chave = normalizarParaComparacao(ab.nomePosto);
        
        if (!ultimosPrecos[chave]) {
            ultimosPrecos[chave] = {
                nomeOriginal: ab.nomePosto,
                endereco: ab.endereco,
                gasolina: null,
                etanol: null,
                data: ab.data
            };
        }
        
        if (ab.combustivel === 'GASOLINA' && !ultimosPrecos[chave].gasolina) {
            ultimosPrecos[chave].gasolina = ab.precoLitro;
        }
        if (ab.combustivel === 'ETANOL' && !ultimosPrecos[chave].etanol) {
            ultimosPrecos[chave].etanol = ab.precoLitro;
        }
    });
    
    console.log(`📋 ${Object.keys(ultimosPrecos).length} postos únicos nos abastecimentos`);
    
    // Tentar fazer match com postos cadastrados
    let matchesEncontrados = 0;
    let postosNovos = 0;
    
    Object.entries(ultimosPrecos).forEach(([chave, dados]) => {
        // Buscar posto existente
        const match = encontrarPostoMaisProximo(dados.nomeOriginal, dados.endereco);
        
        if (match) {
            const posto = match.posto;
            console.log(`✅ Match: "${dados.nomeOriginal}" → "${posto.nomeFantasia}" (score: ${match.score.toFixed(2)})`);
            
            if (dados.gasolina) {
                posto.precos.gasolina = dados.gasolina;
                console.log(`   ⛽ Gasolina: R$ ${dados.gasolina.toFixed(2)}`);
            }
            if (dados.etanol) {
                posto.precos.etanol = dados.etanol;
                console.log(`   🌿 Etanol: R$ ${dados.etanol.toFixed(2)}`);
            }
            posto.ultimaAtualizacaoPreco = dados.data;
            matchesEncontrados++;
        } else {
            // Criar novo posto
            console.log(`➕ Novo posto: "${dados.nomeOriginal}"`);
            
            const coords = obterCoordenadasPorEndereco({ logradouro: dados.endereco });
            
            const novoPosto = {
                id: Date.now() + Math.random() * 1000,
                terminal: null,
                nomeFantasia: dados.nomeOriginal,
                endereco: {
                    logradouro: dados.endereco || '',
                    bairro: extrairBairroDoEndereco(dados.endereco),
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
                ultimaAtualizacaoPreco: dados.data
            };
            
            postosData.push(novoPosto);
            postosNovos++;
        }
    });
    
    console.log(`📊 Resultado: ${matchesEncontrados} matches, ${postosNovos} novos postos`);
    
    // Salvar dados
    salvarPostos(postosData);
    abastecimentosData = abastecimentos;
    salvarAbastecimentos(abastecimentos);
    
    // Atualizar variável global
    window.postosData = postosData;
    
    console.log(`✅ Total: ${postosData.length} postos no sistema`);
    
    return postosData;
}

function parseDataBR(dataStr, horaStr) {
    if (!dataStr) return new Date(0);
    
    try {
        const partes = dataStr.split('/');
        if (partes.length === 3) {
            const dia = parseInt(partes[0]);
            const mes = parseInt(partes[1]) - 1;
            const ano = parseInt(partes[2]);
            
            let hora = 0, min = 0;
            if (horaStr) {
                const ph = horaStr.split(':');
                hora = parseInt(ph[0]) || 0;
                min = parseInt(ph[1]) || 0;
            }
            
            return new Date(ano, mes, dia, hora, min);
        }
    } catch (e) {}
    
    return new Date(0);
}

function extrairBairroDoEndereco(endereco) {
    if (!endereco) return 'Centro';
    
    const endLower = endereco.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    for (const [bairro, coords] of Object.entries(coordenadasBairros)) {
        const bairroNorm = bairro.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (endLower.includes(bairroNorm)) {
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
    
    // Primeiro tentar localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.POSTOS);
    if (saved) {
        try {
            postosData = JSON.parse(saved);
            if (postosData.length > 0) {
                console.log(`✅ ${postosData.length} postos do localStorage`);
                window.postosData = postosData;
                return postosData;
            }
        } catch (e) {}
    }
    
    // Depois tentar JSON
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
                
                console.log(`✅ ${postosData.length} postos do JSON`);
                salvarPostos(postosData);
                window.postosData = postosData;
                return postosData;
            }
        }
    } catch (error) {
        console.warn('Erro ao carregar JSON:', error);
    }
    
    return [];
}

// ==========================================
// STORAGE
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
    
    postosData = [];
    return postosData;
}

function salvarPostos(postos) {
    try {
        postosData = postos;
        window.postosData = postos;
        localStorage.setItem(STORAGE_KEYS.POSTOS, JSON.stringify(postos));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
        console.log(`💾 ${postos.length} postos salvos`);
        return true;
    } catch (e) {
        console.error('Erro ao salvar:', e);
        return false;
    }
}

function carregarAbastecimentos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.ABASTECIMENTOS);
        if (saved) {
            abastecimentosData = JSON.parse(saved);
            window.abastecimentosData = abastecimentosData;
            return abastecimentosData;
        }
    } catch (e) {}
    
    return [];
}

function salvarAbastecimentos(dados) {
    try {
        abastecimentosData = dados;
        window.abastecimentosData = dados;
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
    window.abastecimentosData = [];
}

// ==========================================
// GEOCODIFICAÇÃO
// ==========================================

function obterCoordenadasPorBairro(bairro) {
    if (!bairro) return null;
    
    const bairroNorm = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    
    for (const [key, coords] of Object.entries(coordenadasBairros)) {
        const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (bairroNorm.includes(keyNorm) || keyNorm.includes(bairroNorm)) {
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
    
    if (endereco?.logradouro) {
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
            return sorted.sort((a, b) => {
                const pA = a.precos?.gasolina || 999;
                const pB = b.precos?.gasolina || 999;
                return pA - pB;
            });
        case 'price_eth':
            return sorted.sort((a, b) => {
                const pA = a.precos?.etanol || 999;
                const pB = b.precos?.etanol || 999;
                return pA - pB;
            });
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
    
    let maisBaratoGasolina = null, maisCaroGasolina = null;
    let maisBaratoEtanol = null, maisCaroEtanol = null;
    
    if (postosComGasolina.length > 0) {
        maisBaratoGasolina = postosComGasolina.reduce((min, p) => 
            p.precos.gasolina < min.precos.gasolina ? p : min);
        maisCaroGasolina = postosComGasolina.reduce((max, p) => 
            p.precos.gasolina > max.precos.gasolina ? p : max);
    }
    
    if (postosComEtanol.length > 0) {
        maisBaratoEtanol = postosComEtanol.reduce((min, p) => 
            p.precos.etanol < min.precos.etanol ? p : min);
        maisCaroEtanol = postosComEtanol.reduce((max, p) => 
            p.precos.etanol > max.precos.etanol ? p : max);
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
        'ALE': '#0066CC',
        'BANDEIRA BRANCA': '#6B7280'
    };
    
    return cores[b] || '#6B7280';
}

async function carregarDadosANP() {
    // Dados já definidos
    return anpData;
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
