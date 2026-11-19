import React from 'react';
import type { Language } from '../../types';
import type { TopListing } from '../../types/analytics';

interface TopListingsTableProps {
    items: TopListing[];
    title: string;
    listingLabel: string;
    cityLabel: string;
    viewsLabel: string;
    emptyLabel: string;
    lang: Language;
}

export const TopListingsTable: React.FC<TopListingsTableProps> = ({
    items,
    title,
    listingLabel,
    cityLabel,
    viewsLabel,
    emptyLabel,
    lang,
}) => {
    // the bar of each row is relative to the most viewed listing
    const maxViews = Math.max(...items.map((item) => item.views), 1);

    return (
        <div className="rounded-2xl border border-gray-200/65 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black text-gray-900">{title}</h2>

            {items.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold text-gray-500">{emptyLabel}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500">
                                <th className="pb-3 pe-4 text-start font-bold">{listingLabel}</th>
                                <th className="pb-3 pe-4 text-start font-bold">{cityLabel}</th>
                                <th className="pb-3 text-end font-bold">{viewsLabel}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t border-gray-100">
                                    <td className="py-3 pe-4 font-bold text-gray-800">{item.title[lang]}</td>
                                    <td className="py-3 pe-4 text-gray-500">{item.city[lang]}</td>
                                    <td className="py-3">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 sm:block">
                                                <div
                                                    className="h-full rounded-full bg-(--color-accent)"
                                                    style={{ width: `${(item.views / maxViews) * 100}%` }}
                                                />
                                            </div>
                                            <span className="font-black tabular-nums text-gray-900">
                                                {item.views.toLocaleString('en-US')}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
