import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case serverError(statusCode: Int)
    case noFlightFound
    case decodingError(Error)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .serverError(let code):
            return "Server error (HTTP \(code))"
        case .noFlightFound:
            return "No flight found for the given flight number and date"
        case .decodingError(let error):
            return "Failed to parse response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}
