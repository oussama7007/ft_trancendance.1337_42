import React from 'react';
import type { Language } from '../types';
import { translations } from '../translations';
import {Phone, MapPin} from 'lucide-react'

interface FooterProps {
  lang: Language;
  setActivePage?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  setActivePage,
}) => {
  const t = translations[lang];
  const isRTL = lang === 'ar';

  return (
    <footer
      dir={isRTL ? 'rtl' : 'ltr'}
      className="mt-12 border-t border-gray-100 bg-white px-6 py-12"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-4">

        {/*DESCRIPTION*/}
        <div className="col-span-1 md:col-span-2">
          <h3 className="mb-2 text-xl font-black tracking-wide text-gray-900">
            i
            <span className="text-(--color-accent) transition-colors duration-300 hover:text-gray-900">
              Rent
            </span>
            .ma
          </h3>

          <p className="mb-4 max-w-sm text-sm leading-relaxed text-gray-500">
            {t.footer.footerDesc}
          </p>

          <a
            href="mailto:support@irent.ma"
            className="text-sm font-bold text-(--color-accent) transition-colors duration-300 hover:text-gray-900"
          >
            support@irent.ma
          </a>
        </div>

        {/*ABOUT*/}
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gray-900">
            {t.footer.footerAboutTitle}
          </h4>

          <ul className="space-y-3 text-sm text-gray-600">

            {/* Support */}
            <li>
              <button
                type="button"
                onClick={() => setActivePage?.('support')}
                className="cursor-pointer transition-all duration-200 hover:translate-x-1 hover:text-(--color-accent)"
              >
                {t.footer.support}
              </button>
            </li>

            {/* Terms */}
            <li>
              <button
                type="button"
                onClick={() => setActivePage?.('terms')}
                className="cursor-pointer transition-all duration-200 hover:translate-x-1 hover:text-(--color-accent)"
              >
                {t.footer.terms}
              </button>
            </li>

          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gray-900">
            {t.footer.footerContactTitle}
          </h4>

          <ul className="space-y-3 text-sm text-gray-600">

            {/* Location */}
            <li className="flex items-center gap-2 transition-colors duration-200 hover:text-gray-900">
                <MapPin className="h-4 w-4 shrink-0 text-(--color-accent)" />
                <span>Khouribga, Morocco</span>
            </li>

            {/* Phone */}
            <li>
                <a
                    href="tel:+212600000000"
                    className="flex items-center gap-2 transition-colors duration-200 hover:text-(--color-accent)"
                >
                    <Phone className="h-4 w-4 shrink-0 text-(--color-accent)" />
                    <span>+212 600-000000</span>
                </a>
            </li>

          </ul>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between border-t border-gray-100 pt-5 text-xs text-gray-400 sm:flex-row">

        {/* Copyright */}
        <p>
          {t.footer.footerRights}
        </p>

        {/* Legal links */}
        <div className="mt-4 flex items-center gap-2.5 sm:mt-0">

          {/* Privacy Policy */}
          <button
            type="button"
            onClick={() => setActivePage?.('privacy')}
            className="cursor-pointer transition-colors duration-200 hover:text-(--color-accent)"
          >
            {t.footer.privacyPolicy}
          </button>

          {/* Terms of Use */}
          <button
            type="button"
            onClick={() => setActivePage?.('terms')}
            className="cursor-pointer transition-colors duration-200 hover:text-(--color-accent)"
          >
            {t.footer.termsOfUse}
          </button>

          {/* Security */}
          <button
            type="button"
            onClick={() => setActivePage?.('security')}
            className="cursor-pointer transition-colors duration-200 hover:text-(--color-accent)"
          >
            {t.footer.security}
          </button>

        </div>
      </div>
    </footer>
  );
};