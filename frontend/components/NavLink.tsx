"use client";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    Pick<LinkProps, "href"> {
  className?: string;
  activeClassName?: string;
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, end, ...props }, ref) => {
    const pathname = usePathname();
    const target = typeof href === "string" ? href : href.pathname || "";
    const isActive = end ? pathname === target : pathname.startsWith(target);
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
