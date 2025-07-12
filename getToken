const fetch = require('node-fetch');

const clientId = 'CaptynEl-CaptynEl-PRD-aaa2283c9-3f8011dd';
const clientSecret = 'PRD-aa2283c937b6-7387-4c2e-8ac2-859a';

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

async function getAccessToken() {
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  const data = await res.json();
  console.log('Access Token:', data.access_token);
  console.log('Expires in (secs):', data.expires_in);
}

getAccessToken();
