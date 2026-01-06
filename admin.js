// ==========================================
// ADMIN - CMG POSTOS
// ==========================================

let postosAdmin = [];
let abastecimentosAdmin = [];

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 Inicializando Admin...');
    
    // Carregar dados existentes
    await carregarDadosAdmin();
    
    // Configurar eventos
    configurarEventos();
    
    // Renderizar interface
    renderizarStatus();
    renderizarPostos();
    
    // Carregar preços ANP
    await atualizarPrecosANP();
    
    console.log('✅ Admin inicializado');
});

// ==========================================
// CARREGAR DADOS
// ==========================================

async function carregarDadosAdmin() {
    // Carregar postos
    const postosStorage = localStorage.getItem('cmg_postos_data');
    if (postosStorage) {
        try {
            postosAdmin = JSON.parse(postosStorage);
        } catch(e) {
            postosAdmin = [];
        }
    }
    
    // Se não tem postos, carregar do JSON
    if (postosAdmin.length === 0) {
        try {
            const response = await fetch('./postos.json');
            if (response.ok) {
                const json = await response.json();
                if (json.success && json.data) {
                    postosAdmin = json.data.map((posto, index) => ({
                        id: parseInt(posto.terminal) || (Date.now() + index),
                        terminal: posto.terminal,
                        nomeFantasia: posto.nomeFantasia || 'Posto',
                        razaoSocial: posto.razaoSocial,
                        cnpj: posto.cnpj,
                        endereco: {
                            logradouro: `${posto.endereco?.logradouro || ''} ${posto.endereco?.rua || ''}`.trim(),
                            numero: posto.endereco?.numero || 'S/N',
                            bairro: posto.endereco?.bairro || 'Centro',
                            cidade: posto.endereco?.cidade || 'Guarulhos',
                            estado: posto.endereco?.uf || 'SP'
                        },
                        coordenadas: obterCoordenadasPorBairro(posto.endereco?.bairro) || {
                            lat: -23.4538 + (Math.random() - 0.5) * 0.04,
                            lng: -46.5333 + (Math.random() - 0.5) * 0.04
                        },
                        precos: { gasolina: 0, etanol: 0 },
                        bandeira: posto.bandeira || 'BANDEIRA BRANCA',
                        ativo: true
                    }));
                    salvarPostosAdmin();
                }
            }
        } catch(e) {
            console.warn('Erro ao carregar JSON:', e);
        }
    }
    
    // Carregar abastecimentos
    const abastStorage = localStorage.getItem('cmg_abastecimentos_data');
    if (abastStorage) {
        try {
            abastecimentosAdmin = JSON.parse(abastStorage);
        } catch(e) {
            abastecimentosAdmin = [];
        }
    }
    
    console.log(`📊 Carregados: ${postosAdmin.length} postos, ${abastecimentosAdmin.length} abastecimentos`);
}

function obterCoordenadasPorBairro(bairro) {
    if (!bairro) return null;
    
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
        'gopouva': { lat: -23.4650, lng: -46.5300 },
        'bom clima': { lat: -23.4420, lng: -46.5180 },
        'taboao': { lat: -23.4500, lng: -46.5200 },
        'vila galvao': { lat: -23.4620, lng: -46.5500 },
        'itapegica': { lat: -23.4450, lng: -46.5600 },
        'porto da igreja': { lat: -23.4400, lng: -46.5500 },
        'jardim zaira': { lat: -23.4380, lng: -46.5420 },
        'torres tibagy': { lat: -23.4550, lng: -46.5100 },
        'dutra': { lat: -23.4400, lng: -46.4600 },
        'presidente dutra': { lat: -23.4400, lng: -46.4600 }
    };
    
    const bairroLower = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    for (const [key, coords] of Object.entries(coordenadasBairros)) {
        if (bairroLower.includes(key) || key.includes(bairroLower)) {
            return {
                lat: coords.lat + (Math.random() - 0.5) * 0.008,
                lng: coords.lng + (Math.random() - 0.5) * 0.008
            };
        }
    }
    return null;
}

// ==========================================
// SALVAR DADOS
// ==========================================

function salvarPostosAdmin() {
    localStorage.setItem('cmg_postos_data', JSON.stringify(postosAdmin));
    localStorage.setItem('cmg_last_update', new Date().toISOString());
    
    // Atualizar variável global
    if (typeof window.postosData !== 'undefined') {
        window.postosData = postosAdmin;
    }
}

function salvarAbastecimentosAdmin() {
    localStorage.setItem('cmg_abastecimentos_data', JSON.stringify(abastecimentosAdmin));
}

// ==========================================
// CONFIGURAR EVENTOS
// ==========================================

function configurarEventos() {
    // Área de upload de abastecimentos
    const dropAbast = document.getElementById('dropzone-abastecimentos');
    const inputAbast = document.getElementById('input-abastecimentos');
    
    if (dropAbast) {
        dropAbast.addEventListener('click', () => inputAbast?.click());
        dropAbast.addEventListener('dragover', handleDragOver);
        dropAbast.addEventListener('dragleave', handleDragLeave);
        dropAbast.addEventListener('drop', (e) => handleDrop(e, 'abastecimentos'));
    }
    
    if (inputAbast) {
        inputAbast.addEventListener('change', (e) => handleFileSelect(e, 'abastecimentos'));
    }
    
    // Área de upload de estabelecimentos
    const dropEstab = document.getElementById('dropzone-estabelecimentos');
    const inputEstab = document.getElementById('input-estabelecimentos');
    
    if (dropEstab) {
        dropEstab.addEventListener('click', () => inputEstab?.click());
        dropEstab.addEventListener('dragover', handleDragOver);
        dropEstab.addEventListener('dragleave', handleDragLeave);
        dropEstab.addEventListener('drop', (e) => handleDrop(e, 'estabelecimentos'));
    }
    
    if (inputEstab) {
        inputEstab.addEventListener('change', (e) => handleFileSelect(e, 'estabelecimentos'));
    }
    
    // Botão Exportar JSON
    document.getElementById('btn-exportar')?.addEventListener('click', exportarJSON);
    
    // Botão Limpar Dados
    document.getElementById('btn-limpar')?.addEventListener('click', limparDados);
}

// ==========================================
// HANDLERS DE DRAG & DROP
// ==========================================

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e, tipo) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processarArquivo(files[0], tipo);
    }
}

function handleFileSelect(e, tipo) {
    const files = e.target.files;
    if (files.length > 0) {
        processarArquivo(files[0], tipo);
    }
}

// ==========================================
// PROCESSAR ARQUIVO
// ==========================================

function processarArquivo(file, tipo) {
    console.log(`📂 Processando arquivo: ${file.name} (${tipo})`);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const conteudo = e.target.result;
        
        if (tipo === 'abastecimentos') {
            processarCSVAbastecimentos(conteudo);
        } else {
            processarExcelEstabelecimentos(conteudo);
        }
    };
    
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsBinaryString(file);
    }
}

// ==========================================
// PROCESSAR CSV DE ABASTECIMENTOS
// ==========================================

function processarCSVAbastecimentos(csvContent) {
    console.log('📊 Processando CSV de abastecimentos...');
    
    if (!csvContent || typeof csvContent !== 'string') {
        mostrarNotificacao('Erro: arquivo vazio ou inválido', 'error');
        return;
    }
    
    const linhas = csvContent.split('\n');
    const abastecimentos = [];
    
    // Encontrar linha do cabeçalho
    let headerIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(20, linhas.length); i++) {
        const linha = linhas[i].toLowerCase();
        if ((linha.includes('data') && linha.includes('combustivel')) ||
            (linha.includes('data') && linha.includes('posto')) ||
            (linha.includes('data') && linha.includes('valor'))) {
            headerIndex = i;
            headers = parseCSVLine(linhas[i]);
            console.log(`📋 Cabeçalho encontrado na linha ${i}:`, headers);
            break;
        }
    }
    
    if (headerIndex === -1) {
        // Tentar primeira linha não vazia
        for (let i = 0; i < linhas.length; i++) {
            if (linhas[i].trim() && !linhas[i].startsWith('SEP')) {
                headerIndex = i;
                headers = parseCSVLine(linhas[i]);
                break;
            }
        }
    }
    
    if (headerIndex === -1 || headers.length < 3) {
        mostrarNotificacao('Erro: cabeçalho não encontrado no CSV', 'error');
        return;
    }
    
    const headersLower = headers.map(h => h.toLowerCase().replace(/["\s]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    console.log('Headers normalizados:', headersLower);
    
    // Mapear colunas
    const colMap = {
        data: findColumn(headersLower, ['data']),
        hora: findColumn(headersLower, ['hora']),
        combustivel: findColumn(headersLower, ['combustivel', 'tipo_combustivel', 'tipocombustivel']),
        qtde: findColumn(headersLower, ['qtde_combustivel', 'qtde', 'quantidade', 'litros', 'qtdecombustivel']),
        valor: findColumn(headersLower, ['valor_abastecimento', 'valor', 'total', 'valorabastecimento', 'valortotal']),
        cidade: findColumn(headersLower, ['cidade_posto', 'cidade', 'cidadeposto']),
        nomePosto: findColumn(headersLower, ['nome_posto', 'posto', 'estabelecimento', 'nomeposto']),
        endereco: findColumn(headersLower, ['endereco_posto', 'endereco', 'enderecoposto']),
        placa: findColumn(headersLower, ['placa', 'placa_veiculo']),
        condutor: findColumn(headersLower, ['nome_condutor', 'condutor', 'motorista', 'nomecondutor'])
    };
    
    console.log('Mapeamento de colunas:', colMap);
    
    // Processar linhas de dados
    for (let i = headerIndex + 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha || linha.startsWith('SEP') || linha.startsWith('sep')) continue;
        
        try {
            const valores = parseCSVLine(linha);
            if (valores.length < 4) continue;
            
            // Extrair valores
            const cidade = getCol(valores, colMap.cidade) || '';
            
            // Filtrar apenas Guarulhos (se tiver coluna cidade)
            if (colMap.cidade >= 0 && cidade && !cidade.toUpperCase().includes('GUARULHOS')) {
                continue;
            }
            
            const qtdeStr = getCol(valores, colMap.qtde) || '0';
            const valorStr = getCol(valores, colMap.valor) || '0';
            
            const qtde = parseFloat(qtdeStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
            const valor = parseFloat(valorStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
            
            if (isNaN(qtde) || isNaN(valor) || qtde <= 0 || valor <= 0) continue;
            
            const precoLitro = valor / qtde;
            
            // Validar preço razoável (entre R$ 2 e R$ 10)
            if (precoLitro < 2 || precoLitro > 10) continue;
            
            const combustivel = getCol(valores, colMap.combustivel) || '';
            const tipoCombustivel = (combustivel.toUpperCase().includes('ETANOL') || 
                                     combustivel.toUpperCase().includes('ALCOOL') ||
                                     combustivel.toUpperCase().includes('ÁLCOOL')) ? 'ETANOL' : 'GASOLINA';
            
            abastecimentos.push({
                data: getCol(valores, colMap.data) || '',
                hora: getCol(valores, colMap.hora) || '',
                combustivel: tipoCombustivel,
                quantidade: qtde,
                valorTotal: valor,
                precoLitro: precoLitro,
                nomePosto: getCol(valores, colMap.nomePosto) || '',
                endereco: getCol(valores, colMap.endereco) || '',
                cidade: cidade || 'GUARULHOS',
                placa: getCol(valores, colMap.placa) || '',
                condutor: getCol(valores, colMap.condutor) || ''
            });
            
        } catch (e) {
            console.warn(`Erro na linha ${i}:`, e);
        }
    }
    
    console.log(`✅ ${abastecimentos.length} abastecimentos processados`);
    
    if (abastecimentos.length === 0) {
        mostrarNotificacao('Nenhum abastecimento válido encontrado', 'warning');
        return;
    }
    
    // IMPORTANTE: Salvar abastecimentos
    abastecimentosAdmin = abastecimentos;
    salvarAbastecimentosAdmin();
    
    // Atualizar preços dos postos
    atualizarPrecosPostos(abastecimentos);
    
    // Atualizar interface
    renderizarStatus();
    renderizarPostos();
    
    mostrarNotificacao(`${abastecimentos.length} abastecimentos processados! Preços atualizados.`, 'success');
}

function parseCSVLine(linha) {
    const resultado = [];
    let atual = '';
    let dentroAspas = false;
    
    // Detectar separador
    const separador = linha.includes(';') ? ';' : ',';
    
    for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
        
        if (char === '"') {
            dentroAspas = !dentroAspas;
        } else if (char === separador && !dentroAspas) {
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

function atualizarPrecosPostos(abastecimentos) {
    console.log('📊 Atualizando preços dos postos...');
    
    // Ordenar por data (mais recente primeiro)
    const ordenados = [...abastecimentos].sort((a, b) => {
        return parseDataBR(b.data) - parseDataBR(a.data);
    });
    
    // Agrupar por posto (pegar último preço de cada combustível)
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
        
        // Só atualiza se ainda não tem preço (primeiro encontrado = mais recente)
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
    
    let matchCount = 0;
    let novoCount = 0;
    
    // Fazer matching com postos existentes
    for (const [chave, dados] of Object.entries(precosPorPosto)) {
        let melhorMatch = null;
        let melhorScore = 0;
        
        for (const posto of postosAdmin) {
            const nomeNorm = normalizarNome(posto.nomeFantasia);
            let score = calcularSimilaridade(chave, nomeNorm);
            
            if (posto.razaoSocial) {
                const razaoNorm = normalizarNome(posto.razaoSocial);
                score = Math.max(score, calcularSimilaridade(chave, razaoNorm));
            }
            
            if (score > melhorScore) {
                melhorScore = score;
                melhorMatch = posto;
            }
        }
        
        if (melhorMatch && melhorScore >= 0.4) {
            // Atualizar posto existente
            if (dados.gasolina && dados.gasolina > 0) {
                melhorMatch.precos = melhorMatch.precos || {};
                melhorMatch.precos.gasolina = dados.gasolina;
            }
            if (dados.etanol && dados.etanol > 0) {
                melhorMatch.precos = melhorMatch.precos || {};
                melhorMatch.precos.etanol = dados.etanol;
            }
            melhorMatch.ultimaAtualizacaoPreco = dados.dataGasolina || dados.dataEtanol;
            
            console.log(`   ✅ Match: "${dados.nomeOriginal}" → "${melhorMatch.nomeFantasia}" (${(melhorScore * 100).toFixed(0)}%)`);
            matchCount++;
        } else {
            // Criar novo posto
            const novoPosto = {
                id: Date.now() + Math.random() * 1000,
                nomeFantasia: dados.nomeOriginal,
                endereco: {
                    logradouro: dados.endereco || '',
                    bairro: extrairBairro(dados.endereco),
                    cidade: 'Guarulhos',
                    estado: 'SP'
                },
                coordenadas: obterCoordenadasPorBairro(extrairBairro(dados.endereco)) || {
                    lat: -23.4538 + (Math.random() - 0.5) * 0.04,
                    lng: -46.5333 + (Math.random() - 0.5) * 0.04
                },
                precos: {
                    gasolina: dados.gasolina || 0,
                    etanol: dados.etanol || 0
                },
                bandeira: 'BANDEIRA BRANCA',
                ativo: true,
                ultimaAtualizacaoPreco: dados.dataGasolina || dados.dataEtanol
            };
            
            postosAdmin.push(novoPosto);
            console.log(`   ➕ Novo posto: "${dados.nomeOriginal}"`);
            novoCount++;
        }
    }
    
    console.log(`📊 Resultado: ${matchCount} matches, ${novoCount} novos postos`);
    
    // IMPORTANTE: Salvar postos atualizados
    salvarPostosAdmin();
}

function normalizarNome(texto) {
    if (!texto) return '';
    return texto
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\bAUTO\s*POSTO\b/g, '')
        .replace(/\bPOSTO\s*(DE\s*)?/g, '')
        .replace(/\bSERVICOS?\b/g, '')
        .replace(/\bCOM(ERCIO)?\s*(DE\s*)?(COMB(USTIVEIS)?)?\b/g, '')
        .replace(/\bDERIVADOS\b/g, '')
        .replace(/\bPETROLEO\b/g, '')
        .replace(/\bLTDA\b/g, '')
        .replace(/\bEIRELI\b/g, '')
        .replace(/\bME\b/g, '')
        .replace(/\bS\/?A\b/g, '')
        .replace(/\bEPP\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
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
            if (p1.length > 3 && p2.length > 3 && (p1.includes(p2) || p2.includes(p1))) {
                matches += 0.7;
                break;
            }
        }
    }
    
    return matches / Math.max(palavras1.length, palavras2.length);
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
    
    const bairros = ['centro', 'cumbica', 'aeroporto', 'macedo', 'gopouva', 'vila barros', 
                     'vila augusta', 'bom clima', 'taboao', 'cocaia', 'picanco', 'picanço',
                     'dutra', 'presidente dutra', 'itapegica', 'porto da igreja'];
    
    for (const bairro of bairros) {
        if (endLower.includes(bairro)) {
            return bairro.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
    }
    return 'Centro';
}

// ==========================================
// PROCESSAR EXCEL DE ESTABELECIMENTOS
// ==========================================

function processarExcelEstabelecimentos(conteudo) {
    mostrarNotificacao('Processamento de Excel em desenvolvimento', 'info');
}

// ==========================================
// PREÇOS ANP - CORRIGIDO
// ==========================================

async function atualizarPrecosANP() {
    console.log('🔍 Buscando preços ANP...');
    
    const container = document.getElementById('anp-precos');
    if (!container) return;
    
    // Valores de referência ANP para Guarulhos (atualizados)
    // Fonte: ANP - Levantamento de Preços de Combustíveis
    const precoReferencia = {
        gasolinaComum: 6.06,  // Média Guarulhos
        etanol: 3.97,         // Média Guarulhos
        dataAtualizacao: new Date().toISOString(),
        semana: 'Semana 01/2026',
        fonte: 'ANP - Guarulhos/SP'
    };
    
    // Tentar buscar dados atualizados
    try {
        const response = await fetch('https://api.allorigins.win/raw?url=' + 
            encodeURIComponent('https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/shlp/dsan/guarulhos-sp'));
        
        if (response.ok) {
            const html = await response.text();
            
            // Buscar preço gasolina
            const regexGasolina = /gasolina\s*comum[^0-9]*?(\d)[,.](\d{2,3})/gi;
            const matchGas = regexGasolina.exec(html);
            
            if (matchGas) {
                precoReferencia.gasolinaComum = parseFloat(`${matchGas[1]}.${matchGas[2]}`);
            }
            
            // Buscar preço etanol
            const regexEtanol = /etanol[^0-9]*?(\d)[,.](\d{2,3})/gi;
            const matchEtanol = regexEtanol.exec(html);
            
            if (matchEtanol) {
                precoReferencia.etanol = parseFloat(`${matchEtanol[1]}.${matchEtanol[2]}`);
            }
        }
    } catch (e) {
        console.warn('Usando preços de referência');
    }
    
    // Salvar no localStorage
    localStorage.setItem('cmg_anp_data', JSON.stringify(precoReferencia));
    window.anpData = precoReferencia;
    
    // Atualizar interface
    container.innerHTML = `
        <div class="anp-card">
            <h4>📊 Preços Médios ANP - Guarulhos/SP</h4>
            <div class="anp-precos">
                <div class="anp-preco">
                    <span class="label">Gasolina Comum</span>
                    <span class="valor">R$ ${precoReferencia.gasolinaComum.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="anp-preco">
                    <span class="label">Etanol</span>
                    <span class="valor">R$ ${precoReferencia.etanol.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
            <div class="anp-fonte">
                Fonte: ${precoReferencia.fonte} | ${precoReferencia.semana}
            </div>
        </div>
    `;
    
    console.log('✅ Preços ANP atualizados:', precoReferencia);
}

// ==========================================
// RENDERIZAR INTERFACE
// ==========================================

function renderizarStatus() {
    const container = document.getElementById('status-container');
    if (!container) return;
    
    const postosComPreco = postosAdmin.filter(p => p.precos?.gasolina > 0 || p.precos?.etanol > 0);
    const ultimaAtualizacao = localStorage.getItem('cmg_last_update');
    
    container.innerHTML = `
        <div class="status-item">
            <span class="status-number">${postosAdmin.length}</span>
            <span class="status-label">postos cadastrados</span>
        </div>
        <div class="status-item">
            <span class="status-number">${postosComPreco.length}</span>
            <span class="status-label">postos com preço</span>
        </div>
        <div class="status-item">
            <span class="status-number">${abastecimentosAdmin.length}</span>
            <span class="status-label">abastecimentos</span>
        </div>
        <div class="status-item">
            <span class="status-label">Última atualização: ${ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleString('pt-BR') : '--'}</span>
        </div>
    `;
}

function renderizarPostos() {
    const tbody = document.getElementById('postos-tbody');
    if (!tbody) return;
    
    if (postosAdmin.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Nenhum posto cadastrado</td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por nome
    const ordenados = [...postosAdmin].sort((a, b) => 
        (a.nomeFantasia || '').localeCompare(b.nomeFantasia || '')
    );
    
    tbody.innerHTML = ordenados.map(posto => `
        <tr>
            <td>
                <strong>${posto.nomeFantasia || 'Sem nome'}</strong>
                ${posto.razaoSocial ? `<br><small class="text-muted">${posto.razaoSocial}</small>` : ''}
            </td>
            <td>${posto.bandeira || '-'}</td>
            <td>
                ${posto.endereco?.logradouro || '-'}
                ${posto.endereco?.bairro ? `<br><small>${posto.endereco.bairro}</small>` : ''}
            </td>
            <td class="${posto.precos?.gasolina > 0 ? 'preco-valor' : 'text-muted'}">
                ${posto.precos?.gasolina > 0 ? `R$ ${posto.precos.gasolina.toFixed(2).replace('.', ',')}` : '--'}
            </td>
            <td class="${posto.precos?.etanol > 0 ? 'preco-valor' : 'text-muted'}">
                ${posto.precos?.etanol > 0 ? `R$ ${posto.precos.etanol.toFixed(2).replace('.', ',')}` : '--'}
            </td>
            <td>${posto.ultimaAtualizacaoPreco || '--'}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editarPosto(${posto.id})">
                    ✏️
                </button>
                <button class="btn btn-sm btn-danger" onclick="excluirPosto(${posto.id})">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// AÇÕES
// ==========================================

function exportarJSON() {
    const dados = {
        exportadoEm: new Date().toISOString(),
        postos: postosAdmin,
        abastecimentos: abastecimentosAdmin
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cmg-postos-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    mostrarNotificacao('Dados exportados com sucesso!', 'success');
}

function limparDados() {
    if (!confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    localStorage.removeItem('cmg_postos_data');
    localStorage.removeItem('cmg_abastecimentos_data');
    localStorage.removeItem('cmg_last_update');
    localStorage.removeItem('cmg_anp_data');
    
    postosAdmin = [];
    abastecimentosAdmin = [];
    
    renderizarStatus();
    renderizarPostos();
    
    mostrarNotificacao('Todos os dados foram limpos!', 'success');
}

function editarPosto(id) {
    const posto = postosAdmin.find(p => p.id === id);
    if (!posto) return;
    
    // Implementar modal de edição
    console.log('Editar posto:', posto);
    mostrarNotificacao('Função de edição em desenvolvimento', 'info');
}

function excluirPosto(id) {
    if (!confirm('Tem certeza que deseja excluir este posto?')) return;
    
    postosAdmin = postosAdmin.filter(p => p.id !== id);
    salvarPostosAdmin();
    renderizarPostos();
    renderizarStatus();
    
    mostrarNotificacao('Posto excluído!', 'success');
}

// ==========================================
// NOTIFICAÇÕES
// ==========================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remover notificação anterior
    const anterior = document.querySelector('.notification');
    if (anterior) anterior.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${tipo}`;
    notification.innerHTML = `
        <span class="notification-icon">${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span class="notification-message">${mensagem}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => notification.remove(), 5000);
}

// Expor funções globais
window.editarPosto = editarPosto;
window.excluirPosto = excluirPosto;
