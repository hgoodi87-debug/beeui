
declare global {
    interface Window {
        grecaptcha: any;
    }
}

const RECAPTCHA_SITE_KEY = '6Lf59FMsAAAAAO-qcqBdXcn_CDR8A7jP6wud0RWP';

export const RecaptchaService = {
    execute: async (action: string = 'submit'): Promise<string | null> => {
        try {
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
