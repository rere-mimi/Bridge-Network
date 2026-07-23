import type { LiveMetrics } from '../types'

type MetricsBarProps = {
  metrics: LiveMetrics
  totalNodes: number
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function MetricsBar({ metrics, totalNodes }: MetricsBarProps) {
  const items = [
    {
      label: 'Active bridges',
      value: `${metrics.activeNodes}/${totalNodes}`,
      hint: 'nodes online',
    },
    {
      label: 'Throughput',
      value: `${formatNumber(metrics.totalThroughput)}`,
      hint: 'Mbps aggregate',
    },
    {
      label: 'Avg latency',
      value: `${metrics.avgLatency}`,
      hint: 'milliseconds',
    },
    {
      label: 'Open alerts',
      value: `${metrics.openAlerts}`,
      hint: 'needs attention',
    },
    {
      label: 'Packet rate',
      value: formatNumber(metrics.packetsPerSec),
      hint: 'pps estimated',
    },
  ]

  return (
    <section className="metrics-bar" aria-label="Live network metrics">
      {items.map((item) => (
        <article key={item.label} className="metric-tile">
          <p className="metric-label">{item.label}</p>
          <p className="metric-value" key={`${item.label}-${item.value}`}>
            {item.value}
          </p>
          <p className="metric-hint">{item.hint}</p>
        </article>
      ))}
    </section>
  )
}
