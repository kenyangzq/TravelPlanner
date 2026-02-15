import Foundation
import SwiftData

@available(iOS 26, *)
@Model
final class FlightEvent: TripEvent {
    var flightNumber: String = ""
    var airlineName: String = ""
    var airlineIATA: String = ""
    var departureAirportIATA: String = ""
    var departureAirportName: String = ""
    var departureTerminal: String = ""
    var departureGate: String = ""
    var arrivalAirportIATA: String = ""
    var arrivalAirportName: String = ""
    var arrivalTerminal: String = ""
    var arrivalGate: String = ""
    var departureLatitude: Double?
    var departureLongitude: Double?
    var arrivalLatitude: Double?
    var arrivalLongitude: Double?
    var flightStatus: String = ""
    var scheduledDepartureTime: Date?
    var scheduledArrivalTime: Date?
    var lastUpdated: Date?

    init(
        flightNumber: String,
        date: Date
    ) {
        self.flightNumber = flightNumber
        super.init(
            title: "Flight \(flightNumber)",
            startDate: date,
            endDate: date
        )
    }

    required init() {
        self.flightNumber = ""
        super.init(title: "", startDate: Date(), endDate: Date())
    }

    override var eventIcon: String { "airplane" }
    override var eventColor: String { "blue" }
    override var eventTypeName: String { "Flight" }

    var departureSummary: String {
        if departureAirportIATA.isEmpty { return "Departure" }
        return "\(departureAirportIATA) - \(departureAirportName)"
    }

    var arrivalSummary: String {
        if arrivalAirportIATA.isEmpty { return "Arrival" }
        return "\(arrivalAirportIATA) - \(arrivalAirportName)"
    }
}
