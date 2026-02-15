import Foundation

// All structs use custom CodingKeys or extra fields to handle
// unknown keys from the AeroDataBox API without failing.

struct FlightAPIResponse: Codable {
    let number: String?
    let status: String?
    let airline: AirlineInfo?
    let departure: AirportMovement?
    let arrival: AirportMovement?
    let lastUpdatedUtc: String?
    let codeshareStatus: String?
    let isCargo: Bool?
    let aircraft: AircraftInfo?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        number = try container.decodeIfPresent(String.self, forKey: .number)
        status = try container.decodeIfPresent(String.self, forKey: .status)
        airline = try container.decodeIfPresent(AirlineInfo.self, forKey: .airline)
        departure = try container.decodeIfPresent(AirportMovement.self, forKey: .departure)
        arrival = try container.decodeIfPresent(AirportMovement.self, forKey: .arrival)
        lastUpdatedUtc = try container.decodeIfPresent(String.self, forKey: .lastUpdatedUtc)
        codeshareStatus = try container.decodeIfPresent(String.self, forKey: .codeshareStatus)
        isCargo = try container.decodeIfPresent(Bool.self, forKey: .isCargo)
        aircraft = try container.decodeIfPresent(AircraftInfo.self, forKey: .aircraft)
    }

    enum CodingKeys: String, CodingKey {
        case number, status, airline, departure, arrival, lastUpdatedUtc
        case codeshareStatus, isCargo, aircraft
    }
}

struct AircraftInfo: Codable {
    let model: String?
    let reg: String?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        model = try container.decodeIfPresent(String.self, forKey: .model)
        reg = try container.decodeIfPresent(String.self, forKey: .reg)
    }

    enum CodingKeys: String, CodingKey {
        case model, reg
    }
}

struct AirlineInfo: Codable {
    let name: String?
    let iata: String?
    let icao: String?
}

struct AirportMovement: Codable {
    let airport: AirportInfo?
    let scheduledTime: FlightTime?
    let revisedTime: FlightTime?
    let terminal: String?
    let gate: String?
    let quality: [String]?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        airport = try container.decodeIfPresent(AirportInfo.self, forKey: .airport)
        scheduledTime = try container.decodeIfPresent(FlightTime.self, forKey: .scheduledTime)
        revisedTime = try container.decodeIfPresent(FlightTime.self, forKey: .revisedTime)
        terminal = try container.decodeIfPresent(String.self, forKey: .terminal)
        gate = try container.decodeIfPresent(String.self, forKey: .gate)
        quality = try container.decodeIfPresent([String].self, forKey: .quality)
    }

    enum CodingKeys: String, CodingKey {
        case airport, scheduledTime, revisedTime, terminal, gate, quality
    }
}

struct AirportInfo: Codable {
    let name: String?
    let iata: String?
    let icao: String?
    let location: AirportLocation?
    let countryCode: String?
    let timeZone: String?
    let shortName: String?
    let municipalityName: String?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decodeIfPresent(String.self, forKey: .name)
        iata = try container.decodeIfPresent(String.self, forKey: .iata)
        icao = try container.decodeIfPresent(String.self, forKey: .icao)
        location = try container.decodeIfPresent(AirportLocation.self, forKey: .location)
        countryCode = try container.decodeIfPresent(String.self, forKey: .countryCode)
        timeZone = try container.decodeIfPresent(String.self, forKey: .timeZone)
        shortName = try container.decodeIfPresent(String.self, forKey: .shortName)
        municipalityName = try container.decodeIfPresent(String.self, forKey: .municipalityName)
    }

    enum CodingKeys: String, CodingKey {
        case name, iata, icao, location, countryCode, timeZone, shortName, municipalityName
    }
}

struct AirportLocation: Codable {
    let lat: Double
    let lon: Double
}

struct FlightTime: Codable {
    let utc: String?
    let local: String?
}
