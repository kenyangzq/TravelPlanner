import SwiftUI

struct ActivityEventRow: View {
    let activity: ActivityEvent

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "star.fill")
                .font(.title2)
                .foregroundStyle(.orange)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(activity.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Spacer()
                }

                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.caption2)
                    Text(activity.startDate.displayDateTime)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if !activity.activityLocationName.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin")
                            .font(.caption2)
                        Text(activity.activityLocationName)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                if !activity.activityDescription.isEmpty {
                    Text(activity.activityDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                if let lat = activity.activityLatitude, let lng = activity.activityLongitude {
                    MapLinkButton(
                        label: activity.activityLocationName.isEmpty ? "Location" : activity.activityLocationName,
                        lat: lat, lng: lng
                    )
                }
            }
        }
        .padding(.vertical, 4)
    }
}
