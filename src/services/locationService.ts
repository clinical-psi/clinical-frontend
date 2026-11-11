import {
  locationsApi,
  type LocationFilters,
  type WriteLocationRequest,
} from "../data/http/locationsApi";

export const locationService = {
  getAll() {
    return locationsApi.listOptions();
  },
  browse(filters: LocationFilters) {
    return locationsApi.browse(filters);
  },
  getById(id: number) {
    return locationsApi.getById(id);
  },
  create(request: WriteLocationRequest) {
    return locationsApi.create(request);
  },
  update(id: number, request: WriteLocationRequest) {
    return locationsApi.update(id, request);
  },
  deactivate(id: number) {
    return locationsApi.deactivate(id);
  },
};
