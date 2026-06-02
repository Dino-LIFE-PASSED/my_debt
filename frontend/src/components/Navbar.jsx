import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-title">
        💸 Debt Tracker
      </Link>
    </nav>
  );
}

export default Navbar;
