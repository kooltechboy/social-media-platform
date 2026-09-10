/**
 * Cloudflare Stream Live Input client for TUKUBI
 * Docs: https://developers.cloudflare.com/stream/stream-live/
 *
 * Environment variables required (server-side only — never expose to client):
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_STREAM_API_TOKEN
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export interface CloudflareStreamLiveInput {
  uid: string;
  rtmpsUrl: string;       // RTMPS ingest URL for OBS/mobile
  rtmpsKey: string;       // Stream key — treat as a secret
  webRtcUrl: string;      // WHIP WebRTC ingest for browser streaming
  playbackHlsUrl: string; // HLS manifest for all browsers via video tag
  playbackDashUrl: string;
}

export interface CfStreamConfig {
  accountId: string;
  apiToken: string;
}

export class CloudflareStreamClient {
  constructor(private readonly config: CfStreamConfig) {}

  async createLiveInput(params: {
    name: string;
    creatorId: string;
  }): Promise<CloudflareStreamLiveInput> {
    const url = CF_API_BASE + '/accounts/' + this.config.accountId + '/stream/live_inputs';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.config.apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta: { name: params.name, creatorId: params.creatorId },
        recording: { mode: 'automatic', timeoutSeconds: 10 },
      }),
    });

    if (!res.ok) {
      let errText = '';
      try { errText = JSON.stringify(await res.json()); } catch { errText = res.statusText; }
      throw new Error('Cloudflare Stream API error ' + res.status + ': ' + errText);
    }

    const { result } = (await res.json()) as {
      result: {
        uid: string;
        rtmps?: { url?: string; streamKey?: string };
        webRTC?: { url?: string };
      };
    };

    return {
      uid: result.uid,
      rtmpsUrl: result.rtmps?.url ?? '',
      rtmpsKey: result.rtmps?.streamKey ?? '',
      webRtcUrl: result.webRTC?.url ?? '',
      playbackHlsUrl: 'https://customer-' + this.config.accountId + '.cloudflarestream.com/' + result.uid + '/manifest/video.m3u8',
      playbackDashUrl: 'https://customer-' + this.config.accountId + '.cloudflarestream.com/' + result.uid + '/manifest/video.mpd',
    };
  }

  async deleteLiveInput(uid: string): Promise<void> {
    await fetch(
      CF_API_BASE + '/accounts/' + this.config.accountId + '/stream/live_inputs/' + uid,
      { method: 'DELETE', headers: { Authorization: 'Bearer ' + this.config.apiToken } }
    );
  }

  async getLiveInputStatus(uid: string): Promise<{ isConnected: boolean; viewerCount: number }> {
    const res = await fetch(
      CF_API_BASE + '/accounts/' + this.config.accountId + '/stream/live_inputs/' + uid,
      { headers: { Authorization: 'Bearer ' + this.config.apiToken } }
    );
    if (!res.ok) return { isConnected: false, viewerCount: 0 };
    const { result } = (await res.json()) as {
      result: { status?: { current?: { state?: string; clientsConnected?: number } } };
    };
    return {
      isConnected: result.status?.current?.state === 'connected',
      viewerCount: result.status?.current?.clientsConnected ?? 0,
    };
  }
}

/**
 * Factory — returns null when env vars are not configured, allowing callers
 * to show a helpful "not configured" message instead of crashing.
 */
export function createCloudflareStreamClient(): CloudflareStreamClient | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return new CloudflareStreamClient({ accountId, apiToken });
}
