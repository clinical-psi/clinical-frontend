import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type Location = {
  id: number
  address: string
  name: string
  hallName: string
  longitude: number
  latitude: number
  mapsLink: string
}

export const locationsApi = {
  list: async (): Promise<Location[]> => {
    const { data } = await axios.get<Location[]>(`${API_BASE_URL}/locations`)
    return data
  },
}
