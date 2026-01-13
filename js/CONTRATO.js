// ==========================================
// BASE DE CONHECIMENTO - CONTRATO PRIME
// Contrato Administrativo nº 08/2025
// ==========================================

const CONTRATO_PRIME = `
=== CONTRATO ADMINISTRATIVO Nº 08/2025 ===
Câmara Municipal de Guarulhos + Prime Consultoria e Assessoria Empresarial LTDA
Processo Administrativo: 1403/2025
Pregão Eletrônico: 90004/2025

PARTES DO CONTRATO:
- CONTRATANTE: Câmara Municipal de Guarulhos
  - CNPJ: 49.811.037/0001-99
  - Endereço: Av. Guarulhos, 845 - CEP 07023-000 - Guarulhos/SP
  - Representante: Vereador Fausto Miguel Martello (Presidente)
  
- CONTRATADA: Prime Consultoria e Assessoria Empresarial LTDA
  - CNPJ: 05.340.639/0001-30
  - Endereço: Calçada Canopo, 11, 2º andar, Sala 3 - Alphaville - Santana de Parnaíba/SP - CEP 06541-078
  - Representante: Renata Nunes Ferreira (Coordenadora de Licitações)

=== CLÁUSULA PRIMEIRA - OBJETO DO CONTRATO ===
Contratação de serviços de implantação, intermediação e administração do abastecimento da frota de veículos da Câmara Municipal de Guarulhos, incluindo:
- Utilização de cartões magnéticos ou microprocessados
- Acesso a sistema de gestão online em tempo real
- Fornecimento de relatórios gerenciais
- Parametrização por veículo
- Controle de consumo
- Rede de postos credenciados em Guarulhos e no Estado de São Paulo

=== VALORES E QUANTIDADES ESTIMADAS ===
GASOLINA COMUM:
- Quantidade mensal estimada: 7.478 litros
- Quantidade total (30 meses): 224.345 litros
- Valor de referência ANP: R$ 6,06/litro
- Valor mensal estimado: R$ 45.316,68
- Valor total estimado: R$ 1.359.530,70

ETANOL:
- Quantidade mensal estimada: 394 litros
- Quantidade total (30 meses): 11.808 litros
- Valor de referência ANP: R$ 3,97/litro
- Valor mensal estimado: R$ 1.564,18
- Valor total estimado: R$ 46.877,76

TOTAIS:
- Valor mensal estimado (sem taxa): R$ 46.880,86
- Valor total estimado (sem taxa): R$ 1.406.408,46
- Taxa de Administração: -5,65% (NEGATIVA = DESCONTO)
- Valor mensal com desconto: R$ 44.231,55
- VALOR GLOBAL DO CONTRATO: R$ 1.326.946,38
- Limite máximo mensal: 12.000 litros (Ato da Mesa nº 356/2021)

=== CLÁUSULA SEGUNDA - VIGÊNCIA E PRORROGAÇÃO ===
- Prazo de vigência: 30 (trinta) meses
- Início: 23/10/2025
- Prorrogável por até 10 anos (arts. 106 e 107, Lei 14.133/2021)

Condições para prorrogação:
1. Preços vantajosos para a Administração
2. Serviços prestados regularmente (relatório comprobatório)
3. Interesse da Administração na continuidade
4. Manifestação expressa da Contratada
5. Manutenção das condições de habilitação
6. Sem registro no CADIN
7. Não ter sido penalizada com declaração de inidoneidade ou impedimento

A prorrogação requer termo aditivo.
Custos não renováveis já amortizados devem ser reduzidos/eliminados na renovação.
O Contratado NÃO tem direito subjetivo à prorrogação.

=== FROTA DE VEÍCULOS ===
- Total de veículos: 40
- Composição: 39 Chevrolet Onix + 1 Chevrolet Spin
- Consumo médio estimado: 167,73 litros/veículo/mês
- Consumo mensal total estimado: 7.380,10 litros
- Limite máximo mensal: 12.000 litros
- Limite total (30 meses): 360.000 litros

=== CARTÕES MAGNÉTICOS/MICROPROCESSADOS ===
- Mínimo: 50 cartões (40 para veículos + 10 reservas)
- Personalização: placa e modelo do veículo
- Cartões reserva: identificados como "reservas"
- Substituição: gratuita (perda, roubo, novos veículos)
- Funcionalidades:
  * Bloqueio/desbloqueio online instantâneo
  * Troca de senha online
  * Dois limites concomitantes: R$ e litros
  * Limite de preço unitário máximo por combustível
  * Senha pessoal por condutor

=== REDE DE POSTOS CREDENCIADOS ===
Cobertura em Guarulhos:
- Distância máxima: 5 km para encontrar um posto
- Obrigatório: 1 posto a ~3 km da sede (Av. Guarulhos, 845)
- Mínimo 1 posto 24 horas em Guarulhos

Cobertura no Estado de SP:
- 1 posto a cada 50 km nas cidades próximas

Horário mínimo de funcionamento:
- Segunda a sábado: 07h às 20h
- Pelo menos 1 posto: 24h/7 dias

Credenciamento:
- Novos postos: prazo de 30 dias corridos após solicitação
- Alterações devem ser comunicadas imediatamente por escrito

Vedações para credenciamento:
- Postos com ICMS suspenso (Lei Estadual 11.929/2005)
- Postos sem autorização ANP (Resolução ANP 948/2023)
- Postos penalizados por infrações ambientais

=== REGRAS DE PREÇOS ===
- Preço máximo: média ANP da semana anterior para cada município
- Sistema DEVE impedir transações acima do limite ANP
- Alertas automáticos para tentativas acima do limite
- Abastecimento acima do ANP: apenas com autorização expressa do Gestor
- Valor da bomba: à vista ou negociado diretamente
- Possibilidade de desconto negociado com postos

=== SISTEMA DE GESTÃO ===
Funcionalidades obrigatórias:
- Registro informatizado em tempo real
- Cancelamento imediato de operações
- Relatórios gerenciais, financeiros e operacionais
- Controle de despesas, consumo e quilometragem por veículo
- Indicação de desvios de consumo
- Exportação de dados: TXT, XLSX, CSV, XML

Comprovante de transação deve conter:
- Identificação do posto (nome e endereço)
- Identificação do veículo (placa)
- Tipo de combustível
- Data e hora
- Quantidade em litros
- Valor da operação

Relatórios obrigatórios:
- Relação de veículos (placa, marca, modelo, combustível, ano)
- Histórico de operações (hora, posto, veículo, combustível, litros, valor)
- Relatório quinzenal de preços por região
- Volume e gastos por tipo de combustível
- Preço médio por combustível
- Indicação de desvios de média de consumo

=== IMPLANTAÇÃO DO SISTEMA ===
Prazo máximo: 15 dias corridos após início do contrato

Cronograma:
- Designação de equipe e preposto: na assinatura do contrato
- Cadastramento de condutores: 5 dias
- Cadastramento de gestores: 5 dias
- Cadastramento de veículos: 5 dias
- Tabelas de fabricante: 15 dias
- Treinamento: 15 dias
- Apresentação da rede credenciada: 15 dias

=== OBRIGAÇÕES DA CONTRATADA (PRIME) ===
1. Pagamento exclusivo aos postos (Câmara não responde solidária/subsidiariamente)
2. Fornecimento gratuito de cartões (inclusive substituições)
3. Treinamento de condutores e gestores (sem custo)
4. Suporte técnico 24h por telefone 0800 ou similar
5. Credenciar apenas postos regulares
6. Descredenciar postos com ICMS suspenso ou penalizados
7. Responsabilidade pela qualidade dos combustíveis
8. Responsabilidade por danos causados por combustível adulterado
9. Manter preposto para representação
10. Garantir segurança e integridade das informações
11. Comunicar alterações de postos imediatamente
12. Comparecer quando convocada (prazo: 24h)
13. Fiscalizar recolhimento de tributos pelos postos
14. Cumprir normas trabalhistas, previdenciárias e fiscais
15. Guardar sigilo sobre informações
16. Cumprir LGPD

=== OBRIGAÇÕES DA CONTRATANTE (CÂMARA) ===
1. Fornecer cadastro completo dos veículos
2. Indicar gestor e fiscal do contrato
3. Fiscalizar a execução dos serviços
4. Comunicar faltas ao encarregado da Contratada
5. Recolher comprovantes de abastecimento e notas fiscais
6. Efetuar pagamento no prazo
7. Não praticar atos de ingerência na administração da Contratada

=== PAGAMENTO ===
- Prazo: até 10 dias úteis após finalização da liquidação
- Forma: ordem bancária
- Correção por atraso: IPCA-IBGE
- Liquidação: 10 dias úteis (ou 5 para valores até limite do art. 75, II)

Nota Fiscal deve conter:
- Prazo de validade
- Data de emissão
- Dados do contrato e órgão
- Período de execução
- Valor a pagar
- Retenções tributárias

Regularidade exigida:
- SICAF atualizado
- Certidões de regularidade fiscal
- FGTS
- CNDT (débitos trabalhistas)

=== REAJUSTE ===
A taxa de administração é FIXA e IRREAJUSTÁVEL durante toda a vigência.
Máximo de duas casas decimais.

=== PENALIDADES E SANÇÕES ===
Infrações administrativas (Lei 14.133/2021):
a) Inexecução parcial do contrato
b) Inexecução parcial com grave dano à Administração
c) Inexecução total do contrato
d) Retardamento da execução sem justificativa
e) Documentação falsa
f) Ato fraudulento
g) Comportamento inidôneo ou fraude
h) Ato lesivo (Lei 12.846/2013)

Sanções aplicáveis:
1. ADVERTÊNCIA: inexecução parcial sem gravidade
2. IMPEDIMENTO DE LICITAR: infrações b, c, d (quando não justificar pena maior)
3. DECLARAÇÃO DE INIDONEIDADE: infrações e, f, g, h (ou b, c, d graves)
4. MULTA: 5% sobre valor estimado dos itens prejudicados

Observações:
- Sanções podem ser cumuladas com multa
- Prazo de defesa: 15 dias úteis
- Multa pode ser descontada de pagamentos ou garantia
- Prazo para recolhimento administrativo: 10 dias corridos
- Publicação no CEIS e CNEP: 15 dias úteis
- Reabilitação: conforme art. 163 da Lei 14.133/2021

=== EXTINÇÃO DO CONTRATO ===
Hipóteses de extinção:
1. Vencimento do prazo (se não prorrogado)
2. Falta de créditos orçamentários
3. Não oferece mais vantagem à Administração
4. Motivos do art. 137 da Lei 14.133/2021
5. Amigavelmente (com contraditório e ampla defesa)
6. Vínculo irregular com dirigente/agente público

Notificação para não-continuidade:
- Mínimo 2 meses antes da data de aniversário
- Se notificado com menos de 2 meses: extinção ocorre 2 meses após comunicação

Termo de extinção deve conter:
- Balanço dos eventos contratuais
- Relação de pagamentos efetuados e devidos
- Indenizações e multas

=== LGPD (Lei 13.709/2018) ===
- Cumprimento integral obrigatório
- Dados apenas para finalidades contratuais
- Vedado compartilhamento não autorizado
- Comunicação de suboperadores: 5 dias úteis
- Eliminação de dados ao término do tratamento
- Treinamento de empregados sobre LGPD
- Bancos de dados: ambiente virtual controlado com rastreabilidade
- Formato interoperável para reutilização

=== TESTES DO SISTEMA ===
- Prazo para demonstração: 3 dias úteis após convocação
- Duração da análise: até 4 horas (prorrogável)
- Comissão de Avaliação: Coordenadoria de Suporte Administrativo
- Deve atender 100% dos requisitos
- Equipamentos e software instalados pela empresa
- Acesso livre a todos durante análise
- Vedado uso de aparelhos eletrônicos por concorrentes

=== DOTAÇÃO ORÇAMENTÁRIA ===
- Combustíveis: 0110.0112200712.210.01.1100000.339030.000
- Serviços: 0110.0112200712.210.01.1100000.339039.000

=== LEGISLAÇÃO APLICÁVEL ===
- Lei 14.133/2021 (Nova Lei de Licitações)
- Lei 8.078/1990 (Código de Defesa do Consumidor)
- Lei 13.709/2018 (LGPD)
- Lei Estadual 11.929/2005 (postos com ICMS suspenso)
- Resolução ANP 948/2023
- Decreto 6.481/2008 (trabalho infantil)
- Portaria CAT 02/11

=== CONTATOS ===
Câmara Municipal de Guarulhos:
- Endereço: Av. Guarulhos, 845 - CEP 07023-000
- Telefone: (11) 2475-0200
- Site: www.guarulhos.sp.leg.br

Prime Consultoria:
- Endereço: Calçada Canopo, 11, 2º andar, Sala 3 - Alphaville - Santana de Parnaíba/SP
- CEP: 06541-078

=== FORO ===
Comarca de Guarulhos para dirimir litígios (art. 92, §1º, Lei 14.133/2021)
`;

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTRATO_PRIME;
}
