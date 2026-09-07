import { locationsApi, type Location } from '../data/http/locationsApi'

export const locationService = {
  async getAll(): Promise<Location[]> {
    return locationsApi.list()
  },
}
