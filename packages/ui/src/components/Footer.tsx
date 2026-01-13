import { useState } from "react";
import { LogoIcon } from "./Icons";
import { TermsModal } from "./TermsModal";

export const Footer = () => {
  const [openTerms, setOpenTerms] = useState(false);

  return (
    <>
      <footer id="footer">
        <hr className="w-11/12 mx-auto" />

        <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <a rel="noreferrer noopener" href="/" className="font-bold text-xl flex">
              <LogoIcon />
              <span className="text-primary">Growth Help</span>
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Follow Us</h3>
            <a className="opacity-60 hover:opacity-100" href="#">Instagram</a>
            <a className="opacity-60 hover:opacity-100" href="#">Twitter</a>
            <a className="opacity-60 hover:opacity-100" href="#">Telegram</a>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">About</h3>
            <a className="opacity-60 hover:opacity-100" href="#">Features</a>
            <a className="opacity-60 hover:opacity-100" href="#">FAQ</a>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Contact</h3>
            <a className="opacity-60 hover:opacity-100">
              Email:<span className="text-primary pl-1">growthhelp.in@gmail.com</span>
            </a>
            <a className="opacity-60 hover:opacity-100">Address</a>
            <button
              onClick={() => setOpenTerms(true)}
              className="opacity-60 hover:opacity-100 text-left"
            >
              Terms & Conditions
            </button>
          </div>
        </section>

        <section className="container pb-14 text-center">
          <h3>Growth Help &copy; 2025 — All Rights Reserved.</h3>
        </section>
      </footer>

      <TermsModal open={openTerms} onClose={() => setOpenTerms(false)} />
    </>
  );
};
