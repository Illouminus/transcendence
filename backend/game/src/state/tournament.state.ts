import { TournamentState } from '../@types/tournament.types';

export const activeTournaments: Record<number, TournamentState> = {};

const matchReadyState: Record<number, Set<number>> = {};