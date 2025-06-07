export default function ContactDetails() {
    return (
      <div className="space-y-2 max-w-md mx-auto p-4 border rounded shadow">
        <div>
          Email:{" "}
          <a href="mailto:someone@example.com" className="text-blue-600 underline">
            someone@example.com
          </a>
        </div>
        <div>
          Phone:{" "}
          <a href="tel:+911234567890" className="text-blue-600 underline">
            +91 1234567890
          </a>
        </div>
      </div>
    );
  }
  