import {Home, List, Users} from 'lucide-react';

type SearchTab = 'home' | 'roommate' | 'list';

interface SearchTabsProps {
    activeTab: SearchTab;
    onChange: (tab: SearchTab) => void;

    isLoggedIn: boolean;
    
    onNavigate: (page: string) => void;
    labels:{
        home: string;
        roommate: string;
        list: string;
    };
}

export const  SearchTabs = ({
    activeTab,
    onChange,
    // isLoggedIn,
    // onNavigate,
    labels,
}: SearchTabsProps) => {
    const tabs = [{
        id : 'home' as const,
        label: labels.home,
        icon: Home,
    },
    {
        id : 'roommate' as const,
        label: labels.roommate,
        icon: Users,
    },
    {
        id : 'list' as const,
        label: labels.list,
        icon: List,
    }
];

    return (
        <div className='flex gap-1.5 px-2'>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button key={tab.id} onClick={() => onChange(tab.id)} className={
                        `px-4 py-2.5 rounded-t-xl text-xs font-black transition-all duration-300 hover:scale-102
                        hover:-translate-y-0.5 cursor-pointer flex flex-[0.5] items-center gap-2 
                        ${isActive ? 'bg-white text-gray-900 shadow-sm border-x border-gray-200/60' : 
                            'bg-white/40 text-gray-500 hover:text-gray-900 hover:bg-amber-300'
                        }
                        ` }
                    >
                    <Icon size={16} className='text-sky-500' />
                    {tab.label}
                    </button>
                );
            })}

            {/* <button onClick={() => {
                if (!isLoggedIn){
                    onNavigate('signin');
                }else{
                    onNavigate('profile');
                }    
            } 
            } className='px-4 py-2.5 rounded-t-xl text-xs font-black bg-white/40 text-gray-900 hover:bg-white/60 
            transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2
            '>
                <List size={16} />
                {labels.list}
            </button> */}
        </div>
    );
};