import React from 'react';
import type { Language } from '../types';
import { translations } from '../translations';
import {Phone, MapPin} from 'lucide-react'

import { Link } from 'react-router-dom';

interface FooterProps {
  lang: Language;

}

export const Footer: React.FC<FooterProps> = ({
  lang,

}) => {
  const t = translations[lang];
  const isRTL = lang === 'ar';

  return (
    <footer
      dir={isRTL ? 'rtl' : 'ltr'}
      className="mt-12 border-t border-gray-100 bg-white px-6 py-12"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 md:grid-cols-3">

        <div>
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

        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gray-900">
            {t.footer.footerContactTitle}
          </h4>

          <ul className="space-y-3 text-sm text-gray-600">

            <li className="flex items-center gap-2 transition-colors duration-200 hover:text-gray-900">
                <MapPin className="h-4 w-4 shrink-0 text-(--color-accent)" />
                <span>{t.footer.address}</span>
            </li>

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

        <div>
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-gray-900">
            {t.footer.legalTitle}
          </h4>

          <ul className="space-y-3 text-sm text-gray-600">

            <li>
              <Link to="/privacy" className="cursor-pointer transition-all duration-200 hover:text-(--color-accent)">
                {t.footer.privacyPolicy}
              </Link>
            </li>

            <li>
              <Link to="/terms" className="cursor-pointer transition-all duration-200 hover:text-(--color-accent)">
                {t.footer.terms}
              </Link>
            </li>

          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1600px] border-t border-gray-100 pt-5 text-center text-xs text-gray-400">
        <p>{t.footer.footerRights}</p>
      </div>
    </footer>
  );
};
