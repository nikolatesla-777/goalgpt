
export interface AIPredictionPayload {
    matchId: string;           // External Match ID (API-Football or internal)
    homeTeam: string;
    awayTeam: string;
    league: string;
    prediction: string;        // e.g. "MS 1", "2.5 ÜST"
    odds: number;              // e.g. 1.85
    confidence: number;        // 1-10 or 1-100
    analysis: string;          // Brief AI rationale
    timestamp: number;         // Unix timestamp of generation
    botId?: string;            // Which bot generated this?
    minute?: number | string | null;  // Match minute when prediction was made (e.g. 65)
    // derived fields for legacy support
    rawText?: string;
    originalId?: number;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    botGroupId?: string | null;
    botGroupName?: string | null;
    // Enhanced parsed fields from CleanText format
    matchScore?: string | null;       // Score when prediction was made (e.g. "4-0")
    botName?: string | null;          // Bot name (technical): "Minute 72"
    botDisplayName?: string | null;   // Bot display name (görünen isim): "72. Dakika Botu"
    lastGoalMinute?: number | null;   // Son golün atıldığı dakika
    // Calculated prediction fields (our own algorithm)
    originalPrediction?: string | null;      // Cenklerden gelen (doğrulama amaçlı)
    calculatedPrediction?: string | null;    // Bizim hesapladığımız: "MS 3.5 ÜST"
    predictionPeriod?: 'IY' | 'MS' | null;   // İlk Yarı / Maç Sonu
    predictionThreshold?: number | null;     // 2.5, 3.5, etc.
    predictionDirection?: 'ÜST' | 'ALT' | null;
    goalsAtPrediction?: number | null;       // Tahmin anındaki toplam gol
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
