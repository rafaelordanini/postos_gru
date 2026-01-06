// ==========================================
// ADMIN - CMG POSTOS - VERSÃO CORRIGIDA
// Estabelecimentos: dados cadastrais
// Abastecimentos: preços de combustíveis
// ==========================================

let postosAdmin = [];
let abastecimentosAdmin = [];
let estabelecimentosImportados = [];

// ==========================================
// MAPEAMENTO DE NOMES (CSV -> XLSX)
// ==========================================

const MAPEAMENTO_NOMES = {
    // Nome no CSV de Abastecimentos : Nome no XLSX de Estabelecimentos
    'AUTO POSTO COCAIA': 'AUTO POSTO COCAIA',
    'POSTO COCAIA': 'POSTO COCAIA',
    'AUTO POSTO GUARULHOS': 'AUTO POSTO GUARULHOS',
    'AUTO POSTO R66 LTDA': 'AUTO POSTO R66 LTDA',
    'AUTO POSTO VILA BARROS LTDA': 'AUTO POSTO VILA BARROS LTDA',
    'AUTO POSTO PORTAL DE GUARULHOS': 'AUTO POSTO PORTAL DE GUARULHOS',
    'AUTO POSTO BEQUIA': 'AUTO POSTO BEQUIA',
    'AUTO POSTO FERRARI': 'AUTO POSTO FERRARI',
    'AUTO POSTO CARROSEL': 'AUTO POSTO CARROSEL',
    'AUTO POSTO CRUZEIRO DO SUL': 'AUTO POSTO CRUZEIRO DO SUL',
    'CRUZEIRO DO SUL POSTO DE SERVICO LT': 'CRUZEIRO DO SUL POSTO DE SERVICO LT',
    'POSTO SAKAMOTO I': 'POSTO SAKAMOTO I',
    'POSTO NAZARE': 'POSTO NAZARE',
    'POSTO GRAN JK': 'POSTO GRAN JK',
    'POSTO DE SERVICOS VILA PARAISO': 'POSTO DE SERVICOS VILA PARAISO',
    'LAGO DE COMO': 'LAGO DE COMO',
    'LUIZ XII': 'LUIZ XII',
    'DUQUE POSTO RODOVIA PRESIDENTE DUTRA LTDA': 'DUQUE POSTO RODOVIA PRESIDENTE DUTRA LTDA',
    'SPEEDY AUTO POSTO LTDA': 'SPEEDY AUTO POSTO LTDA', // Não existe no XLSX - será ignorado ou criado
    'AEROCAR COMBUSTIVEIS': 'AEROCAR COMBUSTIVEIS',
    'POSTO PEDRAO': 'POSTO PEDRAO',
    'POSTO MESTRE': 'POSTO MESTRE',
    'AUTO POSTO MANCINI': 'AUTO POSTO MANCINI',
    'AUTO POSTO TIO BILY LTDA': 'AUTO POSTO TIO BILY LTDA',
    'ISIKAWA': 'ISIKAWA' // Posto em São Paulo - será filtrado
};

// ==========================================
// COORDENADAS POR BAIRRO
// ==========================================

const COORDENADAS_BAIRROS = {
    'centro': { lat: -23.4538, lng: -46.5333 },
    'aeroporto': { lat: -23.4356, lng: -46.4731 },
    'aeroporto internacional de guarulhos': { lat: -23.4356, lng: -46.4731 },
    'cumbica': { lat: -23.4400, lng: -46.4800 },
    'cocaia': { lat: -23.4750, lng: -46.5450 },
    'vila barros': { lat: -23.4520, lng: -46.5150 },
    'vila augusta': { lat: -23.4580, lng: -46.5280 },
    'macedo': { lat: -23.4700, lng: -46.5400 },
    'jardim presidente dutra': { lat: -23.4550, lng: -46.4650 },
    'vila florida': { lat: -23.4480, lng: -46.5100 },
    'vila florida': { lat: -23.4480, lng: -46.5100 },
    'jardim santa francisca': { lat: -23.4600, lng: -46.5250 },
    'jd santa francisca': { lat: -23.4600, lng: -46.5250 },
    'picanco': { lat: -23.4680, lng: -46.5380 },
    'picanço': { lat: -23.4680, lng: -46.5380 },
    'gopouva': { lat: -23.4650, lng: -46.5300 },
    'bom clima': { lat: -23.4420, lng: -46.5180 },
    'taboao': { lat: -23.4500, lng: -46.5200 },
    'vila galvao': { lat: -23.4620, lng: -46.5500 },
    'vl galvao': { lat: -23.4620, lng: -46.5500 },
    'itapegica': { lat: -23.4450, lng: -46.5600 },
    'porto da igreja': { lat: -23.4400, lng: -46.5500 },
    'jardim zaira': { lat: -23.4380, lng: -46.5420 },
    'torres tibagy': { lat: -23.4550, lng: -46.5100 },
    'cidade industrial satelite': { lat: -23.4650, lng: -46.4900 },
    'cidade industrial satelite de sao paulo': { lat: -23.4650, lng: -46.4900 },
    'vila das bandeiras': { lat: -23.4550, lng: -46.5200 },
    'parque estrela': { lat: -23.4500, lng: -46.5100 },
    'jardim albertina': { lat: -23.4800, lng: -46.5000 },
    'cidade martins': { lat: -23.4600, lng: -46.5400 },
    'jardim moreira': { lat: -23.4550, lng: -46.5300 },
    'vila paraiso': { lat: -23.4700, lng: -46.5200 },
    'cidade serodio': { lat: -23.4650, lng: -46.5100 },
    'vila anny': { lat: -23.4750, lng: -46.4800 },
    'jardim nova taboao': { lat: -23.4600, lng: -46.5350 },
    'varzea do palacio': { lat: -23.4400, lng: -46.4700 },
    'varzia do palacio': { lat: -23.4400, lng: -46.4700 },
    'parque sao miguel': { lat: -23.4850, lng: -46.5100 },
    'zona industrial': { lat: -23.4700, lng: -46.4850 }
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 Inicializando Admin...');
    
    await carregarDadosAdmin();
    configurarEventos();
    renderizarStatus();
    renderizarPostos();
    
    console.log('✅ Admin inicializado');
});

// ==========================================
// CARREGAR DADOS DO LOCALSTORAGE
// ==========================================

async function carregarDadosAdmin() {
    // Carregar postos salvos
    const postosStorage = localStorage.getItem('cmg_postos_data');
    if (postosStorage) {
        try {
            postosAdmin = JSON.parse(postosStorage);
        } catch(e) {
            postosAdmin = [];
        }
    }
    
    // Carregar abastecimentos salvos
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

// ==========================================
// SALVAR DADOS
// ==========================================

function salvarPostosAdmin() {
    localStorage.setItem('cmg_postos_data', JSON.stringify(postosAdmin));
    localStorage.setItem('cmg_last_update', new Date().toISOString());
    
    // Sincronizar com variável global do mapa
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
    // Dropzone Abastecimentos (CSV)
    const dropAbast = document.getElementById('dropzone-abastecimentos');
    const inputAbast = document.getElementById('input-abastecimentos');
    
    if (dropAbast && inputAbast) {
        dropAbast.addEventListener('click', () => inputAbast.click());
        dropAbast.addEventListener('dragover', handleDragOver);
        dropAbast.addEventListener('dragleave', handleDragLeave);
        dropAbast.addEventListener('drop', (e) => handleDrop(e, 'abastecimentos'));
        inputAbast.addEventListener('change', (e) => handleFileSelect(e, 'abastecimentos'));
    }
    
    // Dropzone Estabelecimentos (XLSX)
    const dropEstab = document.getElementById('dropzone-estabelecimentos');
    const inputEstab = document.getElementById('input-estabelecimentos');
    
    if (dropEstab && inputEstab) {
        dropEstab.addEventListener('click', () => inputEstab.click());
        dropEstab.addEventListener('dragover', handleDragOver);
        dropEstab.addEventListener('dragleave', handleDragLeave);
        dropEstab.addEventListener('drop', (e) => handleDrop(e, 'estabelecimentos'));
        inputEstab.addEventListener('change', (e) => handleFileSelect(e, 'estabelecimentos'));
    }
    
    // Botões
    document.getElementById('btn-exportar')?.addEventListener('click', exportarJSON);
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
    
    if (tipo === 'estabelecimentos') {
        // XLSX - usar FileReader com ArrayBuffer
        const reader = new FileReader();
        reader.onload = function(e) {
            processarXLSXEstabelecimentos(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    } else {
        // CSV - usar FileReader com texto
        const reader = new FileReader();
        reader.onload = function(e) {
            processarCSVAbastecimentos(e.target.result);
        };
        reader.readAsText(file, 'UTF-8');
    }
}

// ==========================================
// PROCESSAR XLSX DE ESTABELECIMENTOS
// Fonte principal dos dados cadastrais
// ==========================================

function processarXLSXEstabelecimentos(arrayBuffer) {
    console.log('📊 Processando XLSX de Estabelecimentos...');
    
    try {
        // Verificar se SheetJS está disponível
        if (typeof XLSX === 'undefined') {
            mostrarNotificacao('Erro: Biblioteca XLSX não carregada', 'error');
            return;
        }
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`📋 Linhas no XLSX: ${dados.length}`);
        
        // Encontrar linha do cabeçalho (procurar por "Terminal")
        let headerIndex = -1;
        let headers = [];
        
        for (let i = 0; i < Math.min(20, dados.length); i++) {
            const linha = dados[i];
            if (linha && linha.some(cell => String(cell).toUpperCase().includes('TERMINAL'))) {
                headerIndex = i;
                headers = linha.map(h => String(h || '').trim());
                console.log(`📋 Cabeçalho encontrado na linha ${i}:`, headers);
                break;
            }
        }
        
        if (headerIndex === -1) {
            mostrarNotificacao('Erro: Cabeçalho não encontrado no XLSX', 'error');
            return;
        }
        
        // Mapear colunas
        const colMap = {
            terminal: findColumnIndex(headers, ['Terminal']),
            nomeFantasia: findColumnIndex(headers, ['Nome Fantasia']),
            razaoSocial: findColumnIndex(headers, ['Razão Social', 'Razao Social']),
            cnpj: findColumnIndex(headers, ['CNPJ']),
            inscricaoEstadual: findColumnIndex(headers, ['Inscrição Estadual', 'Inscricao Estadual']),
            cep: findColumnIndex(headers, ['CEP']),
            logradouro: findColumnIndex(headers, ['Logradouro']),
            endereco: findColumnIndex(headers, ['Endereço', 'Endereco']),
            numero: findColumnIndex(headers, ['Número', 'Numero']),
            bairro: findColumnIndex(headers, ['Bairro']),
            uf: findColumnIndex(headers, ['UF']),
            cidade: findColumnIndex(headers, ['Cidade']),
            contato: findColumnIndex(headers, ['Contato']),
            telefone: findColumnIndex(headers, ['Telefone']),
            email: findColumnIndex(headers, ['E-mail', 'Email']),
            bandeira: findColumnIndex(headers, ['Bandeira']),
            tipo: findColumnIndex(headers, ['Tipo']),
            horario: findColumnIndex(headers, ['Horario Funcionamento', 'Horário Funcionamento']),
            ultimaTransacao: findColumnIndex(headers, ['Data da Última Transação', 'Data da Ultima Transacao'])
        };
        
        console.log('Mapeamento de colunas:', colMap);
        
        // Processar linhas de dados
        const estabelecimentos = [];
        
        for (let i = headerIndex + 1; i < dados.length; i++) {
            const linha = dados[i];
            if (!linha || linha.length < 5) continue;
            
            const terminal = getCell(linha, colMap.terminal);
            const nomeFantasia = getCell(linha, colMap.nomeFantasia);
            const cidade = getCell(linha, colMap.cidade);
            
            // Validar dados mínimos
            if (!terminal || !nomeFantasia) continue;
            
            // Filtrar apenas Guarulhos
            if (cidade && !cidade.toUpperCase().includes('GUARULHOS')) {
                continue;
            }
            
            const bairro = getCell(linha, colMap.bairro) || '';
            const coordenadas = obterCoordenadasPorBairro(bairro);
            
            const estabelecimento = {
                id: parseInt(terminal) || Date.now() + i,
                terminal: terminal,
                nomeFantasia: nomeFantasia,
                razaoSocial: getCell(linha, colMap.razaoSocial) || '',
                cnpj: getCell(linha, colMap.cnpj) || '',
                inscricaoEstadual: getCell(linha, colMap.inscricaoEstadual) || '',
                endereco: {
                    cep: getCell(linha, colMap.cep) || '',
                    logradouro: getCell(linha, colMap.logradouro) || '',
                    rua: getCell(linha, colMap.endereco) || '',
                    numero: getCell(linha, colMap.numero) || 'S/N',
                    bairro: bairro,
                    cidade: cidade || 'Guarulhos',
                    estado: getCell(linha, colMap.uf) || 'SP'
                },
                coordenadas: coordenadas,
                contato: getCell(linha, colMap.contato) || '',
                telefone: getCell(linha, colMap.telefone) || '',
                email: getCell(linha, colMap.email) || '',
                bandeira: normalizarBandeira(getCell(linha, colMap.bandeira)),
                tipo: getCell(linha, colMap.tipo) || 'POSTO',
                horarioFuncionamento: getCell(linha, colMap.horario) || '',
                ultimaTransacao: getCell(linha, colMap.ultimaTransacao) || '',
                precos: {
                    gasolina: 0,
                    etanol: 0
                },
                ativo: true
            };
            
            estabelecimentos.push(estabelecimento);
        }
        
        console.log(`✅ ${estabelecimentos.length} estabelecimentos processados do XLSX`);
        
        if (estabelecimentos.length === 0) {
            mostrarNotificacao('Nenhum estabelecimento válido encontrado', 'warning');
            return;
        }
        
        // Salvar estabelecimentos como postos
        estabelecimentosImportados = estabelecimentos;
        postosAdmin = estabelecimentos;
        
        // Se já temos abastecimentos, atualizar preços
        if (abastecimentosAdmin.length > 0) {
            atualizarPrecosDosPosto();
        }
        
        salvarPostosAdmin();
        renderizarStatus();
        renderizarPostos();
        
        mostrarNotificacao(`${estabelecimentos.length} estabelecimentos importados com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao processar XLSX:', error);
        mostrarNotificacao('Erro ao processar arquivo XLSX: ' + error.message, 'error');
    }
}

// ==========================================
// PROCESSAR CSV DE ABASTECIMENTOS
// Fonte dos preços de combustíveis
// ==========================================

function processarCSVAbastecimentos(csvContent) {
    console.log('📊 Processando CSV de Abastecimentos...');
    
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
        if (linha.includes('data') && linha.includes('combustivel')) {
            headerIndex = i;
            headers = parseCSVLine(linhas[i]);
            console.log(`📋 Cabeçalho encontrado na linha ${i}:`, headers);
            break;
        }
    }
    
    if (headerIndex === -1) {
        mostrarNotificacao('Erro: cabeçalho não encontrado no CSV', 'error');
        return;
    }
    
    // Normalizar headers
    const headersLower = headers.map(h => 
        h.toLowerCase()
         .replace(/["\s]/g, '')
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '')
    );
    
    // Mapear colunas
    const colMap = {
        data: findColumnCSV(headersLower, ['data']),
        hora: findColumnCSV(headersLower, ['hora']),
        combustivel: findColumnCSV(headersLower, ['combustivel']),
        qtde: findColumnCSV(headersLower, ['qtde_combustivel_abastecido', 'qtde']),
        valor: findColumnCSV(headersLower, ['valor_abastecimento', 'valor']),
        cidade: findColumnCSV(headersLower, ['cidade_posto']),
        nomePosto: findColumnCSV(headersLower, ['nome_posto']),
        endereco: findColumnCSV(headersLower, ['endereco_posto']),
        placa: findColumnCSV(headersLower, ['placa']),
        condutor: findColumnCSV(headersLower, ['nome_condutor'])
    };
    
    console.log('Mapeamento de colunas CSV:', colMap);
    
    // Processar linhas de dados
    for (let i = headerIndex + 1; i < linhas.length; i++) {
        const linha = linhas[i].trim();
        if (!linha || linha.startsWith('SEP')) continue;
        
        try {
            const valores = parseCSVLine(linha);
            if (valores.length < 4) continue;
            
            const cidade = getColCSV(valores, colMap.cidade) || '';
            
            // Filtrar apenas Guarulhos
            if (colMap.cidade >= 0 && cidade && !cidade.toUpperCase().includes('GUARULHOS')) {
                continue;
            }
            
            const qtdeStr = getColCSV(valores, colMap.qtde) || '0';
            const valorStr = getColCSV(valores, colMap.valor) || '0';
            
            const qtde = parseFloat(qtdeStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
            const valor = parseFloat(valorStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
            
            if (isNaN(qtde) || isNaN(valor) || qtde <= 0 || valor <= 0) continue;
            
            const precoLitro = valor / qtde;
            
            // Validar preço razoável (entre R$ 2 e R$ 12)
            if (precoLitro < 2 || precoLitro > 12) continue;
            
            const combustivel = getColCSV(valores, colMap.combustivel) || '';
            const tipoCombustivel = normalizarCombustivel(combustivel);
            
            const nomePosto = getColCSV(valores, colMap.nomePosto) || '';
            const dataStr = getColCSV(valores, colMap.data) || '';
            const horaStr = getColCSV(valores, colMap.hora) || '';
            
            abastecimentos.push({
                data: dataStr,
                hora: horaStr,
                dataHora: parseDataHoraBR(dataStr, horaStr),
                combustivel: tipoCombustivel,
                quantidade: qtde,
                valorTotal: valor,
                precoLitro: precoLitro,
                nomePosto: nomePosto.trim(),
                nomePostoNormalizado: normalizarNomePosto(nomePosto),
                endereco: getColCSV(valores, colMap.endereco) || '',
                cidade: cidade || 'GUARULHOS',
                placa: getColCSV(valores, colMap.placa) || '',
                condutor: getColCSV(valores, colMap.condutor) || ''
            });
            
        } catch (e) {
            console.warn(`Erro na linha ${i}:`, e);
        }
    }
    
    console.log(`✅ ${abastecimentos.length} abastecimentos processados do CSV`);
    
    // Mostrar nomes únicos de postos
    const nomesUnicos = [...new Set(abastecimentos.map(ab => ab.nomePosto))].filter(n => n);
    console.log(`📍 Postos únicos no CSV: ${nomesUnicos.length}`, nomesUnicos);
    
    if (abastecimentos.length === 0) {
        mostrarNotificacao('Nenhum abastecimento válido encontrado', 'warning');
        return;
    }
    
    // Salvar abastecimentos
    abastecimentosAdmin = abastecimentos;
    salvarAbastecimentosAdmin();
    
    // Se já temos estabelecimentos, atualizar preços
    if (postosAdmin.length > 0) {
        atualizarPrecosDosPosto();
    }
    
    renderizarStatus();
    renderizarPostos();
    
    mostrarNotificacao(`${abastecimentos.length} abastecimentos importados de ${nomesUnicos.length} postos!`, 'success');
}

// ==========================================
// ATUALIZAR PREÇOS DOS POSTOS
// Usa o último abastecimento de cada posto como preço atual
// ==========================================

function atualizarPrecosDosPosto() {
    console.log('💰 Atualizando preços dos postos...');
    
    if (postosAdmin.length === 0) {
        console.warn('Nenhum posto cadastrado para atualizar preços');
        return;
    }
    
    if (abastecimentosAdmin.length === 0) {
        console.warn('Nenhum abastecimento para extrair preços');
        return;
    }
    
    // Ordenar abastecimentos por data (mais recente primeiro)
    const abastOrdenados = [...abastecimentosAdmin].sort((a, b) => {
        return (b.dataHora || 0) - (a.dataHora || 0);
    });
    
    // Criar mapa de preços mais recentes por posto
    // Chave: nome normalizado do posto
    // Valor: { gasolina: preço, etanol: preço, dataGasolina: data, dataEtanol: data }
    const precosPorPosto = {};
    
    for (const ab of abastOrdenados) {
        const nomeNorm = ab.nomePostoNormalizado;
        if (!nomeNorm) continue;
        
        if (!precosPorPosto[nomeNorm]) {
            precosPorPosto[nomeNorm] = {
                nomeOriginal: ab.nomePosto,
                gasolina: null,
                etanol: null,
                dataGasolina: null,
                dataEtanol: null
            };
        }
        
        // Só atualiza se ainda não tem preço (primeiro encontrado = mais recente)
        if (ab.combustivel === 'GASOLINA' && precosPorPosto[nomeNorm].gasolina === null) {
            precosPorPosto[nomeNorm].gasolina = ab.precoLitro;
            precosPorPosto[nomeNorm].dataGasolina = ab.data;
        }
        if (ab.combustivel === 'ETANOL' && precosPorPosto[nomeNorm].etanol === null) {
            precosPorPosto[nomeNorm].etanol = ab.precoLitro;
            precosPorPosto[nomeNorm].dataEtanol = ab.data;
        }
    }
    
    console.log(`📍 Preços extraídos de ${Object.keys(precosPorPosto).length} postos únicos`);
    
    // Atualizar preços nos postos cadastrados
    let atualizados = 0;
    let naoEncontrados = [];
    
    for (const posto of postosAdmin) {
        const nomePostoNorm = normalizarNomePosto(posto.nomeFantasia);
        
        // Tentar encontrar match direto
        let precos = precosPorPosto[nomePostoNorm];
        
        // Se não encontrou, tentar match parcial
        if (!precos) {
            precos = encontrarPrecosPorSimilaridade(posto.nomeFantasia, precosPorPosto);
        }
        
        if (precos) {
            posto.precos = posto.precos || {};
            
            if (precos.gasolina !== null) {
                posto.precos.gasolina = Math.round(precos.gasolina * 100) / 100;
            }
            if (precos.etanol !== null) {
                posto.precos.etanol = Math.round(precos.etanol * 100) / 100;
            }
            
            posto.ultimaAtualizacaoPreco = precos.dataGasolina || precos.dataEtanol;
            atualizados++;
            
            console.log(`   ✅ ${posto.nomeFantasia}: G=${posto.precos.gasolina || '-'} | E=${posto.precos.etanol || '-'}`);
        } else {
            naoEncontrados.push(posto.nomeFantasia);
        }
    }
    
    console.log(`📊 Resultado: ${atualizados} postos atualizados`);
    
    if (naoEncontrados.length > 0) {
        console.log(`⚠️ Postos sem preços (${naoEncontrados.length}):`, naoEncontrados);
    }
    
    // Salvar postos atualizados
    salvarPostosAdmin();
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function findColumnIndex(headers, nomes) {
    for (let i = 0; i < headers.length; i++) {
        const headerLower = headers[i].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const nome of nomes) {
            const nomeLower = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (headerLower === nomeLower || headerLower.includes(nomeLower)) {
                return i;
            }
        }
    }
    return -1;
}

function findColumnCSV(headers, nomes) {
    for (let i = 0; i < headers.length; i++) {
        for (const nome of nomes) {
            const nomeNorm = nome.replace(/_/g, '');
            if (headers[i] === nomeNorm || headers[i].includes(nomeNorm)) {
                return i;
            }
        }
    }
    return -1;
}

function getCell(linha, index) {
    if (index < 0 || index >= linha.length) return '';
    const valor = linha[index];
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
}

function getColCSV(valores, index) {
    if (index < 0 || index >= valores.length) return '';
    return (valores[index] || '').trim().replace(/^"|"$/g, '');
}

function parseCSVLine(linha) {
    const resultado = [];
    let atual = '';
    let dentroAspas = false;
    
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

function normalizarNomePosto(nome) {
    if (!nome) return '';
    
    return nome
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^A-Z0-9\s]/g, ' ')    // Remove caracteres especiais
        .replace(/\s+/g, ' ')             // Múltiplos espaços -> um
        .trim();
}

function normalizarCombustivel(combustivel) {
    const comb = combustivel.toUpperCase();
    if (comb.includes('ETANOL') || comb.includes('ALCOOL') || comb.includes('ÁLCOOL')) {
        return 'ETANOL';
    }
    return 'GASOLINA';
}

function normalizarBandeira(bandeira) {
    if (!bandeira || bandeira === 'N/A') return 'BANDEIRA BRANCA';
    return bandeira.toUpperCase();
}

function parseDataHoraBR(dataStr, horaStr) {
    try {
        // Formato: DD/MM/YYYY HH:MM:SS
        const partes = dataStr.split('/');
        if (partes.length !== 3) return 0;
        
        const dia = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const ano = parseInt(partes[2]);
        
        let hora = 0, minuto = 0, segundo = 0;
        if (horaStr) {
            const partesHora = horaStr.split(':');
            hora = parseInt(partesHora[0]) || 0;
            minuto = parseInt(partesHora[1]) || 0;
            segundo = parseInt(partesHora[2]) || 0;
        }
        
        return new Date(ano, mes, dia, hora, minuto, segundo).getTime();
    } catch (e) {
        return 0;
    }
}

function obterCoordenadasPorBairro(bairro) {
    if (!bairro) {
        return {
            lat: -23.4538 + (Math.random() - 0.5) * 0.04,
            lng: -46.5333 + (Math.random() - 0.5) * 0.04
        };
    }
    
    const bairroLower = bairro.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    
    // Tentar match exato
    if (COORDENADAS_BAIRROS[bairroLower]) {
        const coords = COORDENADAS_BAIRROS[bairroLower];
        return {
            lat: coords.lat + (Math.random() - 0.5) * 0.003,
            lng: coords.lng + (Math.random() - 0.5) * 0.003
        };
    }
    
    // Tentar match parcial
    for (const [key, coords] of Object.entries(COORDENADAS_BAIRROS)) {
        if (bairroLower.includes(key) || key.includes(bairroLower)) {
            return {
                lat: coords.lat + (Math.random() - 0.5) * 0.003,
                lng: coords.lng + (Math.random() - 0.5) * 0.003
            };
        }
    }
    
    // Fallback: coordenadas aleatórias em Guarulhos
    return {
        lat: -23.4538 + (Math.random() - 0.5) * 0.04,
        lng: -46.5333 + (Math.random() - 0.5) * 0.04
    };
}

function encontrarPrecosPorSimilaridade(nomePosto, precosPorPosto) {
    const nomeNorm = normalizarNomePosto(nomePosto);
    
    // Extrair palavras significativas (ignorar termos genéricos)
    const termosIgnorar = ['AUTO', 'POSTO', 'DE', 'SERVICOS', 'LTDA', 'E', 'COMERCIO', 'COMBUSTIVEIS'];
    const palavrasNome = nomeNorm.split(' ').filter(p => p.length > 2 && !termosIgnorar.includes(p));
    
    let melhorMatch = null;
    let melhorScore = 0;
    
    for (const [chave, precos] of Object.entries(precosPorPosto)) {
        const palavrasChave = chave.split(' ').filter(p => p.length > 2 && !termosIgnorar.includes(p));
        
        // Contar palavras em comum
        let matches = 0;
        for (const p1 of palavrasNome) {
            for (const p2 of palavrasChave) {
                if (p1 === p2) {
                    matches++;
                    break;
                }
            }
        }
        
        // Calcular score
        const score = palavrasNome.length > 0 ? matches / palavrasNome.length : 0;
        
        if (score > melhorScore && score >= 0.5) {
            melhorScore = score;
            melhorMatch = precos;
        }
    }
    
    return melhorMatch;
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================

function renderizarStatus() {
    const statusEl = document.getElementById('status-dados');
    if (!statusEl) return;
    
    const postosComPreco = postosAdmin.filter(p => p.precos?.gasolina > 0 || p.precos?.etanol > 0);
    const ultimaAtualizacao = localStorage.getItem('cmg_last_update');
    
    statusEl.innerHTML = `
        <div class="status-item">
            <span class="status-label">Postos cadastrados:</span>
            <span class="status-value">${postosAdmin.length}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Postos com preço:</span>
            <span class="status-value">${postosComPreco.length}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Abastecimentos:</span>
            <span class="status-value">${abastecimentosAdmin.length}</span>
        </div>
        <div class="status-item">
            <span class="status-label">Última atualização:</span>
            <span class="status-value">${ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleString('pt-BR') : 'Nunca'}</span>
        </div>
    `;
}

function renderizarPostos() {
    const listaEl = document.getElementById('lista-postos');
    if (!listaEl) return;
    
    if (postosAdmin.length === 0) {
        listaEl.innerHTML = '<p class="empty-message">Nenhum posto cadastrado. Importe a planilha de estabelecimentos.</p>';
        return;
    }
    
    // Ordenar por nome
    const postosOrdenados = [...postosAdmin].sort((a, b) => 
        (a.nomeFantasia || '').localeCompare(b.nomeFantasia || '')
    );
    
    listaEl.innerHTML = postosOrdenados.map(posto => `
        <div class="posto-item ${posto.precos?.gasolina > 0 ? 'com-preco' : 'sem-preco'}">
            <div class="posto-info">
                <strong>${posto.nomeFantasia || 'Sem nome'}</strong>
                <span class="posto-bandeira">${posto.bandeira || 'BANDEIRA BRANCA'}</span>
                <span class="posto-endereco">${posto.endereco?.bairro || ''} - ${posto.endereco?.rua || posto.endereco?.logradouro || ''}</span>
            </div>
            <div class="posto-precos">
                <span class="preco gasolina" title="Gasolina">
                    ⛽ ${posto.precos?.gasolina > 0 ? 'R$ ' + posto.precos.gasolina.toFixed(2) : '-'}
                </span>
                <span class="preco etanol" title="Etanol">
                    🌿 ${posto.precos?.etanol > 0 ? 'R$ ' + posto.precos.etanol.toFixed(2) : '-'}
                </span>
            </div>
        </div>
    `).join('');
}

// ==========================================
// EXPORTAR E LIMPAR
// ==========================================

function exportarJSON() {
    if (postosAdmin.length === 0) {
        mostrarNotificacao('Nenhum dado para exportar', 'warning');
        return;
    }
    
    const dados = {
        success: true,
        generated: new Date().toISOString(),
        count: postosAdmin.length,
        data: postosAdmin
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `postos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    mostrarNotificacao('JSON exportado com sucesso!', 'success');
}

function limparDados() {
    if (!confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    postosAdmin = [];
    abastecimentosAdmin = [];
    estabelecimentosImportados = [];
    
    localStorage.removeItem('cmg_postos_data');
    localStorage.removeItem('cmg_abastecimentos_data');
    localStorage.removeItem('cmg_last_update');
    
    renderizarStatus();
    renderizarPostos();
    
    mostrarNotificacao('Dados limpos com sucesso!', 'success');
}

// ==========================================
// NOTIFICAÇÕES
// ==========================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remover notificação anterior
    const anterior = document.querySelector('.notificacao');
    if (anterior) anterior.remove();
    
    const div = document.createElement('div');
    div.className = `notificacao notificacao-${tipo}`;
    div.innerHTML = `
        <span>${mensagem}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(div);
    
    // Auto-remover após 5 segundos
    setTimeout(() => div.remove(), 5000);
}

// ==========================================
// EXPOR FUNÇÕES GLOBAIS
// ==========================================

window.adminPostos = {
    postos: () => postosAdmin,
    abastecimentos: () => abastecimentosAdmin,
    atualizar: atualizarPrecosDosPosto,
    exportar: exportarJSON,
    limpar: limparDados
};
