export type UserRole = 'admin' | 'formateur';

export interface StaffUser {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Workshop {
  id: string;
  titre: string;
  description: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: string;
  trainer: StaffUser | null;
  active_registrations?: number;
  available_seats?: number;
}

export interface WorkshopPayload {
  titre: string;
  description: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: string;
  trainer_id: string | null;
}

export interface ParticipantRef {
  participant_id: string;
  nom_affiche: string;
  email: string;
  synced_at: string;
}

export interface Registration {
  id: string;
  workshop_id: string;
  participant_id: string;
  status: 'inscrit' | 'annule' | string;
  registered_at: string;
  workshop: Workshop;
  participant: ParticipantRef;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface ResourceResponse<T> {
  data: T;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: StaffUser | ResourceResponse<StaffUser>;
}
