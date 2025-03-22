// jwk-to-pem & jsonwebtoken
// https://github.com/Brightspace/node-jwk-to-pem
// JWK(JSONオブジェクト) -> PEMオブジェクト
//
// import jwkToPem from 'jwk-to-pem';
// import jwt = require('jsonwebtoken');
//
// 1. JWKSエンドポイントよりJWK取得 with kid
//   const jwk = { kty: 'EC', crv: 'P-256', x: '...', y: '...' },
// 2. JWK(JSONオブジェクト)を署名用公開鍵(PEM)に変換
//   const pem = jwkToPem(jwk);
// 3. トークンの署名検証

import { APIGatewayProxyEvent } from "aws-lambda";
import axios from "axios";
import { JwtPayload, decode, verify } from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

const BEARER_PREFIX = "Bearer ";
const JWKS_ENDPOINT = "http://localhost:8888/jwks";

// const buildIAMPolicy = (effect: string): PolicyDocument => {
//   return {
//     Version: "2012-10-17",
//     Statement: [
//       {
//         Action: "execute-api:Invoke",
//         Effect: effect,
//         Resource: "*",
//       },
//     ],
//   };
// };

// jwt.verify(token, pem);
const authHandler = async (
  //   event: APIGatewayTokenAuthorizerEvent
  event: APIGatewayProxyEvent
): Promise<void> => {
  const token = event.queryStringParameters.token;

  // "Bearer "除去してトークン文字列取得。
  if (!token) {
    throw Error("Authorization token not found.");
  }

  const encodedToken = event.queryStringParameters.token.substring(
    BEARER_PREFIX.length
  );
  // トークン文字列 -> JWTオブジェクト変換
  const decodedJwt = decode(token, {
    complete: true,
  }) as JwtPayload;
  if (!decodedJwt) {
    throw new Error("Invalid JWT token");
  }
  // JWKSエンドポイントよりJWK(JSONオブジェクト取得)
  const jwks = await axios.get(JWKS_ENDPOINT);

  const kid = decodedJwt.header.kid;

  // JWK取得
  const publicKeyJwk = jwks.data.keys.find((key) => key.kid === kid);

  // JWK -> PEM
  const publicKeyPem = jwkToPem(publicKeyJwk);

  // 署名検証 (complete: true で header,payload,signature全て取得)
  const decoded = verify(token, publicKeyPem, {
    algorithms: ["RS256"],
    complete: true,
  });

  console.log(decoded);
};

export default authHandler;
