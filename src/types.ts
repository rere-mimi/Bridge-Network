export type NodeStatus = 'online' | 'degraded' | 'offline'

export type BridgeNode = {
  id: string
  name: string
  city: string
  region: string
  lat: number
  lng: number
  status: NodeStatus
  throughputMbps: number
  latencyMs: number
  uptimePct: number
  connections: number
}

export type ActivityEvent = {
  id: string
  time: string
  nodeId: string
  nodeName: string
  message: string
  kind: 'info' | 'warn' | 'critical' | 'ok'
}

export type LiveMetrics = {
  activeNodes: number
  totalThroughput: number
  avgLatency: number
  openAlerts: number
  packetsPerSec: number
}
