import React, {useState, useEffect, useRef} from "react";
import { Menu, X, ChevronDown, Globe, UserCircle } from 'lucide-react';

import type {Language, User} from '../types';
import {translations} from '../translations';


interface NavbarProps {
    activePage: string;
    setActivePage: (page: string) => void;

    lang: Language;
    setLang: (lang: Language) => void;

    currentUser: User | null;
    handleLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    activePage,
    setActivePage,
    lang,
    setLang,
    currentUser,
    handleLogout,
}) => {
    const t = translations[lang];

    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


    const languageRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    // close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (languageRef.current && !languageRef.current.contains(target))
            {
                setIsLanguageOpen(false);
            }

            if (userRef.current && !userRef.current.contains(target))
                 {
                setIsUserOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, []);

    // navigation
    const goToPage = (page: string) => {
        setActivePage(page);
        setIsMobileMenuOpen(false);
        setIsUserOpen(false);
    }

    // user initial
    const getUserInitial = () => {
        if (!currentUser){
            return '?';
        }

        return currentUser.fullName.charAt(0).toUpperCase();
    }

    // nav items
    const navItems = [
        {
            id: 'home',
            label: t.navbar.home,
        },
        {
            id: 'listings',
            label: t.navbar.listings,
        },
        {
            id: 'chat',
            label: t.navbar.chat,
        },
        {
            id: 'profile',
            label: t.navbar.profile,
        },
    ];

    // nav langs
    const languages: {
        code: Language;
        label: string;
    } [] = [
        {
            code: 'en',
            label: 'EN',
        },
        {
            code: 'fr',
            label: 'FR',
        },
        {
            code: 'ar',
            label: 'AR',
        },

    ];

    const handleLanguageChange = (newLang: Language) => {
        setLang(newLang);
        setIsLanguageOpen(false);
    }

    // render 
    return(
        <nav dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md"
        >
            <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 md:px-8">
                {/*Logo*/}
                <button type="button" onClick={ () => goToPage('home')} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--color-accent) shadow-md">
                        <span className="text-lg font-black text-white">iR</span>
                    </div>
                    <div className="hidden text-left sm:block">
                        <div className="text-xl font-black tracking-tight text-(--color-primary)">
                            iRent
                        </div>

                        <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-(--color-accent)">
                            {t.navbar.brandSubtitle}
                        </div>
                    </div>
                </button>

                {/*Desktop navgation resp*/}

                <div className="hidden items-center gap-2 md:flex">
                    {navItems.map((item) => (
                        <button key={item.id} type="button"
                            onClick={() => goToPage (item.id)}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200
                                        ${activePage === item.id ? 'bg-(--color-accent) text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-(--color-accent)'
                                        }
                                    `}
                        >
                            {item.label}

                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {/*dropDwon lang*/}
                    <div ref={languageRef} className="relative hidden md:block">
                        <button type="button" onClick={() => setIsLanguageOpen((prev) => !prev)} 
                            aria-label={t.navbar.language}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
                            >
                            <Globe size={18}/>
                            <span>
                                {lang.toUpperCase()}
                            </span>

                            <ChevronDown size={15} className={`transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {isLanguageOpen && (
                            <div className="absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-xl" >
                                {languages.map((language) => (
                                    <button key={language.code} type="button"
                                        onClick={()=> handleLanguageChange(language.code)}
                                        className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-bold transition
                                            ${
                                                lang === language.code 
                                                ? 'bg-(--color-accent) text-white' : 'text-gray-600 hover:bg-gray-100'
                                            }
                                            `}
                                        >
                                            {language.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/*Log out*/}
                    {!currentUser && (
                        <div className="hidden items-center gap-2 md:flex">
                            <button type="button" onClick={() => goToPage('signin')} 
                                className="rounded-xl px-4 py-2.5 text-sm font-bold text-(--color-accent) transition hover:bg-gray-100">
                                {t.navbar.signIn}
                            </button>

                            <button type="button" onClick={() => goToPage('signup')}
                                className="rounded-xl bg-(--color-accent) px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90">
                                {t.navbar.signUp}
                            </button>
                        </div>
                    )}


                    {/*log in*/}
                    {currentUser && (
                    <div ref={userRef} className="relative hidden md:block">
                        <button type="button" onClick={() => setIsUserOpen ((prev) => !prev)}
                            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-gray-100">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-primary) text-sm font-black text-white">
                                {getUserInitial()}
                            </div>

                            <span className="max-w-28 truncate text-sm font-bold text-gray-700">
                                {currentUser?.fullName}
                            </span>

                            <ChevronDown size={15} className={`transition-transform ${isUserOpen ? 'rotate-180' : ''}`} />

                        </button>

                        {isUserOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-xl">
                                <button type="button" onClick={() => goToPage('profile')} 
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100">
                                    <UserCircle size={18}/>
                                    {t.navbar.profile}
                                </button>

                                <button type="button" onClick={handleLogout}
                                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-red-500 transition hover:bg-red-50">
                                    {t.navbar.logout}
                                </button>
                            </div>
                        )}
                    </div>
                    )}

                    {/*mobile menu button*/}
                    <button type="button" onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        aria-label={isMobileMenuOpen ? t.navbar.closeMenu : t.navbar.menu}
                        className="rounded-xl p-2.5 text-(--color-accent) transition hover:bg-gray-100 md:hidden">
                        {isMobileMenuOpen ? (<X size={24}/>) : (<Menu size={24}/>)}
                    </button>
                </div>
            </div>

            {/*Mobile menu resp*/}
            {isMobileMenuOpen && (
                <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => goToPage(item.id)}
                            className={`
                                rounded-xl px-4 py-2.5 text-sm font-bold
                                transition
                                ${
                                    activePage === item.id
                                        ? 'bg-(--color-accent) text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    ))}
                    <div className="my-2 h-px bg-gray-100" />
                    {/*mobile lang*/}
                    <div className="flex items-center gap-2">
                        {languages.map((language) => (
                            <button key={language.code} type="button" onClick={() => handleLanguageChange(language.code)}
                                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold
                                    ${lang === language.code ? 'bg-(--color-accent) text-white' : 'bg-gray-100 text-gray-600'} 
                                `}
                            >
                                {language.label}
                            </button>
                        ))}
                    </div>

                    {/*mobile auth*/}
                    {!currentUser && (
                        <div className="mt-2 flex flex-col gap-2">
                            <button type="button" onClick={() => goToPage('signin')} 
                                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-(--color-primary)">
                                    {t.navbar.signIn}
                            </button>

                            <button type="button" onClick={() => goToPage('signup')} 
                                className="rounded-xl bg-(--color-accent) px-4 py-3 text-sm font-bold text-white">
                                    {t.navbar.signUp}
                            </button>
                        </div>
                    )}

                    {/*mobile logged in*/}
                    {currentUser && (
                        <div className="mt-2">
                            <button type="button" onClick={() => goToPage('profile')}
                                className="w-full rounded-xl px-4 py-3 text-start text-sm font-bold text-gray-700 hover:bg-gray-100">
                                {t.navbar.profile}
                            </button>

                            <button type="button" onClick={() => {
                                                                    handleLogout(); 
                                                                    setIsMobileMenuOpen(false);
                                                        }}
                                className="w-full rounded-xl px-4 py-3 text-start text-sm font-bold text-red-500 hover:bg-red-50">
                                {t.navbar.logout}
                            </button>

                        </div>
                    )}

                </div>

                </div>
            )}

        </nav>
    )
}


