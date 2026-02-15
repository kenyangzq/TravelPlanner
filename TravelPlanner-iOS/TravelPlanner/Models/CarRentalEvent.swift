import Foundation
import SwiftData

@available(iOS 26, *)
@Model
final class CarRentalEvent: TripEvent {
    var pickupDate: Date = Date()
    var returnDate: Date = Date()
    var pickupLocationName: String = ""
    var pickupAirportCode: String = ""
    var pickupLatitude: Double?
    var pickupLongitude: Double?
    var returnLocationName: String = ""
    var returnAirportCode: String = ""
    var returnLatitude: Double?
    var returnLongitude: Double?
    var rentalCompany: String = ""
    var confirmationNumber: String = ""
    var hasCarRental: Bool = true

    init(
        pickupDate: Date,
        returnDate: Date,
        pickupLocation: String,
        returnLocation: String,
        rentalCompany: String = "",
        hasCarRental: Bool = true
    ) {
        self.pickupDate = pickupDate
        self.returnDate = returnDate
        self.pickupLocationName = pickupLocation
        self.returnLocationName = returnLocation
        self.rentalCompany = rentalCompany
        self.hasCarRental = hasCarRental
        super.init(
            title: hasCarRental ? "Car Rental - \(rentalCompany)" : "No Car Rental",
            startDate: pickupDate,
            endDate: returnDate,
            locationName: pickupLocation
        )
    }

    required init() {
        super.init(title: "Car Rental", startDate: Date(), endDate: Date())
    }

    override var eventIcon: String { "car.fill" }
    override var eventColor: String { "green" }
    override var eventTypeName: String { "Car Rental" }
}
