// ==========================================
// APLICAÇÃO PRINCIPAL
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
        // Carregar dados salvos
        carregarPostos();
        
        // Carregar ANP da API
        await carregarDadosANP();
        
        // Atualizar interface
        updateANPDisplay();
        populateFilters();
        updateStats();
        updateLastUpdate();
        
        // Configurar eventos
        setupEventListeners();
        
        // Inicializar mapa
        initMapView();
        
        filteredPostos = [...postosData];
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showError('Erro ao carregar dados. Tente novamente.');
    } finally {
        showLoading(false);
    }
}

// ==========================================
// DISPLAY ANP
// ==========================================

function updateANPDisplay() {
    document.getElementById('anpGasolina').textContent = anpData.gasolinaComum 
        ? `R$ ${anpData.gasolinaComum.toFixed(2)}` 
        : 'R$ --';
    document.getElementById('anpEtanol').textContent = anpData.etanol 
        ? `R$ ${anpData.etanol.toFixed(2)}` 
        : 'R$ --';
}

// ==========================================
// ESTATÍSTICAS (com mais barato e mais caro)
// ==========================================

function updateStats() {
    const stats = getEstatisticas();
    
    document.getElementById('totalPostos').textContent = stats.totalPostos;
    
    // Mais barato
    if (stats.maisBaratoGasolina) {
        document.getElementById('maisBaratoValor').textContent = 
            `R$ ${stats.maisBaratoGasolina.precos.gasolina.toFixed(2)}`;
        document.getElementById('maisBaratoNome').textContent = 
            truncateText(stats.maisBaratoGasolina.nomeFantasia, 25);
    }
    
    // Mais caro
    if (stats.maisCaroGasolina) {
        document.getElementById('maisCaroValor').textContent = 
            `R$ ${stats.maisCaroGasolina.precos.gasolina.toFixed(2)}`;
        document.getElementById('maisCaroNome').textContent = 
            truncateText(stats.maisCaroGasolina.nomeFantasia, 25);
    }
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ==========================================
// FILTROS
// ==========================================

function populateFilters() {
    const filterNeighborhood = document.getElementById('filterNeighborhood');
    const bairros = getBairros();
    filterNeighborhood.innerHTML = '<option value="all">Todos</option>';
    bairros.forEach(b => {
        filterNeighborhood.innerHTML += `<option value="${b}">${b}</option>`;
    });
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('filterNeighborhood').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    
    document.getElementById('postoModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

function applyFilters() {
    const filtros = {
        busca: document.getElementById('searchInput').value,
        bairro: document.getElementById('filterNeighborhood').value
    };
    
    filteredPostos = filterPostos(filtros);
    
    const sortBy = document.getElementById('sortBy').value;
    filteredPostos = sortPostos(filteredPostos, sortBy);
    
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
// VISUALIZAÇÃO
// ==========================================

function setView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-btn').classList.add('active');
    
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
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.view-btn[onclick*="map"]').classList.add('active');
    
    document.getElementById('postosContainer').style.display = 'none';
    document.getElementById('mapContainer').style.display = 'block';
    
    initMap();
}

// ==========================================
// MAPA COM MARCADORES EM BOLINHAS
// ==========================================

function initMap() {
    if (map) {
        updateMapMarkers();
        return;
    }
    
    map = L.map('map', {
        center: [-23.4538, -46.5333],
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
}

function addSedeMarker() {
    const sedeIcon = L.divIcon({
        className: 'marker-sede',
        html: `<div class="marker-circle sede"><i class="fas fa-landmark"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
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
    
    filteredPostos.forEach(posto => {
        const marker = createPostoMarker(posto);
        markersLayer.addLayer(marker);
    });
    
    if (filteredPostos.length > 0) {
        const bounds = [];
        filteredPostos.forEach(p => bounds.push([p.coordenadas.lat, p.coordenadas.lng]));
        bounds.push([SEDE_CAMARA.lat, SEDE_CAMARA.lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

function createPostoMarker(posto) {
    const status = getMarkerStatus(posto);
    
    // Marcador em formato de BOLINHA colorida
    const icon = L.divIcon({
        className: 'marker-posto',
        html: `
            <div class="marker-circle ${status.class}" title="${posto.nomeFantasia}">
                <span class="marker-price">R$${posto.precos.gasolina?.toFixed(2) || '--'}</span>
            </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
    });
    
    const marker = L.marker([posto.coordenadas.lat, posto.coordenadas.lng], { icon: icon });
    marker.bindPopup(createMarkerPopup(posto, status));
    
    return marker;
}

function getMarkerStatus(posto) {
    const preco = posto.precos.gasolina;
    const anp = anpData.gasolinaComum;
    
    if (!preco || !anp) {
        return { class: 'gray', label: 'Sem dados', icon: '❓' };
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
    const dist = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, posto.coordenadas.lat, posto.coordenadas.lng).toFixed(1);
    
    return `
        <div class="popup-content">
            <h3>${posto.nomeFantasia}</h3>
            <span class="popup-badge ${status.class}">${status.icon} ${status.label}</span>
            
            <div class="popup-info">
                <p>📍 ${posto.endereco.logradouro}, ${posto.endereco.numero}</p>
                <p>🏘️ ${posto.endereco.bairro}</p>
                <p>📏 ${dist} km da sede</p>
            </div>
            
            <div class="popup-prices">
                <div class="popup-price ${getPriceClass(posto.precos.gasolina, anpData.gasolinaComum)}">
                    <span>Gasolina</span>
                    <strong>R$ ${posto.precos.gasolina?.toFixed(2) || '--'}</strong>
                </div>
                <div class="popup-price ${getPriceClass(posto.precos.etanol, anpData.etanol)}">
                    <span>Etanol</span>
                    <strong>R$ ${posto.precos.etanol?.toFixed(2) || '--'}</strong>
                </div>
            </div>
            
            <div class="popup-actions">
                <button onclick="openModal(${posto.id})" class="btn-details">
                    <i class="fas fa-edit"></i> Ver / Editar
                </button>
                <button onclick="openDirections(${posto.id})" class="btn-route">
                    <i class="fas fa-route"></i> Rota
                </button>
            </div>
        </div>
    `;
}

function getPriceClass(preco, anp) {
    if (!preco || !anp) return '';
    const diff = ((preco - anp) / anp) * 100;
    if (diff < -1) return 'price-low';
    if (diff > 1) return 'price-high';
    return '';
}

// ==========================================
// MODAL COM EDIÇÃO DE PREÇO
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
    const status = getMarkerStatus(posto);
    const dist = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, posto.coordenadas.lat, posto.coordenadas.lng).toFixed(1);
    
    const ultimaAtualizacao = posto.ultimaAtualizacaoPreco 
        ? new Date(posto.ultimaAtualizacaoPreco).toLocaleString('pt-BR')
        : 'Não informado';
    
    return `
        <div class="modal-status ${status.class}">
            ${status.icon} ${status.label} ${status.diff ? `(${status.diff})` : ''}
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-info-circle"></i> Informações</h4>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Bandeira</span>
                    <span class="info-value">${posto.bandeira}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Distância</span>
                    <span class="info-value">${dist} km</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Telefone</span>
                    <span class="info-value">${posto.telefone}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Última atualização</span>
                    <span class="info-value">${ultimaAtualizacao}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-map-marker-alt"></i> Endereço</h4>
            <p>${posto.endereco.logradouro}, ${posto.endereco.numero}<br>
            ${posto.endereco.bairro} - ${posto.endereco.cidade}/${posto.endereco.estado}<br>
            CEP: ${posto.endereco.cep}</p>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-dollar-sign"></i> Preços (Editar)</h4>
            <p class="anp-reference">Limite ANP: Gasolina R$ ${anpData.gasolinaComum?.toFixed(2) || '--'} | Etanol R$ ${anpData.etanol?.toFixed(2) || '--'}</p>
            
            <div class="price-edit-grid">
                <div class="price-edit-item">
                    <label>Gasolina Comum</label>
                    <div class="price-input-group">
                        <span>R$</span>
                        <input type="number" 
                               id="editGasolina" 
                               value="${posto.precos.gasolina || ''}" 
                               step="0.01" 
                               min="0"
                               placeholder="0.00">
                    </div>
                    <span class="price-status ${getPriceClass(posto.precos.gasolina, anpData.gasolinaComum)}">
                        ${getPriceStatusText(posto.precos.gasolina, anpData.gasolinaComum)}
                    </span>
                </div>
                
                <div class="price-edit-item">
                    <label>Etanol</label>
                    <div class="price-input-group">
                        <span>R$</span>
                        <input type="number" 
                               id="editEtanol" 
                               value="${posto.precos.etanol || ''}" 
                               step="0.01" 
                               min="0"
                               placeholder="0.00">
                    </div>
                    <span class="price-status ${getPriceClass(posto.precos.etanol, anpData.etanol)}">
                        ${getPriceStatusText(posto.precos.etanol, anpData.etanol)}
                    </span>
                </div>
            </div>
            
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
    if (!preco || !anp) return '';
    const diff = ((preco - anp) / anp) * 100;
    if (diff < -1) return `✅ ${diff.toFixed(1)}% abaixo`;
    if (diff > 1) return `🚫 +${diff.toFixed(1)}% acima`;
    return `⚠️ Dentro do limite`;
}

function salvarPrecos(postoId) {
    const gasolina = parseFloat(document.getElementById('editGasolina').value);
    const etanol = parseFloat(document.getElementById('editEtanol').value);
    
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
        // Atualizar interface
        filteredPostos = [...postosData];
        updateStats();
        updateMapMarkers();
        
        // Reabrir modal com dados atualizados
        openModal(postoId);
        
        showNotification('Preços atualizados com sucesso!', 'success');
    } else {
        showNotification('Informe pelo menos um preço válido.', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function openDirections(id) {
    const posto = getPostoById(id);
    if (!posto) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${posto.coordenadas.lat},${posto.coordenadas.lng}`;
    window.open(url, '_blank');
}

// ==========================================
// RENDERIZAÇÃO GRID/LIST
// ==========================================

function renderPostos() {
    const container = document.getElementById('postosContainer');
    
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
    
    return `
        <div class="posto-card ${status.class}" onclick="openModal(${posto.id})">
            <div class="card-header">
                <span class="card-status ${status.class}">${status.icon}</span>
                <h3>${posto.nomeFantasia}</h3>
                <span class="card-bandeira">${posto.bandeira}</span>
            </div>
            <div class="card-address">
                <i class="fas fa-map-marker-alt"></i>
                ${posto.endereco.bairro}
            </div>
            <div class="card-prices">
                <div class="card-price ${getPriceClass(posto.precos.gasolina, anpData.gasolinaComum)}">
                    <span>Gasolina</span>
                    <strong>R$ ${posto.precos.gasolina?.toFixed(2) || '--'}</strong>
                </div>
                <div class="card-price ${getPriceClass(posto.precos.etanol, anpData.etanol)}">
                    <span>Etanol</span>
                    <strong>R$ ${posto.precos.etanol?.toFixed(2) || '--'}</strong>
                </div>
            </div>
        </div>
    `;
}

function createPostoListItem(posto) {
    const status = getMarkerStatus(posto);
    
    return `
        <div class="posto-list-item" onclick="openModal(${posto.id})">
            <div class="list-icon ${status.class}">${status.icon}</div>
            <div class="list-info">
                <h3>${posto.nomeFantasia}</h3>
                <p>${posto.endereco.bairro} - ${posto.bandeira}</p>
            </div>
            <div class="list-prices">
                <span class="${getPriceClass(posto.precos.gasolina, anpData.gasolinaComum)}">
                    Gas: R$ ${posto.precos.gasolina?.toFixed(2) || '--'}
                </span>
                <span class="${getPriceClass(posto.precos.etanol, anpData.etanol)}">
                    Eta: R$ ${posto.precos.etanol?.toFixed(2) || '--'}
                </span>
            </div>
        </div>
    `;
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
    if (event.key === 'Enter') sendMessage();
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
    const container = document.getElementById('chatMessages');
    
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
    container.insertAdjacentHTML('beforeend', `
        <div class="message bot" id="typingIndicator">
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content"><p>Digitando...</p></div>
        </div>
    `);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
}

async function getAIResponse(message) {
    // Respostas locais inteligentes
    const msg = message.toLowerCase();
    
    if (msg.includes('barato') || msg.includes('menor') || msg.includes('melhor')) {
        const stats = getEstatisticas();
        if (stats.maisBaratoGasolina) {
            return `🟢 **Posto mais barato (Gasolina):**\n\n` +
                   `**${stats.maisBaratoGasolina.nomeFantasia}**\n` +
                   `💰 R$ ${stats.maisBaratoGasolina.precos.gasolina.toFixed(2)}\n` +
                   `📍 ${stats.maisBaratoGasolina.endereco.bairro}`;
        }
    }
    
    if (msg.includes('caro') || msg.includes('maior')) {
        const stats = getEstatisticas();
        if (stats.maisCaroGasolina) {
            return `🔴 **Posto mais caro (Gasolina):**\n\n` +
                   `**${stats.maisCaroGasolina.nomeFantasia}**\n` +
                   `💰 R$ ${stats.maisCaroGasolina.precos.gasolina.toFixed(2)}\n` +
                   `📍 ${stats.maisCaroGasolina.endereco.bairro}`;
        }
    }
    
    if (msg.includes('acima') || msg.includes('vermelho') || msg.includes('bloqueado')) {
        const acima = postosData.filter(p => {
            if (!p.precos.gasolina || !anpData.gasolinaComum) return false;
            return ((p.precos.gasolina - anpData.gasolinaComum) / anpData.gasolinaComum) * 100 > 1;
        });
        
        if (acima.length === 0) {
            return '✅ Nenhum posto está com preço acima da ANP no momento!';
        }
        
        let response = `🔴 **Postos com preço ACIMA da ANP (${acima.length}):**\n\n`;
        acima.forEach((p, i) => {
            const diff = ((p.precos.gasolina - anpData.gasolinaComum) / anpData.gasolinaComum * 100).toFixed(1);
            response += `${i + 1}. **${p.nomeFantasia}**\n   R$ ${p.precos.gasolina.toFixed(2)} (+${diff}%)\n\n`;
        });
        return response;
    }
    
    if (msg.includes('legenda') || msg.includes('cores') || msg.includes('mapa')) {
        return `🗺️ **Legenda do Mapa:**\n\n` +
               `🟢 **Verde** - Abaixo da ANP (bom preço)\n` +
               `🟡 **Amarelo** - Igual à ANP (±1%)\n` +
               `🔴 **Vermelho** - Acima da ANP (bloqueado)\n` +
               `🔵 **Azul** - Sede da Câmara\n\n` +
               `Limite ANP Gasolina: R$ ${anpData.gasolinaComum?.toFixed(2) || '--'}`;
    }
    
    if (msg.includes('anp') || msg.includes('limite') || msg.includes('referência')) {
        return `📊 **Preços ANP - Guarulhos:**\n\n` +
               `⛽ Gasolina: R$ ${anpData.gasolinaComum?.toFixed(2) || '--'}\n` +
               `🌿 Etanol: R$ ${anpData.etanol?.toFixed(2) || '--'}\n\n` +
               `Fonte: anp-gru.vercel.app`;
    }
    
    return `🤖 Posso ajudar com:\n\n` +
           `💰 "Qual o posto mais barato?"\n` +
           `🔴 "Quais postos estão acima da ANP?"\n` +
           `🗺️ "O que significam as cores?"\n` +
           `📊 "Qual o limite ANP?"\n\n` +
           `Digite sua pergunta!`;
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function updateLastUpdate() {
    const ultima = getUltimaAtualizacao();
    const texto = ultima 
        ? `Dados: ${new Date(ultima).toLocaleDateString('pt-BR')}`
        : `Atualizado: ${new Date().toLocaleDateString('pt-BR')}`;
    document.getElementById('lastUpdate').textContent = texto;
}

async function refreshData() {
    showLoading(true);
    
    try {
        await carregarDadosANP();
        updateANPDisplay();
        updateStats();
        updateMapMarkers();
        updateLastUpdate();
        showNotification('Dados atualizados!', 'success');
    } catch (error) {
        showNotification('Erro ao atualizar', 'error');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('active', show);
}

function showError(message) {
    alert(message);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
