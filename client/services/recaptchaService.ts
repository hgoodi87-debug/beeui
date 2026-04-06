
declare global {
    interface Window {
        grecaptcha: any;
    }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

let loadPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
    if (loadPromise) return loadPromise;
    if (window.grecaptcha?.enterprise) return Promise.resolve();

    loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            loadPromise = null;
            reject(new Error('Failed to load reCAPTCHA'));
        };
        document.head.appendChild(script);
    });

    return loadPromise;
}

export const RecaptchaService = {
    execute: async (action: string = 'submit'): Promise<string | null> => {
        try {
            await loadRecaptchaScript();

            if (!window.grecaptcha || !window.grecaptcha.enterprise) {
                console.warn('reCAPTCHA Enterprise not loaded yet');
                return null;
            }

            return new Promise((resolve) => {
                window.grecaptcha.enterprise.ready(async () => {
                    try {
                        const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
                        resolve(token);
                    } catch (e) {
                        console.error('reCAPTCHA execution error:', e);
                        resolve(null);
                    }
                });
            });
        } catch (error) {
            console.error('reCAPTCHA Service Error:', error);
            return null;
        }
    }
};
