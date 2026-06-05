import Cocoa
import Vision
import ApplicationServices

struct TextMatch: Encodable {
  let text: String
  let x: Double
  let y: Double
  let width: Double
  let height: Double
}

func attr(_ element: AXUIElement, _ name: String) -> AnyObject? {
  var value: CFTypeRef?
  let error = AXUIElementCopyAttributeValue(element, name as CFString, &value)
  guard error == .success else { return nil }
  return value
}

func stringValue(_ any: AnyObject?) -> String {
  (any as? String) ?? ""
}

func children(_ element: AXUIElement) -> [AXUIElement] {
  (attr(element, kAXChildrenAttribute) as? [AXUIElement]) ?? []
}

func walk(_ element: AXUIElement, visit: (AXUIElement) -> Bool) -> AXUIElement? {
  if visit(element) {
    return element
  }

  for child in children(element) {
    if let found = walk(child, visit: visit) {
      return found
    }
  }

  return nil
}

func parsePid(_ raw: String) -> pid_t {
  guard let pid = Int32(raw) else {
    fputs("invalid pid: \(raw)\n", stderr)
    exit(2)
  }
  return pid
}

func parseDouble(_ raw: String) -> Double {
  guard let value = Double(raw) else {
    fputs("invalid number: \(raw)\n", stderr)
    exit(2)
  }
  return value
}

func focusApp(pid: pid_t) {
  guard let app = NSRunningApplication(processIdentifier: pid) else {
    fputs("app not found for pid \(pid)\n", stderr)
    exit(3)
  }

  app.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
}

func performPress(pid: pid_t, query: String, mode: String) {
  let app = AXUIElementCreateApplication(pid)
  let queries = query
    .split(separator: "|")
    .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
    .filter { !$0.isEmpty }

  let windows = (attr(app, kAXWindowsAttribute) as? [AXUIElement]) ?? []
  let appChildren = (attr(app, kAXChildrenAttribute) as? [AXUIElement]) ?? []
  let roots = windows + appChildren

  func matches(_ candidate: AXUIElement) -> Bool {
    let title = stringValue(attr(candidate, kAXTitleAttribute))
    let desc = stringValue(attr(candidate, kAXDescriptionAttribute))
    let value = stringValue(attr(candidate, kAXValueAttribute))

    for item in queries {
      switch mode {
      case "description":
        if desc == item || desc.contains(item) || item.contains(desc) {
          return true
        }
      case "text":
        if title == item || desc == item || value == item {
          return true
        }
        if title.contains(item) || desc.contains(item) || value.contains(item) {
          return true
        }
        if item.contains(title) || item.contains(desc) || item.contains(value) {
          return true
        }
      default:
        break
      }
    }

    return false
  }

  for root in roots {
    if let element = walk(root, visit: matches) {
      let error = AXUIElementPerformAction(element, kAXPressAction as CFString)
      if error != .success {
        fputs("press failed: \(error.rawValue)\n", stderr)
        exit(4)
      }
      return
    }
  }

  fputs("element not found for query: \(query)\n", stderr)
  exit(5)
}

func mouseAction(kind: String, x: Double, y: Double) {
  let point = CGPoint(x: x, y: y)

  switch kind {
  case "move":
    let event = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left)
    event?.post(tap: .cghidEventTap)
  case "left-click":
    let move = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left)
    move?.post(tap: .cghidEventTap)
    usleep(120_000)
    let down = CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left)
    down?.post(tap: .cghidEventTap)
    usleep(80_000)
    let up = CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left)
    up?.post(tap: .cghidEventTap)
  case "right-click":
    let move = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .right)
    move?.post(tap: .cghidEventTap)
    usleep(120_000)
    let down = CGEvent(mouseEventSource: nil, mouseType: .rightMouseDown, mouseCursorPosition: point, mouseButton: .right)
    down?.post(tap: .cghidEventTap)
    usleep(80_000)
    let up = CGEvent(mouseEventSource: nil, mouseType: .rightMouseUp, mouseCursorPosition: point, mouseButton: .right)
    up?.post(tap: .cghidEventTap)
  default:
    fputs("unsupported mouse action: \(kind)\n", stderr)
    exit(6)
  }
}

func keyCode(for name: String) -> CGKeyCode {
  switch name.lowercased() {
  case "down":
    return 125
  case "right":
    return 124
  case "enter":
    return 36
  case "escape":
    return 53
  default:
    fputs("unsupported key: \(name)\n", stderr)
    exit(11)
  }
}

func keyAction(name: String) {
  let code = keyCode(for: name)
  let down = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: true)
  down?.post(tap: .cghidEventTap)
  usleep(60_000)
  let up = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: false)
  up?.post(tap: .cghidEventTap)
}

func ocrMatches(imagePath: String, query: String) {
  let queries = query
    .split(separator: "|")
    .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
    .filter { !$0.isEmpty }

  let url = URL(fileURLWithPath: imagePath)
  guard let image = NSImage(contentsOf: url) else {
    fputs("failed to load image: \(imagePath)\n", stderr)
    exit(7)
  }

  guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let cgImage = bitmap.cgImage
  else {
    fputs("failed to decode image: \(imagePath)\n", stderr)
    exit(8)
  }

  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.usesLanguageCorrection = false
  request.recognitionLanguages = ["zh-Hans", "en-US"]

  let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

  do {
    try handler.perform([request])
  } catch {
    fputs("vision failed: \(error.localizedDescription)\n", stderr)
    exit(9)
  }

  let scale = NSScreen.main?.backingScaleFactor ?? 1.0
  let imageWidth = Double(cgImage.width)
  let imageHeight = Double(cgImage.height)
  let results = (request.results ?? []).compactMap { observation -> TextMatch? in
    guard let candidate = observation.topCandidates(1).first else {
      return nil
    }

    let text = candidate.string
    guard queries.contains(where: { text.contains($0) || $0.contains(text) }) else {
      return nil
    }

    let box = observation.boundingBox
    let centerX = ((box.origin.x + (box.size.width / 2.0)) * imageWidth) / scale
    let centerY = ((1.0 - box.origin.y - (box.size.height / 2.0)) * imageHeight) / scale
    let width = (box.size.width * imageWidth) / scale
    let height = (box.size.height * imageHeight) / scale

    return TextMatch(
      text: text,
      x: centerX,
      y: centerY,
      width: width,
      height: height
    )
  }

  let encoder = JSONEncoder()
  guard let data = try? encoder.encode(results) else {
    fputs("failed to encode ocr results\n", stderr)
    exit(10)
  }

  print(String(decoding: data, as: UTF8.self))
}

let args = CommandLine.arguments
guard args.count >= 2 else {
  fputs("missing command\n", stderr)
  exit(1)
}

switch args[1] {
case "focus-app":
  guard args.count >= 3 else {
    fputs("usage: focus-app <pid>\n", stderr)
    exit(1)
  }
  focusApp(pid: parsePid(args[2]))
case "press-by-description":
  guard args.count >= 4 else {
    fputs("usage: press-by-description <pid> <query>\n", stderr)
    exit(1)
  }
  performPress(pid: parsePid(args[2]), query: args[3], mode: "description")
case "press-by-text":
  guard args.count >= 4 else {
    fputs("usage: press-by-text <pid> <query>\n", stderr)
    exit(1)
  }
  performPress(pid: parsePid(args[2]), query: args[3], mode: "text")
case "mouse":
  guard args.count >= 5 else {
    fputs("usage: mouse <move|left-click|right-click> <x> <y>\n", stderr)
    exit(1)
  }
  mouseAction(kind: args[2], x: parseDouble(args[3]), y: parseDouble(args[4]))
case "ocr":
  guard args.count >= 4 else {
    fputs("usage: ocr <imagePath> <query>\n", stderr)
    exit(1)
  }
  ocrMatches(imagePath: args[2], query: args[3])
case "key":
  guard args.count >= 3 else {
    fputs("usage: key <down|right|enter|escape>\n", stderr)
    exit(1)
  }
  keyAction(name: args[2])
default:
  fputs("unknown command: \(args[1])\n", stderr)
  exit(1)
}
