
export interface AIPredictionPayload {
    matchId: string;           // TheSports Match ID (or internal ID)
    homeTeam: string;
    awayTeam: string;
    league: string;
    prediction: string;        // e.g. "MS 1", "2.5 ÜST"
    odds: number;              // e.g. 1.85
    confidence: number;        // 1-10 or 1-100
    analysis: string;          // Brief AI rationale
    timestamp: number;         // Unix timestamp of generation
    botId?: string;            // Which bot generated this?
    minute?: string;           // Match minute (e.g. "45")
    // derived fields for legacy support
    rawText?: string;
    originalId?: number;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    botGroupId?: string | null;
    botGroupName?: string | null;
}

export interface LegacyPredictionPayload {
    Id: number;
    Date: string;
    Prediction: string; // Base64 encoded string
}

export interface PredictionIngestResult {
    success: boolean;
    id?: string;
    message?: string;
}
