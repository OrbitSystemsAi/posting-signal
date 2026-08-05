import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });
const app = express();
const port = 3001;
const frontendUrl = "http://127.0.0.1:3004";
const apiBase = "https://api.canva.com/rest/v1";
const clientId = process.env.CANVA_CLIENT_ID;
const clientSecret = process.env.CANVA_CLIENT_SECRET;
const redirectUri =
  process.env.CANVA_REDIRECT_URI || `http://127.0.0.1:${port}/oauth/redirect`;
const scopes = [
  "asset:read",
  "asset:write",
  "design:content:read",
  "design:content:write",
  "design:meta:read",
  "profile:read",
];
const pending = new Map();
const dataDir = path.join(root, ".data");
const tokenPath = path.join(dataDir, "canva-token.enc");
const generatedDir = path.join(root, "public", "generated");
const documentsDir = path.join(dataDir, "documents");
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
});

app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: "1mb" }));
app.use("/generated", express.static(generatedDir));
app.use("/documents", express.static(documentsDir));

const allowedDocumentExtensions = new Set([
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
]);

const configured = () => Boolean(clientId && clientSecret);
const encryptionKey = () =>
  crypto.scryptSync(clientSecret, "signal-canva-token-store-v1", 32);

async function saveToken(token) {
  await fs.mkdir(dataDir, { recursive: true });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(token), "utf8"),
    cipher.final(),
  ]);
  await fs.writeFile(
    tokenPath,
    Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64"),
    { mode: 0o600 },
  );
}

async function loadToken() {
  if (!configured()) return null;
  try {
    const raw = Buffer.from(await fs.readFile(tokenPath, "utf8"), "base64");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      raw.subarray(0, 12),
    );
    decipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(raw.subarray(28)),
        decipher.final(),
      ]).toString("utf8"),
    );
  } catch {
    return null;
  }
}

async function exchangeToken(body) {
  const response = await fetch(`${apiBase}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "Canva token exchange failed");
  result.expires_at = Date.now() + result.expires_in * 1000;
  await saveToken(result);
  return result;
}

async function accessToken() {
  let token = await loadToken();
  if (!token) throw new Error("Canva is not connected");
  if (token.expires_at > Date.now() + 60_000) return token.access_token;
  token = await exchangeToken({
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
  });
  return token.access_token;
}

async function canvaRequest(endpoint, options = {}) {
  const response = await fetch(
    endpoint.startsWith("http") ? endpoint : `${apiBase}${endpoint}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        ...(options.headers || {}),
      },
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      result.message ||
        result.error?.message ||
        `Canva request failed (${response.status})`,
    );
  return result;
}

async function pollJob(endpoint, pick, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    const result = await canvaRequest(endpoint);
    const value = pick(result);
    if (value) return value;
    if (result.job?.status === "failed")
      throw new Error(result.job.error?.message || "Canva job failed");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Canva job timed out");
}

async function uploadImage(imageUrl, title) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok)
    throw new Error("Signal could not download the selected image");
  const upload = await canvaRequest("/asset-uploads", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Asset-Upload-Metadata": JSON.stringify({
        name_base64: Buffer.from(title || "Signal post image").toString(
          "base64",
        ),
      }),
    },
    body: Buffer.from(await imageResponse.arrayBuffer()),
  });
  return pollJob(
    `/asset-uploads/${upload.job.id}`,
    (result) => result.job?.status === "success" && result.job.asset?.id,
  );
}

async function createDesign(action) {
  const assetId = action.imageUrl
    ? await uploadImage(action.imageUrl, action.title)
    : null;
  const body = assetId
    ? { type: "type_and_asset", asset_id: assetId, title: action.title }
    : { type: "custom", width: 1200, height: 627, title: action.title };
  const result = await canvaRequest("/designs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const editUrl = new URL(result.design.urls.edit_url);
  editUrl.searchParams.set(
    "correlation_state",
    Buffer.from(JSON.stringify({ postId: action.postId })).toString(
      "base64url",
    ),
  );
  return editUrl.toString();
}

app.get("/api/canva/status", async (_req, res) => {
  res.json({ configured: configured(), connected: Boolean(await loadToken()) });
});

app.post("/api/canva/launch", (req, res) => {
  if (!configured())
    return res
      .status(503)
      .json({ error: "Canva credentials are not configured" });
  const id = crypto.randomBytes(24).toString("base64url");
  pending.set(id, {
    postId: String(req.body.postId),
    title: String(req.body.title || "Signal LinkedIn post").slice(0, 100),
    imageUrl: typeof req.body.imageUrl === "string" ? req.body.imageUrl : "",
  });
  res.json({ launchUrl: `http://127.0.0.1:${port}/api/canva/start/${id}` });
});

app.get("/api/canva/start/:id", async (req, res) => {
  const action = pending.get(req.params.id);
  if (!action)
    return res
      .status(400)
      .send("This Canva launch has expired. Return to Signal and try again.");
  try {
    if (await loadToken()) return res.redirect(await createDesign(action));
    const verifier = crypto.randomBytes(64).toString("base64url");
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");
    const state = crypto.randomBytes(48).toString("base64url");
    pending.set(state, { ...action, verifier });
    pending.delete(req.params.id);
    const auth = new URL("https://www.canva.com/api/oauth/authorize");
    auth.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      code_challenge: challenge,
      code_challenge_method: "S256",
      scope: scopes.join(" "),
      state,
    }).toString();
    res.redirect(auth.toString());
  } catch (error) {
    res.status(500).send(`Unable to open Canva: ${error.message}`);
  }
});

app.get("/oauth/redirect", async (req, res) => {
  const action = pending.get(req.query.state);
  if (!action || typeof req.query.code !== "string") {
    return res.redirect(
      `${frontendUrl}/?canvaError=${encodeURIComponent(req.query.error || "Invalid OAuth response")}`,
    );
  }
  pending.delete(req.query.state);
  try {
    await exchangeToken({
      grant_type: "authorization_code",
      code: req.query.code,
      code_verifier: action.verifier,
      redirect_uri: redirectUri,
    });
    res.redirect(await createDesign(action));
  } catch (error) {
    res.redirect(
      `${frontendUrl}/?canvaError=${encodeURIComponent(error.message)}`,
    );
  }
});

app.get("/return-nav", async (req, res) => {
  try {
    const token = req.query.correlation_jwt;
    if (typeof token !== "string")
      throw new Error("Canva did not provide a return token");
    await jwtVerify(
      token,
      createRemoteJWKSet(new URL(`${apiBase}/connect/keys`)),
      { audience: clientId },
    );
    const claims = decodeJwt(token);
    const correlation = JSON.parse(
      Buffer.from(String(claims.correlation_state), "base64url").toString(
        "utf8",
      ),
    );
    const params = new URLSearchParams({
      canvaDesignId: String(claims.design_id),
      canvaPostId: String(correlation.postId),
    });
    res.redirect(`${frontendUrl}/?${params}`);
  } catch (error) {
    res.redirect(
      `${frontendUrl}/?canvaError=${encodeURIComponent(error.message)}`,
    );
  }
});

app.post("/api/canva/export", async (req, res) => {
  try {
    const designId = String(req.body.designId || "");
    const postId = String(req.body.postId || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!designId || !postId)
      return res.status(400).json({ error: "Missing design or post ID" });
    const created = await canvaRequest("/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        design_id: designId,
        format: { type: "png", pages: [1], lossless: true },
      }),
    });
    const downloadUrl = await pollJob(
      `/exports/${created.job.id}`,
      (result) => result.job?.status === "success" && result.job.urls?.[0],
      60,
    );
    const image = await fetch(downloadUrl);
    if (!image.ok) throw new Error("Canva export download failed");
    await fs.mkdir(generatedDir, { recursive: true });
    const filename = `canva-${postId}-${Date.now()}.png`;
    await fs.writeFile(
      path.join(generatedDir, filename),
      Buffer.from(await image.arrayBuffer()),
    );
    res.json({
      url: `http://127.0.0.1:${port}/generated/${filename}`,
      designId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/documents",
  documentUpload.single("document"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Choose a document" });
      const extension = path.extname(req.file.originalname).toLowerCase();
      if (!allowedDocumentExtensions.has(extension)) {
        return res.status(415).json({
          error: "LinkedIn supports PDF, PPT, PPTX, DOC, and DOCX documents",
        });
      }
      await fs.mkdir(documentsDir, { recursive: true });
      const id = crypto.randomUUID();
      const filename = `${id}${extension}`;
      await fs.writeFile(path.join(documentsDir, filename), req.file.buffer, {
        mode: 0o600,
      });
      res.json({
        id,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: `http://127.0.0.1:${port}/documents/${filename}`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.delete("/api/documents/:id", async (req, res) => {
  const files = await fs.readdir(documentsDir).catch(() => []);
  const match = files.find((file) => file.startsWith(`${req.params.id}.`));
  if (match) await fs.rm(path.join(documentsDir, match), { force: true });
  res.json({ deleted: Boolean(match) });
});

app.delete("/api/account", async (_req, res) => {
  const token = await loadToken();
  let canvaRevoked = false;
  if (token?.refresh_token && configured()) {
    try {
      const response = await fetch(`${apiBase}/oauth/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          token: token.refresh_token,
        }),
      });
      canvaRevoked = response.ok;
    } catch {
      canvaRevoked = false;
    }
  }
  await fs.rm(tokenPath, { force: true });
  await fs.rm(generatedDir, { recursive: true, force: true });
  await fs.rm(documentsDir, { recursive: true, force: true });
  pending.clear();
  res.json({ deleted: true, canvaRevoked });
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "LinkedIn documents cannot exceed 100 MB"
          : "Only one document can be attached to a post",
    });
  }
  return next(error);
});

app.listen(port, "127.0.0.1", () =>
  console.log(`Signal Canva API running at http://127.0.0.1:${port}`),
);
