import { NavLink } from "react-router-dom";

export default function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted/70 data-[active=true]:bg-muted focus-visible:outline-none focus-visible:shadow-focus",
          isActive ? "data-[active=true]" : ""
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}
