// ==========================================
// ADMIN - Gerenciamento de Postos
// ==========================================

let adminPostos = [];

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});

function initAdmin() {
    console.log('🔧 Iniciando painel admin...');
    
    // Carregar dados existentes
    carregarPostos();
    adminPostos = [...postosData];
    
    // Atualizar interface
    atualizarStatus();
    renderizarPostos();
    
    // Configurar drag and drop
    setupDropZones();
    
    console.log('✅ Admin inicializado');
}

function atualizarStatus() {
    const statusEl = document.getElementById('statusInfo');
    if (statusEl) {
        const ultima = getUltimaAtualizacao();
        statusEl.innerHTML = `
            <strong>${postosData.length}</strong> postos cadastrados<br>
            <small>Última atualização: ${ultima ? new Date(ultima).toLocaleString('pt-BR') : 'Nunca'}</small>
        `;
    }
}

// ==========================================
// DRAG AND DROP
// ==========================================

function setupDropZones() {
    const dropZones = document.querySelectorAll('.drop-zone');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const tipo = zone.dataset.tipo;
                processarArquivo(files[0], tipo);
            }
        });
        
        zone.addEventListener('click', () => {
            const input = zone.querySelector('input[type="file"]');
            if (input) input.click();
        });
    });
}

function handleFileSelect(input, tipo) {
    if (input.files && input.files[0]) {
        processarArquivo(input.files[0], tipo);
    }
}

// ==========================================
// PROCESSAMENTO DE ARQUIVOS
// ==========================================

async function processarArquivo(file, tipo) {
    console.log(`📁 Processando arquivo: ${file.name} (${tipo})`);
    
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        showAdminNotification('Formato inválido. Use .xlsx, .xls ou .csv', 'error');
        return;
    }
    
    showAdminLoading(true);
    
    try {
        if (tipo === 'estabelecimentos') {
            await processarPlanilhaEstabelecimentos(file);
        } else if (tipo === 'abastecimentos') {
            await processarPlanilhaAbastecimentos(file);
        }
    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        showAdminNotification('Erro ao processar arquivo: ' + error.message, 'error');
    } finally {
        showAdminLoading(false);
    }
}

async function processarPlanilhaEstabelecimentos(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                console.log('📊 Linhas encontradas:', json.length);
                
                // Encontrar linha de cabeçalho
                let headerIndex = -1;
                for (let i = 0; i < Math.min(10, json.length); i++) {
                    const row = json[i];
                    if (row && row.some(cell => {
                        const val = String(cell || '').toLowerCase();
                        return val.includes('terminal') || val.includes('nome fantasia') || val.includes('cnpj');
                    })) {
                        headerIndex = i;
                        break;
                    }
                }
                
                if (headerIndex === -1) {
                    throw new Error('Cabeçalho não encontrado. Verifique se a planilha tem as colunas corretas.');
                }
                
                const headers = json[headerIndex].map(h => String(h || '').toLowerCase().trim());
                console.log('📋 Cabeçalhos:', headers);
                
                // Mapear colunas
                const colMap = {
                    terminal: findColumnIndex(headers, ['terminal', 'cod', 'codigo']),
                    nomeFantasia: findColumnIndex(headers, ['nome fantasia', 'fantasia', 'nome']),
                    razaoSocial: findColumnIndex(headers, ['razao social', 'razão social', 'razao']),
                    cnpj: findColumnIndex(headers, ['cnpj', 'cpf/cnpj']),
                    cep: findColumnIndex(headers, ['cep']),
                    logradouro: findColumnIndex(headers, ['logradouro', 'tipo logradouro']),
                    endereco: findColumnIndex(headers, ['endereco', 'endereço', 'rua']),
                    numero: findColumnIndex(headers, ['numero', 'número', 'nro', 'num']),
                    bairro: findColumnIndex(headers, ['bairro']),
                    cidade: findColumnIndex(headers, ['cidade', 'municipio', 'município']),
                    uf: findColumnIndex(headers, ['uf', 'estado']),
                    telefone: findColumnIndex(headers, ['telefone', 'tel', 'fone']),
                    email: findColumnIndex(headers, ['email', 'e-mail']),
                    bandeira: findColumnIndex(headers, ['bandeira', 'rede']),
                    horario: findColumnIndex(headers, ['horario', 'horário', 'funcionamento'])
                };
                
                console.log('🗺️ Mapeamento de colunas:', colMap);
                
                // Processar linhas de dados
                const novosPostos = [];
                
                for (let i = headerIndex + 1; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length === 0) continue;
                    
                    const terminal = getCell(row, colMap.terminal);
                    const nomeFantasia = getCell(row, colMap.nomeFantasia);
                    
                    // Pular linhas sem terminal ou nome
                    if (!terminal && !nomeFantasia) continue;
                    
                    const bairro = getCell(row, colMap.bairro) || 'Centro';
                    const coords = obterCoordenadasPorBairro(bairro);
                    
                    const posto = {
                        id: parseInt(terminal) || (Date.now() + i),
                        terminal: terminal,
                        nomeFantasia: nomeFantasia || `Posto ${terminal}`,
                        razaoSocial: getCell(row, colMap.razaoSocial),
                        cnpj: getCell(row, colMap.cnpj),
                        telefone: getCell(row, colMap.telefone),
                        email: getCell(row, colMap.email),
                        endereco: {
                            logradouro: `${getCell(row, colMap.logradouro)} ${getCell(row, colMap.endereco)}`.trim(),
                            numero: getCell(row, colMap.numero) || 'S/N',
                            bairro: bairro,
                            cidade: getCell(row, colMap.cidade) || 'Guarulhos',
                            estado: getCell(row, colMap.uf) || 'SP',
                            cep: getCell(row, colMap.cep)
                        },
                        coordenadas: coords ? {
                            lat: coords.lat + (Math.random() - 0.5) * 0.008,
                            lng: coords.lng + (Math.random() - 0.5) * 0.008
                        } : {
                            lat: -23.4538 + (Math.random() - 0.5) * 0.04,
                            lng: -46.5333 + (Math.random() - 0.5) * 0.04
                        },
                        precos: { gasolina: 0, etanol: 0 },
                        bandeira: normalizarBandeira(getCell(row, colMap.bandeira)),
                        horarioFuncionamento: getCell(row, colMap.horario),
                        is24h: verificar24hAdmin(getCell(row, colMap.horario)),
                        ativo: true,
                        dataImportacao: new Date().toISOString()
                    };
                    
                    novosPostos.push(posto);
                }
                
                console.log(`✅ ${novosPostos.length} postos processados`);
                
                if (novosPostos.length === 0) {
                    throw new Error('Nenhum posto válido encontrado na planilha.');
                }
                
                // Salvar
                postosData = novosPostos;
                adminPostos = novosPostos;
                salvarPostos(novosPostos);
                
                atualizarStatus();
                renderizarPostos();
                
                showAdminNotification(`${novosPostos.length} postos importados com sucesso!`, 'success');
                resolve(novosPostos);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
    });
}

async function processarPlanilhaAbastecimentos(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);
                
                console.log('📊 Abastecimentos encontrados:', json.length);
                
                // Processar e atualizar preços dos postos
                const precosAtualizados = {};
                
                json.forEach(row => {
                    const terminal = row['Terminal'] || row['terminal'] || row['Posto'];
                    const gasolina = parseFloat(row['Gasolina'] || row['Preço Gasolina'] || row['gasolina'] || 0);
                    const etanol = parseFloat(row['Etanol'] || row['Preço Etanol'] || row['etanol'] || 0);
                    
                    if (terminal) {
                        if (!precosAtualizados[terminal]) {
                            precosAtualizados[terminal] = { gasolina: [], etanol: [] };
                        }
                        if (gasolina > 0) precosAtualizados[terminal].gasolina.push(gasolina);
                        if (etanol > 0) precosAtualizados[terminal].etanol.push(etanol);
                    }
                });
                
                // Atualizar postos com média dos preços
                let atualizados = 0;
                Object.entries(precosAtualizados).forEach(([terminal, precos]) => {
                    const posto = postosData.find(p => p.terminal === terminal);
                    if (posto) {
                        if (precos.gasolina.length > 0) {
                            posto.precos.gasolina = precos.gasolina.reduce((a, b) => a + b) / precos.gasolina.length;
                        }
                        if (precos.etanol.length > 0) {
                            posto.precos.etanol = precos.etanol.reduce((a, b) => a + b) / precos.etanol.length;
                        }
                        posto.ultimaAtualizacaoPreco = new Date().toISOString();
                        atualizados++;
                    }
                });
                
                salvarPostos(postosData);
                adminPostos = [...postosData];
                renderizarPostos();
                
                showAdminNotification(`${atualizados} postos atualizados com preços!`, 'success');
                resolve(json);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
    });
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function findColumnIndex(headers, possibleNames) {
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        for (const name of possibleNames) {
            if (header && header.includes(name)) {
                return i;
            }
        }
    }
    return -1;
}

function getCell(row, index) {
    if (index === -1 || !row || index >= row.length) return '';
    const value = row[index];
    return value !== undefined && value !== null ? String(value).trim() : '';
}

function normalizarBandeira(bandeira) {
    if (!bandeira) return 'BANDEIRA BRANCA';
    
    const b = bandeira.toUpperCase().trim();
    
    const mapeamento = {
        'PETROBRAS': 'PETROBRAS',
        'BR': 'BR',
        'IPIRANGA': 'IPIRANGA',
        'SHELL': 'SHELL',
        'RAIZEN': 'RAÍZEN',
        'RAÍZEN': 'RAÍZEN',
        'ALE': 'ALE',
        'BRANCA': 'BANDEIRA BRANCA',
        'BANDEIRA BRANCA': 'BANDEIRA BRANCA',
        'N/A': 'BANDEIRA BRANCA',
        '': 'BANDEIRA BRANCA'
    };
    
    return mapeamento[b] || b;
}

function verificar24hAdmin(horario) {
    if (!horario) return false;
    const h = String(horario).toLowerCase();
    return h.includes('24') || h.includes('24h') || h.includes('24 horas');
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================

function renderizarPostos() {
    const container = document.getElementById('postosTable');
    if (!container) return;
    
    if (adminPostos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gas-pump"></i>
                <p>Nenhum posto cadastrado</p>
                <p>Importe uma planilha para começar</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Terminal</th>
                    <th>Nome</th>
                    <th>Bandeira</th>
                    <th>Bairro</th>
                    <th>Gasolina</th>
                    <th>Etanol</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    adminPostos.forEach(posto => {
        html += `
            <tr>
                <td>${posto.terminal || '-'}</td>
                <td>${posto.nomeFantasia || '-'}</td>
                <td><span class="badge" style="background: ${getBandeiraCor(posto.bandeira)}; color: white;">${posto.bandeira || 'N/A'}</span></td>
                <td>${posto.endereco?.bairro || '-'}</td>
                <td class="${getPrecoClass(posto.precos?.gasolina)}">
                    ${posto.precos?.gasolina ? `R$ ${posto.precos.gasolina.toFixed(2)}` : '--'}
                </td>
                <td class="${getPrecoClass(posto.precos?.etanol, 'etanol')}">
                    ${posto.precos?.etanol ? `R$ ${posto.precos.etanol.toFixed(2)}` : '--'}
                </td>
                <td>
                    <button onclick="editarPosto(${posto.id})" class="btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="excluirPosto(${posto.id})" class="btn-delete" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function getPrecoClass(preco, tipo = 'gasolina') {
    if (!preco || preco <= 0) return '';
    const limite = tipo === 'etanol' ? 3.97 : 6.06;
    const diff = ((preco - limite) / limite) * 100;
    if (diff > 1) return 'preco-alto';
    if (diff < -1) return 'preco-baixo';
    return '';
}

// ==========================================
// AÇÕES
// ==========================================

function editarPosto(id) {
    const posto = adminPostos.find(p => p.id === id);
    if (!posto) return;
    
    // Implementar modal de edição
    const novoPrecoGas = prompt(`Preço Gasolina para ${posto.nomeFantasia}:`, posto.precos?.gasolina || '');
    const novoPrecoEta = prompt(`Preço Etanol para ${posto.nomeFantasia}:`, posto.precos?.etanol || '');
    
    if (novoPrecoGas !== null) {
        const valor = parseFloat(novoPrecoGas);
        if (!isNaN(valor) && valor > 0) {
            posto.precos.gasolina = valor;
        }
    }
    
    if (novoPrecoEta !== null) {
        const valor = parseFloat(novoPrecoEta);
        if (!isNaN(valor) && valor > 0) {
            posto.precos.etanol = valor;
        }
    }
    
    posto.ultimaAtualizacaoPreco = new Date().toISOString();
    salvarPostos(postosData);
    renderizarPostos();
    showAdminNotification('Posto atualizado!', 'success');
}

function excluirPosto(id) {
    if (!confirm('Tem certeza que deseja excluir este posto?')) return;
    
    const index = postosData.findIndex(p => p.id === id);
    if (index > -1) {
        postosData.splice(index, 1);
        adminPostos = [...postosData];
        salvarPostos(postosData);
        atualizarStatus();
        renderizarPostos();
        showAdminNotification('Posto excluído!', 'success');
    }
}

function limparTodosDadosAdmin() {
    if (!confirm('ATENÇÃO: Isso excluirá TODOS os postos cadastrados. Continuar?')) return;
    
    limparTodosDados();
    adminPostos = [];
    atualizarStatus();
    renderizarPostos();
    showAdminNotification('Todos os dados foram limpos!', 'success');
}

function exportarJSON() {
    const dataStr = JSON.stringify(postosData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `postos_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    
    showAdminNotification('JSON exportado!', 'success');
}

// ==========================================
// NOTIFICAÇÕES
// ==========================================

function showAdminNotification(message, type = 'info') {
    const existing = document.querySelector('.admin-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showAdminLoading(show) {
    let overlay = document.getElementById('adminLoading');
    
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'adminLoading';
            overlay.className = 'admin-loading';
            overlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
    } else if (overlay) {
        overlay.classList.remove('active');
    }
}

// Exportar funções globais
window.handleFileSelect = handleFileSelect;
window.editarPosto = editarPosto;
window.excluirPosto = excluirPosto;
window.limparTodosDadosAdmin = limparTodosDadosAdmin;
window.exportarJSON = exportarJSON;
