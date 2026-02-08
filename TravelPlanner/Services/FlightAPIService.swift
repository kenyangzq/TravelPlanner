import Foundation

final class FlightAPIService {
    private let apiKey: String
    private let baseURL: String

    init(apiKey: String = Constants.API.rapidAPIKey) {
        self.apiKey = apiKey
        self.baseURL = Constants.API.aeroDataBoxBaseURL
    }

    func fetchFlightInfo(flightNumber: String, date: Date) async throws -> FlightAPIResponse {
        let dateString = DateFormatter.apiDate.string(from: date)
        let cleaned = flightNumber.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

        guard let url = URL(string: "\(baseURL)/flights/number/\(cleaned)/\(dateString)") else {
            throw APIError.invalidURL
        }

        let headers = [
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": Constants.API.rapidAPIHost
        ]

        let flights: [FlightAPIResponse] = try await APIClient.shared.fetch(
            url: url,
            headers: headers
        )

        guard let flight = flights.first else {
            throw APIError.noFlightFound
        }

        return flight
    }

    func populateFlightEvent(_ event: FlightEvent, from response: FlightAPIResponse) {
        event.airlineName = response.airline?.name ?? ""
        event.airlineIATA = response.airline?.iata ?? ""
        event.flightStatus = response.status ?? ""

        if let departure = response.departure {
            event.departureAirportIATA = departure.airport?.iata ?? ""
            event.departureAirportName = departure.airport?.name ?? ""
            event.departureTerminal = departure.terminal ?? ""
            event.departureGate = departure.gate ?? ""
            event.departureLatitude = departure.airport?.location?.lat
            event.departureLongitude = departure.airport?.location?.lon

            if let timeStr = departure.scheduledTime?.local ?? departure.scheduledTime?.utc {
                event.scheduledDepartureTime = parseFlightTime(timeStr)
                if let depTime = event.scheduledDepartureTime {
                    event.startDate = depTime
                }
            }
        }

        if let arrival = response.arrival {
            event.arrivalAirportIATA = arrival.airport?.iata ?? ""
            event.arrivalAirportName = arrival.airport?.name ?? ""
            event.arrivalTerminal = arrival.terminal ?? ""
            event.arrivalGate = arrival.gate ?? ""
            event.arrivalLatitude = arrival.airport?.location?.lat
            event.arrivalLongitude = arrival.airport?.location?.lon

            if let timeStr = arrival.scheduledTime?.local ?? arrival.scheduledTime?.utc {
                event.scheduledArrivalTime = parseFlightTime(timeStr)
                if let arrTime = event.scheduledArrivalTime {
                    event.endDate = arrTime
                }
            }
        }

        event.title = "\(event.airlineName) \(event.flightNumber)"
        event.locationName = "\(event.departureAirportIATA) → \(event.arrivalAirportIATA)"
        event.lastUpdated = Date()
    }

    private func parseFlightTime(_ timeString: String) -> Date? {
        // API returns formats like:
        //   "2025-04-09 06:15-07:00" (local with timezone offset)
        //   "2025-04-09 13:15Z" (UTC)
        //   "2025-04-09 13:15:00Z"

        let formats = [
            "yyyy-MM-dd HH:mmXXX",    // "2025-04-09 06:15-07:00"
            "yyyy-MM-dd HH:mm:ssXXX", // "2025-04-09 06:15:00-07:00"
            "yyyy-MM-dd HH:mmX",      // "2025-04-09 13:15Z"
            "yyyy-MM-dd HH:mm:ssX",   // "2025-04-09 13:15:00Z"
            "yyyy-MM-dd'T'HH:mmXXX",  // ISO with T
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            "yyyy-MM-dd'T'HH:mm",     // no timezone
            "yyyy-MM-dd HH:mm",       // no timezone, space
        ]

        for format in formats {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            formatter.locale = Locale(identifier: "en_US_POSIX")
            if let date = formatter.date(from: timeString) {
                return date
            }
        }

        return nil
    }
}
