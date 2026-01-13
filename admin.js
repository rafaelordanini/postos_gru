// ========================================
// CMG POSTOS - ADMIN
// ========================================

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    atualizarEstatisticas();
    atualizarResumoPrecos();
    renderizarTabelaPostos();
    configurarEventos();
    configurarDragDrop();
});

function configurarEventos() {
    // Busca na tabela
    document.getElementById('buscaPosto').addEventListener('input', debounce(renderizarTabelaPostos, 300));
    
    // Form de edição
    document.getElementById('formEditarPosto').addEventListener('submit', salvarEdicao);
}

function configurarDragDrop() {
    const uploadAreas = document.querySelectorAll('.upload-area, .upload-area-small');
    
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });
        
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            const input = area.querySelector('input[type="file"]');
            if (input && e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                input.dispatchEvent(new Event('change'));
            }
        });
    });
}

// ========================================
// PROCESSAMENTO DE ESTABELECIMENTOS
// ========================================

async function processarEstabelecimentos(input) {
    const file = input.files[0];
    if (!file) return;

    const statusEl = document.getElementById('statusEstabelecimentos');
    const progressEl = document.getElementById('progressEstabelecimentos');
    const progressFill = document.getElementById('progressFillEstab');
    const progressText = document.getElementById('progressTextEstab');

    statusEl.innerHTML = '<span class="loading">⏳ Processando planilha...</span>';
    progressEl.style.display = 'flex';
    progressFill.style.width = '0%';

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Encontrar linha do cabeçalho
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i];
            if (row && row.some(cell => {
                const cellStr = String(cell || '').toLowerCase();
                return cellStr.includes('terminal') || cellStr.includes('cnpj');
            })) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error('Cabeçalho não encontrado na planilha');
        }

        const headers = rows[headerRowIndex].map(h => 
            String(h || '').toLowerCase().replace(/[_\s]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        );

        // Mapear colunas
        const colunas = {
            terminal: findColumn(headers, ['terminal', 'codigoterminal']),
            cnpj: findColumn(headers, ['cnpj']),
            razaoSocial: findColumn(headers, ['razaosocial', 'razao']),
            nomeFantasia: findColumn(headers, ['nomefantasia', 'fantasia', 'nome']),
            endereco: findColumn(headers, ['endereco', 'logradouro', 'rua']),
            numero: findColumn(headers, ['numero', 'nro']),
            bairro: findColumn(headers, ['bairro']),
            cidade: findColumn(headers, ['cidade', 'municipio']),
            uf: findColumn(headers, ['uf', 'estado']),
            cep: findColumn(headers, ['cep'])
        };

        console.log('Colunas mapeadas:', colunas);

        // Processar postos
        const postos = [];
        const total = rows.length - headerRowIndex - 1;

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const terminal = row[colunas.terminal];
            if (!terminal) continue;

            const endereco = colunas.endereco !== -1 ? String(row[colunas.endereco] || '') : '';
            const numero = colunas.numero !== -1 ? String(row[colunas.numero] || '') : '';
            const enderecoCompleto = numero ? `${endereco}, ${numero}` : endereco;

            const posto = {
                id: String(terminal),
                terminal: String(terminal),
                cnpj: colunas.cnpj !== -1 ? String(row[colunas.cnpj] || '') : '',
                razaoSocial: colunas.razaoSocial !== -1 ? String(row[colunas.razaoSocial] || '') : '',
                nomeFantasia: colunas.nomeFantasia !== -1 ? String(row[colunas.nomeFantasia] || '') : '',
                endereco: enderecoCompleto,
                bairro: colunas.bairro !== -1 ? String(row[colunas.bairro] || '') : '',
                cidade: colunas.cidade !== -1 ? String(row[colunas.cidade] || '') : 'Guarulhos',
                uf: colunas.uf !== -1 ? String(row[colunas.uf] || '') : 'SP',
                cep: colunas.cep !== -1 ? String(row[colunas.cep] || '') : '',
                lat: null,
                lng: null,
                precos: {}
            };

            // Se não tem nome fantasia, usar razão social
            if (!posto.nomeFantasia && posto.razaoSocial) {
                posto.nomeFantasia = posto.razaoSocial;
            }

            postos.push(posto);

            // Atualizar progresso
            const progress = Math.round(((i - headerRowIndex) / total) * 100);
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }

        // Mesclar com dados existentes (manter preços e coordenadas)
        const postosExistentes = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');
        
        postos.forEach(novoPosto => {
            const existente = postosExistentes.find(p => p.terminal === novoPosto.terminal);
            if (existente) {
                novoPosto.lat = existente.lat;
                novoPosto.lng = existente.lng;
                novoPosto.precos = existente.precos || {};
            }
        });

        // Salvar
        localStorage.setItem('cmg_postos_data', JSON.stringify(postos));

        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        statusEl.innerHTML = `<span class="success">✅ ${postos.length} estabelecimentos importados com sucesso!</span>`;

        atualizarEstatisticas();
        renderizarTabelaPostos();

    } catch (error) {
        console.error('Erro ao processar:', error);
        statusEl.innerHTML = `<span class="error">❌ Erro: ${error.message}</span>`;
    }
}

function findColumn(headers, names) {
    for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name));
        if (idx !== -1) return idx;
    }
    return -1;
}

// ========================================
// PROCESSAMENTO DE PREÇOS DOS POSTOS (ANP)
// ========================================

async function processarPrecoPostos(input, tipoCombustivel) {
    const file = input.files[0];
    if (!file) return;

    const statusId = tipoCombustivel === 'gasolina' ? 'statusGasolina' : 'statusEtanol';
    const statusEl = document.getElementById(statusId);
    statusEl.innerHTML = '<span class="loading">⏳ Processando...</span>';

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Extrair data de emissão
        const dataEmissao = extrairDataEmissao(rows);
        console.log('Data de emissão:', dataEmissao);

        // Extrair preço ANP de referência
        const precoANP = extrairPrecoANP(rows);
        console.log('Preço ANP referência:', precoANP);

        // Encontrar linha do cabeçalho
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const row = rows[i];
            if (row && row.some(cell => {
                const cellStr = String(cell || '').toLowerCase();
                return cellStr.includes('código terminal') || cellStr.includes('codigo terminal');
            })) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error('Cabeçalho não encontrado na planilha');
        }

        const headers = rows[headerRowIndex].map(h => 
            String(h || '').toLowerCase().replace(/[_\s]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        );

        // Encontrar índices das colunas
        const colCodigoTerminal = findColumn(headers, ['codigoterminal', 'terminal']);
        const colEstabelecimento = findColumn(headers, ['estabelecimento']);
        const colEndereco = findColumn(headers, ['endereco']);
        const colPrecoPosto = findColumn(headers, ['precoposto']);
        const colPrecoANP = findColumn(headers, ['precoanp']);

        console.log('Colunas encontradas:', { colCodigoTerminal, colEstabelecimento, colPrecoPosto });

        if (colCodigoTerminal === -1 || colPrecoPosto === -1) {
            throw new Error('Colunas obrigatórias não encontradas');
        }

        // Processar dados dos postos
        const precosPostos = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[colCodigoTerminal]) continue;

            const codigoTerminal = String(row[colCodigoTerminal]).trim();
            if (!codigoTerminal || codigoTerminal === '') continue;

            const preco = parseFloat(String(row[colPrecoPosto]).replace(',', '.')) || 0;
            if (preco <= 0) continue;

            precosPostos.push({
                codigoTerminal: codigoTerminal,
                estabelecimento: colEstabelecimento !== -1 ? String(row[colEstabelecimento] || '').trim() : '',
                endereco: colEndereco !== -1 ? String(row[colEndereco] || '').trim() : '',
                preco: preco,
                precoANP: colPrecoANP !== -1 ? parseFloat(String(row[colPrecoANP]).replace(',', '.')) : null
            });
        }

        console.log(`${precosPostos.length} preços de ${tipoCombustivel} extraídos`);

        // Salvar dados de preços
        salvarPrecosCombustivel(tipoCombustivel, precosPostos, dataEmissao, precoANP);

        // Atualizar preços nos postos cadastrados
        const postosAtualizados = atualizarPrecosPostos(tipoCombustivel);

        statusEl.innerHTML = `<span class="success">✅ ${precosPostos.length} preços importados (${postosAtualizados} postos atualizados)</span>`;

        atualizarResumoPrecos();
        atualizarEstatisticas();
        renderizarTabelaPostos();

    } catch (error) {
        console.error('Erro ao processar preços:', error);
        statusEl.innerHTML = `<span class="error">❌ Erro: ${error.message}</span>`;
    }
}

function extrairDataEmissao(rows) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        if (!row) continue;

        for (const cell of row) {
            const cellStr = String(cell || '');
            const match = cellStr.match(/Data de emissão:\s*(\d{2}\/\d{2}\/\d{4})/i);
            if (match) {
                return match[1];
            }
        }
    }
    return new Date().toLocaleDateString('pt-BR');
}

function extrairPrecoANP(rows) {
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const row = rows[i];
        if (!row) continue;

        for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').toLowerCase();
            if (cell.includes('anp') && (cell.includes('médio') || cell.includes('medio') || cell.includes('ref'))) {
                const valor = parseFloat(String(row[j + 1]).replace(',', '.'));
                if (!isNaN(valor) && valor > 0) {
                    return valor;
                }
            }
        }
    }
    return null;
}

function salvarPrecosCombustivel(tipoCombustivel, precosPostos, dataEmissao, precoANP) {
    let dadosPrecos = JSON.parse(localStorage.getItem('cmg_precos_postos') || '{}');

    dadosPrecos[tipoCombustivel] = {
        dataEmissao: dataEmissao,
        precoANP: precoANP,
        dataImportacao: new Date().toISOString(),
        postos: precosPostos
    };

    localStorage.setItem('cmg_precos_postos', JSON.stringify(dadosPrecos));

    // Atualizar também os dados ANP
    let anpData = JSON.parse(localStorage.getItem('cmg_anp_data') || '{}');
    if (tipoCombustivel === 'gasolina') {
        anpData.gasolinaComum = precoANP;
    } else {
        anpData.etanol = precoANP;
    }
    anpData.dataAtualizacao = dataEmissao;
    localStorage.setItem('cmg_anp_data', JSON.stringify(anpData));
}

function atualizarPrecosPostos(tipoCombustivel) {
    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');
    const dadosPrecos = JSON.parse(localStorage.getItem('cmg_precos_postos') || '{}');
    const precosCombus = dadosPrecos[tipoCombustivel];

    if (!precosCombus || !precosCombus.postos) return 0;

    let atualizados = 0;

    postos.forEach(posto => {
        const precoEncontrado = precosCombus.postos.find(p =>
            p.codigoTerminal === posto.terminal ||
            p.codigoTerminal === posto.id
        );

        if (precoEncontrado) {
            if (!posto.precos) posto.precos = {};
            posto.precos[tipoCombustivel] = precoEncontrado.preco;
            posto.precos[`${tipoCombustivel}ANP`] = precoEncontrado.precoANP;
            posto.precos.dataEmissao = precosCombus.dataEmissao;
            atualizados++;
        }
    });

    localStorage.setItem('cmg_postos_data', JSON.stringify(postos));
    return atualizados;
}

function atualizarResumoPrecos() {
    const resumoEl = document.getElementById('resumoPrecos');
    if (!resumoEl) return;

    const dadosPrecos = JSON.parse(localStorage.getItem('cmg_precos_postos') || '{}');
    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');

    const gasolina = dadosPrecos.gasolina;
    const etanol = dadosPrecos.etanol;

    const postosComGasolina = postos.filter(p => p.precos?.gasolina > 0).length;
    const postosComEtanol = postos.filter(p => p.precos?.etanol > 0).length;

    let html = '';

    if (gasolina || etanol) {
        html = '<div class="resumo-grid">';

        if (gasolina) {
            html += `
                <div class="resumo-item">
                    <strong>🔴 Gasolina</strong>
                    <p>📅 Data: ${gasolina.dataEmissao}</p>
                    <p>📊 ANP Médio: R$ ${gasolina.precoANP?.toFixed(2) || '--'}</p>
                    <p>🏪 ${gasolina.postos?.length || 0} preços (${postosComGasolina} vinculados)</p>
                </div>
            `;
        }

        if (etanol) {
            html += `
                <div class="resumo-item">
                    <strong>🟢 Etanol</strong>
                    <p>📅 Data: ${etanol.dataEmissao}</p>
                    <p>📊 ANP Médio: R$ ${etanol.precoANP?.toFixed(2) || '--'}</p>
                    <p>🏪 ${etanol.postos?.length || 0} preços (${postosComEtanol} vinculados)</p>
                </div>
            `;
        }

        html += '</div>';
    }

    resumoEl.innerHTML = html;
}

// ========================================
// ESTATÍSTICAS
// ========================================

function atualizarEstatisticas() {
    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');

    document.getElementById('statTotalPostos').textContent = postos.length;
    document.getElementById('statPostosGasolina').textContent = postos.filter(p => p.precos?.gasolina > 0).length;
    document.getElementById('statPostosEtanol').textContent = postos.filter(p => p.precos?.etanol > 0).length;
    document.getElementById('statPostosGeo').textContent = postos.filter(p => p.lat && p.lng).length;
}

// ========================================
// TABELA DE POSTOS
// ========================================

function renderizarTabelaPostos() {
    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');
    const busca = document.getElementById('buscaPosto').value.toLowerCase();
    const tbody = document.getElementById('tbodyPostos');

    let filtrados = postos;
    if (busca) {
        filtrados = postos.filter(p =>
            (p.nomeFantasia || '').toLowerCase().includes(busca) ||
            (p.razaoSocial || '').toLowerCase().includes(busca) ||
            (p.terminal || '').toLowerCase().includes(busca)
        );
    }

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum posto encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = filtrados.map(posto => `
        <tr>
            <td>${posto.terminal || '--'}</td>
            <td><strong>${posto.nomeFantasia || posto.razaoSocial || '--'}</strong></td>
            <td>${posto.endereco || '--'}</td>
            <td class="preco-cell ${posto.precos?.gasolina ? 'has-preco' : 'no-preco'}">
                ${posto.precos?.gasolina ? 'R$ ' + posto.precos.gasolina.toFixed(2) : '--'}
            </td>
            <td class="preco-cell ${posto.precos?.etanol ? 'has-preco' : 'no-preco'}">
                ${posto.precos?.etanol ? 'R$ ' + posto.precos.etanol.toFixed(2) : '--'}
            </td>
            <td class="gps-cell ${posto.lat ? 'gps-ok' : 'gps-no'}">
                ${posto.lat ? '✅' : '❌'}
            </td>
            <td class="acoes-cell">
                <button class="btn-table" onclick="editarPosto('${posto.id}')" title="Editar">✏️</button>
                <button class="btn-table danger" onclick="excluirPosto('${posto.id}')" title="Excluir">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// EDIÇÃO DE POSTO
// ========================================

function editarPosto(id) {
    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');
    const posto = postos.find(p => p.id === id);

    if (!posto) return;

    document.getElementById('editId').value = posto.id;
    document.getElementById('editNome').value = posto.nomeFantasia || '';
    document.getElementById('editEndereco').value = posto.endereco || '';
    document.getElementById('editLat').value = posto.lat || '';
    document.getElementById('editLng').value = posto.lng || '';

    document.getElementById('modalEditar').classList.add('active');
}

function fecharModalEditar() {
    document.getElementById('modalEditar').classList.remove('active');
}

function salvarEdicao(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');
    const index = postos.findIndex(p => p.id === id);

    if (index === -1) return;

    postos[index].nomeFantasia = document.getElementById('editNome').value;
    postos[index].endereco = document.getElementById('editEndereco').value;
    postos[index].lat = parseFloat(document.getElementById('editLat').value) || null;
    postos[index].lng = parseFloat(document.getElementById('editLng').value) || null;

    localStorage.setItem('cmg_postos_data', JSON.stringify(postos));

    fecharModalEditar();
    renderizarTabelaPostos();
    atualizarEstatisticas();
}

// ========================================
// EXCLUSÃO
// ========================================

function excluirPosto(id) {
    if (!confirm('Tem certeza que deseja excluir este posto?')) return;

    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');
    const novosPostos = postos.filter(p => p.id !== id);
    localStorage.setItem('cmg_postos_data', JSON.stringify(novosPostos));

    renderizarTabelaPostos();
    atualizarEstatisticas();
}

// ========================================
// GEOCODIFICAÇÃO
// ========================================

async function geocodificarTodos() {
    const postos = JSON.parse(localStorage.getItem('cmg_postos_data') || '[]');
    const semGeo = postos.filter(p => !p.lat || !p.lng);

    if (semGeo.length === 0) {
        alert('Todos os postos já possuem coordenadas!');
        return;
    }

    if (!confirm(`Geocodificar ${semGeo.length} postos sem coordenadas?`)) return;

    let sucesso = 0;
    for (const posto of semGeo) {
        const endereco = `${posto.endereco}, ${posto.bairro || ''}, Guarulhos, SP, Brasil`;
        
        try {
            const coords = await geocodificarEndereco(endereco);
            if (coords) {
                const index = postos.findIndex(p => p.id === posto.id);
                postos[index].lat = coords.lat;
                postos[index].lng = coords.lng;
                sucesso++;
            }
        } catch (e) {
            console.error('Erro ao geocodificar:', posto.nomeFantasia, e);
        }

        // Delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    localStorage.setItem('cmg_postos_data', JSON.stringify(postos));
    alert(`Geocodificação concluída! ${sucesso}/${semGeo.length} postos atualizados.`);

    renderizarTabelaPostos();
    atualizarEstatisticas();
}

async function geocodificarEndereco(endereco) {
    try {
        const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endereco })
        });

        if (!response.ok) throw new Error('Erro na API');

        const coords = await response.json();
        if (coords.lat && coords.lng) {
            return coords;
        }
        return null;
    } catch (error) {
        console.error('Erro ao geocodificar:', error);
        return null;
    }
}

// ========================================
// BACKUP E RESTAURAÇÃO
// ========================================

function exportarDados() {
    const dados = {
        postos: JSON.parse(localStorage.getItem('cmg_postos_data') || '[]'),
        precos: JSON.parse(localStorage.getItem('cmg_precos_postos') || '{}'),
        anp: JSON.parse(localStorage.getItem('cmg_anp_data') || '{}'),
        exportadoEm: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_cmg_postos_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarBackup(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dados = JSON.parse(e.target.result);

            if (dados.postos) {
                localStorage.setItem('cmg_postos_data', JSON.stringify(dados.postos));
            }
            if (dados.precos) {
                localStorage.setItem('cmg_precos_postos', JSON.stringify(dados.precos));
            }
            if (dados.anp) {
                localStorage.setItem('cmg_anp_data', JSON.stringify(dados.anp));
            }

            alert('Backup restaurado com sucesso!');
            location.reload();

        } catch (error) {
            alert('Erro ao importar backup: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function confirmarLimpeza() {
    document.getElementById('modalConfirmTitle').textContent = '⚠️ Limpar Todos os Dados';
    document.getElementById('modalConfirmText').textContent = 'Esta ação irá remover todos os postos, preços e configurações. Deseja continuar?';
    document.getElementById('btnConfirmAction').onclick = limparDados;
    document.getElementById('modalConfirm').classList.add('active');
}

function fecharModalConfirm() {
    document.getElementById('modalConfirm').classList.remove('active');
}

function limparDados() {
    localStorage.removeItem('cmg_postos_data');
    localStorage.removeItem('cmg_precos_postos');
    localStorage.removeItem('cmg_anp_data');

    fecharModalConfirm();
    alert('Dados removidos com sucesso!');
    location.reload();
}

// ========================================
// UTILITÁRIOS
// ========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
