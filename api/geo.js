export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { endereco } = req.body;

    if (!endereco) {
        return res.status(400).json({ error: 'Endereço é obrigatório' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API Key não configurada' });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Retorne APENAS as coordenadas geográficas (latitude e longitude) do endereço: "${endereco}". 
                            Responda SOMENTE no formato JSON: {"lat": numero, "lng": numero}
                            Se não encontrar, retorne: {"lat": null, "lng": null}`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            const coords = JSON.parse(jsonMatch[0]);
            return res.status(200).json(coords);
        }

        return res.status(200).json({ lat: null, lng: null });

    } catch (error) {
        console.error('Erro ao geocodificar:', error);
        return res.status(500).json({ error: 'Erro ao processar' });
    }
}
