/**
 * Sets up redirects for dat:// urls to be proxied.
 */
import { addDatSite, datSites } from './sites';
import { showDatSecureIcon } from './page-action';

const datUrlMatcher = /^[0-9a-f]{64}(\+[0-9]+)?$/;

function init() {
    /*
    * Listen for requests to a fake redirect host (dat.localhost), and redirect to a url which will be
    * proxied to the dat-gateway.
    */
    browser.webRequest.onBeforeRequest.addListener((details) => {
        // replace url encoded dat:// prefix
        const datUrl = decodeURIComponent(details.url.replace('http://dat.localhost/?dat%3A%2F%2F', ''));
        const hostOrAddress = datUrl.split('/')[0];

        // if its a plain dat url, just do the redirect
        if (datUrlMatcher.test(hostOrAddress)) {
            return {
                redirectUrl: `http://${datUrl}`,
            };
        }
        // otherwise, we need to add this hostname to the list of dat sites
        // TODO this will trigger a race condition
        addDatSite(hostOrAddress);
        return {
            redirectUrl: `http://${datUrl}`,
        };
    }, {
        urls: ['http://dat.localhost/*'],
    }, ['blocking']);


    // change dat:// urls to http:// in html documents because protocol handlers do not work on
    // third-party calls
    browser.webRequest.onHeadersReceived.addListener((details) => {
        const host = details.url.split('/')[2];

        if (datSites.has(host) || datUrlMatcher.test(host)) {
            const filter = browser.webRequest.filterResponseData(details.requestId);
            const decoder = new TextDecoder('utf-8');
            const encoder = new TextEncoder();
            filter.ondata = event => {
                const content = decoder.decode(event.data, { stream: true });
                filter.write(encoder.encode(content.replace(/dat:\/\//g, 'http://')));
            };
            // trigger page_action for dat pages
            setTimeout(() => {
                showDatSecureIcon(details.tabId);
            }, 200);
        }
    }, {
        urls: ['http://*/*'],
        types: ['main_frame', 'sub_frame']
    }, ['blocking']);
}

export default {
    init,
};
