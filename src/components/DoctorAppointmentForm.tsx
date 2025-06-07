import React, { useState } from "react";

export default function DoctorAppointmentForm() {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [date, setDate] = useState("");

  const today = new Date().toISOString().split("T")[0];

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
    setPhoneError(value.length === 10 ? "" : "Phone must be exactly 10 digits");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) {
      setPhoneError("Phone must be exactly 10 digits");
      return;
    }
    alert("Appointment submitted!");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 p-4 border rounded shadow">
      <div>
        <label className="block font-medium mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={10}
          className="w-full border rounded px-3 py-2"
          placeholder="Enter 10-digit phone"
          required
        />
        {phoneError && <span className="text-red-600">{phoneError}</span>}
      </div>
      <div>
        <label className="block font-medium mb-1">Preferred Date</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={e => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Book Appointment
      </button>
    </form>
  );
}
