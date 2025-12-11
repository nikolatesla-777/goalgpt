// Shared prediction store for syncing manual predictions with all predictions view
// This acts as a simple client-side state manager

export interface ManualPrediction {
    id: string
    date: string
    time: string
    botName: string
    league: string
    leagueFlag: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    matchStatus: 'live' | 'ht' | 'ft'
    minute: number
    predictionMinute: string
    predictionScore: string
    prediction: string
    result: 'pending' | 'live_won' | 'won' | 'lost'
    isVip: boolean
    source: 'manual' | 'ai'
}

const STORAGE_KEY = 'goalgpt_manual_predictions'

// Get all manual predictions from localStorage
export function getManualPredictions(): ManualPrediction[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

// Add a new manual prediction
export function addManualPrediction(prediction: ManualPrediction): void {
    if (typeof window === 'undefined') return

    const predictions = getManualPredictions()
    predictions.unshift(prediction) // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions))

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('manual-prediction-added', { detail: prediction }))
}

// Update prediction result
export function updatePredictionResult(id: string, result: 'won' | 'lost'): void {
    if (typeof window === 'undefined') return

    const predictions = getManualPredictions()
    const updated = predictions.map(p =>
        p.id === id ? { ...p, result, matchStatus: 'ft' as const } : p
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    window.dispatchEvent(new CustomEvent('prediction-updated', { detail: { id, result } }))
}

// Delete a prediction
export function deletePrediction(id: string): void {
    if (typeof window === 'undefined') return

    const predictions = getManualPredictions()
    const filtered = predictions.filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

    window.dispatchEvent(new CustomEvent('prediction-deleted', { detail: { id } }))
}

// Toggle VIP status
export function toggleVipStatus(id: string): void {
    if (typeof window === 'undefined') return

    const predictions = getManualPredictions()
    const updated = predictions.map(p =>
        p.id === id ? { ...p, isVip: !p.isVip } : p
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    window.dispatchEvent(new CustomEvent('prediction-vip-toggled', { detail: { id } }))
}

// Clear all manual predictions
export function clearManualPredictions(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
}
