import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-title">
        <img src="/logo.png" alt="logo" style={{ height: "32px", borderRadius: "8px" }} />
      </Link>
    </nav>
  );
}

export default Navbar;
