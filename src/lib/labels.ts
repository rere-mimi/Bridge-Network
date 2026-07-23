import type { OperationalStatus } from '../types'

export function statusLabel(status: OperationalStatus): string {
  switch (status) {
    case 'operational':
      return 'Operational'
    case 'watch':
      return 'Watch'
    case 'restricted':
      return 'Restricted'
    case 'closed':
      return 'Closed'
  }
}
