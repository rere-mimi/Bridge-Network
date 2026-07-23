import { useEffect, useMemo, useState } from 'react'
import { BRIDGES, createDefaultElementInspections } from '../data/bridges'
import type {
  ActivityEvent,
  BridgeAsset,
  ElementInspection,
  InspectionPhase,
  InspectionReport,
  LiveMetrics,
  PlatformView,
} from '../types'

function stamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function computeMetrics(
  bridges: BridgeAsset[],
  inspections: InspectionReport[],
): LiveMetrics {
  const operational = bridges.filter((b) => b.status === 'operational').length
  const watchCount = bridges.filter(
    (b) => b.status === 'watch' || b.status === 'restricted' || b.status === 'closed',
  ).length
  const avgCondition = Math.round(
    bridges.reduce((sum, b) => sum + b.conditionIndex, 0) / bridges.length,
  )
  const openInspections = inspections.filter(
    (i) => i.status !== 'reported',
  ).length
  const highRisk = bridges.filter(
    (b) => b.riskLevel === 'high' || b.riskLevel === 'critical',
  ).length

  return {
    totalBridges: bridges.length,
    operational,
    watchCount,
    avgCondition,
    openInspections,
    highRisk,
  }
}

function seedInspections(): InspectionReport[] {
  const harbour = BRIDGES[0]
  const balclutha = BRIDGES.find((b) => b.id === 'br-bal')!
  const grafton = BRIDGES.find((b) => b.id === 'br-gra')!

  return [
    {
      id: 'ins-001',
      bridgeId: harbour.id,
      bridgeName: harbour.name,
      inspector: 'A. Ngata',
      startedAt: '2026-07-18T09:10:00',
      updatedAt: '2026-07-20T14:22:00',
      status: 'in-progress',
      phase: 'inspect',
      elements: createDefaultElementInspections(harbour.elements),
      bmpComments: '',
    },
    {
      id: 'ins-002',
      bridgeId: balclutha.id,
      bridgeName: balclutha.name,
      inspector: 'R. Lawson',
      startedAt: '2026-07-10T08:00:00',
      updatedAt: '2026-07-16T11:40:00',
      status: 'submitted',
      phase: 'bmp-review',
      elements: createDefaultElementInspections(balclutha.elements),
      bmpComments: '',
      submittedAt: '2026-07-16T11:40:00',
    },
    {
      id: 'ins-003',
      bridgeId: grafton.id,
      bridgeName: grafton.name,
      inspector: 'S. Patel',
      startedAt: '2026-06-02T10:15:00',
      updatedAt: '2026-06-28T16:05:00',
      status: 'reported',
      phase: 'reports',
      elements: createDefaultElementInspections(grafton.elements),
      bmpComments: 'Prioritise bearing replacement in FY26 programme.',
      submittedAt: '2026-06-12T09:00:00',
      reviewedAt: '2026-06-18T13:20:00',
      enteredAt: '2026-06-22T10:00:00',
    },
  ]
}

const EVENT_MESSAGES = [
  (b: BridgeAsset) => `Condition refresh synced for ${b.name}`,
  (b: BridgeAsset) => `Risk model recalculated — ${b.name} score ${b.riskScore}`,
  (b: BridgeAsset) => `Inspection reminder: ${b.name} due ${b.nextInspectionDue}`,
  (b: BridgeAsset) => `Digital twin geometry pack updated · ${b.city}`,
  (b: BridgeAsset) => `Maintenance action queue updated for ${b.name}`,
]

export function useBridgePlatform() {
  const [bridges] = useState(BRIDGES)
  const [view, setView] = useState<PlatformView>('overview')
  const [selectedId, setSelectedId] = useState<string>(BRIDGES[0].id)
  const [inspections, setInspections] = useState<InspectionReport[]>(seedInspections)
  const [activeInspectionId, setActiveInspectionId] = useState<string>('ins-001')
  const [events, setEvents] = useState<ActivityEvent[]>(() =>
    BRIDGES.slice(0, 5).map((b, i) => ({
      id: `evt-seed-${i}`,
      time: stamp(),
      bridgeId: b.id,
      bridgeName: b.name,
      message: EVENT_MESSAGES[i % EVENT_MESSAGES.length](b),
      kind: b.riskLevel === 'critical' ? 'critical' : b.riskLevel === 'high' ? 'warn' : 'info',
    })),
  )
  const [clock, setClock] = useState(() => new Date())

  const selectedBridge = useMemo(
    () => bridges.find((b) => b.id === selectedId) ?? bridges[0],
    [bridges, selectedId],
  )

  const activeInspection = useMemo(
    () => inspections.find((i) => i.id === activeInspectionId) ?? inspections[0],
    [inspections, activeInspectionId],
  )

  const metrics = useMemo(
    () => computeMetrics(bridges, inspections),
    [bridges, inspections],
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(new Date())
      const bridge = bridges[Math.floor(Math.random() * bridges.length)]
      const kind: ActivityEvent['kind'] =
        bridge.riskLevel === 'critical'
          ? 'critical'
          : bridge.riskLevel === 'high'
            ? 'warn'
            : Math.random() > 0.7
              ? 'ok'
              : 'info'
      setEvents((prev) =>
        [
          {
            id: `evt-${Date.now()}`,
            time: stamp(),
            bridgeId: bridge.id,
            bridgeName: bridge.name,
            message: EVENT_MESSAGES[Math.floor(Math.random() * EVENT_MESSAGES.length)](
              bridge,
            ),
            kind,
          },
          ...prev,
        ].slice(0, 20),
      )
    }, 4200)
    return () => window.clearInterval(timer)
  }, [bridges])

  function selectBridge(id: string) {
    setSelectedId(id)
  }

  function startInspection(bridgeId: string) {
    const bridge = bridges.find((b) => b.id === bridgeId)
    if (!bridge) return
    const report: InspectionReport = {
      id: `ins-${Date.now()}`,
      bridgeId: bridge.id,
      bridgeName: bridge.name,
      inspector: 'Field Inspector',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      phase: 'elements',
      elements: createDefaultElementInspections(bridge.elements),
      bmpComments: '',
    }
    setInspections((prev) => [report, ...prev])
    setActiveInspectionId(report.id)
    setView('inspection')
  }

  function setInspectionPhase(phase: InspectionPhase) {
    setInspections((prev) =>
      prev.map((ins) =>
        ins.id === activeInspectionId
          ? {
              ...ins,
              phase,
              updatedAt: new Date().toISOString(),
              status:
                phase === 'bmp-review'
                  ? 'submitted'
                  : phase === 'bis-data'
                    ? 'bmp-reviewed'
                    : phase === 'reports'
                      ? 'entered'
                      : phase === 'inspect'
                        ? 'in-progress'
                        : ins.status,
              submittedAt:
                phase === 'bmp-review' ? new Date().toISOString() : ins.submittedAt,
              reviewedAt:
                phase === 'bis-data' ? new Date().toISOString() : ins.reviewedAt,
              enteredAt:
                phase === 'reports' ? new Date().toISOString() : ins.enteredAt,
            }
          : ins,
      ),
    )
  }

  function updateElementInspection(
    elementCode: string,
    patch: Partial<ElementInspection>,
  ) {
    setInspections((prev) =>
      prev.map((ins) =>
        ins.id === activeInspectionId
          ? {
              ...ins,
              updatedAt: new Date().toISOString(),
              elements: ins.elements.map((el) =>
                el.elementCode === elementCode ? { ...el, ...patch } : el,
              ),
            }
          : ins,
      ),
    )
  }

  function updateBmpComments(comments: string) {
    setInspections((prev) =>
      prev.map((ins) =>
        ins.id === activeInspectionId
          ? { ...ins, bmpComments: comments, updatedAt: new Date().toISOString() }
          : ins,
      ),
    )
  }

  function completeInspection() {
    setInspections((prev) =>
      prev.map((ins) =>
        ins.id === activeInspectionId
          ? {
              ...ins,
              status: 'reported',
              phase: 'reports',
              updatedAt: new Date().toISOString(),
            }
          : ins,
      ),
    )
  }

  return {
    bridges,
    view,
    setView,
    selectedId,
    selectedBridge,
    selectBridge,
    inspections,
    activeInspection,
    activeInspectionId,
    setActiveInspectionId,
    startInspection,
    setInspectionPhase,
    updateElementInspection,
    updateBmpComments,
    completeInspection,
    events,
    metrics,
    clock,
  }
}
