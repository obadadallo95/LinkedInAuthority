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

const DEFAULT_DESCRIPTION = "Evidence-backed drafting workspace for engineering leaders and developers. Turn meaningful GitHub work into editable LinkedIn drafts for human review and manual copying.";
const DEFAULT_KEYWORDS = "Evidence-backed drafts, B2B technical content, Developer Advocacy, GitHub project intelligence, Professional brand writing, AI code analysis";
const APP_BASE_URL = "https://ais-pre-rezh6fuwx34odyux6epmmf-435808307626.europe-west2.run.app";

/**
 * Updates primary document metadata, OpenGraph, Twitter card tags, and canonical link
 */
export function updatePageMetadata(options: MetadataOptions = {}) {
  const {
    title = "LinkedIn Authority Engine | Evidence-backed technical drafts",
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
      ? 'مساحة عمل مهنية للمطورين لتحويل أعمال GitHub المهمة إلى مسودات LinkedIn موثقة قابلة للمراجعة والنسخ اليدوي.'
      : lang === 'de'
      ? 'Ein evidenzbasierter Arbeitsbereich für Entwickler, der wichtige GitHub-Arbeit in bearbeitbare LinkedIn-Entwürfe zur manuellen Prüfung umwandelt.'
      : 'An evidence-backed drafting workspace that helps engineering organizations and developers turn meaningful GitHub work into editable LinkedIn drafts for human review.';

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
      { q: "هل تقومون بتخزين الكود الخاص بي؟", a: "قد تُحفظ مقتطفات محدودة من الملفات المختارة ومراجع الأدلة داخل snapshots؛ النسخة التجريبية لا تضمن احتفاظًا صفريًا." },
      { q: "هل يمكنني حذف بياناتي؟", a: "يوفر الإصدار التجريبي مسار حذف تكرارياً لبيانات Firebase وحساب المصادقة؛ يلزم التحقق من المشروع المنشور ومراجعة الاحتفاظ قبل تقديم ادعاء تنظيمي بالمحو الكامل." },
      { q: "كيف يتم النشر على حسابي في LinkedIn؟", a: "النشر المباشر على LinkedIn غير مطبق في النسخة التجريبية الحالية. يتم حفظ المحتوى كمسودة للمراجعة والنسخ اليدوي." }
    ];

    const deQuestions = [
      { q: "Speichern Sie meinen Code?", a: "Begrenzte Ausschnitte ausgewählter Evidenzdateien und abgeleiteter Kontext können in Repository-Snapshots gespeichert werden; diese Beta verspricht keine Null-Aufbewahrung." },
      { q: "Kann ich meine Daten löschen?", a: "Die Beta bietet einen rekursiven Löschvorgang für Firebase-Daten und das Auth-Konto; eine Prüfung der bereitgestellten Umgebung und der Aufbewahrung ist vor regulatorischen Aussagen erforderlich." },
      { q: "Wie funktioniert das Posten auf LinkedIn?", a: "Direktes LinkedIn-Posting ist in der aktuellen Beta nicht implementiert. Inhalte werden zur manuellen Prüfung und zum Kopieren als Entwurf gespeichert." }
    ];

    const enQuestions = [
      { q: "Do you store my code?", a: "Bounded snippets from selected evidence files may be stored in repository snapshots; this beta does not promise zero retention." },
      { q: "Can I delete my data?", a: "The beta provides a recursive deletion flow for Firebase data and the Auth account; deployed-project verification and retention review are still required before making a regulatory erasure claim." },
      { q: "How does LinkedIn publishing work?", a: "Direct LinkedIn publishing is not implemented in the current beta. Generated content is saved as a draft for manual review and copying." }
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
