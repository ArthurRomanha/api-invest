const axios = require('axios');//axios é uma biblioteca que permite fazer requisições http, com base em promises (async, await)
const cheerio = require('cheerio');//cheerio é uma biblioteca que nos permite manipular o conteúdo html da url fornecida
let dados = {
    "indicesPadrão": [
        { "indice": "Selic", "valor": "" },
        { "indice": "CDI", "valor": "" },
        { "indice": "IPCA", "valor": "" },
        { "indice": "Ibovespa", "valor": "" }
    ],
    "fundosPadrao": [
        { "ticker": "gare11", "cotacao": "", "pvp": "", "precoJusto": "" ,"valueDividendYeldTwelveMonths": "", "lastDividend": "" },
        { "ticker": "ggrc11", "cotacao": "", "pvp": "", "precoJusto": "", "valueDividendYeldTwelveMonths": "", "lastDividend": "" },
        { "ticker": "trxf11", "cotacao": "", "pvp": "", "precoJusto": "", "valueDividendYeldTwelveMonths": "", "lastDividend": "" }
    ]
};
let url = '';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // cabeçalho http que permite acesso de todas as origens
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // define que os métodos permitidos são apenas get e options, logo não é possível alterar nada
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    } else if (req.method === 'POST') {
        const { fundos } = req.body; // Receber os fundos do corpo da requisição
        try {
            dados.fundosPadrao = fundos;
            let fundosAtualizados = await main(dados.indicesPadrão, dados.fundosPadrao); // Chama a função main passando os fundos
            res.status(200).json({ fundosAtualizados }); // Responde com os dados atualizados
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).json({ error: 'Erro ao coletar dados' }); // Responde com erro 500
        }
    } else if (req.method === 'GET') {
        fundosPadrao = await main(dados.indicesPadrão, dados.fundosPadrao);
        res.status(200).json({});
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`); // Responde com erro 405
    }
};
async function main(indices, fundos) {
    try {
        url = 'https://investidor10.com.br/indices/';
        const response = await axios.get(url, {//acessa a url com um método do tipo get
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                //O cabeçalho User-Agent informa ao servidor quem está fazendo a requisição. Neste caso, está sendo enviado um valor que simula um navegador comum (Chrome), o que pode ser útil para evitar bloqueios de acesso a determinadas APIs que rejeitam requisições sem um User-Agent adequado ou que são feitas por scripts.
            }
        });

        const html = response.data;//armazena os dados da requisição http, que no caso é um html
        const $ = cheerio.load(html);//lê os elementos html

        //aqui é onde acessamos partes específicas do html para extrair os dados que queremos:

        //Selic
        $(".indices-grid .index-card").eq(2).children(".body").each(function () {
            dados.indicesPadrão[0].valor = $(this).find("p strong").text().trim();
        });

        //CDI
        $(".indices-grid .index-card").eq(0).children(".body").each(function () {
            dados.indicesPadrão[1].valor = $(this).find("p strong").text().trim();
        });

        //IPCA
        $(".indices-grid .index-card").eq(1).children(".body").eq(0).children("p").each(function () {
            dados.indicesPadrão[2].valor = $(this).find("strong").text().trim();
        });

        //IBOV
        $(".indices-grid .index-card").eq(3).children(".body").eq(0).children("p").each(function () {
            dados.indicesPadrão[3].valor = $(this).find("strong").text().trim();
        });
        console.log(indices);
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error);
    }

    for (let fundo of fundos) {
        try {
            url = 'https://investidor10.com.br/fiis/';
            const response = await axios.get(url + fundo.ticker, {//acessa a url com um método do tipo get
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    //O cabeçalho User-Agent informa ao servidor quem está fazendo a requisição. Neste caso, está sendo enviado um valor que simula um navegador comum (Chrome), o que pode ser útil para evitar bloqueios de acesso a determinadas APIs que rejeitam requisições sem um User-Agent adequado ou que são feitas por scripts.
                }
            });

            const html = response.data;//armazena os dados da requisição http, que no caso é um html
            const $ = cheerio.load(html);//lê os elementos html

            //aqui é onde acessamos partes específicas do html para extrair os dados que queremos:

            // cotação
            $("._card.cotacao ._card-body div").each(function () {
                fundo.cotacao = $(this).find(".value").text().trim();
            });

            // p/vp
            $("._card.vp ._card-body").each(function () {
                fundo.pvp = $(this).find("span").text().trim();
            });

            // preço justo
            $(".cell").eq(12).children(".desc").each(function () {
                fundo.precoJusto = $(this).find(".value").text().trim();
            });

            // DY 12 meses
            fundo.valueDividendYeldTwelveMonths = $('.content--info .content--info--item').eq(3).children('.content--info--item--value').eq(0).text().trim();

            // último dividendo
            $(".cell").eq(14).children(".desc").each(function () {
                fundo.lastDividend = $(this).find(".value").text().trim();
            });
        } catch (error) {
            console.error('Erro ao fazer a requisição:', error);
        }
    }

    return dados;
}
run();