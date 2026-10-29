/**
 * TUKUBI Enterprise WebRTC ICE Server Configuration
 * Provides STUN/TURN server candidates for symmetric NAT traversal across Caribbean mobile networks.
 */

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function getIceServers(): IceServerConfig[] {
  const servers: IceServerConfig[] = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
  ];

  // Cloudflare Calls TURN or Coturn configuration via environment
  const coturnUrl = process.env.NEXT_PUBLIC_COTURN_URL || process.env.COTURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME || process.env.TURN_USERNAME;
  const turnCredential =
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL ||
    process.env.TURN_CREDENTIAL ||
    process.env.CLOUDFLARE_CALLS_TURN_KEY;

  if (coturnUrl) {
    servers.push({
      urls: coturnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
}
