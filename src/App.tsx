import { AppShell } from './components/AppShell'
import { ConditionView } from './components/ConditionView'
import { DigitalTwinView } from './components/DigitalTwinView'
import { InspectionView } from './components/InspectionView'
import { InventoryView } from './components/InventoryView'
import { OverviewView } from './components/OverviewView'
import { PlanningView } from './components/PlanningView'
import { RiskView } from './components/RiskView'
import { useBridgePlatform } from './hooks/useBridgePlatform'
import './App.css'

export default function App() {
  const platform = useBridgePlatform()

  return (
    <AppShell
      view={platform.view}
      onViewChange={platform.setView}
      clock={platform.clock}
      metrics={platform.metrics}
    >
      {platform.view === 'overview' && (
        <OverviewView
          bridges={platform.bridges}
          selectedId={platform.selectedId}
          selectedBridge={platform.selectedBridge}
          events={platform.events}
          onSelect={platform.selectBridge}
          onInspect={platform.startInspection}
          onOpenInventory={() => platform.setView('inventory')}
        />
      )}

      {platform.view === 'inventory' && (
        <InventoryView
          bridges={platform.bridges}
          selectedId={platform.selectedId}
          onSelect={platform.selectBridge}
          onInspect={platform.startInspection}
        />
      )}

      {platform.view === 'inspection' && (
        <InspectionView
          bridges={platform.bridges}
          inspections={platform.inspections}
          activeInspection={platform.activeInspection}
          onSelectInspection={platform.setActiveInspectionId}
          onPhaseChange={platform.setInspectionPhase}
          onUpdateElement={platform.updateElementInspection}
          onBmpComments={platform.updateBmpComments}
          onComplete={platform.completeInspection}
          onStart={platform.startInspection}
        />
      )}

      {platform.view === 'condition' && (
        <ConditionView
          bridges={platform.bridges}
          inspections={platform.inspections}
          selectedId={platform.selectedId}
          onSelect={platform.selectBridge}
        />
      )}

      {platform.view === 'risk' && (
        <RiskView
          bridges={platform.bridges}
          selectedId={platform.selectedId}
          onSelect={platform.selectBridge}
        />
      )}

      {platform.view === 'twin' && (
        <DigitalTwinView
          bridge={platform.selectedBridge}
          bridges={platform.bridges}
          onSelect={platform.selectBridge}
        />
      )}

      {platform.view === 'planning' && <PlanningView bridges={platform.bridges} />}
    </AppShell>
  )
}
