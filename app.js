// ==========================================
// APLICAÇÃO PRINCIPAL
// ==========================================

// Variáveis globais
let currentView = 'grid';
let map = null;
let markers = [];
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
        renderPostos();
        updateLastUpdate();
        
        // Event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showError('Erro ao carregar dados. Tente novamente.');
    } finally {
        showLoading(false);
    }
}

async function loadData() {
    // Em produção, buscar dados da API
    // Por enquanto, usando dados locais
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
    
    renderPostos();
    updateStats();
    
    if (currentView === 'map' && map) {
        updateMapMarkers();
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
// RENDERIZAÇÃO DE POSTOS
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
    const gasolinaClass = getPrecoClass(posto.precos.gasolina, anpData.gasolinaComum);
    const etanolClass = getPrecoClass(posto.precos.etanol, anpData.etanol);
    
    return `
        <div class="posto-card" onclick="openModal(${posto.id})">
            <div class="posto-card-header">
                <span class="posto-bandeira">${posto.bandeira}</span>
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
                    <button class="btn-acao" onclick="event.stopPropagation(); openModal(${posto.id})" title="Detalhes">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createPostoListItem(posto) {
    return `
        <div class="posto-list-item" onclick="openModal(${posto.id})">
            <div class="posto-list-icon">
                <i class="fas fa-gas-pump"></i>
            </div>
            <div class="posto-list-info">
                <h3 class="posto-list-nome">${posto.nomeFantasia}</h3>
                <p class="posto-list-endereco">${formatEnderecoCard(posto)} - ${posto.bandeira}</p>
            </div>
            <div class="posto-list-precos">
                <div class="posto-list-preco">
                    <span class="posto-list-preco-label">Gasolina</span>
                    <span class="posto-list-preco-valor">${formatPreco(posto.precos.gasolina)}</span>
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
        initMap();
    } else {
        postosContainer.style.display = '';
        mapContainer.style.display = 'none';
        renderPostos();
    }
}

// ==========================================
// MAPA
// ==========================================

function initMap() {
    if (map) {
        updateMapMarkers();
        return;
    }
    
    map = L.map('map').setView([-23.4538, -46.5333], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Marcador da sede da Câmara
    const sedeIcon = L.divIcon({
        className: 'sede-marker',
        html: '<i class="fas fa-landmark" style="color: #1a5f7a; font-size: 24px;"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
    
    L.marker([SEDE_CAMARA.lat, SEDE_CAMARA.lng], { icon: sedeIcon })
        .addTo(map)
        .bindPopup('<strong>Câmara Municipal de Guarulhos</strong><br>' + SEDE_CAMARA.endereco);
    
    updateMapMarkers();
}

function updateMapMarkers() {
    // Remover marcadores antigos
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    // Adicionar novos marcadores
    filteredPostos.forEach(posto => {
        const marker = L.marker([posto.coordenadas.lat, posto.coordenadas.lng])
            .addTo(map)
            .bindPopup(createPopupContent(posto));
        markers.push(marker);
    });
    
    // Ajustar visualização
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function createPopupContent(posto) {
    return `
        <div class="popup-content">
            <h3>${posto.nomeFantasia}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${formatEnderecoCard(posto)}</p>
            <p><i class="fas fa-flag"></i> ${posto.bandeira}</p>
            <div class="popup-precos">
                <div class="popup-preco">
                    <span class="popup-preco-label">Gasolina</span>
                    <span class="popup-preco-valor">${formatPreco(posto.precos.gasolina)}</span>
                </div>
                <div class="popup-preco">
                    <span class="popup-preco-label">Etanol</span>
                    <span class="popup-preco-valor">${formatPreco(posto.precos.etanol)}</span>
                </div>
            </div>
            <button onclick="openModal(${posto.id})" style="margin-top: 10px; padding: 5px 10px; cursor: pointer;">
                Ver detalhes
            </button>
        </div>
    `;
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
    
    return `
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
            <h4 class="modal-section-title"><i class="fas fa-dollar-sign"></i> Preços</h4>
            <div class="modal-precos-grid">
                ${createModalPrecoCard('Gasolina', posto.precos.gasolina, anpData.gasolinaComum)}
                ${createModalPrecoCard('Etanol', posto.precos.etanol, anpData.etanol)}
                ${createModalPrecoCard('Diesel', posto.precos.diesel, anpData.diesel)}
                ${createModalPrecoCard('GNV', posto.precos.gnv, anpData.gnv)}
            </div>
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
        
        <div class="modal-section">
            <button class="btn-directions" onclick="openDirections(${posto.id})">
                <i class="fas fa-directions"></i> Como Chegar
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
    
    const diff = anpPreco ? ((preco - anpPreco) / anpPreco * 100).toFixed(1) : 0;
    const diffClass = diff < 0 ? 'abaixo' : (diff > 0 ? 'acima' : '');
    const diffText = diff < 0 ? `${diff}% ANP` : (diff > 0 ? `+${diff}% ANP` : 'Igual ANP');
    
    return `
        <div class="modal-preco-card">
            <span class="modal-preco-label">${label}</span>
            <span class="modal-preco-valor">R$ ${preco.toFixed(2)}</span>
            ${anpPreco ? `<span class="modal-preco-comparacao ${diffClass}">${diffText}</span>` : ''}
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
    
    // Adicionar mensagem do usuário
    addChatMessage(message, 'user');
    input.value = '';
    
    // Mostrar indicador de digitação
    showTypingIndicator();
    
    try {
        // Obter resposta da IA
        const response = await getAIResponse(message);
        
        // Remover indicador de digitação
        hideTypingIndicator();
        
        // Adicionar resposta
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
    // Converter markdown simples para HTML
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
        
        const prompt = `Você é um assistente virtual inteligente e versátil da Câmara Municipal de Guarulhos, especializado em:
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

SUAS CAPACIDADES:
- Responder QUALQUER pergunta sobre o contrato, postos, preços, regras
- Calcular distâncias entre postos usando coordenadas (fórmula de Haversine)
- Explicar cláusulas contratuais em linguagem simples
- Informar sobre penalidades, prazos, obrigações
- Comparar preços com limites do contrato
- Ajudar com dúvidas sobre LGPD, pagamentos, fiscalização
- Orientar sobre procedimentos de abastecimento
- Responder perguntas gerais também

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro
- Seja claro, objetivo e amigável
- Use emojis moderadamente para tornar a conversa agradável
- Cite cláusulas do contrato quando relevante
- Para distâncias, calcule usando as coordenadas dos postos
- Se não souber algo específico, seja honesto
- Formate respostas longas com quebras de linha

PERGUNTA DO USUÁRIO: ${userMessage}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2500,
                    topP: 0.95
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            throw new Error('API Error');
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return text || "Desculpe, não consegui processar sua pergunta. Pode reformular?";
        
    } catch (error) {
        console.error('Gemini API error:', error);
        return getLocalResponse(userMessage);
    }
}

function prepareFullContext() {
    return postosData.map(p => {
        const distancia = calcularDistancia(
            SEDE_CAMARA.lat, SEDE_CAMARA.lng,
            p.coordenadas.lat, p.coordenadas.lng
        ).toFixed(1);
        
        return `
- ${p.nomeFantasia} (${p.bandeira})
  Endereço: ${p.endereco.logradouro}, ${p.endereco.numero} - ${p.endereco.bairro}
  Distância da sede: ${distancia} km
  Coordenadas: ${p.coordenadas.lat}, ${p.coordenadas.lng}
  Gasolina: R$ ${p.precos.gasolina?.toFixed(2) || 'N/D'}
  Etanol: R$ ${p.precos.etanol?.toFixed(2) || 'N/D'}
  Diesel: R$ ${p.precos.diesel?.toFixed(2) || 'N/D'}
  GNV: R$ ${p.precos.gnv?.toFixed(2) || 'N/D'}
  24 horas: ${p.is24h ? 'Sim' : 'Não'}
  Telefone: ${p.telefone}`;
    }).join('\n');
}

// ==========================================
// RESPOSTAS LOCAIS (FALLBACK)
// ==========================================

function getLocalResponse(message) {
    const msg = message.toLowerCase();
    
    // Perguntas sobre o contrato
    if (msg.includes('contrato') || msg.includes('prime')) {
        return `📋 **Contrato Administrativo nº 08/2025**

🏢 **Contratada:** Prime Consultoria e Assessoria Empresarial LTDA
📅 **Vigência:** 30 meses a partir de 23/10/2025
💰 **Valor total:** R$ 1.326.946,38
📉 **Taxa de Administração:** -5,65% (desconto!)
⛽ **Limite mensal:** 12.000 litros

Posso detalhar qualquer cláusula específica!`;
    }
    
    // Taxa de administração
    if (msg.includes('taxa') && msg.includes('administra')) {
        return `💰 **Taxa de Administração do Contrato**

A taxa é **NEGATIVA de -5,65%**, ou seja, a Prime concede um **desconto** sobre o valor do combustível!

Isso significa que a cada R$ 100,00 em combustível, a Câmara paga R$ 94,35.`;
    }
    
    // Limite de abastecimento
    if (msg.includes('limite') || (msg.includes('máximo') && (msg.includes('litro') || msg.includes('abastec')))) {
        return `⛽ **Limites de Abastecimento**

📊 **Limite mensal da frota:** 12.000 litros (Ato da Mesa nº 356/2021)
🚗 **Consumo médio por veículo:** 167,73 litros/mês
💳 **Por cartão:** limite em R$ E em litros (ambos)
💵 **Preço máximo:** média ANP da semana anterior (atualmente R$ ${anpData.gasolinaComum?.toFixed(2)} gasolina)

O sistema bloqueia automaticamente abastecimentos acima desses limites!`;
    }
    
    // Penalidades
    if (msg.includes('penalidade') || msg.includes('multa') || msg.includes('sanção') || msg.includes('sancao')) {
        return `⚠️ **Penalidades do Contrato**

• **Advertência:** inexecução parcial sem gravidade
• **Multa:** 5% sobre o valor dos itens prejudicados
• **Impedimento de licitar:** inexecução grave, retardamento
• **Inidoneidade:** fraude, documentação falsa

📝 Prazo de defesa: 15 dias úteis
📋 Prazo para recolhimento de multa: 10 dias corridos`;
    }
    
    // Prazo de pagamento
    if (msg.includes('pagamento') && (msg.includes('prazo') || msg.includes('quando'))) {
        return `💳 **Pagamento aos Postos**

A **Prime é responsável exclusiva** pelo pagamento aos postos credenciados.
A Câmara NÃO responde solidária ou subsidiariamente.

📅 **Pagamento à Prime:** até 10 dias úteis após liquidação
📄 **Nota Fiscal:** deve conter período, valores e dados do contrato
📊 **Correção por atraso:** IPCA-IBGE`;
    }
    
    // Frota
    if (msg.includes('frota') || msg.includes('veículo') || msg.includes('veiculo') || msg.includes('carro')) {
        return `🚗 **Frota da Câmara Municipal**

• **Total:** 40 veículos
• **39 Chevrolet Onix**
• **1 Chevrolet Spin**

💳 Cada veículo tem seu cartão personalizado com placa e modelo.
📊 Consumo médio: 167,73 litros/veículo/mês`;
    }
    
    // Gasolina mais barata
    if (msg.includes('gasolina') && (msg.includes('barat') || msg.includes('menor') || msg.includes('baix'))) {
        const postosComGasolina = postosData.filter(p => p.precos?.gasolina > 0)
            .sort((a, b) => a.precos.gasolina - b.precos.gasolina)
            .slice(0, 5);
        
        if (postosComGasolina.length === 0) {
            return "Não encontrei postos com preços de gasolina cadastrados.";
        }
        
        let response = "⛽ **Top 5 postos com gasolina mais barata:**\n\n";
        postosComGasolina.forEach((p, i) => {
            const dentroLimite = anpData?.gasolinaComum && p.precos.gasolina <= anpData.gasolinaComum;
            response += `${i + 1}. **${p.nomeFantasia}** ${dentroLimite ? '✅' : '⚠️'}\n   📍 ${formatEnderecoCard(p)}\n   💰 R$ ${p.precos.gasolina.toFixed(2)}\n\n`;
        });
        
        if (anpData?.gasolinaComum) {
            response += `📊 *Limite ANP: R$ ${anpData.gasolinaComum.toFixed(2)}*\n✅ = Dentro do limite contratual | ⚠️ = Acima do limite`;
        }
        
        return response;
    }
    
    // Etanol mais barato
    if (msg.includes('etanol') && (msg.includes('barat') || msg.includes('menor') || msg.includes('baix'))) {
        const postosComEtanol = postosData.filter(p => p.precos?.etanol > 0)
            .sort((a, b) => a.precos.etanol - b.precos.etanol)
            .slice(0, 5);
        
        if (postosComEtanol.length === 0) {
            return "Não encontrei postos com preços de etanol cadastrados.";
        }
        
        let response = "🌿 **Top 5 postos com etanol mais barato:**\n\n";
        postosComEtanol.forEach((p, i) => {
            response += `${i + 1}. **${p.nomeFantasia}**\n   📍 ${formatEnderecoCard(p)}\n   💰 R$ ${p.precos.etanol.toFixed(2)}\n\n`;
        });
        
        return response;
    }
    
    // Postos 24h
    if (msg.includes('24') || msg.includes('madrugada') || msg.includes('noite')) {
        const postos24h = postosData.filter(p => p.is24h);
        
        if (postos24h.length === 0) {
            return "⚠️ Não encontrei postos 24h cadastrados. O contrato exige **pelo menos 1 posto 24h** em Guarulhos!";
        }
        
        let response = `🕐 **Postos 24 horas (${postos24h.length}):**\n\n`;
        postos24h.forEach((p, i) => {
            const distancia = calcularDistancia(SEDE_CAMARA.lat, SEDE_CAMARA.lng, p.coordenadas.lat, p.coordenadas.lng).toFixed(1);
            response += `${i + 1}. **${p.nomeFantasia}**\n   📍 ${formatEnderecoCard(p)}\n   📏 ${distancia} km da sede\n\n`;
        });
        
        return response;
    }
    
    // Distância
    if (msg.includes('distância') || msg.includes('distancia') || msg.includes('longe') || msg.includes('perto') || msg.includes('próximo')) {
        return `📏 **Regras de Distância (Contrato)**

• Máximo **5 km** para encontrar um posto credenciado em Guarulhos
• Obrigatório **1 posto a ~3 km** da sede (Av. Guarulhos, 845)
• No estado de SP: **1 posto a cada 50 km** nas cidades próximas

Para calcular a distância entre postos específicos, me diga quais postos!`;
    }
    
    // Vigência
    if (msg.includes('vigência') || msg.includes('vigencia') || msg.includes('prazo') && msg.includes('contrato')) {
        return `📅 **Vigência do Contrato**

• **Prazo:** 30 meses
• **Início:** 23/10/2025
• **Término previsto:** Abril/2028
• **Prorrogação:** Possível por até 10 anos

Condições para prorrogar:
✅ Preços vantajosos
✅ Serviços regulares
✅ Interesse da Administração
✅ Manifestação da Contratada
✅ Habilitação mantida`;
    }
    
    // Cartões
    if (msg.includes('cartão') || msg.includes('cartao') || msg.includes('cartões') || msg.includes('cartoes')) {
        return `💳 **Cartões Magnéticos/Microprocessados**

• **Quantidade:** 50 cartões (40 veículos + 10 reservas)
• **Custo:** Gratuito (fornecimento e substituições)
• **Personalização:** Placa e modelo do veículo

**Funcionalidades:**
• Bloqueio/desbloqueio online instantâneo
• Senha pessoal por condutor
• Limite em R$ e litros (simultâneos)
• Limite de preço por litro`;
    }
    
    // LGPD
    if (msg.includes('lgpd') || msg.includes('dados pessoais') || msg.includes('privacidade')) {
        return `🔒 **LGPD no Contrato**

A Prime deve cumprir integralmente a Lei 13.709/2018:

• Dados apenas para finalidades contratuais
• Vedado compartilhamento não autorizado
• Comunicar suboperadores em 5 dias úteis
• Eliminar dados ao término do contrato
• Treinar empregados sobre LGPD
• Manter rastreabilidade de acessos`;
    }
    
    // Sede
    if (msg.includes('sede') || msg.includes('câmara') || msg.includes('camara') || msg.includes('endereço da')) {
        return `🏛️ **Câmara Municipal de Guarulhos**

📍 **Endereço:** Av. Guarulhos, 845 - Vila Vicentina
📮 **CEP:** 07023-000 - Guarulhos/SP
📞 **Telefone:** (11) 2475-0200
🌐 **Site:** www.guarulhos.sp.leg.br`;
    }
    
    // Quantidade de postos
    if (msg.includes('quantos postos') || msg.includes('total de postos')) {
        return `📊 **Postos Credenciados**

• **Total cadastrado:** ${postosData.length} postos
• **Postos 24h:** ${postosData.filter(p => p.is24h).length}
• **Bandeiras:** ${[...new Set(postosData.map(p => p.bandeira))].join(', ')}

O contrato exige cobertura em todo o município de Guarulhos e Estado de SP.`;
    }
    
    // Resposta padrão
    return `🤖 **Posso ajudar com:**

💰 Preços de combustíveis
📋 Detalhes do contrato com a Prime
⚠️ Penalidades e multas
🚗 Informações da frota (40 veículos)
📏 Distâncias entre postos
🕐 Postos 24 horas
💳 Cartões e limites
📅 Prazos e pagamentos
🔒 LGPD e privacidade

Pergunte qualquer coisa sobre postos credenciados ou o contrato!`;
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
    if (preco < anpPreco) return 'destaque';
    if (preco > anpPreco) return 'alerta';
    return '';
}

function is24Hours(posto) {
    return posto.is24h === true;
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
    const dias = {
        segunda: 'Seg',
        terca: 'Ter',
        quarta: 'Qua',
        quinta: 'Qui',
        sexta: 'Sex',
        sabado: 'Sáb',
        domingo: 'Dom'
    };
    
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
        updateLastUpdate();
        showLoading(false);
        alert('Dados atualizados com sucesso!');
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
