import type { AttachmentEvent, BlobStore, Queue, Queued } from "./types.ts"

export class SqsQueue implements Queue {
  queueUrl: string
  region: string
  constructor(
    queueUrl = required("SQS_QUEUE_URL"),
    region = process.env.AWS_REGION ?? "us-east-1",
  ) {
    this.queueUrl = queueUrl
    this.region = region
  }

  async receive(max: number): Promise<Queued[]> {
    const body = await aws("sqs", this.region, "AmazonSQS.ReceiveMessage", {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: Math.min(max, 10),
      WaitTimeSeconds: 10,
    })
    const messages = (body.Messages ?? []) as Array<{ ReceiptHandle: string; Body: string }>
    return messages.map((message) => ({
      receipt: message.ReceiptHandle,
      event: parseEvent(message.Body),
    }))
  }

  async delete(receipt: string): Promise<void> {
    await aws("sqs", this.region, "AmazonSQS.DeleteMessage", {
      QueueUrl: this.queueUrl,
      ReceiptHandle: receipt,
    })
  }
}

export class GcsBlobStore implements BlobStore {
  token: string
  constructor(token = required("GCS_ACCESS_TOKEN")) {
    this.token = token
  }

  async download(bucket: string, objectName: string): Promise<Uint8Array> {
    const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`
    const response = await fetch(url, { headers: { authorization: `Bearer ${this.token}` } })
    if (!response.ok) throw new Error(`gcs HTTP ${response.status} ${bucket}/${objectName}`)
    return new Uint8Array(await response.arrayBuffer())
  }
}

function parseEvent(body: string): AttachmentEvent {
  const data = JSON.parse(body) as Partial<AttachmentEvent>
  for (const key of ["id", "bucket", "object", "mime", "filename"] as const) {
    if (!data[key]) throw new Error(`sqs message missing ${key}`)
  }
  return data as AttachmentEvent
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function aws(service: string, region: string, target: string, payload: unknown): Promise<Record<string, unknown>> {
  const accessKey = required("AWS_ACCESS_KEY_ID")
  const secret = required("AWS_SECRET_ACCESS_KEY")
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "")
  const date = amzDate.slice(0, 8)
  const body = JSON.stringify(payload)
  const host = `${service}.${region}.amazonaws.com`
  const canonical = [
    "POST", "/", "",
    `host:${host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${target}`,
    "",
    "host;x-amz-date;x-amz-target",
    await sha256(body),
  ].join("\n")
  const scope = `${date}/${region}/${service}/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonical)}`
  const signingKey = await hmac(
    await hmac(await hmac(await hmac(new TextEncoder().encode("AWS4" + secret), date), region), service),
    "aws4_request",
  )
  const signature = bufferToHex(await hmac(signingKey, stringToSign))
  const response = await fetch(`https://${host}/`, {
    method: "POST",
    headers: {
      host,
      "content-type": "application/x-amz-json-1.0",
      "x-amz-date": amzDate,
      "x-amz-target": target,
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=host;x-amz-date;x-amz-target, Signature=${signature}`,
    },
    body,
  })
  if (!response.ok) throw new Error(`${service} HTTP ${response.status}`)
  return await response.json() as Record<string, unknown>
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return bufferToHex(digest)
}

async function hmac(key: BufferSource, text: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(text))
}

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}
