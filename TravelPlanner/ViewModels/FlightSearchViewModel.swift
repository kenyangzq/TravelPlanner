import Foundation

@Observable
final class FlightSearchViewModel {
    var flightNumber: String = ""
    var flightDate: Date = Date()
    var isLoading = false
    var errorMessage: String?
    var fetchedSuccessfully = false

    private let flightService = FlightAPIService()

    func searchFlight(for event: FlightEvent) async {
        guard !flightNumber.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Please enter a flight number"
            return
        }

        isLoading = true
        errorMessage = nil
        fetchedSuccessfully = false

        do {
            let response = try await flightService.fetchFlightInfo(
                flightNumber: flightNumber,
                date: flightDate
            )
            await MainActor.run {
                flightService.populateFlightEvent(event, from: response)
                self.fetchedSuccessfully = true
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func reset() {
        flightNumber = ""
        flightDate = Date()
        isLoading = false
        errorMessage = nil
        fetchedSuccessfully = false
    }
}
