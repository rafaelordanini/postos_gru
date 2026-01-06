// ==========================================
// APLICAÇÃO PRINCIPAL
// ==========================================

// Variáveis globais
let currentView = 'map'; // Começa com mapa como padrão
let map = null;
let markers = [];
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
        // Carregar dados
        await loadData();
        
        // Inicializar interface
        updateANPDisplay();
        populateFilters();
        updateStats();
        updateLastUpdate();
        
        // Event listeners
        setupEventListeners();
        
        // Inicializar com visualização de mapa
        initMapView();
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showError('Erro ao carregar dados. Tente novamente.');
    } finally {
        showLoading(false);
    }
}

async function loadData() {
    filteredPostos = [...postosData];
}

// ==========================================
// DISPLAY ANP
// ==========================================

function updateANPDisplay() {
    document.getElementById('anpGasolina').textContent = `R$ ${anpData.gasolinaComum?.toFixed(2) || '--'}`;
    document.getElementById('anpEtanol').textContent = `R$ ${anpData.etanol?.toFixed(2) || '--'}`;
    document.getElementById('anpDiesel').textContent = `R$ ${anpData.diesel?.toFixed(2) || '--'}`;
    document.getElementById('anpGnv').textContent = `R$ ${anpData.gnv?.toFixed(2) || '--'}`;
}

// ==========================================
// FILTROS
// ==========================================

function populateFilters() {
    // Bandeiras
    const filterBrand = document.getElementById('filterBrand');
    const bandeiras = getBandeiras();
    filterBrand.innerHTML = '<option value="all">Todas</option>';
    bandeiras.forEach(b => {
        filterBrand.innerHTML += `<option value="${b}">${b}</option>`;
    });
    
    // Bairros
    const filterNeighborhood = document.getElementById('filterNeighborhood');
    const bairros = getBairros();
    filterNeighborhood.innerHTML = '<option value="all">Todos</option>';
    bairros.forEach(b => {
        filterNeighborhood.innerHTML += `<option value="${b}">${b}</option>`;
    });
}

function setupEventListeners() {
    // Busca em tempo real
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    
    // Filtros
    document.getElementById('filterFuel').addEventListener('change', applyFilters);
    document.getElementById('filterBrand').addEventListener('change', applyFilters);
    document.getElementById('filterNeighborhood').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    
    // Fechar modal ao clicar fora
    document.getElementById('postoModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Tecla ESC para fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function applyFilters() {
    const filtros = {
        busca: document.getElementById('searchInput').value,
        combustivel: document.getElementById('filterFuel').value,
        bandeira: document.getElementById('filterBrand').value,
        bairro: document.getElementById('filterNeighborhood').value
    };
    
    filteredPostos = filterPostos(filtros);
    
    const sortBy = document.getElementById('sortBy').value;
    if (sortBy === 'distance') {
        filteredPostos = sortByDistanciaFromSede(filteredPostos);
    } else {
        filteredPostos = sortPostos(filteredPostos, sortBy);
    }
    
    updateStats();
    
    if (currentView === 'map') {
        updateMapMarkers();
    } else {
        renderPostos();
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    applyFilters();
}

// ==========================================
// ESTATÍSTICAS
// ==========================================

function updateStats() {
    const stats = getEstatisticas();
    
    document.getElementById('totalPostos').textContent = filteredPostos.length;
    document.getElementById('avgGasolina').textContent = stats.mediaGasolina > 0 ? `R$ ${stats.mediaGasolina.toFixed(2)}` : 'R$ --';
    document.getElementById('avgEtanol').textContent = stats.mediaEtanol > 0 ? `R$ ${stats.mediaEtanol.toFixed(2)}` : 'R$ --';
    document.getElementById('postos24h').textContent = filteredPostos.filter(p => p.is24h).length;
}

// ==========================================
// VISUALIZAÇÃO
// ==========================================

function setView(view) {
    currentView = view;
    
    // Atualizar botões
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-btn').classList.add('active');
    
    // Mostrar/ocultar containers
    const postosContainer = document.getElementById('postosContainer');
    const mapContainer = document.getElementById('mapContainer');
    
    if (view === 'map') {
        postosContainer.style.display = 'none';
        mapContainer.style.display = 'block';
        if (!map) {
            initMap();
        } else {
            updateMapMarkers();
            map.invalidateSize();
        }
    } else {
        postosContainer.style.display = '';
        mapContainer.style.display = 'none';
        renderPostos();
    }
}

function initMapView() {
    // Definir mapa como visualização ativa
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.view-btn[onclick*="map"]').classList.add('active');
    
    document.getElementById('postosContainer').style.display = 'none';
    document.getElementById('mapContainer').style.display = 'block';
    
    initMap();
}

// ==========================================
// MAPA COM MARCADORES COLORIDOS
// ==========================================

function initMap() {
    if (map) {
        updateMapMarkers();
        return;
    }
    
    // Criar mapa centrado em Guarulhos
    map = L.map('map', {
        center: [-23.4538, -46.5333],
        zoom: 13,
        zoomControl: true
    });
    
    // Camada de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Criar layer group para marcadores
    markersLayer = L.layerGroup().addTo(map);
    
    // Adicionar marcador da sede da Câmara
    addSedeMarker();
    
    // Adicionar legenda
    addMapLegend();
    
    // Adicionar marcadores dos postos
    updateMapMarkers();
}

function addSedeMarker() {
    const sedeIcon = L.divIcon({
        className: 'custom-marker sede-marker',
        html: `
            <div class="marker-pin sede">
                <i class="fas fa-landmark"></i>
            </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
    });
    
    L.marker([SEDE_CAMARA.lat, SEDE_CAMARA.lng], { icon: sedeIcon })
        .addTo(map)
        .bindPopup(`
            <div class="popup-sede">
                <h3>🏛️ Câmara Municipal de Guarulhos</h3>
                <p><strong>Sede da Frota</strong></p>
                <p>📍 ${SEDE_CAMARA.endereco}</p>
                <p>📞 (11) 2475-0200</p>
            </div>
        `);
}

function addMapLegend() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <h4>📊 Legenda de Preços</h4>
            <div class="legend-item">
                <span class="legend-color verde"></span>
                <span>Abaixo da ANP (bom preço)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color amarelo"></span>
                <span>Igual à ANP (dentro do limite)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color vermelho"></span>
                <span>Acima da ANP (⚠️ bloqueado)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color azul"></span>
                <span>Sede da Câmara</span>
            </div>
        `;
        return div;
    };
    
    legend.addTo(map);
}

function updateMapMarkers() {
    if (!markersLayer) return;
    
    // Limpar marcadores anteriores
    markersLayer.clearLayers();
    
    // Adicionar marcadores dos postos
    filteredPostos.forEach(posto => {
        const marker = createPostoMarker(posto);
        markersLayer.addLayer(marker);
    });
    
    // Ajustar visualização para incluir todos os marcadores
    if (filteredPostos.length > 0) {
        const allMarkers = [];
        markersLayer.eachLayer(m => allMarkers.push(m));
        
        if (allMarkers.length > 0) {
            const group = L.featureGroup(allMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

function createPostoMarker(posto) {
    // Determinar cor baseada no preço da gasolina vs ANP
    const corStatus = getMarkerColor(posto);
    
    const icon = L.divIcon({
        className: `custom-marker posto-marker ${corStatus.class}`,
        html: `
            <div class="marker-pin ${corStatus.class}" title="${posto.nomeFantasia}">
                <i class="fas fa-gas-pump"></i>
                <span class="marker-price">R$ ${posto.precos.gasolina?.toFixed(2) || '--'}</span>
            </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 60],
        popupAnchor: [0, -60]
    });
    
    const marker = L.marker([posto.coordenadas.lat, posto.coordenadas.lng], { icon: icon });
    
    // Popup com informações detalhadas
    marker.bindPopup(createMarkerPopup(posto, corStatus));
    
    return marker;
}

function getMarkerColor(posto) {
    const precoGasolina = posto.precos.gasolina;
    const anpGasolina = anpData.gasolinaComum;
    
    if (!precoGasolina || !anpGasolina) {
        return { class: 'cinza', label: 'Sem dados', icon: '❓' };
    }
    
    const diferenca = ((precoGasolina - anpGasolina) / anpGasolina) * 100;
    
    if (diferenca < -1) {
        // Mais de 1% abaixo da ANP
        return { 
            class: 'verde', 
            label: 'Abaixo da ANP', 
            icon: '✅',
            diff: diferenca.toFixed(1) + '%'
        };
    } else if (diferenca <= 1) {
        // Entre -1% e +1% da ANP (considerado igual)
        return { 
            class: 'amarelo', 
            label: 'Igual à ANP', 
            icon: '⚠️',
            diff: diferenca.toFixed(1) + '%'
        };
    } else {
        // Acima da ANP
        return { 
            class: 'vermelho', 
            label: 'Acima da ANP', 
            icon: '🚫',
            diff: '+' + diferenca.toFixed(1) + '%'
        };
    }
}

function createMarkerPopup(posto, corStatus) {
    const distancia = calcularDistancia(
        SEDE_CAMARA.lat, SEDE_CAMARA.lng,
        posto.coordenadas.lat, posto.coordenadas.lng
    ).toFixed(1);
    
    return `
        <div class="popup-posto ${corStatus.class}">
            <div class="popup-header">
                <h3>${posto.nomeFantasia}</h3>
                <span class="popup-bandeira">${posto.bandeira}</span>
            </div>
            
            <div class="popup-status ${corStatus.class}">
                ${corStatus.icon} ${corStatus.label} 
                ${corStatus.diff ? `<small>(${corStatus.diff})</small>` : ''}
            </div>
            
            <div class="popup-info">
                <p>📍 ${posto.endereco.logradouro}, ${posto.endereco.numero}</p>
                <p>🏘️ ${posto.endereco.bairro}</p>
                <p>📏 ${distancia} km da sede</p>
                <p>🕐 ${posto.is24h ? '24 horas' : (isOpen(posto) ? 'Aberto agora' : 'Fechado')}</p>
            </div>
            
            <div class="popup-precos">
                <div class="popup-preco ${getPrecoClass(posto.precos.gasolina, anpData.gasolinaComum)}">
                    <span class="label">Gasolina</span>
                    <span class="valor">R$ ${posto.precos.gasolina?.toFixed(2) || '--'}</span>
                </div>
                <div class="popup-preco ${getPrecoClass(posto.precos.etanol, anpData.etanol)}">
                    <span class="label">Etanol</span>
                    <span class="valor">R$ ${posto.precos.etanol?.toFixed(2) || '--'}</span>
                </div>
                <div class="popup-preco">
                    <span class="label">Diesel</span>
                    <span class="valor">R$ ${posto.precos.diesel?.toFixed(2) || '--'}</span>
                </div>
                <div class="popup-preco">
                    <span class="label">GNV</span>
                    <span class="valor">R$ ${posto.precos.gnv?.toFixed(2) || '--'}</span>
                </div>
            </div>
            
            <div class="popup-anp">
                <small>Limite ANP Gasolina: R$ ${anpData.gasolinaComum?.toFixed(2) || '--'}</small>
            </div>
            
            <div class="popup-actions">
                <button onclick="openModal(${posto.id})" class="btn-popup-details">
                    <i class="fas fa-info-circle"></i> Detalhes
                </button>
                <button onclick="openDirections(${posto.id})" class="btn-popup-directions">
                    <i class="fas fa-directions"></i> Rota
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// RENDERIZAÇÃO DE POSTOS (GRID/LIST)
// ==========================================

function renderPostos() {
    const container = document.getElementById('postosContainer');
    
    if (filteredPostos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum posto encontrado</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }
    
    if (currentView === 'grid') {
        container.className = 'postos-grid';
        container.innerHTML = filteredPostos.map(posto => createPostoCard(posto)).join('');
    } else if (currentView === 'list') {
        container.className = 'postos-list';
        container.innerHTML = filteredPostos.map(posto => createPostoListItem(posto)).join('');
    }
}

function createPostoCard(posto) {
    const corStatus = getMarkerColor(posto);
    const gasolinaClass = getPrecoClass(posto.precos.gasolina, anpData.gasolinaComum);
    const etanolClass = getPrecoClass(posto.precos.etanol, anpData.etanol);
    
    return `
        <div class="posto-card ${corStatus.class}-border" onclick="openModal(${posto.id})">
            <div class="posto-card-header">
                <span class="posto-bandeira">${posto.bandeira}</span>
                <span class="posto-status ${corStatus.class}">${corStatus.icon}</span>
                <h3 class="posto-nome">${posto.nomeFantasia}</h3>
                <p class="posto-endereco">
                    <i class="fas fa-map-marker-alt"></i>
                    ${formatEnderecoCard(posto)}
                </p>
            </div>
            <div class="posto-card-body">
                <div class="posto-precos">
                    <div class="preco-item">
                        <span class="preco-label">Gasolina</span>
                        <span class="preco-valor ${gasolinaClass}">${formatPreco(posto.precos.gasolina)}</span>
                    </div>
                    <div class="preco-item">
                        <span class="preco-label">Etanol</span>
                        <span class="preco-valor ${etanolClass}">${formatPreco(posto.precos.etanol)}</span>
                    </div>
                    <div class="preco-item">
                        <span class="preco-label">Diesel</span>
                        <span class="preco-valor">${formatPreco(posto.precos.diesel)}</span>
                    </div>
                    <div class="preco-item">
                        <span class="preco-label">GNV</span>
                        <span class="preco-valor">${formatPreco(posto.precos.gnv)}</span>
                    </div>
                </div>
            </div>
            <div class="posto-card-footer">
                <span class="posto-horario ${posto.is24h || isOpen(posto) ? 'aberto' : 'fechado'}">
                    <i class="fas fa-clock"></i>
                    ${posto.is24h ? '24 horas' : (isOpen(posto) ? 'Aberto agora' : 'Fechado')}
                </span>
                <div class="posto-acoes">
                    <button class="btn-acao" onclick="event.stopPropagation(); openDirections(${posto.id})" title="Como chegar">
                        <i class="fas fa-directions"></i>
                    </button>
                    <button class="btn-acao" onclick="event.stopPropagation(); focusOnMap(${posto.id})" title="Ver no mapa">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createPostoListItem(posto) {
    const corStatus = getMarkerColor(posto);
    
    return `
        <div class="posto-list-item ${corStatus.class}-border" onclick="openModal(${posto.id})">
            <div class="posto-list-icon ${corStatus.class}">
                <i class="fas fa-gas-pump"></i>
            </div>
            <div class="posto-list-info">
                <h3 class="posto-list-nome">${posto.nomeFantasia} <span class="status-badge ${corStatus.class}">${corStatus.icon}</span></h3>
                <p class="posto-list-endereco">${formatEnderecoCard(posto)} - ${posto.bandeira}</p>
            </div>
            <div class="posto-list-precos">
                <div class="posto-list-preco">
                    <span class="posto-list-preco-label">Gasolina</span>
                    <span class="posto-list-preco-valor ${getPrecoClass(posto.precos.gasolina, anpData.gasolinaComum)}">${formatPreco(posto.precos.gasolina)}</span>
                </div>
                <div class="posto-list-preco">
                    <span class="posto-list-preco-label">Etanol</span>
                    <span class="posto-list-preco-valor">${formatPreco(posto.precos.etanol)}</span>
                </div>
                <div class="posto-list-preco">
                    <span class="posto-list-preco-label">Diesel</span>
                    <span class="posto-list-preco-valor">${formatPreco(posto.precos.diesel)}</span>
                </div>
            </div>
        </div>
    `;
}

function focusOnMap(id) {
    const posto = getPostoById(id);
    if (!posto) return;
    
    // Mudar para visualização de mapa
    setView('map');
    
    // Centralizar no posto
    setTimeout(() => {
        map.setView([posto.coordenadas.lat, posto.coordenadas.lng], 16);
        
        // Abrir popup do posto
        markersLayer.eachLayer(marker => {
            const latlng = marker.getLatLng();
            if (Math.abs(latlng.lat - posto.coordenadas.lat) < 0.0001 && 
                Math.abs(latlng.lng - posto.coordenadas.lng) < 0.0001) {
                marker.openPopup();
            }
        });
    }, 300);
}

// ==========================================
// MODAL
// ==========================================

function openModal(id) {
    const posto = getPostoById(id);
    if (!posto) return;
    
    document.getElementById('modalTitle').textContent = posto.nomeFantasia;
    document.getElementById('modalBody').innerHTML = createModalContent(posto);
    document.getElementById('postoModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('postoModal').classList.remove('active');
    document.body.style.overflow = '';
}

function createModalContent(posto) {
    const distancia = calcularDistancia(
        SEDE_CAMARA.lat, SEDE_CAMARA.lng,
        posto.coordenadas.lat, posto.coordenadas.lng
    ).toFixed(1);
    
    const corStatus = getMarkerColor(posto);
    
    return `
        <div class="modal-status-banner ${corStatus.class}">
            ${corStatus.icon} ${corStatus.label} ${corStatus.diff ? `(${corStatus.diff} em relação à ANP)` : ''}
        </div>
        
        <div class="modal-section">
            <h4 class="modal-section-title"><i class="fas fa-info-circle"></i> Informações Gerais</h4>
            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <span class="modal-info-label">Bandeira</span>
                    <span class="modal-info-value">${posto.bandeira}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">CNPJ</span>
                    <span class="modal-info-value">${posto.cnpj}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Telefone</span>
                    <span class="modal-info-value">${posto.telefone}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Distância da Sede</span>
                    <span class="modal-info-value">${distancia} km</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4 class="modal-section-title"><i class="fas fa-map-marker-alt"></i> Endereço</h4>
            <p style="color: var(--text-secondary);">
                ${posto.endereco.logradouro}, ${posto.endereco.numero}<br>
                ${posto.endereco.bairro} - ${posto.endereco.cidade}/${posto.endereco.estado}<br>
                CEP: ${posto.endereco.cep}
            </p>
        </div>
        
        <div class="modal-section">
            <h4 class="modal-section-title"><i class="fas fa-dollar-sign"></i> Preços vs ANP</h4>
            <div class="modal-precos-grid">
                ${createModalPrecoCard('Gasolina', posto.precos.gasolina, anpData.gasolinaComum)}
                ${createModalPrecoCard('Etanol', posto.precos.etanol, anpData.etanol)}
                ${createModalPrecoCard('Diesel', posto.precos.diesel, anpData.diesel)}
                ${createModalPrecoCard('GNV', posto.precos.gnv, anpData.gnv)}
            </div>
            <p class="modal-anp-note">
                ⚠️ <strong>Importante:</strong> Preços acima da ANP são bloqueados pelo sistema de cartões, conforme contrato.
            </p>
        </div>
        
        <div class="modal-section">
            <h4 class="modal-section-title"><i class="fas fa-clock"></i> Horário de Funcionamento</h4>
            <p style="color: var(--text-secondary);">
                ${posto.is24h ? '🕐 Funcionamento 24 horas' : formatHorario(posto.horarioFuncionamento)}
            </p>
        </div>
        
        <div class="modal-section">
            <h4 class="modal-section-title"><i class="fas fa-concierge-bell"></i> Serviços</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${posto.servicos.map(s => `<span class="badge badge-info">${s}</span>`).join('')}
            </div>
        </div>
        
        <div class="modal-section modal-actions-section">
            <button class="btn-directions" onclick="openDirections(${posto.id})">
                <i class="fas fa-directions"></i> Como Chegar
            </button>
            <button class="btn-map-focus" onclick="closeModal(); focusOnMap(${posto.id})">
                <i class="fas fa-map-marker-alt"></i> Ver no Mapa
            </button>
        </div>
    `;
}

function createModalPrecoCard(label, preco, anpPreco) {
    if (!preco || preco <= 0) {
        return `
            <div class="modal-preco-card">
                <span class="modal-preco-label">${label}</span>
                <span class="modal-preco-valor">--</span>
            </div>
        `;
    }
    
    let diffClass = '';
    let diffText = '';
    let statusIcon = '';
    
    if (anpPreco) {
        const diff = ((preco - anpPreco) / anpPreco * 100).toFixed(1);
        if (diff < -1) {
            diffClass = 'abaixo';
            diffText = `${diff}% ANP`;
            statusIcon = '✅';
        } else if (diff <= 1) {
            diffClass = 'igual';
            diffText = 'Igual ANP';
            statusIcon = '⚠️';
        } else {
            diffClass = 'acima';
            diffText = `+${diff}% ANP`;
            statusIcon = '🚫';
        }
    }
    
    return `
        <div class="modal-preco-card ${diffClass}">
            <span class="modal-preco-label">${label}</span>
            <span class="modal-preco-valor">R$ ${preco.toFixed(2)}</span>
            ${anpPreco ? `<span class="modal-preco-comparacao ${diffClass}">${statusIcon} ${diffText}</span>` : ''}
            ${anpPreco ? `<span class="modal-preco-anp">ANP: R$ ${anpPreco.toFixed(2)}</span>` : ''}
        </div>
    `;
}

function openDirections(id) {
    const posto = getPostoById(id);
    if (!posto) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${posto.coordenadas.lat},${posto.coordenadas.lng}`;
    window.open(url, '_blank');
}

// ==========================================
// CHAT IA
// ==========================================

function toggleChat() {
    const container = document.getElementById('chatContainer');
    const toggleBtn = document.getElementById('chatToggleBtn');
    
    chatOpen = !chatOpen;
    
    if (chatOpen) {
        container.classList.remove('minimized');
        toggleBtn.style.display = 'none';
    } else {
        container.classList.add('minimized');
        toggleBtn.style.display = 'flex';
    }
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
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
    document.getElementById('chatInput').value = question;
    sendMessage();
}

function addChatMessage(content, type) {
    const messagesContainer = document.getElementById('chatMessages');
    
    const messageHTML = `
        <div class="message ${type}">
            <div class="message-avatar">
                <i class="fas fa-${type === 'bot' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                ${formatChatMessage(content)}
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatChatMessage(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '<br>• ');
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const indicator = `
        <div class="message bot typing-indicator" id="typingIndicator">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>Digitando<span class="dots">...</span></p>
            </div>
        </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// ==========================================
// INTEGRAÇÃO COM GEMINI AI
// ==========================================

async function getAIResponse(userMessage) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'SUA_API_KEY_AQUI') {
        return getLocalResponse(userMessage);
    }

    try {
        const postosContext = prepareFullContext();
        
        const prompt = `Você é um assistente virtual inteligente da Câmara Municipal de Guarulhos, especializado em:
1. Postos de combustíveis credenciados
2. O contrato administrativo com a empresa Prime (Contrato nº 08/2025)
3. Regras de abastecimento da frota oficial

${CONTRATO_PRIME}

DADOS DOS POSTOS CREDENCIADOS:
${postosContext}

DADOS ANP ATUAIS (Média Semanal Guarulhos):
- Gasolina Comum: R$ ${anpData?.gasolinaComum?.toFixed(2) || 'N/A'} (limite máximo do contrato)
- Etanol: R$ ${anpData?.etanol?.toFixed(2) || 'N/A'}
- Diesel: R$ ${anpData?.diesel?.toFixed(2) || 'N/A'}
- GNV: R$ ${anpData?.gnv?.toFixed(2) || 'N/A'}

CLASSIFICAÇÃO DE PREÇOS (usado no mapa):
- 🟢 VERDE: Mais de 1% abaixo da ANP (recomendado)
- 🟡 AMARELO: Entre -1% e +1% da ANP (dentro do limite)
- 🔴 VERMELHO: Acima de 1% da ANP (bloqueado pelo sistema)

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro
- Seja claro, objetivo e amigável
- Use emojis moderadamente
- Cite cláusulas do contrato quando relevante
- Para preços, indique se está verde/amarelo/vermelho
- Formate respostas longas com quebras de linha

PERGUNTA DO USUÁRIO: ${userMessage}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2500, topP: 0.95 }
            })
        });

        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar sua pergunta.";
        
    } catch (error) {
        console.error('Gemini API error:', error);
        return getLocalResponse(userMessage);
    }
}

function prepareFullContext() {
    return postosData.map(p => {
        const distancia = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, p.coordenadas.lat, p.coordenadas.lng).toFixed(1);
        const status = getMarkerColor(p);
        
        return `
- ${p.nomeFantasia} (${p.bandeira}) [${status.label}]
  Endereço: ${p.endereco.logradouro}, ${p.endereco.numero} - ${p.endereco.bairro}
  Distância da sede: ${distancia} km
  Gasolina: R$ ${p.precos.gasolina?.toFixed(2) || 'N/D'} ${status.icon}
  Etanol: R$ ${p.precos.etanol?.toFixed(2) || 'N/D'}
  24 horas: ${p.is24h ? 'Sim' : 'Não'}`;
    }).join('\n');
}

function getLocalResponse(message) {
    const msg = message.toLowerCase();
    
    // Postos verdes (melhores preços)
    if (msg.includes('verde') || msg.includes('melhor') || msg.includes('recomend')) {
        const postosVerdes = postosData.filter(p => {
            const status = getMarkerColor(p);
            return status.class === 'verde';
        });
        
        if (postosVerdes.length === 0) {
            return "🟡 No momento, não há postos com preços significativamente abaixo da ANP. Os postos amarelos estão dentro do limite contratual.";
        }
        
        let response = "🟢 **Postos com melhores preços (VERDE):**\n\n";
        postosVerdes.forEach((p, i) => {
            const diff = ((p.precos.gasolina - anpData.gasolinaComum) / anpData.gasolinaComum * 100).toFixed(1);
            response += `${i + 1}. **${p.nomeFantasia}**\n   💰 R$ ${p.precos.gasolina.toFixed(2)} (${diff}% ANP)\n   📍 ${formatEnderecoCard(p)}\n\n`;
        });
        
        return response;
    }
    
    // Postos vermelhos (bloqueados)
    if (msg.includes('vermelho') || msg.includes('bloqueado') || msg.includes('acima')) {
        const postosVermelhos = postosData.filter(p => {
            const status = getMarkerColor(p);
            return status.class === 'vermelho';
        });
        
        if (postosVermelhos.length === 0) {
            return "✅ Ótimo! Nenhum posto está com preços acima do limite ANP no momento.";
        }
        
        let response = "🔴 **Postos com preços ACIMA da ANP (bloqueados):**\n\n";
        postosVermelhos.forEach((p, i) => {
            const diff = ((p.precos.gasolina - anpData.gasolinaComum) / anpData.gasolinaComum * 100).toFixed(1);
            response += `${i + 1}. **${p.nomeFantasia}**\n   ⚠️ R$ ${p.precos.gasolina.toFixed(2)} (+${diff}% ANP)\n   📍 ${formatEnderecoCard(p)}\n\n`;
        });
        
        response += "⚠️ O sistema de cartões bloqueia abastecimentos nesses postos automaticamente.";
        return response;
    }
    
    // Legenda do mapa
    if (msg.includes('legenda') || msg.includes('cores') || msg.includes('mapa')) {
        return `🗺️ **Legenda do Mapa:**

🟢 **VERDE** - Preço abaixo da ANP (>1%)
   ✅ Melhor opção, economia garantida

🟡 **AMARELO** - Preço igual à ANP (±1%)
   ⚠️ Dentro do limite contratual

🔴 **VERMELHO** - Preço acima da ANP (>1%)
   🚫 Bloqueado pelo sistema de cartões

🔵 **AZUL** - Sede da Câmara Municipal
   📍 Av. Guarulhos, 845

**Limite ANP atual (gasolina): R$ ${anpData.gasolinaComum?.toFixed(2) || '--'}**`;
    }
    
    // Contrato
    if (msg.includes('contrato') || msg.includes('prime')) {
        return `📋 **Contrato Administrativo nº 08/2025**

🏢 **Contratada:** Prime Consultoria
📅 **Vigência:** 30 meses (desde 23/10/2025)
💰 **Valor total:** R$ 1.326.946,38
📉 **Taxa de Administração:** -5,65% (DESCONTO!)
⛽ **Limite mensal:** 12.000 litros

🚗 **Frota:** 40 veículos (39 Onix + 1 Spin)

Posso detalhar qualquer cláusula!`;
    }
    
    // Gasolina mais barata
    if (msg.includes('gasolina') && (msg.includes('barat') || msg.includes('menor'))) {
        const ordenados = [...postosData].filter(p => p.precos?.gasolina > 0)
            .sort((a, b) => a.precos.gasolina - b.precos.gasolina).slice(0, 5);
        
        let response = "⛽ **Top 5 - Gasolina mais barata:**\n\n";
        ordenados.forEach((p, i) => {
            const status = getMarkerColor(p);
            response += `${i + 1}. **${p.nomeFantasia}** ${status.icon}\n   💰 R$ ${p.precos.gasolina.toFixed(2)}\n   📍 ${formatEnderecoCard(p)}\n\n`;
        });
        
        return response;
    }
    
    // 24 horas
    if (msg.includes('24') || msg.includes('madrugada')) {
        const postos24h = postosData.filter(p => p.is24h);
        
        let response = `🕐 **Postos 24 horas (${postos24h.length}):**\n\n`;
        postos24h.forEach((p, i) => {
            const status = getMarkerColor(p);
            const dist = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, p.coordenadas.lat, p.coordenadas.lng).toFixed(1);
            response += `${i + 1}. **${p.nomeFantasia}** ${status.icon}\n   📍 ${formatEnderecoCard(p)}\n   📏 ${dist} km da sede\n\n`;
        });
        
        return response;
    }
    
    // Resposta padrão
    return `🤖 **Posso ajudar com:**

🗺️ **Mapa:** cores verde/amarelo/vermelho
💰 Preços e comparação com ANP
📋 Detalhes do contrato Prime
🚗 Frota e limites de abastecimento
🕐 Postos 24 horas
📏 Distâncias entre postos

Pergunte sobre os postos ou o contrato!`;
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function formatEnderecoCard(posto) {
    return `${posto.endereco.logradouro}, ${posto.endereco.numero} - ${posto.endereco.bairro}`;
}

function formatPreco(preco) {
    if (!preco || preco <= 0) return '--';
    return `R$ ${preco.toFixed(2)}`;
}

function getPrecoClass(preco, anpPreco) {
    if (!preco || !anpPreco) return '';
    const diff = ((preco - anpPreco) / anpPreco) * 100;
    if (diff < -1) return 'destaque';
    if (diff > 1) return 'alerta';
    return '';
}

function isOpen(posto) {
    if (posto.is24h) return true;
    
    const now = new Date();
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaAtual = dias[now.getDay()];
    const horario = posto.horarioFuncionamento[diaAtual];
    
    if (!horario) return false;
    
    const horaAtual = now.getHours() * 60 + now.getMinutes();
    const [abreH, abreM] = horario.abertura.split(':').map(Number);
    const [fechaH, fechaM] = horario.fechamento.split(':').map(Number);
    const abertura = abreH * 60 + abreM;
    const fechamento = fechaH * 60 + fechaM;
    
    return horaAtual >= abertura && horaAtual < fechamento;
}

function formatHorario(horario) {
    const dias = { segunda: 'Seg', terca: 'Ter', quarta: 'Qua', quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom' };
    let result = '';
    for (const [dia, h] of Object.entries(horario)) {
        if (h && h.abertura && h.fechamento) {
            result += `${dias[dia]}: ${h.abertura} - ${h.fechamento}<br>`;
        }
    }
    return result || 'Horário não informado';
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Atualizado: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function refreshData() {
    showLoading(true);
    setTimeout(() => {
        updateMapMarkers();
        updateLastUpdate();
        updateStats();
        showLoading(false);
    }, 1000);
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('active', show);
}

function showError(message) {
    alert(message);
}

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
