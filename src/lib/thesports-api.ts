import axios from 'axios';

// NOTE: Base URL should NOT include /football since all endpoints already have it
const BASE_URL = process.env.THESPORTS_API_URL || 'https://api.thesports.com/v1';
const API_USER = process.env.THESPORTS_API_USER;
const API_SECRET = process.env.THESPORTS_API_SECRET;

if (!API_USER || !API_SECRET) {
    console.warn('⚠️ TheSports API credentials missing in environment variables.');
}

export interface FixtureDto {
    id: string;
    home_team_id: string;
    away_team_id: string;
    home: { name: string, logo: string };
    away: { name: string, logo: string };
    scores: { home: number, away: number };
    status: { id: number, name: string }; // e.g. 1=NotStarted, 2=FirstHalf, 3=HT, 4=SecondHalf, etc.
    minute: number;
    competition: { id: string, name: string };
    country: { id: string, name: string };
    time: number; // Unix timestamp
}

interface TeamAdditionalDto {
    id: string; // TheSports team ID
    name: string;
    logo?: string;
    country_id?: string;
    national: number;
    country_logo?: string;
    city?: string;
    stadium?: string;
    competition_id?: string;
    // ... add fields as needed
}

export class TheSportsApi {

    /**
     * Authenticates and fetches data. (Private Helper)
     */
    private static async get(endpoint: string, params: any = {}) {
        try {
            // Ensure params are clear of undefined
            const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null));

            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                params: {
                    user: API_USER,
                    secret: API_SECRET,
                    ...cleanParams
                }
            });
            return response.data;
        } catch (error: any) {
            console.error(`Method: GET, Endpoint: ${endpoint}, Error: ${error.message}`);
            // Return empty list/null safely on error to avoid crashing flow
            return { results: [] };
        }
    }

    /**
     * Fetches details for a specific match.
     */
    static async getMatch(matchId: string): Promise<FixtureDto | null> {
        const data = await this.get('/football/match/detail', { id: matchId });
        return data.results?.[0] || null; // Match details often come in list or direct object
    }

    /**
     * Fetches live matches.
     */
    static async getLiveMatches(): Promise<FixtureDto[]> {
        const data = await this.get('/football/match/live');
        return data.results || [];
    }

    /**
     * Fetches matches for today (diary endpoint).
     * This returns all of today's matches: scheduled, live, and finished.
     */
    static async getFixturesByDate(date?: number): Promise<FixtureDto[]> {
        // /football/match/diary returns today's full fixture list
        const data = await this.get('/football/match/diary');
        return data.results || [];
    }

    /**
     * TEAMS (Existing)
     */
    static async getTeamList(page: number = 1, time?: number): Promise<TeamAdditionalDto[]> {
        // Based on legacy TS_TeamService.cs
        // Endpoint structure might be different, verifying from usage in legacy code:
        // _theSportsService.GetTeamAdditionalListAsync(...)

        // Let's assume the endpoint is '/team/additional/list' based on typical TheSports naming
        // Or we can check if there's an 'infrastructure' file with base URL.
        // For now, we use standard route.

        const params: any = { page };
        if (time) params.time = time; // For incremental updates

        const data = await this.get('/football/team/additional/list', params);

        // The API likely returns { results: [...] } or just [...]
        // Adjust based on actual response structure verification if needed.
        return data.results || [];
    }
}
