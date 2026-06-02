// ===== components/DateInput.jsx =====
// Date picker component ใช้แทน <input type="date"> ทุกที่

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function DateInput({ value, onChange, placeholder = "Select date" }) {
  // แปลง string "2026-06-01" → Date object (ที่ react-datepicker ต้องการ)
  const selected = value ? new Date(value + "T00:00:00") : null;

  function handleChange(date) {
    if (!date) { onChange(""); return; }
    // แปลง Date object → string "YYYY-MM-DD" กลับไปเก็บใน form
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, "0");
    const dd   = String(date.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
  }

  return (
    <ReactDatePicker
      selected={selected}
      onChange={handleChange}
      dateFormat="dd MMM yyyy"       // แสดงเป็น "02 Jun 2026"
      placeholderText={placeholder}
      showMonthDropdown              // dropdown เลือกเดือน
      showYearDropdown               // dropdown เลือกปี
      dropdownMode="select"          // ใช้ <select> แทน scroll
      yearDropdownItemNumber={10}
      className="date-input"
      wrapperClassName="date-input-wrapper"
      autoComplete="off"
    />
  );
}

export default DateInput;
