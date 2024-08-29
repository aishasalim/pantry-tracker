// togetherClient.js
import Together from 'together-ai';

let togetherClient;

export function getTogetherClient() {
  if (!togetherClient) {
    togetherClient = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
    });
  }
  return togetherClient;
}
