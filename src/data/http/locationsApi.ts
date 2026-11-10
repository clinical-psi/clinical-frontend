import { get, post, put, patch } from "./httpClient";

export type LocationHallOption = {
  id: number;
  locationId: number;
  name: string;
  hallName: string;
};

export type LocationHall = {
  id: number;
  hallName: string;
};

export type Location = {
  id: number;
  name: string;
  halls: LocationHall[];
  address: string;
  longitude: number | null;
  latitude: number | null;
  mapsLink: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export type WriteLocationRequest = Pick<Location, "address" | "name"> & {
  halls: Array<{ id?: number; hallName: string }>;
};

export type LocationPage = {
  content: Location[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type LocationFilters = {
  q: string;
  page: number;
  size: number;
  status?: Location["status"];
};

export function formatLocationLabel(location: Pick<LocationHallOption, "name" | "hallName">) {
  return [location.name, location.hallName].filter(Boolean).join(" - ");
}

export const locationsApi = {
  listOptions: () => get<LocationHallOption[]>("/locations/options"),
  browse: (filters: LocationFilters) => get<LocationPage>("/locations/browse", filters),
  getById: (id: number) => get<Location>(`/locations/${id}`),
  create: (request: WriteLocationRequest) => post<Location>("/locations", request),
  update: (id: number, request: WriteLocationRequest) => put<Location>(`/locations/${id}`, request),
  deactivate: (id: number) => patch<void>(`/locations/${id}/deactivate`),
};
