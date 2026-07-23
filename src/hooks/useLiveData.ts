import { useEffect, useRef, useState } from 'react'
import {
  INITIAL_NODES,
  createActivityEvent,
  jitterNode,
} from '../data/nodes'
import type { ActivityEvent, BridgeNode, LiveMetrics, NodeStatus } from '../types'

function computeMetrics(nodes: BridgeNode[]): LiveMetrics {
  const active = nodes.filter((n) => n.status !== 'offline')
  const totalThroughput = active.reduce((sum, n) => sum + n.throughputMbps, 0)
  const avgLatency =
    active.length === 0
      ? 0
      : Math.round(active.reduce((sum, n) => sum + n.latencyMs, 0) / active.length)
  const openAlerts = nodes.filter((n) => n.status !== 'online').length
  const packetsPerSec = Math.round(totalThroughput * 120 + Math.random() * 8000)

  return {
    activeNodes: active.length,
    totalThroughput,
    avgLatency,
    openAlerts,
    packetsPerSec,
  }
}

export function useLiveData() {
  const [nodes, setNodes] = useState<BridgeNode[]>(INITIAL_NODES)
  const [events, setEvents] = useState<ActivityEvent[]>(() => {
    const seed: ActivityEvent[] = []
    for (let i = 0; i < 6; i++) {
      seed.push(createActivityEvent(INITIAL_NODES, i))
    }
    return seed
  })
  const [metrics, setMetrics] = useState<LiveMetrics>(() => computeMetrics(INITIAL_NODES))
  const [clock, setClock] = useState(() => new Date())
  const seq = useRef(events.length)

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNodes((prev) => {
        const next = prev.map(jitterNode)
        setMetrics(computeMetrics(next))
        return next
      })
      setClock(new Date())
    }, 2200)

    const stream = window.setInterval(() => {
      seq.current += 1
      setNodes((current) => {
        const event = createActivityEvent(current, seq.current)
        setEvents((prev) => [event, ...prev].slice(0, 24))
        return current
      })
    }, 3800)

    return () => {
      window.clearInterval(tick)
      window.clearInterval(stream)
    }
  }, [])

  return { nodes, events, metrics, clock }
}

export function statusLabel(status: NodeStatus): string {
  switch (status) {
    case 'online':
      return 'Online'
    case 'degraded':
      return 'Degraded'
    case 'offline':
      return 'Offline'
  }
}
