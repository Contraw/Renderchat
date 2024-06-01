const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
const api_key = process.env.TRAN_KEY

let key = api_key;
let endpoint = "https://api.cognitive.microsofttranslator.com";
let location = "eastus2";

const translateText = async (text, from, to) => {
  let params = new URLSearchParams();
  params.append("api-version", "3.0");
  params.append("from", from);
  params.append("to", to);

  try {
    const response = await axios({
      baseURL: endpoint,
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuidv4().toString()
      },
      params: params,
      data: [{ 'text': text }],
      responseType: 'json'
    });

    return response.data[0].translations;
  } catch (error) {
    console.error('Error translating text:', error);
    return [];
  }
};

module.exports = { translateText };
