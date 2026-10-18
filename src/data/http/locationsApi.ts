import { get } from "./httpClient";

export type Location = {
  id: number;
  address: string;
  name: string;
  hallName: string;
  longitude: number;
  latitude: number;
  mapsLink: string;
};

export const locationsApi = {
  list: async (): Promise<Location[]> => {
    return get<Location[]>("/locations");
  },
};
