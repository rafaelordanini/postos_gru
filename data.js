// ==========================================
// DADOS DOS POSTOS CREDENCIADOS
// ==========================================

// Configuração da API Gemini
const GEMINI_API_KEY = 'SUA_API_KEY_AQUI'; // Substitua pela sua chave

// Dados ANP (simulados - em produção, buscar da API)
let anpData = {
    gasolinaComum: 6.06,
    etanol: 3.97,
    diesel: 5.89,
    gnv: 4.29,
    dataAtualizacao: new Date().toISOString()
};

// Dados dos postos credenciados
let postosData = [
    {
        id: 1,
        nomeFantasia: "Auto Posto Duque Centro",
        razaoSocial: "Duque Comércio de Combustíveis Ltda",
        cnpj: "12.345.678/0001-90",
        bandeira: "Ipiranga",
        endereco: {
            logradouro: "Av. Paulo Faccini",
            numero: "1500",
            bairro: "Centro",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07110-000"
        },
        coordenadas: {
            lat: -23.4538,
            lng: -46.5333
        },
        telefone: "(11) 2468-1500",
        horarioFuncionamento: {
            segunda: { abertura: "06:00", fechamento: "22:00" },
            terca: { abertura: "06:00", fechamento: "22:00" },
            quarta: { abertura: "06:00", fechamento: "22:00" },
            quinta: { abertura: "06:00", fechamento: "22:00" },
            sexta: { abertura: "06:00", fechamento: "22:00" },
            sabado: { abertura: "06:00", fechamento: "20:00" },
            domingo: { abertura: "07:00", fechamento: "18:00" }
        },
        is24h: false,
        precos: {
            gasolina: 5.89,
            etanol: 3.79,
            diesel: 5.69,
            gnv: 4.19
        },
        servicos: ["Calibragem", "Loja de conveniência", "Troca de óleo"],
        avaliacao: 4.5,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 2,
        nomeFantasia: "Posto Shell Guarulhos 24h",
        razaoSocial: "Shell Brasil Petróleo Ltda",
        cnpj: "23.456.789/0001-01",
        bandeira: "Shell",
        endereco: {
            logradouro: "Av. Guarulhos",
            numero: "2000",
            bairro: "Vila Augusta",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07025-000"
        },
        coordenadas: {
            lat: -23.4628,
            lng: -46.5189
        },
        telefone: "(11) 2408-2000",
        horarioFuncionamento: {
            segunda: { abertura: "00:00", fechamento: "23:59" },
            terca: { abertura: "00:00", fechamento: "23:59" },
            quarta: { abertura: "00:00", fechamento: "23:59" },
            quinta: { abertura: "00:00", fechamento: "23:59" },
            sexta: { abertura: "00:00", fechamento: "23:59" },
            sabado: { abertura: "00:00", fechamento: "23:59" },
            domingo: { abertura: "00:00", fechamento: "23:59" }
        },
        is24h: true,
        precos: {
            gasolina: 5.99,
            etanol: 3.89,
            diesel: 5.79,
            gnv: 0
        },
        servicos: ["Calibragem", "Loja de conveniência", "Lavagem", "Borracharia"],
        avaliacao: 4.7,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 3,
        nomeFantasia: "Posto BR Aeroporto",
        razaoSocial: "Petrobras Distribuidora S/A",
        cnpj: "34.567.890/0001-12",
        bandeira: "Petrobras",
        endereco: {
            logradouro: "Rod. Hélio Smidt",
            numero: "s/n",
            bairro: "Cumbica",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07190-100"
        },
        coordenadas: {
            lat: -23.4356,
            lng: -46.4731
        },
        telefone: "(11) 2445-8900",
        horarioFuncionamento: {
            segunda: { abertura: "00:00", fechamento: "23:59" },
            terca: { abertura: "00:00", fechamento: "23:59" },
            quarta: { abertura: "00:00", fechamento: "23:59" },
            quinta: { abertura: "00:00", fechamento: "23:59" },
            sexta: { abertura: "00:00", fechamento: "23:59" },
            sabado: { abertura: "00:00", fechamento: "23:59" },
            domingo: { abertura: "00:00", fechamento: "23:59" }
        },
        is24h: true,
        precos: {
            gasolina: 6.09,
            etanol: 3.99,
            diesel: 5.89,
            gnv: 4.29
        },
        servicos: ["Calibragem", "Loja de conveniência", "Restaurante", "Estacionamento"],
        avaliacao: 4.3,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 4,
        nomeFantasia: "Auto Posto Bonsucesso",
        razaoSocial: "Bonsucesso Combustíveis Ltda",
        cnpj: "45.678.901/0001-23",
        bandeira: "Ipiranga",
        endereco: {
            logradouro: "Av. Bonsucesso",
            numero: "850",
            bairro: "Bonsucesso",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07175-000"
        },
        coordenadas: {
            lat: -23.4789,
            lng: -46.4956
        },
        telefone: "(11) 2456-0850",
        horarioFuncionamento: {
            segunda: { abertura: "06:00", fechamento: "22:00" },
            terca: { abertura: "06:00", fechamento: "22:00" },
            quarta: { abertura: "06:00", fechamento: "22:00" },
            quinta: { abertura: "06:00", fechamento: "22:00" },
            sexta: { abertura: "06:00", fechamento: "22:00" },
            sabado: { abertura: "07:00", fechamento: "20:00" },
            domingo: { abertura: "08:00", fechamento: "16:00" }
        },
        is24h: false,
        precos: {
            gasolina: 5.79,
            etanol: 3.69,
            diesel: 5.59,
            gnv: 4.09
        },
        servicos: ["Calibragem", "Loja de conveniência"],
        avaliacao: 4.2,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 5,
        nomeFantasia: "Posto Texaco Taboão",
        razaoSocial: "Texaco Brasil Ltda",
        cnpj: "56.789.012/0001-34",
        bandeira: "Texaco",
        endereco: {
            logradouro: "Estrada do Caminho Velho",
            numero: "1200",
            bairro: "Taboão",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07140-000"
        },
        coordenadas: {
            lat: -23.4412,
            lng: -46.5567
        },
        telefone: "(11) 2484-1200",
        horarioFuncionamento: {
            segunda: { abertura: "06:00", fechamento: "23:00" },
            terca: { abertura: "06:00", fechamento: "23:00" },
            quarta: { abertura: "06:00", fechamento: "23:00" },
            quinta: { abertura: "06:00", fechamento: "23:00" },
            sexta: { abertura: "06:00", fechamento: "23:00" },
            sabado: { abertura: "06:00", fechamento: "22:00" },
            domingo: { abertura: "07:00", fechamento: "20:00" }
        },
        is24h: false,
        precos: {
            gasolina: 5.85,
            etanol: 3.75,
            diesel: 5.65,
            gnv: 0
        },
        servicos: ["Calibragem", "Loja de conveniência", "Troca de óleo", "Lavagem"],
        avaliacao: 4.4,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 6,
        nomeFantasia: "Posto Ale Pimentas",
        razaoSocial: "Ale Combustíveis S/A",
        cnpj: "67.890.123/0001-45",
        bandeira: "Ale",
        endereco: {
            logradouro: "Av. Papa João Paulo I",
            numero: "3200",
            bairro: "Pimentas",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07263-000"
        },
        coordenadas: {
            lat: -23.4923,
            lng: -46.4234
        },
        telefone: "(11) 2489-3200",
        horarioFuncionamento: {
            segunda: { abertura: "05:00", fechamento: "23:00" },
            terca: { abertura: "05:00", fechamento: "23:00" },
            quarta: { abertura: "05:00", fechamento: "23:00" },
            quinta: { abertura: "05:00", fechamento: "23:00" },
            sexta: { abertura: "05:00", fechamento: "23:00" },
            sabado: { abertura: "06:00", fechamento: "22:00" },
            domingo: { abertura: "06:00", fechamento: "20:00" }
        },
        is24h: false,
        precos: {
            gasolina: 5.69,
            etanol: 3.59,
            diesel: 5.49,
            gnv: 3.99
        },
        servicos: ["Calibragem", "Loja de conveniência", "Borracharia"],
        avaliacao: 4.0,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 7,
        nomeFantasia: "Posto Bandeirantes",
        razaoSocial: "Bandeirantes Derivados de Petróleo Ltda",
        cnpj: "78.901.234/0001-56",
        bandeira: "Bandeira Branca",
        endereco: {
            logradouro: "Av. Otávio Braga de Mesquita",
            numero: "450",
            bairro: "Vila Galvão",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07050-000"
        },
        coordenadas: {
            lat: -23.4678,
            lng: -46.5412
        },
        telefone: "(11) 2441-0450",
        horarioFuncionamento: {
            segunda: { abertura: "06:00", fechamento: "21:00" },
            terca: { abertura: "06:00", fechamento: "21:00" },
            quarta: { abertura: "06:00", fechamento: "21:00" },
            quinta: { abertura: "06:00", fechamento: "21:00" },
            sexta: { abertura: "06:00", fechamento: "21:00" },
            sabado: { abertura: "07:00", fechamento: "18:00" },
            domingo: { abertura: "08:00", fechamento: "14:00" }
        },
        is24h: false,
        precos: {
            gasolina: 5.59,
            etanol: 3.49,
            diesel: 5.39,
            gnv: 0
        },
        servicos: ["Calibragem"],
        avaliacao: 3.8,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 8,
        nomeFantasia: "Auto Posto Cidade Seródio",
        razaoSocial: "Seródio Comércio de Combustíveis Ltda",
        cnpj: "89.012.345/0001-67",
        bandeira: "Petrobras",
        endereco: {
            logradouro: "Av. Salgado Filho",
            numero: "2800",
            bairro: "Cidade Seródio",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07130-000"
        },
        coordenadas: {
            lat: -23.4234,
            lng: -46.5089
        },
        telefone: "(11) 2467-2800",
        horarioFuncionamento: {
            segunda: { abertura: "00:00", fechamento: "23:59" },
            terca: { abertura: "00:00", fechamento: "23:59" },
            quarta: { abertura: "00:00", fechamento: "23:59" },
            quinta: { abertura: "00:00", fechamento: "23:59" },
            sexta: { abertura: "00:00", fechamento: "23:59" },
            sabado: { abertura: "00:00", fechamento: "23:59" },
            domingo: { abertura: "00:00", fechamento: "23:59" }
        },
        is24h: true,
        precos: {
            gasolina: 5.95,
            etanol: 3.85,
            diesel: 5.75,
            gnv: 4.25
        },
        servicos: ["Calibragem", "Loja de conveniência", "Lavagem", "Troca de óleo", "Borracharia"],
        avaliacao: 4.6,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 9,
        nomeFantasia: "Posto Presidente Dutra",
        razaoSocial: "Dutra Combustíveis e Serviços Ltda",
        cnpj: "90.123.456/0001-78",
        bandeira: "Shell",
        endereco: {
            logradouro: "Rod. Presidente Dutra",
            numero: "km 225",
            bairro: "Itapegica",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07220-000"
        },
        coordenadas: {
            lat: -23.4089,
            lng: -46.4567
        },
        telefone: "(11) 2413-2250",
        horarioFuncionamento: {
            segunda: { abertura: "00:00", fechamento: "23:59" },
            terca: { abertura: "00:00", fechamento: "23:59" },
            quarta: { abertura: "00:00", fechamento: "23:59" },
            quinta: { abertura: "00:00", fechamento: "23:59" },
            sexta: { abertura: "00:00", fechamento: "23:59" },
            sabado: { abertura: "00:00", fechamento: "23:59" },
            domingo: { abertura: "00:00", fechamento: "23:59" }
        },
        is24h: true,
        precos: {
            gasolina: 6.05,
            etanol: 3.95,
            diesel: 5.85,
            gnv: 4.35
        },
        servicos: ["Calibragem", "Loja de conveniência", "Restaurante", "Chuveiros", "Estacionamento para caminhões"],
        avaliacao: 4.5,
        dataUltimaAtualizacao: "2025-01-06"
    },
    {
        id: 10,
        nomeFantasia: "Auto Posto Vila Rio",
        razaoSocial: "Vila Rio Derivados de Petróleo Ltda",
        cnpj: "01.234.567/0001-89",
        bandeira: "Ipiranga",
        endereco: {
            logradouro: "Av. Rio de Janeiro",
            numero: "1100",
            bairro: "Vila Rio de Janeiro",
            cidade: "Guarulhos",
            estado: "SP",
            cep: "07042-000"
        },
        coordenadas: {
            lat: -23.4567,
            lng: -46.5234
        },
        telefone: "(11) 2455-1100",
        horarioFuncionamento: {
            segunda: { abertura: "06:00", fechamento: "22:00" },
            terca: { abertura: "06:00", fechamento: "22:00" },
            quarta: { abertura: "06:00", fechamento: "22:00" },
            quinta: { abertura: "06:00", fechamento: "22:00" },
            sexta: { abertura: "06:00", fechamento: "22:00" },
            sabado: { abertura: "07:00", fechamento: "20:00" },
            domingo: { abertura: "08:00", fechamento: "18:00" }
        },
        is24h: false,
        precos: {
            gasolina: 5.82,
            etanol: 3.72,
            diesel: 5.62,
            gnv: 4.12
        },
        servicos: ["Calibragem", "Loja de conveniência", "Troca de óleo"],
        avaliacao: 4.3,
        dataUltimaAtualizacao: "2025-01-06"
    }
];

// Função para atualizar preços ANP
function updateANPData(data) {
    anpData = { ...anpData, ...data, dataAtualizacao: new Date().toISOString() };
}

// Função para adicionar novo posto
function addPosto(posto) {
    posto.id = postosData.length > 0 ? Math.max(...postosData.map(p => p.id)) + 1 : 1;
    postosData.push(posto);
    return posto;
}

// Função para atualizar posto
function updatePosto(id, dados) {
    const index = postosData.findIndex(p => p.id === id);
    if (index !== -1) {
        postosData[index] = { ...postosData[index], ...dados, dataUltimaAtualizacao: new Date().toISOString().split('T')[0] };
        return postosData[index];
    }
    return null;
}

// Função para remover posto
function removePosto(id) {
    const index = postosData.findIndex(p => p.id === id);
    if (index !== -1) {
        return postosData.splice(index, 1)[0];
    }
    return null;
}

// Função para buscar posto por ID
function getPostoById(id) {
    return postosData.find(p => p.id === id);
}

// Função para buscar postos por filtros
function filterPostos(filtros) {
    return postosData.filter(posto => {
        if (filtros.bandeira && filtros.bandeira !== 'all' && posto.bandeira !== filtros.bandeira) {
            return false;
        }
        if (filtros.bairro && filtros.bairro !== 'all' && posto.endereco.bairro !== filtros.bairro) {
            return false;
        }
        if (filtros.combustivel && filtros.combustivel !== 'all') {
            if (!posto.precos[filtros.combustivel] || posto.precos[filtros.combustivel] <= 0) {
                return false;
            }
        }
        if (filtros.is24h && !posto.is24h) {
            return false;
        }
        if (filtros.busca) {
            const busca = filtros.busca.toLowerCase();
            const nomeMatch = posto.nomeFantasia.toLowerCase().includes(busca);
            const enderecoMatch = posto.endereco.logradouro.toLowerCase().includes(busca);
            const bairroMatch = posto.endereco.bairro.toLowerCase().includes(busca);
            if (!nomeMatch && !enderecoMatch && !bairroMatch) {
                return false;
            }
        }
        return true;
    });
}

// Função para ordenar postos
function sortPostos(postos, criterio) {
    const sorted = [...postos];
    switch (criterio) {
        case 'name':
            sorted.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
            break;
        case 'gasolina':
            sorted.sort((a, b) => (a.precos.gasolina || 999) - (b.precos.gasolina || 999));
            break;
        case 'etanol':
            sorted.sort((a, b) => (a.precos.etanol || 999) - (b.precos.etanol || 999));
            break;
        case 'diesel':
            sorted.sort((a, b) => (a.precos.diesel || 999) - (b.precos.diesel || 999));
            break;
        case 'avaliacao':
            sorted.sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0));
            break;
        default:
            break;
    }
    return sorted;
}

// Função para obter lista de bandeiras únicas
function getBandeiras() {
    return [...new Set(postosData.map(p => p.bandeira))].sort();
}

// Função para obter lista de bairros únicos
function getBairros() {
    return [...new Set(postosData.map(p => p.endereco.bairro))].sort();
}

// Função para calcular estatísticas
function getEstatisticas() {
    const stats = {
        total: postosData.length,
        postos24h: postosData.filter(p => p.is24h).length,
        mediaGasolina: 0,
        mediaEtanol: 0,
        mediaDiesel: 0,
        menorGasolina: null,
        menorEtanol: null,
        menorDiesel: null
    };

    const gasolinaPrecos = postosData.filter(p => p.precos.gasolina > 0).map(p => p.precos.gasolina);
    const etanolPrecos = postosData.filter(p => p.precos.etanol > 0).map(p => p.precos.etanol);
    const dieselPrecos = postosData.filter(p => p.precos.diesel > 0).map(p => p.precos.diesel);

    if (gasolinaPrecos.length > 0) {
        stats.mediaGasolina = gasolinaPrecos.reduce((a, b) => a + b, 0) / gasolinaPrecos.length;
        stats.menorGasolina = Math.min(...gasolinaPrecos);
    }
    if (etanolPrecos.length > 0) {
        stats.mediaEtanol = etanolPrecos.reduce((a, b) => a + b, 0) / etanolPrecos.length;
        stats.menorEtanol = Math.min(...etanolPrecos);
    }
    if (dieselPrecos.length > 0) {
        stats.mediaDiesel = dieselPrecos.reduce((a, b) => a + b, 0) / dieselPrecos.length;
        stats.menorDiesel = Math.min(...dieselPrecos);
    }

    return stats;
}

// Função para calcular distância entre duas coordenadas (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Coordenadas da sede da Câmara Municipal
const SEDE_CAMARA = {
    lat: -23.4565,
    lng: -46.5320,
    endereco: "Av. Guarulhos, 845 - Vila Vicentina"
};

// Função para ordenar postos por distância da sede
function sortByDistanciaFromSede(postos) {
    return postos.map(posto => ({
        ...posto,
        distanciaSede: calcularDistancia(
            SEDE_CAMARA.lat, 
            SEDE_CAMARA.lng, 
            posto.coordenadas.lat, 
            posto.coordenadas.lng
        )
    })).sort((a, b) => a.distanciaSede - b.distanciaSede);
}
