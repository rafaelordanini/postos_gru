// ==========================================
// ADMIN - Gerenciamento de Postos (CORRIGIDO)
// ==========================================

let adminPostos = [];

document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});

function initAdmin() {
    console.log('🔧 Iniciando painel admin...');
    
    // Carregar dados
    carregarPostos();
    carregarAbastecimentos();
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
        const stats = getEstatisticas();
        
        statusEl.innerHTML = `
            <strong>${postosData.length}</strong> postos cadastrados<br>
            <strong>${stats.postosComPreco}</strong> postos com preço<br>
            <strong>${abastecimentosData.length}</strong> abastecimentos<br>
            <small>Última atualização: ${ultima ? new Date(ultima).toLocaleString('pt-BR') : 'Nunca'}</small>
        `;
    }
}

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

async function processarArquivo(file, tipo) {
    console.log(`📁 Processando arquivo: ${file.name} (${tipo})`);
    
    const ext = file.name.split('.').pop().toLowerCase();
    
    showAdminLoading(true);
    
    try {
        if (tipo === 'abastecimentos') {
            if (ext === 'csv') {
                await processarCSVAbastecimentos(file);
            } else if (ext === 'xlsx' || ext === 'xls') {
                await processarExcelAbastecimentos(file);
            } else {
                throw new Error('Formato não suportado. Use .csv, .xlsx ou .xls');
            }
        } else if (tipo === 'estabelecimentos') {
            if (ext === 'xlsx' || ext === 'xls') {
                await processarPlanilhaEstabelecimentos(file);
            } else if (ext === 'csv') {
                await processarCSVEstabelecimentos(file);
            } else {
                throw new Error('Formato não suportado. Use .xlsx, .xls ou .csv');
            }
        }
    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        showAdminNotification('Erro: ' + error.message, 'error');
    } finally {
        showAdminLoading(false);
    }
}

// ==========================================
// PROCESSAR CSV DE ABASTECIMENTOS
// ==========================================

async function processarCSVAbastecimentos(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csvContent = e.target.result;
                
                console.log('📄 CSV carregado, processando...');
                
                // Processar CSV
                const abastecimentos = processarAbastecimentosCSV(csvContent);
                
                if (abastecimentos.length === 0) {
                    throw new Error('Nenhum abastecimento válido encontrado no arquivo.');
                }
                
                // Atualizar preços dos postos
                atualizarPrecosComAbastecimentos(abastecimentos);
                
                // Atualizar interface
                adminPostos = [...postosData];
                atualizarStatus();
                renderizarPostos();
                
                showAdminNotification(`✅ ${abastecimentos.length} abastecimentos processados!`, 'success');
                resolve(abastecimentos);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file, 'UTF-8');
    });
}

// ==========================================
// PROCESSAR EXCEL DE ABASTECIMENTOS
// ==========================================

async function processarExcelAbastecimentos(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                // Verificar se XLSX está disponível
                if (typeof XLSX === 'undefined') {
                    throw new Error('Biblioteca XLSX não carregada. Use arquivo CSV.');
                }
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                
                // Converter para CSV
                const csvContent = XLSX.utils.sheet_to_csv(sheet);
                
                // Processar como CSV
                const abastecimentos = processarAbastecimentosCSV(csvContent);
                
                if (abastecimentos.length === 0) {
                    throw new Error('Nenhum abastecimento válido encontrado.');
                }
                
                atualizarPrecosComAbastecimentos(abastecimentos);
                
                adminPostos = [...postosData];
                atualizarStatus();
                renderizarPostos();
                
                showAdminNotification(`✅ ${abastecimentos.length} abastecimentos processados!`, 'success');
                resolve(abastecimentos);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
    });
}

// ==========================================
// PROCESSAR PLANILHA DE ESTABELECIMENTOS
// ==========================================

async function processarPlanilhaEstabelecimentos(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                if (typeof XLSX === 'undefined') {
                    throw new Error('Biblioteca XLSX não carregada.');
                }
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                // Encontrar cabeçalho
                let headerIndex = -1;
                for (let i = 0; i < Math.min(10, json.length); i++) {
                    const row = json[i];
                    if (row && row.some(cell => {
                        const val = String(cell || '').toLowerCase();
                        return val.includes('terminal') || val.includes('nome fantasia');
                    })) {
                        headerIndex = i;
                        break;
                    }
                }
                
                if (headerIndex === -1) {
                    throw new Error('Cabeçalho não encontrado na planilha.');
                }
                
                const headers = json[headerIndex].map(h => String(h || '').toLowerCase().trim());
                
                const colMap = {
                    terminal: findColIndex(headers, ['terminal', 'cod']),
                    nomeFantasia: findColIndex(headers, ['nome fantasia', 'fantasia']),
                    cnpj: findColIndex(headers, ['cnpj']),
                    cep: findColIndex(headers, ['cep']),
                    logradouro: findColIndex(headers, ['logradouro', 'tipo logradouro']),
                    endereco: findColIndex(headers, ['endereco', 'endereço', 'rua']),
                    numero: findColIndex(headers, ['numero', 'número']),
                    bairro: findColIndex(headers, ['bairro']),
                    cidade: findColIndex(headers, ['cidade', 'municipio']),
                    uf: findColIndex(headers, ['uf', 'estado']),
                    telefone: findColIndex(headers, ['telefone']),
                    bandeira: findColIndex(headers, ['bandeira'])
                };
                
                const novosPostos = [];
                
                for (let i = headerIndex + 1; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length === 0) continue;
                    
                    const terminal = getCellValue(row, colMap.terminal);
                    const nomeFantasia = getCellValue(row, colMap.nomeFantasia);
                    
                    if (!terminal && !nomeFantasia) continue;
                    
                    const bairro = getCellValue(row, colMap.bairro) || 'Centro';
                    const coords = obterCoordenadasPorBairro(bairro);
                    
                    novosPostos.push({
                        id: parseInt(terminal) || (Date.now() + i),
                        terminal: terminal,
                        nomeFantasia: nomeFantasia || `Posto ${terminal}`,
                        cnpj: getCellValue(row, colMap.cnpj),
                        telefone: getCellValue(row, colMap.telefone),
                        endereco: {
                            logradouro: `${getCellValue(row, colMap.logradouro)} ${getCellValue(row, colMap.endereco)}`.trim(),
                            numero: getCellValue(row, colMap.numero) || 'S/N',
                            bairro: bairro,
                            cidade: getCellValue(row, colMap.cidade) || 'Guarulhos',
                            estado: getCellValue(row, colMap.uf) || 'SP',
                            cep: getCellValue(row, colMap.cep)
                        },
                        coordenadas: coords ? {
                            lat: coords.lat + (Math.random() - 0.5) * 0.008,
                            lng: coords.lng + (Math.random() - 0.5) * 0.008
                        } : {
                            lat: -23.4538 + (Math.random() - 0.5) * 0.04,
                            lng: -46.5333 + (Math.random() - 0.5) * 0.04
                        },
                        precos: { gasolina: 0, etanol: 0 },
                        bandeira: getCellValue(row, colMap.bandeira) || 'BANDEIRA BRANCA',
                        ativo: true
                    });
                }
                
                if (novosPostos.length === 0) {
                    throw new Error('Nenhum posto válido encontrado.');
                }
                
                postosData = novosPostos;
                adminPostos = novosPostos;
                salvarPostos(novosPostos);
                
                atualizarStatus();
                renderizarPostos();
                
                showAdminNotification(`✅ ${novosPostos.length} postos importados!`, 'success');
                resolve(novosPostos);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
    });
}

async function processarCSVEstabelecimentos(file) {
    showAdminNotification('Para estabelecimentos, use arquivo Excel (.xlsx)', 'error');
}

function findColIndex(headers, possibleNames) {
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        for (const name of possibleNames) {
            if (header && header.includes(name)) return i;
        }
    }
    return -1;
}

function getCellValue(row, index) {
    if (index === -1 || !row || index >= row.length) return '';
    const value = row[index];
    return value !== undefined && value !== null ? String(value).trim() : '';
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
                    <th>Posto</th>
                    <th>Bandeira</th>
                    <th>Endereço</th>
                    <th>Gasolina</th>
                    <th>Etanol</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    adminPostos.forEach(posto => {
        const statusGas = getStatusPreco(posto.precos?.gasolina, anpData.gasolinaComum);
        const statusEta = getStatusPreco(posto.precos?.etanol, anpData.etanol);
        
        html += `
            <tr>
                <td>
                    <strong>${posto.nomeFantasia || '-'}</strong>
                    <br><small>${posto.terminal || ''}</small>
                </td>
                <td>
                    <span class="badge" style="background: ${getBandeiraCor(posto.bandeira)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                        ${posto.bandeira || 'N/A'}
                    </span>
                </td>
                <td>
                    ${posto.endereco?.logradouro || '-'}
                    <br><small>${posto.endereco?.bairro || ''}</small>
                </td>
                <td class="${statusGas.class}">
                    ${posto.precos?.gasolina > 0 ? `R$ ${posto.precos.gasolina.toFixed(2)}` : '--'}
                    ${statusGas.icon}
                </td>
                <td class="${statusEta.class}">
                    ${posto.precos?.etanol > 0 ? `R$ ${posto.precos.etanol.toFixed(2)}` : '--'}
                    ${statusEta.icon}
                </td>
                <td>
                    ${posto.ultimaAtualizacaoPreco ? `<small>${posto.ultimaAtualizacaoPreco}</small>` : '<small>Sem dados</small>'}
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

function getStatusPreco(preco, limite) {
    if (!preco || preco <= 0) return { class: '', icon: '' };
    if (!limite) return { class: '', icon: '' };
    
    const diff = ((preco - limite) / limite) * 100;
    
    if (diff > 3) {
        return { class: 'preco-alto', icon: '🔴' };
    } else if (diff > 1) {
        return { class: 'preco-medio', icon: '🟡' };
    } else {
        return { class: 'preco-baixo', icon: '🟢' };
    }
}

// ==========================================
// AÇÕES
// ==========================================

function editarPosto(id) {
    const posto = adminPostos.find(p => p.id === id);
    if (!posto) return;
    
    const novoPrecoGas = prompt(`Preço Gasolina para ${posto.nomeFantasia}:`, posto.precos?.gasolina?.toFixed(2) || '');
    const novoPrecoEta = prompt(`Preço Etanol para ${posto.nomeFantasia}:`, posto.precos?.etanol?.toFixed(2) || '');
    
    let atualizado = false;
    
    if (novoPrecoGas !== null && novoPrecoGas !== '') {
        const valor = parseFloat(novoPrecoGas.replace(',', '.'));
        if (!isNaN(valor) && valor > 0) {
            posto.precos.gasolina = valor;
            atualizado = true;
        }
    }
    
    if (novoPrecoEta !== null && novoPrecoEta !== '') {
        const valor = parseFloat(novoPrecoEta.replace(',', '.'));
        if (!isNaN(valor) && valor > 0) {
            posto.precos.etanol = valor;
            atualizado = true;
        }
    }
    
    if (atualizado) {
        posto.ultimaAtualizacaoPreco = new Date().toISOString().split('T')[0];
        salvarPostos(postosData);
        renderizarPostos();
        showAdminNotification('Posto atualizado!', 'success');
    }
}

function excluirPosto(id) {
    if (!confirm('Excluir este posto?')) return;
    
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
    if (!confirm('ATENÇÃO: Isso excluirá TODOS os dados. Continuar?')) return;
    
    limparTodosDados();
    adminPostos = [];
    atualizarStatus();
    renderizarPostos();
    showAdminNotification('Dados limpos!', 'success');
}

function exportarJSON() {
    const dataStr = JSON.stringify({ postos: postosData, abastecimentos: abastecimentosData }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `dados_postos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
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
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideIn 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showAdminLoading(show) {
    let overlay = document.getElementById('adminLoading');
    
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'adminLoading';
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '9998'
            });
            overlay.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #1e40af;"></i>
                    <p style="margin-top: 15px; color: #374151;">Processando arquivo...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    } else if (overlay) {
        overlay.style.display = 'none';
    }
}

// Exportar funções globais
window.handleFileSelect = handleFileSelect;
window.editarPosto = editarPosto;
window.excluirPosto = excluirPosto;
window.limparTodosDadosAdmin = limparTodosDadosAdmin;
window.exportarJSON = exportarJSON;
