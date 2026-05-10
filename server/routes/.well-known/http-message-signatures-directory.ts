// Web Bot Auth directory — Ed25519 JWK keys used to verify signed
// agent requests per RFC 9421. Replace the placeholder key with a
// production key generated via: openssl genpkey -algorithm Ed25519
import { defineEventHandler, setHeader } from 'h3'

const DIR = {
  keys: [
    {
      kty: 'OKP',
      crv: 'Ed25519',
      kid: 'codetime-bot-2026-05',
      use: 'sig',
      alg: 'EdDSA',
      x: 'oOFlvmmlkphyaXf15Kk9QUy5CcSUnrANaqM2rvfBkFY',
      nbf: 1_746_835_200,
      exp: 1_809_907_200,
    },
  ],
}

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return DIR
})
