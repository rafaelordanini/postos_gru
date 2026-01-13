// ========================================
// CMG POSTOS - APP PRINCIPAL
// ========================================

// Variáveis globais
let postosData = [];
let anpData = {};
let map = null;
let markers = [];
let viewMode = 'grid'; // grid, list, map

// Coordenadas da Câmara de Guarulhos
const CAMARA_COORDS = { lat: -23.4538, lng: -46.5333 };

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    configurarEventos();
    atualizarDataHeader();
});

function carregarDados() {
    // Carregar postos
    const postosStorage = localStorage.getItem('cmg_postos_data');
    postosData = postosStorage ? JSON.parse(postosStorage) : [];
    
    // Carregar dados ANP
    const anpStorage = localStorage.getItem('cmg_anp_data');
    anpData = anpStorage ? JSON.parse(anpStorage) : {};
    
    // Renderizar
    atualizarResumo();
    renderizarPostos();
    preencherFiltroBairros();
}

function configurarEventos() {
    // Busca
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(filtrarPostos, 300));
    
    const btnLimpar = document.getElementById('btnLimparBusca');
    btnLimpar.addEventListener('click', () => {
        searchInput.value = '';
        btnLimpar.classList.remove('visible');
        filtrarPostos();
    });
    
    searchInput.addEventListener('input', () => {
        btnLimpar.classList.toggle('visible', searchInput.value.length > 0);
    });
    
    // Filtros
    document.getElementById('btnFiltrar').addEventListener('click', filtrarPostos);
    document.getElementById('ordenarPor').addEventListener('change', filtrarPostos);
    document.getElementById('filtroBairro').addEventListener('change', filtrarPostos);
    
    // Visualização
    document.getElementById('btnViewGrid').addEventListener('click', () => setViewMode('grid'));
    document.getElementById('btnViewList').addEventListener('click', () => setViewMode('list'));
    document.getElementById('btnViewMap').addEventListener('click', () => setViewMode('map'));
    
    // Atualizar
    document.getElementById('btnAtualizar').addEventListener('click', carregarDados);
    
    // Fechar modal ao clicar fora
    document.getElementById('modalDetalhes').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            fecharModal();
        }
    });
}

// ========================================
// ATUALIZAÇÃO DE DADOS
// ========================================

function atualizarDataHeader() {
    const dadosPrecos = JSON.parse(localStorage.getItem('cmg_precos_postos') || '{}');
    const dataEl = document.getElementById('dataAtualizacao');
    
    if (dataEl) {
        const dataGas = dadosPrecos.gasolina?.dataEmissao;
        const dataEta = dadosPrecos.etanol?.dataEmissao;
        const data = dataGas || dataEta || '--/--/----';
        dataEl.textContent = `Dados: ${data}`;
    }
}

function atualizarResumo() {
    // Total de postos
    document.getElementById('totalPostos').textContent = postosData.length;
    
    // Preços de gasolina
    const precosGasolina = postosData
        .map(p => p.precos?.gasolina)
        .filter(p => p && p > 0);
    
    if (precosGasolina.length > 0) {
        const menor = Math.min(...precosGasolina);
        const maior = Math.max(...precosGasolina);
        document.getElementById('menorPrecoGas').textContent = `R$ ${menor.toFixed(2)}`;
        document.getElementById('maiorPrecoGas').textContent = `R$ ${maior.toFixed(2)}`;
    } else {
        document.getElementById('menorPrecoGas').textContent = 'R$ --';
        document.getElementById('maiorPrecoGas').textContent = 'R$ --';
    }
    
    // ANP
    const precoANP = anpData.gasolinaComum;
    document.getElementById('precoANP').textContent = precoANP 
        ? `R$ ${precoANP.toFixed(2)}` 
        : 'R$ --';
}

function preencherFiltroBairros() {
    const bairros = [...new Set(postosData.map(p => p.bairro).filter(b => b))].sort();
    const select = document.getElementById('filtroBairro');
    
    select.innerHTML = '<option value="">Todos</option>';
    bairros.forEach(bairro => {
        select.innerHTML += `<option value="${bairro}">${bairro}</option>`;
    });
}

// ========================================
// RENDERIZAÇÃO
// ========================================

function renderizarPostos(postos = postosData) {
    const container = document.getElementById('postosContainer');
    const mensagemVazia = document.getElementById('mensagemVazia');
    
    if (postos.length === 0) {
        container.innerHTML = '';
        mensagemVazia.style.display = 'block';
        return;
    }
    
    mensagemVazia.style.display = 'none';
    
    container.className = viewMode === 'list' ? 'postos-list' : 'postos-grid';
    container.innerHTML = postos.map(posto => renderizarCardPosto(posto)).join('');
    
    // Adicionar eventos de clique
    container.querySelectorAll('.posto-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const posto = postosData.find(p => p.id === id);
            if (posto) abrirModal(posto);
        });
    });
}

function renderizarCardPosto(posto) {
    const precos = posto.precos || {};
    const dataEmissao = precos.dataEmissao || '';
    
    // Determinar status em relação à ANP
    const statusGasolina = getStatusPreco(precos.gasolina, anpData.gasolinaComum);
    const statusEtanol = getStatusPreco(precos.etanol, anpData.etanol);
    
    return `
        <div class="posto-card" data-id="${posto.id}">
            <div class="posto-header">
                <h3>${posto.nomeFantasia || posto.razaoSocial || 'Sem nome'}</h3>
                ${dataEmissao ? `<span class="posto-data">📅 ${dataEmissao}</span>` : ''}
            </div>
            
            <div class="posto-endereco">
                📍 ${posto.endereco || ''} ${posto.bairro ? '- ' + posto.bairro : ''} - Guarulhos
            </div>
            
            <div class="posto-precos">
                <div class="preco-item ${statusGasolina}">
                    <span class="combustivel">🔴 Gasolina</span>
                    <span class="valor">${precos.gasolina ? 'R$ ' + precos.gasolina.toFixed(2) : 'R$ --'}</span>
                    ${anpData.gasolinaComum ? `<span class="anp">ANP: R$ ${anpData.gasolinaComum.toFixed(2)}</span>` : ''}
                </div>
                
                <div class="preco-item ${statusEtanol}">
                    <span class="combustivel">🟢 Etanol</span>
                    <span class="valor">${precos.etanol ? 'R$ ' + precos.etanol.toFixed(2) : 'R$ --'}</span>
                    ${anpData.etanol ? `<span class="anp">ANP: R$ ${anpData.etanol.toFixed(2)}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function getStatusPreco(precoPosto, precoANP) {
    if (!precoPosto || !precoANP) return '';
    if (precoPosto < precoANP) return 'preco-abaixo';
    if (precoPosto <= precoANP * 1.02) return 'preco-igual'; // Tolerância de 2%
    return 'preco-acima';
}

// ========================================
// FILTROS E ORDENAÇÃO
// ========================================

function filtrarPostos() {
    const busca = document.getElementById('searchInput').value.toLowerCase().trim();
    const bairro = document.getElementById('filtroBairro').value;
    const ordenar = document.getElementById('ordenarPor').value;
    
    let resultado = [...postosData];
    
    // Filtro de busca
    if (busca) {
        resultado = resultado.filter(p => 
            (p.nomeFantasia || '').toLowerCase().includes(busca) ||
            (p.razaoSocial || '').toLowerCase().includes(busca) ||
            (p.endereco || '').toLowerCase().includes(busca) ||
            (p.bairro || '').toLowerCase().includes(busca)
        );
    }
    
    // Filtro de bairro
    if (bairro) {
        resultado = resultado.filter(p => p.bairro === bairro);
    }
    
    // Ordenação
    resultado.sort((a, b) => {
        switch (ordenar) {
            case 'gasolina':
                const precoA = a.precos?.gasolina || 999;
                const precoB = b.precos?.gasolina || 999;
                return precoA - precoB;
            case 'etanol':
                const etanolA = a.precos?.etanol || 999;
                const etanolB = b.precos?.etanol || 999;
                return etanolA - etanolB;
            case 'distancia':
                // Se tiver geolocalização, ordenar por distância
                if (a.lat && a.lng && b.lat && b.lng) {
                    const distA = calcularDistancia(CAMARA_COORDS.lat, CAMARA_COORDS.lng, a.lat, a.lng);
                    const distB = calcularDistancia(CAMARA_COORDS.lat, CAMARA_COORDS.lng, b.lat, b.lng);
                    return distA - distB;
                }
                return 0;
            default: // nome
                return (a.nomeFantasia || '').localeCompare(b.nomeFantasia || '');
        }
    });
    
    renderizarPostos(resultado);
    
    if (viewMode === 'map') {
        atualizarMapa(resultado);
    }
}

// ========================================
// VISUALIZAÇÃO
// ========================================

function setViewMode(mode) {
    viewMode = mode;
    
    // Atualizar botões
    document.querySelectorAll('.btn-view').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btnView${mode.charAt(0).toUpperCase() + mode.slice(1)}`).classList.add('active');
    
    // Mostrar/ocultar elementos
    const mapContainer = document.getElementById('mapContainer');
    const postosContainer = document.getElementById('postosContainer');
    
    if (mode === 'map') {
        mapContainer.style.display = 'block';
        postosContainer.style.display = 'none';
        inicializarMapa();
    } else {
        mapContainer.style.display = 'none';
        postosContainer.style.display = mode === 'grid' ? 'grid' : 'flex';
        filtrarPostos();
    }
}

// ========================================
// MAPA
// ========================================

function inicializarMapa() {
    if (map) {
        atualizarMapa(postosData);
        return;
    }
    
    map = L.map('map').setView([CAMARA_COORDS.lat, CAMARA_COORDS.lng], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    // Marcador da Câmara
    const camaraIcon = L.divIcon({
        className: 'marker-camara',
        html: '<div style="background:#1a56db;color:white;padding:8px;border-radius:50%;font-size:16px;">🏛️</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    L.marker([CAMARA_COORDS.lat, CAMARA_COORDS.lng], { icon: camaraIcon })
        .addTo(map)
        .bindPopup('<strong>Câmara Municipal de Guarulhos</strong>');
    
    atualizarMapa(postosData);
}

function atualizarMapa(postos) {
    if (!map) return;
    
    // Remover marcadores anteriores
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    // Adicionar novos marcadores
    postos.forEach(posto => {
        if (!posto.lat || !posto.lng) return;
        
        const status = getStatusPreco(posto.precos?.gasolina, anpData.gasolinaComum);
        let cor = '#9ca3af'; // Cinza padrão
        
        if (status === 'preco-abaixo') cor = '#059669';
        else if (status === 'preco-igual') cor = '#d97706';
        else if (status === 'preco-acima') cor = '#dc2626';
        
        const icon = L.divIcon({
            className: 'marker-posto',
            html: `<div style="background:${cor};color:white;padding:6px 8px;border-radius:20px;font-size:12px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);">🏪</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        
        const marker = L.marker([posto.lat, posto.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <strong>${posto.nomeFantasia || posto.razaoSocial}</strong><br>
                ${posto.endereco || ''}<br>
                <hr style="margin:8px 0">
                🔴 Gasolina: R$ ${posto.precos?.gasolina?.toFixed(2) || '--'}<br>
                🟢 Etanol: R$ ${posto.precos?.etanol?.toFixed(2) || '--'}
            `);
        
        markers.push(marker);
    });
}

// ========================================
// MODAL
// ========================================

function abrirModal(posto) {
    const modal = document.getElementById('modalDetalhes');
    const body = document.getElementById('modalBody');
    
    const precos = posto.precos || {};
    const dataEmissao = precos.dataEmissao || 'Não informada';
    
    body.innerHTML = `
        <div class="modal-header">
            <h2>${posto.nomeFantasia || posto.razaoSocial || 'Posto'}</h2>
        </div>
        <div class="modal-body">
            <div class="detalhe-row">
                <span class="detalhe-label">Terminal:</span>
                <span class="detalhe-valor">${posto.terminal || '--'}</span>
            </div>
            <div class="detalhe-row">
                <span class="detalhe-label">CNPJ:</span>
                <span class="detalhe-valor">${posto.cnpj || '--'}</span>
            </div>
            <div class="detalhe-row">
                <span class="detalhe-label">Endereço:</span>
                <span class="detalhe-valor">${posto.endereco || '--'}</span>
            </div>
            <div class="detalhe-row">
                <span class="detalhe-label">Bairro:</span>
                <span class="detalhe-valor">${posto.bairro || '--'}</span>
            </div>
            <div class="detalhe-row">
                <span class="detalhe-label">Cidade:</span>
                <span class="detalhe-valor">${posto.cidade || 'Guarulhos'} - ${posto.uf || 'SP'}</span>
            </div>
            
            <div class="modal-precos">
                <div class="modal-preco-card ${getStatusPreco(precos.gasolina, anpData.gasolinaComum)}">
                    <h4>🔴 Gasolina</h4>
                    <div class="preco">${precos.gasolina ? 'R$ ' + precos.gasolina.toFixed(2) : 'R$ --'}</div>
                    <div class="referencia">ANP: R$ ${anpData.gasolinaComum?.toFixed(2) || '--'}</div>
                    <div class="data-preco">📅 ${dataEmissao}</div>
                </div>
                
                <div class="modal-preco-card ${getStatusPreco(precos.etanol, anpData.etanol)}">
                    <h4>🟢 Etanol</h4>
                    <div class="preco">${precos.etanol ? 'R$ ' + precos.etanol.toFixed(2) : 'R$ --'}</div>
                    <div class="referencia">ANP: R$ ${anpData.etanol?.toFixed(2) || '--'}</div>
                    <div class="data-preco">📅 ${dataEmissao}</div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function fecharModal() {
    document.getElementById('modalDetalhes').classList.remove('active');
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

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
