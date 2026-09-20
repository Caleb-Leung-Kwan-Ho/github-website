import { createDesktop } from '../../desktop/windows.js';
import { createNavigation } from '../../desktop/navigation.js';
import { setupWindowMenus } from '../../desktop/menus.js';
import { createPortfolioSite } from '../../sites/portfolio/site.js';
import { createHobbiesSite } from '../../sites/hobbies/site.js';

// The first site is the desktop's default destination. Each site owns its content behavior.
var sites = [createPortfolioSite(), createHobbiesSite()];
var desktop = createDesktop(sites);
var navigation = createNavigation(sites, desktop);

sites.forEach(function (site) {
	if (site.initialize) { site.initialize(navigation, desktop); }
});
setupWindowMenus(sites, desktop, navigation);
desktop.setActiveWindow(sites[0].element);
navigation.start();

function finishLoading() {
	window.setTimeout(function () { document.body.classList.remove('is-preload'); }, 100);
}
if (document.readyState === 'complete') {
	finishLoading();
} else {
	window.addEventListener('load', finishLoading);
}
