import type { Language } from '../types';

export interface LegalSection {
    heading: string;
    paragraphs: string[];
}

export interface LegalDocument {
    title: string;
    updated: string;
    intro: string;
    sections: LegalSection[];
}

export type LegalKind = 'privacy' | 'terms';

export const legalContent: Record<Language, Record<LegalKind, LegalDocument>> = {
    en: {
        privacy: {
            title: 'Privacy Policy',
            updated: 'Last updated: 1 November 2026',
            intro:
                'iRent is a platform that helps people find and publish housing for rent in Morocco. This policy explains which personal data we collect, why we collect it, and the choices you have.',
            sections: [
                {
                    heading: 'Data we collect',
                    paragraphs: [
                        'Account data: first name, last name, date of birth, gender, an optional national ID number (CIN) and your contact (email or phone number).',
                        'Password: we never store your password. We only store a salted hash (bcrypt) that cannot be reversed.',
                        'Listing data: the title, description, city, district, price, number of bedrooms, photo link and the name you enter when you publish a listing. Listings are public.',
                        'Technical data: your language choice is stored in your browser (localStorage). We do not use advertising or analytics cookies.',
                    ],
                },
                {
                    heading: 'How we use your data',
                    paragraphs: [
                        'To create and secure your account, and to verify your contact with a one-time code that expires after 5 minutes.',
                        'To publish your listings and let other users search and view them.',
                        'We do not sell your personal data.',
                    ],
                },
                {
                    heading: 'Location and maps',
                    paragraphs: [
                        'If you allow it, your browser shares your approximate position so we can suggest the nearest city and center the map. The position stays in your browser and is not stored on our servers; only the resulting city name may be used as a search filter.',
                        'The map is provided by Google Maps. Loading it sends your IP address and browser information to Google, under Google\'s own privacy policy.',
                    ],
                },
                {
                    heading: 'Who can see your data',
                    paragraphs: [
                        'Listings are visible to all visitors, together with the name you entered. Your contact details, date of birth and national ID are never shown publicly.',
                        'We share data with service providers only when it is needed to run the service (for example Google Maps) or when the law requires it.',
                    ],
                },
                {
                    heading: 'How long we keep it',
                    paragraphs: [
                        'Account data is kept until you ask us to delete your account. Listings are kept until you remove them.',
                        'Verification codes expire after 5 minutes and are cleared once your contact is verified. Temporary registration data is removed when your account is created.',
                    ],
                },
                {
                    heading: 'Security',
                    paragraphs: [
                        'Passwords are hashed with bcrypt and the database is only reachable by the application. No system is perfectly secure, so please choose a strong and unique password.',
                    ],
                },
                {
                    heading: 'Your rights',
                    paragraphs: [
                        'You can ask to access, correct or delete your personal data, or object to its processing, in line with Moroccan law 09-08 on the protection of personal data.',
                        'Write to support@irent.ma and we will answer within a reasonable time.',
                    ],
                },
                {
                    heading: 'Changes and contact',
                    paragraphs: [
                        'We may update this policy. The date at the top shows the latest version.',
                        'Questions: support@irent.ma.',
                    ],
                },
            ],
        },
        terms: {
            title: 'Terms of Service',
            updated: 'Last updated: 1 November 2026',
            intro:
                'By using iRent you agree to these terms. If you do not agree, please do not use the service.',
            sections: [
                {
                    heading: 'The service',
                    paragraphs: [
                        'iRent lets owners publish housing listings and lets visitors browse them. iRent is not a party to any rental agreement and does not guarantee that a listing is available, accurate or lawful.',
                    ],
                },
                {
                    heading: 'Your account',
                    paragraphs: [
                        'You must give accurate information, be at least 18 years old to publish listings, and keep your password secret. You are responsible for everything that happens under your account.',
                    ],
                },
                {
                    heading: 'Listings and content',
                    paragraphs: [
                        'You are responsible for the content you publish. Listings must be truthful, describe a real property that you have the right to rent, and must not be illegal, misleading, discriminatory or offensive.',
                        'You give iRent a non-exclusive licence to display your content on the service.',
                    ],
                },
                {
                    heading: 'Prohibited use',
                    paragraphs: [
                        'Do not try to access other accounts, disrupt the service, collect data from it at high volume, upload malicious content, or use it for fraud.',
                    ],
                },
                {
                    heading: 'Visits and payments',
                    paragraphs: [
                        'Visits, contracts and payments take place between users, outside iRent. We recommend never paying before visiting the property and always signing a written contract.',
                    ],
                },
                {
                    heading: 'Intellectual property',
                    paragraphs: [
                        'The iRent name, logo and software belong to the iRent team. The listings you publish remain yours.',
                    ],
                },
                {
                    heading: 'Liability',
                    paragraphs: [
                        'The service is provided "as is". To the extent allowed by law, iRent is not liable for losses resulting from listings, meetings or agreements between users.',
                    ],
                },
                {
                    heading: 'Suspension and termination',
                    paragraphs: [
                        'We may remove content or suspend accounts that break these terms. You may stop using the service and ask us to delete your account at any time.',
                    ],
                },
                {
                    heading: 'Changes, law and contact',
                    paragraphs: [
                        'We may update these terms; continuing to use the service means you accept the new version. These terms are governed by Moroccan law.',
                        'Contact: support@irent.ma.',
                    ],
                },
            ],
        },
    },

    fr: {
        privacy: {
            title: 'Politique de confidentialité',
            updated: 'Dernière mise à jour : 1er novembre 2026',
            intro:
                "iRent est une plateforme qui aide à trouver et à publier des logements à louer au Maroc. Cette politique explique quelles données personnelles nous collectons, pourquoi, et quels choix vous avez.",
            sections: [
                {
                    heading: 'Données collectées',
                    paragraphs: [
                        "Données du compte : prénom, nom, date de naissance, sexe, numéro de CIN (facultatif) et votre contact (e-mail ou numéro de téléphone).",
                        "Mot de passe : nous ne le conservons jamais. Nous stockons uniquement une empreinte salée (bcrypt) impossible à inverser.",
                        "Données des annonces : titre, description, ville, quartier, prix, nombre de chambres, lien de la photo et nom saisi lors de la publication. Les annonces sont publiques.",
                        "Données techniques : votre choix de langue est enregistré dans votre navigateur (localStorage). Nous n'utilisons ni cookies publicitaires ni cookies d'analyse.",
                    ],
                },
                {
                    heading: 'Utilisation des données',
                    paragraphs: [
                        "Pour créer et sécuriser votre compte, et vérifier votre contact avec un code à usage unique qui expire après 5 minutes.",
                        "Pour publier vos annonces et permettre aux autres utilisateurs de les rechercher et de les consulter.",
                        "Nous ne vendons pas vos données personnelles.",
                    ],
                },
                {
                    heading: 'Localisation et cartes',
                    paragraphs: [
                        "Si vous l'autorisez, votre navigateur partage votre position approximative afin de proposer la ville la plus proche et de centrer la carte. La position reste dans votre navigateur et n'est pas stockée sur nos serveurs ; seul le nom de la ville obtenue peut servir de filtre de recherche.",
                        "La carte est fournie par Google Maps. Son chargement transmet votre adresse IP et des informations sur votre navigateur à Google, selon la politique de confidentialité de Google.",
                    ],
                },
                {
                    heading: 'Qui peut voir vos données',
                    paragraphs: [
                        "Les annonces sont visibles par tous les visiteurs, avec le nom que vous avez saisi. Vos coordonnées, votre date de naissance et votre CIN ne sont jamais affichés publiquement.",
                        "Nous partageons des données avec des prestataires uniquement lorsque c'est nécessaire au fonctionnement du service (par exemple Google Maps) ou lorsque la loi l'exige.",
                    ],
                },
                {
                    heading: 'Durée de conservation',
                    paragraphs: [
                        "Les données du compte sont conservées jusqu'à ce que vous demandiez la suppression de votre compte. Les annonces sont conservées jusqu'à ce que vous les supprimiez.",
                        "Les codes de vérification expirent après 5 minutes et sont effacés une fois votre contact vérifié. Les données temporaires d'inscription sont supprimées à la création du compte.",
                    ],
                },
                {
                    heading: 'Sécurité',
                    paragraphs: [
                        "Les mots de passe sont hachés avec bcrypt et la base de données n'est accessible que par l'application. Aucun système n'est parfaitement sûr : choisissez un mot de passe fort et unique.",
                    ],
                },
                {
                    heading: 'Vos droits',
                    paragraphs: [
                        "Vous pouvez demander l'accès, la rectification ou la suppression de vos données personnelles, ou vous opposer à leur traitement, conformément à la loi marocaine 09-08 relative à la protection des données personnelles.",
                        "Écrivez à support@irent.ma et nous répondrons dans un délai raisonnable.",
                    ],
                },
                {
                    heading: 'Modifications et contact',
                    paragraphs: [
                        "Nous pouvons mettre à jour cette politique. La date en haut indique la version la plus récente.",
                        "Questions : support@irent.ma.",
                    ],
                },
            ],
        },
        terms: {
            title: "Conditions d'utilisation",
            updated: 'Dernière mise à jour : 1er novembre 2026',
            intro:
                "En utilisant iRent, vous acceptez ces conditions. Si vous ne les acceptez pas, veuillez ne pas utiliser le service.",
            sections: [
                {
                    heading: 'Le service',
                    paragraphs: [
                        "iRent permet aux propriétaires de publier des annonces de logement et aux visiteurs de les consulter. iRent n'est partie à aucun contrat de location et ne garantit pas qu'une annonce soit disponible, exacte ou légale.",
                    ],
                },
                {
                    heading: 'Votre compte',
                    paragraphs: [
                        "Vous devez fournir des informations exactes, avoir au moins 18 ans pour publier des annonces et garder votre mot de passe secret. Vous êtes responsable de tout ce qui se passe avec votre compte.",
                    ],
                },
                {
                    heading: 'Annonces et contenu',
                    paragraphs: [
                        "Vous êtes responsable du contenu que vous publiez. Les annonces doivent être sincères, décrire un bien réel que vous avez le droit de louer, et ne doivent pas être illégales, trompeuses, discriminatoires ou offensantes.",
                        "Vous accordez à iRent une licence non exclusive pour afficher votre contenu sur le service.",
                    ],
                },
                {
                    heading: 'Usages interdits',
                    paragraphs: [
                        "N'essayez pas d'accéder à d'autres comptes, de perturber le service, d'en collecter les données en grand volume, de téléverser du contenu malveillant ou de l'utiliser pour une fraude.",
                    ],
                },
                {
                    heading: 'Visites et paiements',
                    paragraphs: [
                        "Les visites, contrats et paiements ont lieu entre utilisateurs, en dehors d'iRent. Nous recommandons de ne jamais payer avant d'avoir visité le bien et de toujours signer un contrat écrit.",
                    ],
                },
                {
                    heading: 'Propriété intellectuelle',
                    paragraphs: [
                        "Le nom iRent, le logo et le logiciel appartiennent à l'équipe iRent. Les annonces que vous publiez restent les vôtres.",
                    ],
                },
                {
                    heading: 'Responsabilité',
                    paragraphs: [
                        "Le service est fourni « tel quel ». Dans la mesure permise par la loi, iRent n'est pas responsable des pertes résultant des annonces, des rencontres ou des accords entre utilisateurs.",
                    ],
                },
                {
                    heading: 'Suspension et résiliation',
                    paragraphs: [
                        "Nous pouvons supprimer du contenu ou suspendre les comptes qui enfreignent ces conditions. Vous pouvez cesser d'utiliser le service et demander la suppression de votre compte à tout moment.",
                    ],
                },
                {
                    heading: 'Modifications, droit applicable et contact',
                    paragraphs: [
                        "Nous pouvons mettre à jour ces conditions ; continuer à utiliser le service signifie que vous acceptez la nouvelle version. Ces conditions sont régies par le droit marocain.",
                        "Contact : support@irent.ma.",
                    ],
                },
            ],
        },
    },

    ar: {
        privacy: {
            title: 'سياسة الخصوصية',
            updated: 'آخر تحديث: 1 نونبر 2026',
            intro:
                'iRent منصة تساعد الناس على إيجاد وعرض سكن للكراء في المغرب. توضح هذه السياسة البيانات الشخصية التي نجمعها، ولماذا نجمعها، والخيارات المتاحة لك.',
            sections: [
                {
                    heading: 'البيانات التي نجمعها',
                    paragraphs: [
                        'بيانات الحساب: الاسم الشخصي والعائلي، وتاريخ الازدياد، والجنس، ورقم البطاقة الوطنية (CIN) اختياريا، ووسيلة التواصل (البريد الإلكتروني أو رقم الهاتف).',
                        'كلمة المرور: لا نحتفظ بها أبدا. نخزن فقط بصمة مشفرة بملح (bcrypt) لا يمكن عكسها.',
                        'بيانات العروض: العنوان والوصف والمدينة والحي والثمن وعدد الغرف ورابط الصورة والاسم الذي تدخله عند نشر العرض. العروض عمومية.',
                        'بيانات تقنية: يُحفظ اختيارك للغة في متصفحك (localStorage). لا نستعمل ملفات تعريف الارتباط الإعلانية أو التحليلية.',
                    ],
                },
                {
                    heading: 'كيف نستعمل بياناتك',
                    paragraphs: [
                        'لإنشاء حسابك وتأمينه، وللتحقق من وسيلة تواصلك برمز لمرة واحدة ينتهي بعد 5 دقائق.',
                        'لنشر عروضك وتمكين المستخدمين الآخرين من البحث عنها وعرضها.',
                        'لا نبيع بياناتك الشخصية.',
                    ],
                },
                {
                    heading: 'الموقع والخرائط',
                    paragraphs: [
                        'إذا سمحت بذلك، يشارك متصفحك موقعك التقريبي لنقترح أقرب مدينة ونوسّط الخريطة. يبقى الموقع في متصفحك ولا يُخزَّن في خوادمنا؛ وقد يُستعمل اسم المدينة الناتج فقط كمرشح للبحث.',
                        'الخريطة مقدمة من Google Maps. يؤدي تحميلها إلى إرسال عنوان IP ومعلومات المتصفح إلى Google وفق سياسة الخصوصية الخاصة بها.',
                    ],
                },
                {
                    heading: 'من يمكنه رؤية بياناتك',
                    paragraphs: [
                        'العروض ظاهرة لجميع الزوار، مع الاسم الذي أدخلته. لا تُعرض بيانات تواصلك وتاريخ ازديادك ورقم بطاقتك الوطنية علنا أبدا.',
                        'نشارك البيانات مع مزودي الخدمات فقط عند الضرورة لتشغيل الخدمة (مثل Google Maps) أو عندما يفرض القانون ذلك.',
                    ],
                },
                {
                    heading: 'مدة الاحتفاظ بالبيانات',
                    paragraphs: [
                        'تُحفظ بيانات الحساب إلى أن تطلب حذف حسابك. وتُحفظ العروض إلى أن تحذفها.',
                        'تنتهي صلاحية رموز التحقق بعد 5 دقائق وتُمسح بعد التحقق من وسيلة تواصلك. وتُحذف بيانات التسجيل المؤقتة عند إنشاء الحساب.',
                    ],
                },
                {
                    heading: 'الأمان',
                    paragraphs: [
                        'تُشفَّر كلمات المرور بخوارزمية bcrypt، ولا يمكن الوصول إلى قاعدة البيانات إلا من التطبيق. لا يوجد نظام آمن بالكامل، لذا اختر كلمة مرور قوية وفريدة.',
                    ],
                },
                {
                    heading: 'حقوقك',
                    paragraphs: [
                        'يمكنك طلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها، أو الاعتراض على معالجتها، وفق القانون المغربي 09-08 المتعلق بحماية المعطيات الشخصية.',
                        'راسلنا على support@irent.ma وسنجيبك في أجل معقول.',
                    ],
                },
                {
                    heading: 'التعديلات والتواصل',
                    paragraphs: [
                        'قد نحدّث هذه السياسة. يبيّن التاريخ في الأعلى أحدث نسخة.',
                        'للاستفسار: support@irent.ma.',
                    ],
                },
            ],
        },
        terms: {
            title: 'شروط الاستخدام',
            updated: 'آخر تحديث: 1 نونبر 2026',
            intro:
                'باستعمالك iRent فإنك توافق على هذه الشروط. إذا كنت لا توافق عليها، فيرجى عدم استعمال الخدمة.',
            sections: [
                {
                    heading: 'الخدمة',
                    paragraphs: [
                        'تتيح iRent للمالكين نشر عروض السكن وللزوار تصفحها. iRent ليست طرفا في أي عقد كراء ولا تضمن أن العرض متاح أو صحيح أو قانوني.',
                    ],
                },
                {
                    heading: 'حسابك',
                    paragraphs: [
                        'عليك تقديم معلومات صحيحة، وأن يكون عمرك 18 سنة على الأقل لنشر العروض، وأن تحافظ على سرية كلمة مرورك. أنت مسؤول عن كل ما يحدث عبر حسابك.',
                    ],
                },
                {
                    heading: 'العروض والمحتوى',
                    paragraphs: [
                        'أنت مسؤول عن المحتوى الذي تنشره. يجب أن تكون العروض صادقة، وتصف عقارا حقيقيا لك الحق في كرائه، وألا تكون غير قانونية أو مضللة أو تمييزية أو مسيئة.',
                        'تمنح iRent رخصة غير حصرية لعرض محتواك على الخدمة.',
                    ],
                },
                {
                    heading: 'الاستعمال الممنوع',
                    paragraphs: [
                        'لا تحاول الدخول إلى حسابات الآخرين، أو تعطيل الخدمة، أو جمع بياناتها بكميات كبيرة، أو رفع محتوى خبيث، أو استعمالها في الاحتيال.',
                    ],
                },
                {
                    heading: 'الزيارات والأداء',
                    paragraphs: [
                        'تتم الزيارات والعقود والأداءات بين المستخدمين خارج iRent. ننصح بعدم الدفع قبل زيارة العقار وبتوقيع عقد مكتوب دائما.',
                    ],
                },
                {
                    heading: 'الملكية الفكرية',
                    paragraphs: [
                        'اسم iRent والشعار والبرمجيات ملك لفريق iRent. أما العروض التي تنشرها فتبقى ملكا لك.',
                    ],
                },
                {
                    heading: 'المسؤولية',
                    paragraphs: [
                        'تُقدَّم الخدمة "كما هي". وبالقدر الذي يسمح به القانون، لا تتحمل iRent مسؤولية الخسائر الناتجة عن العروض أو اللقاءات أو الاتفاقات بين المستخدمين.',
                    ],
                },
                {
                    heading: 'الإيقاف والإنهاء',
                    paragraphs: [
                        'يجوز لنا حذف المحتوى أو إيقاف الحسابات المخالفة لهذه الشروط. ويمكنك التوقف عن استعمال الخدمة وطلب حذف حسابك في أي وقت.',
                    ],
                },
                {
                    heading: 'التعديلات والقانون المطبق والتواصل',
                    paragraphs: [
                        'قد نحدّث هذه الشروط؛ ومتابعة استعمال الخدمة تعني قبولك النسخة الجديدة. تخضع هذه الشروط للقانون المغربي.',
                        'للتواصل: support@irent.ma.',
                    ],
                },
            ],
        },
    },
};
