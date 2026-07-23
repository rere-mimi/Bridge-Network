import type { ActivityEvent, BridgeNode, NodeStatus } from '../types'

export const INITIAL_NODES: BridgeNode[] = [
  {
    id: 'bn-sea',
    name: 'Cascade Gate',
    city: 'Seattle',
    region: 'Pacific NW',
    lat: 47.6062,
    lng: -122.3321,
    status: 'online',
    throughputMbps: 842,
    latencyMs: 18,
    uptimePct: 99.97,
    connections: 1240,
  },
  {
    id: 'bn-sfo',
    name: 'Golden Span',
    city: 'San Francisco',
    region: 'West Coast',
    lat: 37.7749,
    lng: -122.4194,
    status: 'online',
    throughputMbps: 1120,
    latencyMs: 14,
    uptimePct: 99.99,
    connections: 2104,
  },
  {
    id: 'bn-lax',
    name: 'Pacific Arc',
    city: 'Los Angeles',
    region: 'West Coast',
    lat: 34.0522,
    lng: -118.2437,
    status: 'degraded',
    throughputMbps: 610,
    latencyMs: 42,
    uptimePct: 98.4,
    connections: 980,
  },
  {
    id: 'bn-den',
    name: 'High Plains',
    city: 'Denver',
    region: 'Mountain',
    lat: 39.7392,
    lng: -104.9903,
    status: 'online',
    throughputMbps: 540,
    latencyMs: 22,
    uptimePct: 99.91,
    connections: 720,
  },
  {
    id: 'bn-chi',
    name: 'Lake Link',
    city: 'Chicago',
    region: 'Midwest',
    lat: 41.8781,
    lng: -87.6298,
    status: 'online',
    throughputMbps: 980,
    latencyMs: 19,
    uptimePct: 99.95,
    connections: 1680,
  },
  {
    id: 'bn-dal',
    name: 'Lone Star Relay',
    city: 'Dallas',
    region: 'South Central',
    lat: 32.7767,
    lng: -96.797,
    status: 'online',
    throughputMbps: 760,
    latencyMs: 21,
    uptimePct: 99.88,
    connections: 1102,
  },
  {
    id: 'bn-atl',
    name: 'Peach Corridor',
    city: 'Atlanta',
    region: 'Southeast',
    lat: 33.749,
    lng: -84.388,
    status: 'degraded',
    throughputMbps: 490,
    latencyMs: 38,
    uptimePct: 97.9,
    connections: 860,
  },
  {
    id: 'bn-nyc',
    name: 'Hudson Hub',
    city: 'New York',
    region: 'Northeast',
    lat: 40.7128,
    lng: -74.006,
    status: 'online',
    throughputMbps: 1480,
    latencyMs: 12,
    uptimePct: 99.98,
    connections: 3200,
  },
  {
    id: 'bn-bos',
    name: 'Harbor Node',
    city: 'Boston',
    region: 'Northeast',
    lat: 42.3601,
    lng: -71.0589,
    status: 'online',
    throughputMbps: 670,
    latencyMs: 16,
    uptimePct: 99.93,
    connections: 940,
  },
  {
    id: 'bn-mia',
    name: 'Gulf Bridge',
    city: 'Miami',
    region: 'Southeast',
    lat: 25.7617,
    lng: -80.1918,
    status: 'offline',
    throughputMbps: 0,
    latencyMs: 0,
    uptimePct: 94.2,
    connections: 0,
  },
  {
    id: 'bn-phx',
    name: 'Desert Span',
    city: 'Phoenix',
    region: 'Southwest',
    lat: 33.4484,
    lng: -112.074,
    status: 'online',
    throughputMbps: 430,
    latencyMs: 27,
    uptimePct: 99.7,
    connections: 510,
  },
  {
    id: 'bn-msp',
    name: 'North Fork',
    city: 'Minneapolis',
    region: 'Midwest',
    lat: 44.9778,
    lng: -93.265,
    status: 'online',
    throughputMbps: 390,
    latencyMs: 24,
    uptimePct: 99.85,
    connections: 430,
  },
]

const EVENT_TEMPLATES: Array<{
  kind: ActivityEvent['kind']
  message: (node: BridgeNode) => string
  weight: number
}> = [
  {
    kind: 'ok',
    message: (n) => `${n.name} handshake restored — route healthy`,
    weight: 3,
  },
  {
    kind: 'info',
    message: (n) => `Traffic spike on ${n.city} corridor (+${12 + Math.floor(Math.random() * 28)}%)`,
    weight: 4,
  },
  {
    kind: 'info',
    message: (n) => `Failover rehearsal completed at ${n.name}`,
    weight: 2,
  },
  {
    kind: 'warn',
    message: (n) => `Elevated latency detected near ${n.city}`,
    weight: 2,
  },
  {
    kind: 'warn',
    message: (n) => `Packet loss climbing on ${n.name} uplink`,
    weight: 2,
  },
  {
    kind: 'critical',
    message: (n) => `${n.name} dropped below SLA threshold`,
    weight: 1,
  },
]

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item
  }
  return items[items.length - 1]
}

export function createActivityEvent(nodes: BridgeNode[], seq: number): ActivityEvent {
  const candidates = nodes.filter((n) => n.status !== 'offline')
  const pool = candidates.length > 0 ? candidates : nodes
  const node = pool[Math.floor(Math.random() * pool.length)]
  const template = pickWeighted(EVENT_TEMPLATES)
  const now = new Date()
  return {
    id: `evt-${seq}-${now.getTime()}`,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    nodeId: node.id,
    nodeName: node.name,
    message: template.message(node),
    kind: template.kind,
  }
}

export function jitterNode(node: BridgeNode): BridgeNode {
  if (node.status === 'offline') {
    // Rare recovery chance
    if (Math.random() < 0.08) {
      return {
        ...node,
        status: 'degraded',
        throughputMbps: 120 + Math.floor(Math.random() * 180),
        latencyMs: 45 + Math.floor(Math.random() * 30),
        connections: 40 + Math.floor(Math.random() * 80),
      }
    }
    return node
  }

  const drift = () => (Math.random() - 0.5) * 2
  let status: NodeStatus = node.status
  const roll = Math.random()

  if (status === 'online' && roll < 0.04) status = 'degraded'
  else if (status === 'degraded' && roll < 0.12) status = 'online'
  else if (status === 'degraded' && roll > 0.97) status = 'offline'

  if (status === 'offline') {
    return {
      ...node,
      status,
      throughputMbps: 0,
      latencyMs: 0,
      connections: 0,
      uptimePct: Math.max(90, node.uptimePct - 0.05),
    }
  }

  const baseThroughput = status === 'degraded' ? node.throughputMbps * 0.7 : node.throughputMbps
  const baseLatency = status === 'degraded' ? Math.max(node.latencyMs, 35) : node.latencyMs

  return {
    ...node,
    status,
    throughputMbps: Math.max(
      80,
      Math.round(baseThroughput + drift() * (status === 'degraded' ? 40 : 55)),
    ),
    latencyMs: Math.max(8, Math.round(baseLatency + drift() * (status === 'degraded' ? 8 : 3))),
    connections: Math.max(
      20,
      Math.round(node.connections + drift() * (status === 'degraded' ? 25 : 40)),
    ),
    uptimePct: Math.min(99.99, Math.max(95, node.uptimePct + drift() * 0.01)),
  }
}
