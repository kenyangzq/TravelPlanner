import SwiftUI

/// A DatePicker that snaps to 15-minute intervals for better UX
/// Shows compact time display by default, expands to full picker on tap
struct MinuteIntervalDatePicker: View {
    let title: String
    @Binding var date: Date
    @State private var isExpanded = false

    var body: some View {
        Button {
            withAnimation {
                isExpanded.toggle()
            }
        } label: {
            HStack {
                Text(title)
                Spacer()
                if isExpanded {
                    DatePickerWrapper(
                        date: $date
                    )
                    .labelsHidden()
                    .frame(width: 200)
                } else {
                    Text(formattedDate)
                        .foregroundStyle(.secondary)
                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

/// A DatePicker that snaps to 15-minute intervals for better UX (with range support)
/// Shows compact time display by default, expands to full picker on tap
struct MinuteIntervalDatePickerRange: View {
    let title: String
    @Binding var date: Date
    var bounds: ClosedRange<Date>
    @State private var isExpanded = false

    var body: some View {
        Button {
            withAnimation {
                isExpanded.toggle()
            }
        } label: {
            HStack {
                Text(title)
                Spacer()
                if isExpanded {
                    DatePickerWrapper(
                        date: $date,
                        range: bounds
                    )
                    .labelsHidden()
                    .frame(width: 200)
                } else {
                    Text(formattedDate)
                        .foregroundStyle(.secondary)
                    Image(systemName: "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

/// UIViewRepresentable wrapper for UIDatePicker with 15-minute interval
private struct DatePickerWrapper: UIViewRepresentable {
    @Binding var date: Date
    var range: ClosedRange<Date>? = nil

    func makeUIView(context: Context) -> UIDatePicker {
        let picker = UIDatePicker()
        picker.datePickerMode = .dateAndTime
        picker.minuteInterval = 15  // Snap to 15-minute intervals
        picker.preferredDatePickerStyle = .wheels
        picker.sizeToFit()
        picker.addTarget(
            context.coordinator,
            action: #selector(Coordinator.dateChanged(_:)),
            for: .valueChanged
        )
        return picker
    }

    func updateUIView(_ uiView: UIDatePicker, context: Context) {
        uiView.date = date
        if let range = range {
            uiView.minimumDate = range.lowerBound
            uiView.maximumDate = range.upperBound
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(date: $date)
    }

    class Coordinator: NSObject {
        @Binding var date: Date

        init(date: Binding<Date>) {
            self._date = date
        }

        @objc func dateChanged(_ sender: UIDatePicker) {
            self.date = sender.date
        }
    }
}
