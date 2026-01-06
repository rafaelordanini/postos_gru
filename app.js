// ==========================================
// APLICAÇÃO PRINCIPAL - CMG Postos
// ==========================================

let currentView = 'map';
let map = null;
let markersLayer = null;
let filteredPostos = [];
let chatOpen = true;

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    init();
});

async function init() {
    showLoading(true);
    
    try {
        console.log('🚀 Iniciando aplicação...');
        
        // Carregar ANP primeiro
        await carregarDadosANP();
        
        // Tentar carregar postos do JSON, senão do localStorage
        const savedPostos = localStorage.getItem('cmg_postos_data');
        if (savedPostos) {
            postosData = JSON.parse(savedPostos);
            console.log(`✅ ${postosData.length} postos do localStorage`);
        }
        
        // Se não tem postos salvos, carregar do JSON
        if (postosData.length === 0) {
            await carregarPostosDoJSON();
        }
        
        // Atualizar interface
        updateANPDisplay();
        populateFilters();
        updateStats();
        updateLastUpdate();
        
        // Configurar eventos
        setupEventListeners();
        
        // Inicializar com visão de mapa
        filteredPostos = [...postosData];
        initMapView();
        
        console.log('✅ Aplicação inicializada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError('Erro ao carregar dados. Tente novamente.');
    } finally {
        showLoading(false);
    }
}

// ==========================================
// DISPLAY ANP
// ==========================================

function updateANPDisplay() {
    const gasolinaEl = document.getElementById('anpGasolina');
    const etanolEl = document.getElementById('anpEtanol');
    
    if (gasolinaEl) {
        gasolinaEl.textContent = anpData.gasolinaComum 
            ? `R$ ${anpData.gasolinaComum.toFixed(2)}` 
            : 'R$ --';
    }
    
    if (etanolEl) {
        etanolEl.textContent = anpData.etanol 
            ? `R$ ${anpData.etanol.toFixed(2)}` 
            : 'R$ --';
    }
}

// ==========================================
// ESTATÍSTICAS
// ==========================================

function updateStats() {
    const stats = getEstatisticas();
    
    const totalEl = document.getElementById('totalPostos');
    if (totalEl) totalEl.textContent = stats.totalPostos;
    
    // Mais barato
    const maisBaratoValorEl = document.getElementById('maisBaratoValor');
    const maisBaratoNomeEl = document.getElementById('maisBaratoNome');
    
    if (stats.maisBaratoGasolina) {
        if (maisBaratoValorEl) {
            maisBaratoValorEl.textContent = `R$ ${stats.maisBaratoGasolina.precos.gasolina.toFixed(2)}`;
        }
        if (maisBaratoNomeEl) {
            maisBaratoNomeEl.textContent = truncateText(stats.maisBaratoGasolina.nomeFantasia, 25);
        }
    } else {
        if (maisBaratoValorEl) maisBaratoValorEl.textContent = 'R$ --';
        if (maisBaratoNomeEl) maisBaratoNomeEl.textContent = 'Sem dados';
    }
    
    // Mais caro
    const maisCaroValorEl = document.getElementById('maisCaroValor');
    const maisCaroNomeEl = document.getElementById('maisCaroNome');
    
    if (stats.maisCaroGasolina) {
        if (maisCaroValorEl) {
            maisCaroValorEl.textContent = `R$ ${stats.maisCaroGasolina.precos.gasolina.toFixed(2)}`;
        }
        if (maisCaroNomeEl) {
            maisCaroNomeEl.textContent = truncateText(stats.maisCaroGasolina.nomeFantasia, 25);
        }
    } else {
        if (maisCaroValorEl) maisCaroValorEl.textContent = 'R$ --';
        if (maisCaroNomeEl) maisCaroNomeEl.textContent = 'Sem dados';
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ==========================================
// FILTROS
// ==========================================

function populateFilters() {
    const filterNeighborhood = document.getElementById('filterNeighborhood');
    if (!filterNeighborhood) return;
    
    const bairros = getBairros();
    filterNeighborhood.innerHTML = '<option value="all">Todos</option>';
    bairros.forEach(b => {
        filterNeighborhood.innerHTML += `<option value="${b}">${b}</option>`;
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterNeighborhood = document.getElementById('filterNeighborhood');
    const sortBy = document.getElementById('sortBy');
    const modal = document.getElementById('postoModal');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    if (filterNeighborhood) {
        filterNeighborhood.addEventListener('change', applyFilters);
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', applyFilters);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterNeighborhood = document.getElementById('filterNeighborhood');
    const sortBy = document.getElementById('sortBy');
    
    const filtros = {
        busca: searchInput ? searchInput.value : '',
        bairro: filterNeighborhood ? filterNeighborhood.value : 'all'
    };
    
    filteredPostos = filterPostos(filtros);
    
    const sortCriteria = sortBy ? sortBy.value : 'name';
    filteredPostos = sortPostos(filteredPostos, sortCriteria);
    
    updateStats();
    
    if (currentView === 'map') {
        updateMapMarkers();
    } else {
        renderPostos();
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        applyFilters();
    }
}

// ==========================================
// VISUALIZAÇÃO
// ==========================================

function setView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('.view-btn').classList.add('active');
    }
    
    const postosContainer = document.getElementById('postosContainer');
    const mapContainer = document.getElementById('mapContainer');
    
    if (view === 'map') {
        if (postosContainer) postosContainer.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'block';
        if (!map) {
            initMap();
        } else {
            updateMapMarkers();
            map.invalidateSize();
        }
    } else {
        if (postosContainer) postosContainer.style.display = '';
        if (mapContainer) mapContainer.style.display = 'none';
        renderPostos();
    }
}

function initMapView() {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    const mapBtn = document.querySelector('.view-btn[onclick*="map"]');
    if (mapBtn) mapBtn.classList.add('active');
    
    const postosContainer = document.getElementById('postosContainer');
    const mapContainer = document.getElementById('mapContainer');
    
    if (postosContainer) postosContainer.style.display = 'none';
    if (mapContainer) mapContainer.style.display = 'block';
    
    setTimeout(() => {
        initMap();
    }, 100);
}

// ==========================================
// MAPA
// ==========================================

function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Elemento do mapa não encontrado');
        return;
    }
    
    if (map) {
        updateMapMarkers();
        return;
    }
    
    console.log('🗺️ Inicializando mapa...');
    
    map = L.map('map', {
        center: [SEDE_CAMARA.lat, SEDE_CAMARA.lng],
        zoom: 13,
        zoomControl: true
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(map);
    
    markersLayer = L.layerGroup().addTo(map);
    
    addSedeMarker();
    addMapLegend();
    updateMapMarkers();
    
    console.log('✅ Mapa inicializado');
}

function addSedeMarker() {
    const sedeIcon = L.divIcon({
        className: 'marker-sede',
        html: `<div class="marker-circle sede"><i class="fas fa-landmark"></i></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22]
    });
    
    L.marker([SEDE_CAMARA.lat, SEDE_CAMARA.lng], { icon: sedeIcon })
        .addTo(map)
        .bindPopup(`
            <div class="popup-content">
                <h3>🏛️ Câmara Municipal de Guarulhos</h3>
                <p>📍 ${SEDE_CAMARA.endereco}</p>
            </div>
        `);
}

function addMapLegend() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <h4>📊 Legenda</h4>
            <div class="legend-item"><span class="dot green"></span> Abaixo da ANP</div>
            <div class="legend-item"><span class="dot yellow"></span> Igual à ANP</div>
            <div class="legend-item"><span class="dot red"></span> Acima da ANP</div>
            <div class="legend-item"><span class="dot blue"></span> Sede da Câmara</div>
        `;
        return div;
    };
    
    legend.addTo(map);
}

function updateMapMarkers() {
    if (!markersLayer) return;
    
    markersLayer.clearLayers();
    
    console.log(`📍 Renderizando ${filteredPostos.length} postos no mapa`);
    
    filteredPostos.forEach(posto => {
        if (posto.coordenadas && posto.coordenadas.lat && posto.coordenadas.lng) {
            const marker = createPostoMarker(posto);
            markersLayer.addLayer(marker);
        }
    });
    
    // Ajustar bounds
    if (filteredPostos.length > 0) {
        const bounds = [];
        filteredPostos.forEach(p => {
            if (p.coordenadas && p.coordenadas.lat && p.coordenadas.lng) {
                bounds.push([p.coordenadas.lat, p.coordenadas.lng]);
            }
        });
        bounds.push([SEDE_CAMARA.lat, SEDE_CAMARA.lng]);
        
        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }
}

function createPostoMarker(posto) {
    const status = getMarkerStatus(posto);
    const preco = posto.precos?.gasolina;
    
    const icon = L.divIcon({
        className: 'marker-posto',
        html: `
            <div class="marker-circle ${status.class}" title="${posto.nomeFantasia}">
                ${preco > 0 ? `<span class="marker-price">${preco.toFixed(2)}</span>` : '<i class="fas fa-gas-pump"></i>'}
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
    
    const marker = L.marker([posto.coordenadas.lat, posto.coordenadas.lng], { icon: icon });
    marker.bindPopup(createMarkerPopup(posto, status));
    
    return marker;
}

function getMarkerStatus(posto) {
    const preco = posto.precos?.gasolina;
    const anp = anpData.gasolinaComum;
    
    if (!preco || preco <= 0 || !anp) {
        return { class: 'gray', label: 'Sem preço', icon: '❓' };
    }
    
    const diff = ((preco - anp) / anp) * 100;
    
    if (diff < -1) {
        return { class: 'green', label: 'Abaixo da ANP', icon: '✅', diff: diff.toFixed(1) + '%' };
    } else if (diff <= 1) {
        return { class: 'yellow', label: 'Igual à ANP', icon: '⚠️', diff: diff.toFixed(1) + '%' };
    } else {
        return { class: 'red', label: 'Acima da ANP', icon: '🚫', diff: '+' + diff.toFixed(1) + '%' };
    }
}

function createMarkerPopup(posto, status) {
    const dist = calcularDistancia(
        SEDE_CAMARA.lat, SEDE_CAMARA.lng, 
        posto.coordenadas.lat, posto.coordenadas.lng
    ).toFixed(1);
    
    const endereco = posto.endereco || {};
    
    return `
        <div class="popup-content">
            <h3>${posto.nomeFantasia || 'Posto'}</h3>
            <span class="popup-badge ${status.class}">${status.icon} ${status.label}</span>
            
            <div class="popup-info">
                <p>📍 ${endereco.logradouro || ''}, ${endereco.numero || 'S/N'}</p>
                <p>🏘️ ${endereco.bairro || 'Guarulhos'}</p>
                <p>📏 ${dist} km da sede</p>
                <p>🏷️ ${posto.bandeira || 'Bandeira Branca'}</p>
            </div>
            
            <div class="popup-prices">
                <div class="popup-price ${getPriceClass(posto.precos?.gasolina, anpData.gasolinaComum)}">
                    <span>Gasolina</span>
                    <strong>R$ ${posto.precos?.gasolina?.toFixed(2) || '--'}</strong>
                </div>
                <div class="popup-price ${getPriceClass(posto.precos?.etanol, anpData.etanol)}">
                    <span>Etanol</span>
                    <strong>R$ ${posto.precos?.etanol?.toFixed(2) || '--'}</strong>
                </div>
            </div>
            
            <div class="popup-actions">
                <button onclick="openModal(${posto.id})" class="btn-details">
                    <i class="fas fa-edit"></i> Detalhes
                </button>
                <button onclick="openDirections(${posto.id})" class="btn-route">
                    <i class="fas fa-route"></i> Rota
                </button>
            </div>
        </div>
    `;
}

function getPriceClass(preco, anp) {
    if (!preco || !anp || preco <= 0) return '';
    const diff = ((preco - anp) / anp) * 100;
    if (diff < -1) return 'price-low';
    if (diff > 1) return 'price-high';
    return '';
}

// ==========================================
// MODAL
// ==========================================

function openModal(id) {
    const posto = getPostoById(id);
    if (!posto) {
        console.warn('Posto não encontrado:', id);
        return;
    }
    
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('postoModal');
    
    if (modalTitle) modalTitle.textContent = posto.nomeFantasia || 'Posto';
    if (modalBody) modalBody.innerHTML = createModalContent(posto);
    if (modal) modal.classList.add('active');
    
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('postoModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function createModalContent(posto) {
    const status = getMarkerStatus(posto);
    const dist = calcularDistancia(
        SEDE_CAMARA.lat, SEDE_CAMARA.lng, 
        posto.coordenadas?.lat || 0, posto.coordenadas?.lng || 0
    ).toFixed(1);
    
    const ultimaAtualizacao = posto.ultimaAtualizacaoPreco 
        ? new Date(posto.ultimaAtualizacaoPreco).toLocaleString('pt-BR')
        : 'Não informado';
    
    const endereco = posto.endereco || {};
    
    return `
        <div class="modal-status ${status.class}">
            ${status.icon} ${status.label} ${status.diff ? `(${status.diff})` : ''}
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-info-circle"></i> Informações</h4>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Bandeira</span>
                    <span class="info-value">${posto.bandeira || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Distância</span>
                    <span class="info-value">${dist} km</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Telefone</span>
                    <span class="info-value">${posto.telefone || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Horário</span>
                    <span class="info-value">${posto.is24h ? '24 horas' : (posto.horarioFuncionamento || 'N/A')}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-map-marker-alt"></i> Endereço</h4>
            <p>${endereco.logradouro || ''}, ${endereco.numero || 'S/N'}<br>
            ${endereco.bairro || ''} - ${endereco.cidade || 'Guarulhos'}/${endereco.estado || 'SP'}<br>
            CEP: ${endereco.cep || 'N/A'}</p>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-dollar-sign"></i> Preços</h4>
            <p class="anp-reference">
                <strong>Limite ANP:</strong> Gasolina R$ ${anpData.gasolinaComum?.toFixed(2) || '--'} | Etanol R$ ${anpData.etanol?.toFixed(2) || '--'}
            </p>
            
            <div class="price-edit-grid">
                <div class="price-edit-item">
                    <label>Gasolina Comum</label>
                    <div class="price-input-group">
                        <span>R$</span>
                        <input type="number" 
                               id="editGasolina" 
                               value="${posto.precos?.gasolina || ''}" 
                               step="0.01" 
                               min="0"
                               placeholder="0.00">
                    </div>
                    <span class="price-status ${getPriceClass(posto.precos?.gasolina, anpData.gasolinaComum)}">
                        ${getPriceStatusText(posto.precos?.gasolina, anpData.gasolinaComum)}
                    </span>
                </div>
                
                <div class="price-edit-item">
                    <label>Etanol</label>
                    <div class="price-input-group">
                        <span>R$</span>
                        <input type="number" 
                               id="editEtanol" 
                               value="${posto.precos?.etanol || ''}" 
                               step="0.01" 
                               min="0"
                               placeholder="0.00">
                    </div>
                    <span class="price-status ${getPriceClass(posto.precos?.etanol, anpData.etanol)}">
                        ${getPriceStatusText(posto.precos?.etanol, anpData.etanol)}
                    </span>
                </div>
            </div>
            
            <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">
                Última atualização: ${ultimaAtualizacao}
            </p>
            
            <button class="btn-save-prices" onclick="salvarPrecos(${posto.id})">
                <i class="fas fa-save"></i> Salvar Preços
            </button>
        </div>
        
        <div class="modal-section modal-actions">
            <button class="btn-directions" onclick="openDirections(${posto.id})">
                <i class="fas fa-directions"></i> Como Chegar
            </button>
        </div>
    `;
}

function getPriceStatusText(preco, anp) {
    if (!preco || !anp || preco <= 0) return '';
    const diff = ((preco - anp) / anp) * 100;
    if (diff < -1) return `✅ ${diff.toFixed(1)}% abaixo`;
    if (diff > 1) return `🚫 +${diff.toFixed(1)}% acima`;
    return `⚠️ Dentro do limite`;
}

function salvarPrecos(postoId) {
    const gasolinaInput = document.getElementById('editGasolina');
    const etanolInput = document.getElementById('editEtanol');
    
    const gasolina = gasolinaInput ? parseFloat(gasolinaInput.value) : NaN;
    const etanol = etanolInput ? parseFloat(etanolInput.value) : NaN;
    
    let atualizado = false;
    
    if (!isNaN(gasolina) && gasolina > 0) {
        atualizarPrecoPosto(postoId, 'gasolina', gasolina);
        atualizado = true;
    }
    
    if (!isNaN(etanol) && etanol > 0) {
        atualizarPrecoPosto(postoId, 'etanol', etanol);
        atualizado = true;
    }
    
    if (atualizado) {
        filteredPostos = [...postosData];
        updateStats();
        updateMapMarkers();
        openModal(postoId);
        showNotification('Preços atualizados com sucesso!', 'success');
    } else {
        showNotification('Informe pelo menos um preço válido.', 'error');
    }
}

function openDirections(id) {
    const posto = getPostoById(id);
    if (!posto || !posto.coordenadas) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${posto.coordenadas.lat},${posto.coordenadas.lng}`;
    window.open(url, '_blank');
}

// ==========================================
// RENDERIZAÇÃO GRID/LIST
// ==========================================

function renderPostos() {
    const container = document.getElementById('postosContainer');
    if (!container) return;
    
    if (filteredPostos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum posto encontrado</h3>
                <p>Ajuste os filtros de busca</p>
            </div>
        `;
        return;
    }
    
    if (currentView === 'grid') {
        container.className = 'postos-grid';
        container.innerHTML = filteredPostos.map(posto => createPostoCard(posto)).join('');
    } else {
        container.className = 'postos-list';
        container.innerHTML = filteredPostos.map(posto => createPostoListItem(posto)).join('');
    }
}

function createPostoCard(posto) {
    const status = getMarkerStatus(posto);
    const endereco = posto.endereco || {};
    
    return `
        <div class="posto-card ${status.class}" onclick="openModal(${posto.id})">
            <div class="card-header">
                <span class="card-status ${status.class}">${status.icon}</span>
                <h3>${posto.nomeFantasia || 'Posto'}</h3>
                <span class="card-bandeira">${posto.bandeira || 'N/A'}</span>
            </div>
            <div class="card-address">
                <i class="fas fa-map-marker-alt"></i>
                ${endereco.bairro || 'Guarulhos'}
            </div>
            <div class="card-prices">
                <div class="card-price ${getPriceClass(posto.precos?.gasolina, anpData.gasolinaComum)}">
                    <span>Gasolina</span>
                    <strong>R$ ${posto.precos?.gasolina?.toFixed(2) || '--'}</strong>
                </div>
                <div class="card-price ${getPriceClass(posto.precos?.etanol, anpData.etanol)}">
                    <span>Etanol</span>
                    <strong>R$ ${posto.precos?.etanol?.toFixed(2) || '--'}</strong>
                </div>
            </div>
        </div>
    `;
}

function createPostoListItem(posto) {
    const status = getMarkerStatus(posto);
    const endereco = posto.endereco || {};
    
    return `
        <div class="posto-list-item" onclick="openModal(${posto.id})">
            <div class="list-icon ${status.class}">${status.icon}</div>
            <div class="list-info">
                <h3>${posto.nomeFantasia || 'Posto'}</h3>
                <p>${endereco.bairro || 'Guarulhos'} - ${posto.bandeira || 'N/A'}</p>
            </div>
            <div class="list-prices">
                <span class="${getPriceClass(posto.precos?.gasolina, anpData.gasolinaComum)}">
                    Gas: R$ ${posto.precos?.gasolina?.toFixed(2) || '--'}
                </span>
                <span class="${getPriceClass(posto.precos?.etanol, anpData.etanol)}">
                    Eta: R$ ${posto.precos?.etanol?.toFixed(2) || '--'}
                </span>
            </div>
        </div>
    `;
}

// ==========================================
// NOTIFICAÇÕES
// ==========================================

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// CHAT IA
// ==========================================

function toggleChat() {
    const container = document.getElementById('chatContainer');
    const toggleBtn = document.getElementById('chatToggleBtn');
    
    chatOpen = !chatOpen;
    
    if (chatOpen) {
        if (container) container.classList.remove('minimized');
        if (toggleBtn) toggleBtn.style.display = 'none';
    } else {
        if (container) container.classList.add('minimized');
        if (toggleBtn) toggleBtn.style.display = 'flex';
    }
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    showTypingIndicator();
    
    try {
        const response = await getAIResponse(message);
        hideTypingIndicator();
        addChatMessage(response, 'bot');
    } catch (error) {
        hideTypingIndicator();
        addChatMessage('Desculpe, ocorreu um erro. Tente novamente.', 'bot');
    }
}

function askQuickQuestion(question) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = question;
        sendMessage();
    }
}

function addChatMessage(content, type) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const html = `
        <div class="message ${type}">
            <div class="message-avatar">
                <i class="fas fa-${type === 'bot' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">${formatChatMessage(content)}</div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
}

function formatChatMessage(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.insertAdjacentHTML('beforeend', `
        <div class="message bot" id="typingIndicator">
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content"><p>Digitando...</p></div>
        </div>
    `);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function getAIResponse(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('barato') || msg.includes('menor') || msg.includes('melhor')) {
        const stats = getEstatisticas();
        if (stats.maisBaratoGasolina) {
            return `🟢 **Posto mais barato (Gasolina):**\n\n` +
                   `**${stats.maisBaratoGasolina.nomeFantasia}**\n` +
                   `💰 R$ ${stats.maisBaratoGasolina.precos.gasolina.toFixed(2)}\n` +
                   `📍 ${stats.maisBaratoGasolina.endereco?.bairro || 'Guarulhos'}`;
        }
        return 'Não há dados de preços disponíveis no momento.';
    }
    
    if (msg.includes('caro') || msg.includes('maior')) {
        const stats = getEstatisticas();
        if (stats.maisCaroGasolina) {
            return `🔴 **Posto mais caro (Gasolina):**\n\n` +
                   `**${stats.maisCaroGasolina.nomeFantasia}**\n` +
                   `💰 R$ ${stats.maisCaroGasolina.precos.gasolina.toFixed(2)}\n` +
                   `📍 ${stats.maisCaroGasolina.endereco?.bairro || 'Guarulhos'}`;
        }
        return 'Não há dados de preços disponíveis no momento.';
    }
    
    if (msg.includes('acima') || msg.includes('vermelho') || msg.includes('bloqueado')) {
        const acima = postosData.filter(p => {
            if (!p.precos?.gasolina || !anpData.gasolinaComum) return false;
            return ((p.precos.gasolina - anpData.gasolinaComum) / anpData.gasolinaComum) * 100 > 1;
        });
        
        if (acima.length === 0) {
            return '✅ Nenhum posto está com preço acima da ANP no momento!';
        }
        
        let response = `🔴 **Postos com preço ACIMA da ANP (${acima.length}):**\n\n`;
        acima.slice(0, 5).forEach((p, i) => {
            const diff = ((p.precos.gasolina - anpData.gasolinaComum) / anpData.gasolinaComum * 100).toFixed(1);
            response += `${i + 1}. **${p.nomeFantasia}**\n   R$ ${p.precos.gasolina.toFixed(2)} (+${diff}%)\n\n`;
        });
        if (acima.length > 5) {
            response += `... e mais ${acima.length - 5} postos.`;
        }
        return response;
    }
    
    if (msg.includes('anp') || msg.includes('limite') || msg.includes('referência') || msg.includes('media')) {
        return `📊 **Preços ANP - Guarulhos:**\n\n` +
               `⛽ Gasolina: R$ ${anpData.gasolinaComum?.toFixed(2) || '--'}\n` +
               `🌿 Etanol: R$ ${anpData.etanol?.toFixed(2) || '--'}\n\n` +
               `Estes são os preços médios de referência.`;
    }
    
    if (msg.includes('total') || msg.includes('quantos') || msg.includes('postos')) {
        const stats = getEstatisticas();
        return `📊 **Estatísticas:**\n\n` +
               `🏪 Total de postos: ${stats.totalPostos}\n` +
               `💰 Postos com preço: ${stats.postosComPreco}\n\n` +
               `Use o mapa para visualizar todos os postos!`;
    }
    
    return `🤖 Posso ajudar com:\n\n` +
           `💰 "Qual o posto mais barato?"\n` +
           `🔴 "Quais postos estão acima da ANP?"\n` +
           `📊 "Qual o limite ANP?"\n` +
           `🏪 "Quantos postos temos?"\n\n` +
           `Digite sua pergunta!`;
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (!el) return;
    
    const ultima = getUltimaAtualizacao();
    const texto = ultima 
        ? `Dados: ${new Date(ultima).toLocaleDateString('pt-BR')}`
        : `Atualizado: ${new Date().toLocaleDateString('pt-BR')}`;
    el.textContent = texto;
}

async function refreshData() {
    showLoading(true);
    
    try {
        await carregarPostosDoJSON();
        await carregarDadosANP();
        
        filteredPostos = [...postosData];
        
        updateANPDisplay();
        populateFilters();
        updateStats();
        updateMapMarkers();
        updateLastUpdate();
        
        showNotification('Dados atualizados!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        showNotification('Erro ao atualizar', 'error');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

function showError(message) {
    showNotification(message, 'error');
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Exportar funções globais
window.setView = setView;
window.clearSearch = clearSearch;
window.openModal = openModal;
window.closeModal = closeModal;
window.salvarPrecos = salvarPrecos;
window.openDirections = openDirections;
window.toggleChat = toggleChat;
window.handleChatKeypress = handleChatKeypress;
window.sendMessage = sendMessage;
window.askQuickQuestion = askQuickQuestion;
window.refreshData = refreshData;
