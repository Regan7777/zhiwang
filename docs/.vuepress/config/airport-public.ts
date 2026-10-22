import { isVisibleAirport } from './airports'
import type { AirportData } from './airports'
import { hostname } from './site'
import { getNoExpiryPackage } from './no-expiry-packages'
export const serializeAirport = (airport: AirportData) => {
  const { performance, ...publicAirport } = airport
  return {
    ...publicAirport,
    ...(airport.noExpiry !== false && isVisibleAirport(airport) ? { noExpiryPackage: getNoExpiryPackage(airport.path) } : {}),
    url: `${hostname}${airport.path}`,
  }
}

export type PublicAirportData = ReturnType<typeof serializeAirport>
