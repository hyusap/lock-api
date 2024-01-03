import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token, secret, device } = req.query || req.body;
  if (!token || !secret || !device) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  if (typeof secret !== "string") {
    return res.status(400).json({ error: "Secret must be a string" });
  }

  const nonce = uuidv4();
  const t = Date.now();
  let stringToSign = `${token}${t}${nonce}`;

  const secretBuffer = Buffer.from(secret, "utf-8");

  const sign = crypto
    .createHmac("sha256", secretBuffer)
    .update(stringToSign.toString())
    .digest("base64");

  const apiUrl = "https://api.switch-bot.com";

  const tokenString = Array.isArray(token) ? token[0] : token;

  const headers = {
    Authorization: tokenString,
    "Content-Type": "application/json",
    charset: "utf8",
    t: t.toString(),
    sign: sign,
    nonce: nonce,
  };

  const data = await fetch(`${apiUrl}/v1.1/devices/${device}/commands`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ command: "unlock" }),
  });
  const json = await data.json();
  console.log(json);

  return res.json({ completed: true });
}
