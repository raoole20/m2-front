"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Transition,
  type Variants,
} from "motion/react";

import type { NavLink } from "../../../lib/content";
import { Logo } from "./Logo";

type NavShellProps = {
  homeHref: string;
  otherLangHref: string;
  otherLangLabel: string;
  loginHref: string;
  loginLabel: string;
  ctaHref: string;
  ctaLabel: string;
  links: NavLink[];
};

const headerVariants: Variants = {
  top: { top: 0, left: 0, right: 0, translateX: "0%", width: "100%" },
  scrolled: { top: 14, left: "50%", right: "auto", translateX: "-50%", width: "auto" },
};

const shellVariants: Variants = {
  top: {
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 0,
    backgroundColor: "rgba(11, 15, 26, 0)",
    backdropFilter: "blur(0px) saturate(100%)",
    borderColor: "rgba(255, 255, 255, 0)",
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
    gap: 40,
  },
  scrolled: {
    paddingLeft: 18,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 999,
    backgroundColor: "rgba(11, 15, 26, 0.72)",
    backdropFilter: "blur(22px) saturate(180%)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    boxShadow:
      "0 10px 40px -10px rgba(0,0,0,0.55), 0 2px 10px -4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
    gap: 24,
  },
};

const springTransition: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.9,
  borderRadius: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  backdropFilter: { duration: 0.3, ease: "easeOut" },
  backgroundColor: { duration: 0.3, ease: "easeOut" },
  boxShadow: { duration: 0.4, ease: "easeOut" },
};

const instantTransition: Transition = { duration: 0 };

export function NavShell(props: NavShellProps) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!scrolled && latest > 48) setScrolled(true);
    else if (scrolled && latest < 24) setScrolled(false);
  });

  const transition = reduce ? instantTransition : springTransition;
  const state = scrolled ? "scrolled" : "top";

  return (
    <>
      <motion.header
        className="nav-root"
        data-scrolled={scrolled}
        initial={false}
        animate={state}
        variants={headerVariants}
        transition={transition}
      >
        <motion.div
          className="nav-shell"
          data-state={state}
          variants={shellVariants}
          transition={transition}
        >
          <Link className="logo" aria-label="M2" href={props.homeHref}>
            <Logo height={28} />
          </Link>
          <nav className="nav-links">
            {props.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="nav-right">
            <Link className="nav-lang" href={props.otherLangHref}>
              {props.otherLangLabel}
            </Link>
            <Link className="nav-login" href={props.loginHref}>
              {props.loginLabel}
            </Link>
            <Link className="btn btn-primary" href={props.ctaHref}>
              {props.ctaLabel}
              <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </motion.header>
      <div className="nav-spacer" aria-hidden />
    </>
  );
}
