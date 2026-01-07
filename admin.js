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
        'aeroporto internacional de guarulhos': { lat: -23.4356, lng: -46.4731 },
        'cumbica': { lat: -23.4400, lng: -46.4800 },
        'cocaia': { lat: -23.4750, lng: -46.5450 },
        'vila barros': { lat: -23.4520, lng: -46.5150 },
        'vila augusta': { lat: -23.4580, lng: -46.5280 },
        'macedo': { lat: -23.4700, lng: -46.5400 },
        'jardim presidente dutra': { lat: -23.4550, lng: -46.4650 },
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
        'dutra': { lat: -23.4400, lng: -46.4600 },
        'presidente dutra': { lat: -23.4400, lng: -46.4600 },
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
    
    // Botão Atualizar ANP
    document.getElementById('btn-atualizar-anp')?.addEventListener('click', atualizarPrecosANP);
    
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
    
    if (tipo === 'estabelecimentos') {
        // XLSX - precisa ler como ArrayBuffer para SheetJS
        reader.onload = function(e) {
            processarXLSXEstabelecimentos(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    } else {
        // CSV - ler como texto
        reader.onload = function(e) {
            processarCSVAbastecimentos(e.target.result);
        };
        reader.readAsText(file, 'UTF-8');
    }
}

// ==========================================
// PROCESSAR XLSX DE ESTABELECIMENTOS
// Fonte principal dos dados cadastrais dos postos
// ==========================================

function processarXLSXEstabelecimentos(arrayBuffer) {
    console.log('📊 Processando XLSX de Estabelecimentos...');
    
    try {
        // Verificar se SheetJS está disponível
        if (typeof XLSX === 'undefined') {
            mostrarNotificacao('Erro: Biblioteca XLSX não carregada. Adicione a biblioteca SheetJS.', 'error');
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
            
            const terminal = getCellXLSX(linha, colMap.terminal);
            const nomeFantasia = getCellXLSX(linha, colMap.nomeFantasia);
            const cidade = getCellXLSX(linha, colMap.cidade);
            
            // Validar dados mínimos
            if (!terminal || !nomeFantasia) continue;
            
            // Filtrar apenas Guarulhos
            if (cidade && !cidade.toUpperCase().includes('GUARULHOS')) {
                continue;
            }
            
            const bairro = getCellXLSX(linha, colMap.bairro) || '';
            const coordenadas = obterCoordenadasPorBairro(bairro) || {
                lat: -23.4538 + (Math.random() - 0.5) * 0.04,
                lng: -46.5333 + (Math.random() - 0.5) * 0.04
            };
            
            const bandeira = getCellXLSX(linha, colMap.bandeira) || '';
            
            const estabelecimento = {
                id: parseInt(terminal) || Date.now() + i,
                terminal: terminal,
                nomeFantasia: nomeFantasia,
                razaoSocial: getCellXLSX(linha, colMap.razaoSocial) || '',
                cnpj: getCellXLSX(linha, colMap.cnpj) || '',
                endereco: {
                    logradouro: `${getCellXLSX(linha, colMap.logradouro) || ''} ${getCellXLSX(linha, colMap.endereco) || ''}`.trim(),
                    numero: getCellXLSX(linha, colMap.numero) || 'S/N',
                    bairro: bairro,
                    cidade: cidade || 'Guarulhos',
                    estado: getCellXLSX(linha, colMap.uf) || 'SP',
                    cep: getCellXLSX(linha, colMap.cep) || ''
                },
                coordenadas: coordenadas,
                contato: getCellXLSX(linha, colMap.contato) || '',
                telefone: getCellXLSX(linha, colMap.telefone) || '',
                email: getCellXLSX(linha, colMap.email) || '',
                bandeira: (bandeira && bandeira !== 'N/A') ? bandeira.toUpperCase() : 'BANDEIRA BRANCA',
                horarioFuncionamento: getCellXLSX(linha, colMap.horario) || '',
                ultimaTransacao: getCellXLSX(linha, colMap.ultimaTransacao) || '',
                precos: { gasolina: 0, etanol: 0 },
                ativo: true
            };
            
            estabelecimentos.push(estabelecimento);
        }
        
        console.log(`✅ ${estabelecimentos.length} estabelecimentos processados do XLSX`);
        
        if (estabelecimentos.length === 0) {
            mostrarNotificacao('Nenhum estabelecimento válido encontrado', 'warning');
            return;
        }
        
        // Substituir postos pelos estabelecimentos importados
        postosAdmin = estabelecimentos;
        
        // Se já temos abastecimentos salvos, atualizar preços
        if (abastecimentosAdmin.length > 0) {
            atualizarPrecosPostos(abastecimentosAdmin);
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

function getCellXLSX(linha, index) {
    if (index < 0 || index >= linha.length) return '';
    const valor = linha[index];
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
}

// ==========================================
// PROCESSAR CSV DE ABASTECIMENTOS
// Fonte dos preços de combustíveis
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
    
    const headersLower = headers.map(h => h.toLowerCase().replace(/["\s_]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    console.log('Headers normalizados:', headersLower);
    
    // Mapear colunas
    const colMap = {
        data: findColumnExact(headersLower, ['data']),
        hora: findColumnExact(headersLower, ['hora']),
        combustivel: findColumnExact(headersLower, ['combustivel', 'tipo_combustivel', 'tipocombustivel']),
        qtde: findColumnExact(headersLower, ['qtde_combustivel_abastecido', 'qtde_combustivel', 'qtdecombustivel', 'qtde', 'quantidade', 'litros']),
        valor: findColumnExact(headersLower, ['valor_abastecimento', 'valorabastecimento', 'valortotal', 'valor', 'total']),
        cidade: findColumnExact(headersLower, ['cidade_posto', 'cidadeposto']),
        nomePosto: findColumnExact(headersLower, ['nome_posto', 'nomeposto']),
        endereco: findColumnExact(headersLower, ['endereco_posto', 'enderecoposto']),
        placa: findColumnExact(headersLower, ['placa', 'placa_veiculo']),
        condutor: findColumnExact(headersLower, ['nome_condutor', 'nomecondutor', 'condutor', 'motorista'])
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
            
            // Validar preço razoável (entre R$ 2 e R$ 12)
            if (precoLitro < 2 || precoLitro > 12) continue;
            
            const combustivel = getCol(valores, colMap.combustivel) || '';
            const tipoCombustivel = (combustivel.toUpperCase().includes('ETANOL') || 
                                     combustivel.toUpperCase().includes('ALCOOL') ||
                                     combustivel.toUpperCase().includes('ÁLCOOL')) ? 'ETANOL' : 'GASOLINA';
            
            const nomePosto = getCol(valores, colMap.nomePosto) || '';
            const dataStr = getCol(valores, colMap.data) || '';
            const horaStr = getCol(valores, colMap.hora) || '';
            
            abastecimentos.push({
                data: dataStr,
                hora: horaStr,
                dataHora: parseDataHoraBR(dataStr, horaStr),
                combustivel: tipoCombustivel,
                quantidade: qtde,
                valorTotal: valor,
                precoLitro: precoLitro,
                nomePosto: nomePosto,
                nomePostoNormalizado: normalizarNome(nomePosto),
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
    
    // Mostrar nomes únicos de postos encontrados
    const nomesUnicos = [...new Set(abastecimentos.map(ab => ab.nomePosto))].filter(n => n);
    console.log(`📍 Postos únicos encontrados: ${nomesUnicos.length}`, nomesUnicos);
    
    if (abastecimentos.length === 0) {
        mostrarNotificacao('Nenhum abastecimento válido encontrado', 'warning');
        return;
    }
    
    // Salvar abastecimentos
    abastecimentosAdmin = abastecimentos;
    salvarAbastecimentosAdmin();
    
    // Atualizar preços dos postos
    atualizarPrecosPostos(abastecimentos);
    
    // Atualizar interface
    renderizarStatus();
    renderizarPostos();
    
    mostrarNotificacao(`${abastecimentos.length} abastecimentos importados de ${nomesUnicos.length} postos!`, 'success');
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

function findColumnExact(headers, nomes) {
    // Primeiro: busca exata (prioridade máxima)
    for (let i = 0; i < headers.length; i++) {
        for (const nome of nomes) {
            const nomeNorm = nome.replace(/_/g, '');
            if (headers[i] === nomeNorm) {
                return i;
            }
        }
    }
    
    // Segundo: busca por inclusão completa
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

function getCol(valores, index) {
    if (index < 0 || index >= valores.length) return '';
    return (valores[index] || '').trim().replace(/^"|"$/g, '');
}

function parseDataHoraBR(dataStr, horaStr) {
    try {
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

// ==========================================
// ATUALIZAR PREÇOS DOS POSTOS
// Usa o último abastecimento de cada posto como preço atual
// ==========================================

function atualizarPrecosPostos(abastecimentos) {
    console.log('📊 Atualizando preços dos postos...');
    
    // Ordenar por data (mais recente primeiro)
    const ordenados = [...abastecimentos].sort((a, b) => {
        return (b.dataHora || parseDataBR(b.data)) - (a.dataHora || parseDataBR(a.data));
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
                melhorMatch.precos.gasolina = Math.round(dados.gasolina * 100) / 100;
            }
            if (dados.etanol && dados.etanol > 0) {
                melhorMatch.precos = melhorMatch.precos || {};
                melhorMatch.precos.etanol = Math.round(dados.etanol * 100) / 100;
            }
            melhorMatch.ultimaAtualizacaoPreco = dados.dataGasolina || dados.dataEtanol;
            
            console.log(`   ✅ Match: "${dados.nomeOriginal}" → "${melhorMatch.nomeFantasia}" (${(melhorScore * 100).toFixed(0)}%)`);
            matchCount++;
        } else {
            // Criar novo posto apenas se não temos postos importados do XLSX
            // Se temos postos do XLSX, não criar novos a partir dos abastecimentos
            if (postosAdmin.length === 0) {
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
                        gasolina: dados.gasolina ? Math.round(dados.gasolina * 100) / 100 : 0,
                        etanol: dados.etanol ? Math.round(dados.etanol * 100) / 100 : 0
                    },
                    bandeira: 'BANDEIRA BRANCA',
                    ativo: true,
                    ultimaAtualizacaoPreco: dados.dataGasolina || dados.dataEtanol
                };
                
                postosAdmin.push(novoPosto);
                console.log(`   ➕ Novo posto: "${dados.nomeOriginal}"`);
                novoCount++;
            } else {
                console.log(`   ⚠️ Sem match: "${dados.nomeOriginal}" (score: ${(melhorScore * 100).toFixed(0)}%)`);
            }
        }
    }
    
    console.log(`📊 Resultado: ${matchCount} matches, ${novoCount} novos postos`);
    
    // Salvar postos atualizados
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
// PREÇOS ANP - BUSCAR DE anp-gru.vercel.app
// ==========================================

async function atualizarPrecosANP() {
    console.log('🔍 Buscando preços ANP de anp-gru.vercel.app...');
    
    const container = document.getElementById('anp-precos');
    
    if (!container) return;
    
    let dadosANP = {
        gasolinaComum: null,
        etanol: null,
        diesel: null,
        gnv: null,
        periodo: null,
        fonte: null
    };
    
    try {
        const response = await fetch('https://anp-gru.vercel.app/prices.json');
        
        if (response.ok) {
            const dados = await response.json();
            
            if (dados.success && dados.data) {
                // Formatar período
                let periodo = '';
                if (dados.periodStart && dados.periodEnd) {
                    const inicio = dados.periodStart.split('-').reverse().join('/');
                    const fim = dados.periodEnd.split('-').reverse().join('/');
                    periodo = `${inicio} a ${fim}`;
                }
                
                dadosANP = {
                    gasolinaComum: dados.data.gasolinaComum,
                    etanol: dados.data.etanol,
                    diesel: dados.data.diesel,
                    gnv: dados.data.gnv,
                    periodo: periodo,
                    dataAtualizacao: dados.updatedAt,
                    fonte: 'ANP via anp-gru.vercel.app',
                    timestamp: new Date().toISOString()
                };
                
                // Salvar no localStorage
                localStorage.setItem('cmg_anp_data', JSON.stringify(dadosANP));
                window.anpData = dadosANP;
                
                console.log('✅ Preços ANP atualizados:', dadosANP);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao buscar preços ANP:', error);
    }
    
    // Renderizar interface
    const gasolinaDisplay = dadosANP.gasolinaComum 
        ? `R$ ${dadosANP.gasolinaComum.toFixed(2).replace('.', ',')}` 
        : '<span class="text-muted">Indisponível</span>';
    
    const etanolDisplay = dadosANP.etanol 
        ? `R$ ${dadosANP.etanol.toFixed(2).replace('.', ',')}` 
        : '<span class="text-muted">Indisponível</span>';
    
    const dieselDisplay = dadosANP.diesel 
        ? `R$ ${dadosANP.diesel.toFixed(2).replace('.', ',')}` 
        : '<span class="text-muted">--</span>';
    
    const gnvDisplay = dadosANP.gnv 
        ? `R$ ${dadosANP.gnv.toFixed(2).replace('.', ',')}` 
        : '<span class="text-muted">--</span>';
    
    container.innerHTML = `
        <div class="anp-card">
            <h4>📊 Preços Médios ANP - Guarulhos/SP</h4>
            <div class="anp-precos">
                <div class="anp-preco">
                    <span class="label">Gasolina Comum</span>
                    <span class="valor">${gasolinaDisplay}</span>
                </div>
                <div class="anp-preco">
                    <span class="label">Etanol</span>
                    <span class="valor">${etanolDisplay}</span>
                </div>
                <div class="anp-preco">
                    <span class="label">Diesel</span>
                    <span class="valor">${dieselDisplay}</span>
                </div>
                <div class="anp-preco">
                    <span class="label">GNV</span>
                    <span class="valor">${gnvDisplay}</span>
                </div>
            </div>
            <div class="anp-fonte">
                ${dadosANP.fonte ? `Fonte: <a href="https://anp-gru.vercel.app" target="_blank">${dadosANP.fonte}</a>` : 'Fonte: --'}
                ${dadosANP.periodo ? ` | Período: ${dadosANP.periodo}` : ''}
            </div>
            ${!dadosANP.gasolinaComum ? `
                <div class="anp-aviso" style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 0.85rem;">
                    ⚠️ Não foi possível carregar os preços. 
                    <a href="https://anp-gru.vercel.app" target="_blank">Consulte o site</a>
                </div>
            ` : ''}
        </div>
    `;
}

// ==========================================
// RENDERIZAR INTERFACE
// ==========================================

function renderizarStatus() {
    const container = document.getElementById('statusInfo');
    if (!container) return;
    
    const postosComPreco = postosAdmin.filter(p => p.precos?.gasolina > 0 || p.precos?.etanol > 0);
    const ultimaAtualizacao = localStorage.getItem('cmg_last_update');
    const anp = JSON.parse(localStorage.getItem('cmg_anp_data') || '{}');
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div style="text-align: center; padding: 15px; background: #e0f2fe; border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: bold; color: #0369a1;">${postosAdmin.length}</div>
                <div style="color: #666;">postos cadastrados</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #d1fae5; border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: bold; color: #047857;">${postosComPreco.length}</div>
                <div style="color: #666;">com preço</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #fef3c7; border-radius: 8px;">
                <div style="font-size: 2rem; font-weight: bold; color: #b45309;">${abastecimentosAdmin.length}</div>
                <div style="color: #666;">abastecimentos</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3e8ff; border-radius: 8px;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #7c3aed;">
                    ${anp.gasolinaComum ? 'R$ ' + anp.gasolinaComum.toFixed(2) : '--'}
                </div>
                <div style="color: #666;">ANP Gasolina</div>
            </div>
        </div>
        <div style="font-size: 0.85rem; color: #888;">
            Última atualização: ${ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleString('pt-BR') : '--'}
        </div>
    `;
}

function renderizarPostos() {
    const postosTable = document.getElementById('postosTable');
    if (!postosTable) return;
    
    if (postosAdmin.length === 0) {
        postosTable.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">Nenhum posto cadastrado</p>';
        return;
    }
    
    const ordenados = [...postosAdmin].sort((a, b) => 
        (a.nomeFantasia || '').localeCompare(b.nomeFantasia || '')
    );
    
    postosTable.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">Posto</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">Bandeira</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">Bairro</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">Gasolina</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">Etanol</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">Atualização</th>
                        <th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${ordenados.map(posto => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px;">
                                <strong>${posto.nomeFantasia || 'Sem nome'}</strong>
                                ${posto.razaoSocial ? `<br><small style="color: #888;">${posto.razaoSocial}</small>` : ''}
                            </td>
                            <td style="padding: 10px;">${posto.bandeira || '-'}</td>
                            <td style="padding: 10px;">${posto.endereco?.bairro || '-'}</td>
                            <td style="padding: 10px; font-weight: bold; color: ${posto.precos?.gasolina > 0 ? '#059669' : '#9ca3af'};">
                                ${posto.precos?.gasolina > 0 ? 'R$ ' + posto.precos.gasolina.toFixed(2) : '--'}
                            </td>
                            <td style="padding: 10px; font-weight: bold; color: ${posto.precos?.etanol > 0 ? '#059669' : '#9ca3af'};">
                                ${posto.precos?.etanol > 0 ? 'R$ ' + posto.precos.etanol.toFixed(2) : '--'}
                            </td>
                            <td style="padding: 10px; font-size: 0.8rem; color: #6b7280;">
                                ${posto.ultimaAtualizacaoPreco || '--'}
                            </td>
                            <td style="padding: 10px;">
                                <button onclick="excluirPosto(${posto.id})" 
                                        style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <p style="margin-top: 10px; font-size: 0.8rem; color: #888;">
            Mostrando ${ordenados.length} postos
        </p>
    `;
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
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background: ${tipo === 'success' ? '#d1fae5' : tipo === 'error' ? '#fee2e2' : tipo === 'warning' ? '#fef3c7' : '#e0f2fe'};
        color: ${tipo === 'success' ? '#065f46' : tipo === 'error' ? '#991b1b' : tipo === 'warning' ? '#92400e' : '#1e40af'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span style="flex: 1;">${mensagem}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.7;">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => notification.remove(), 5000);
}

// ==========================================
// EXPOR FUNÇÕES GLOBAIS
// ==========================================

window.editarPosto = editarPosto;
window.excluirPosto = excluirPosto;
