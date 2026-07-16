/**
 * MetadataUtils.ts
 * Utility module for dynamically updating document meta-tags, canonical URLs,
 * and JSON-LD structured data to optimize indexing by B2B search engines and AI crawlers.
 */

export interface MetadataOptions {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  lang?: 'ar' | 'en' | 'de';
  image?: string;
  type?: 'website' | 'article' | 'software';
}

const DEFAULT_DESCRIPTION = "Enterprise-grade AI-powered content automation platform for engineering leaders and developers. Transform GitHub repositories, source files, and development milestones into high-impact LinkedIn content.";
const DEFAULT_KEYWORDS = "LinkedIn Automation, B2B Content Creation, Developer Advocacy, GitHub Content Engine, Professional Brand Automation, AI Code Summarizer";
const APP_BASE_URL = "https://ais-pre-rezh6fuwx34odyux6epmmf-435808307626.europe-west2.run.app";

/**
 * Updates primary document metadata, OpenGraph, Twitter card tags, and canonical link
 */
export function updatePageMetadata(options: MetadataOptions = {}) {
  const {
    title = "LinkedIn Authority Engine | Professional B2B Content Automation",
    description = DEFAULT_DESCRIPTION,
    keywords = DEFAULT_KEYWORDS,
    path = "",
    lang = "en",
    image = "/assets/logo.png",
    type = "website"
  } = options;

  // 1. Update HTML tag attributes
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // 2. Update Title
  document.title = title;

  // 3. Helper to set meta content
  const setMetaValue = (nameOrProperty: string, value: string, isProperty = false) => {
    const attribute = isProperty ? 'property' : 'name';
    let element = document.querySelector(`meta[${attribute}="${nameOrProperty}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, nameOrProperty);
      document.head.appendChild(element);
    }
    element.setAttribute('content', value);
  };

  // 4. Update basic metadata tags
  setMetaValue('description', description);
  setMetaValue('keywords', keywords);
  setMetaValue('author', 'Obada Dallo');

  // 5. Update OpenGraph tags
  const canonicalUrl = `${APP_BASE_URL}${path}`;
  setMetaValue('og:title', title, true);
  setMetaValue('og:description', description, true);
  setMetaValue('og:type', type, true);
  setMetaValue('og:url', canonicalUrl, true);
  setMetaValue('og:image', image.startsWith('http') ? image : `${APP_BASE_URL}${image}`, true);
  setMetaValue('og:site_name', 'LinkedIn Authority Engine', true);

  // 6. Update Twitter Card tags
  setMetaValue('twitter:card', 'summary_large_image');
  setMetaValue('twitter:title', title);
  setMetaValue('twitter:description', description);
  setMetaValue('twitter:image', image.startsWith('http') ? image : `${APP_BASE_URL}${image}`);

  // 7. Update Canonical URL Link Tag
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);
}

/**
 * Injects or updates a JSON-LD structured data script block
 */
export function injectJSONLD(schema: object) {
  let scriptElement = document.getElementById('jsonld-structured-data') as HTMLScriptElement;
  if (!scriptElement) {
    scriptElement = document.createElement('script');
    scriptElement.id = 'jsonld-structured-data';
    scriptElement.type = 'application/ld+json';
    document.head.appendChild(scriptElement);
  }
  scriptElement.textContent = JSON.stringify(schema, null, 2);
}

/**
 * Standard templates for generating structured data schemas
 */
export const SchemaTemplates = {
  getSoftwareApplicationSchema: (lang: 'ar' | 'en' | 'de' = 'en') => {
    const desc = lang === 'ar' 
      ? 'منصة أتمتة محتوى مهنية للشركات والمطورين لتحويل مستودعات GitHub إلى منشورات LinkedIn رائدة.'
      : lang === 'de'
      ? 'Eine professionelle B2B-Content-Automatisierungsplattform für Entwickler und Unternehmen zur Umwandlung von GitHub-Repositories in LinkedIn-Beiträge.'
      : 'An enterprise B2B content automation system designed to help engineering organizations and developers transform their GitHub repositories into professional, authoritative LinkedIn posts.';

    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "LinkedIn Authority Engine",
      "operatingSystem": "All",
      "applicationCategory": "BusinessApplication",
      "screenshot": `${APP_BASE_URL}/assets/logo.png`,
      "softwareVersion": "1.0.0",
      "description": desc,
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD",
        "category": "Beta / Free Tier"
      },
      "author": {
        "@type": "Person",
        "name": "Obada Dallo",
        "jobTitle": "Full-Stack Developer & AI Architect"
      }
    };
  },

  getFAQSchema: (lang: 'ar' | 'en' | 'de' = 'en') => {
    const arQuestions = [
      { q: "هل تقومون بتخزين الكود الخاص بي؟", a: "لا، نحن لا نقوم بتخزين أي شفرة مصدرية على خوادمنا. المعالجة تتم بشكل لحظي فقط لتوليد مسودات المنشورات المهنية." },
      { q: "هل يمكنني حذف بياناتي؟", a: "نعم، يمكنك مسح كافة بياناتك ومنشوراتك وارتباطات حسابك بشكل نهائي من خلال خيار 'حذف الحساب' في صفحة الإعدادات، استجابةً للائحة العامة لحماية البيانات (GDPR)." },
      { q: "كيف يتم النشر على حسابي في LinkedIn؟", a: "نستخدم منصة LinkedIn API الرسمية باستخدام رموز وصول آمنة (OAuth) ولا نحتفظ ببيانات تسجيل الدخول الخاصة بك مطلقاً." }
    ];

    const deQuestions = [
      { q: "Speichern Sie meinen Code?", a: "Nein, wir speichern keinen Quellcode auf unseren Servern. Die Verarbeitung erfolgt rein flüchtig im RAM zur Inhaltserstellung." },
      { q: "Kann ich meine Daten löschen?", a: "Ja, Sie können alle Ihre Daten, Beiträge und Kontoverknüpfungen dauerhaft über die Option 'Konto löschen' in den Einstellungen löschen (DSGVO-konform)." },
      { q: "Wie funktioniert das Posten auf LinkedIn?", a: "Wir nutzen die offizielle LinkedIn-API über sichere OAuth-Verbindungen. Ihre persönlichen Anmeldedaten werden niemals gespeichert." }
    ];

    const enQuestions = [
      { q: "Do you store my code?", a: "No, we do not store any source code on our servers. Processing is strictly transient and runs inside ephemeral memory enclaves." },
      { q: "Can I delete my data?", a: "Yes, you can permanently erase all your data, posts, and connected API tokens via the 'Delete Account' option in Settings (fully GDPR compliant)." },
      { q: "How does LinkedIn publishing work?", a: "We use the official LinkedIn API through secure OAuth credentials. Your actual account passwords are never accessed or stored." }
    ];

    const selectedList = lang === 'ar' ? arQuestions : lang === 'de' ? deQuestions : enQuestions;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": selectedList.map(item => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    };
  }
};
