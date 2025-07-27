module.exports = async function (context, req) {
  const apiKey = process.env.AZURE_OPENAI_KEY; // NO REACT_ prefix needed
  const result = await fetch('https://api.openai.com/v1/...', {
    headers: { Authorization: `Bearer ${apiKey}` },
    ...
  });
  const data = await result.json();
  context.res = {
    body: data
  };
};
