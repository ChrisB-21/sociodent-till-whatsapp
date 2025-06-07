export default function About() {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">About Us</h1>
        <p>
          {/* Your about us content here */}
          Welcome to SocioDent, redefining oral health care through innovation.
        </p>
  
        {/* Contact Us Section */}
        <section id="contact-us" className="mt-12 p-6 bg-gray-50 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            Email:{" "}
            <a href="mailto:someone@example.com" className="text-blue-600 underline">
              someone@example.com
            </a>
          </p>
          <p>
            Phone:{" "}
            <a href="tel:+911234567890" className="text-blue-600 underline">
              +91 1234567890
            </a>
          </p>
        </section>
      </div>
    );
  }
  