import { RecipeViewData } from "src/shared/website-data";
import { WebpageDocument } from "./document";

/**
 * Mounts the interactive recipe card (from the `obsidian-recipe-view` browser
 * bundle exposed as `window.renderRecipeCard`) on recipe notes, replacing the
 * plain rendered markdown with the card.
 *
 * Each exported recipe page carries a `data-recipe` attribute on its
 * `.obsidian-document` plus an embedded JSON payload (`#recipe-payload`) holding
 * the pre-rendered markdown HTML, the frontmatter and the file name. The recipe
 * settings are read from the site metadata, which captures the `recipe-view`
 * plugin's own data.json at export time.
 */
export function initRecipeView() {
	let teardown: (() => void) | undefined;

	ObsidianSite.onDocumentLoad((doc: WebpageDocument) => {
		// Destroy any previously mounted card (and its wrapper node) on every
		// navigation, BEFORE the data-recipe check. Without this, navigating
		// recipe -> non-recipe would leave the stale recipe card mounted over
		// the plain page.
		if (teardown) {
			try {
				teardown();
			} catch (e) {
				console.error("Failed to tear down previous recipe card", e);
			}
			teardown = undefined;
		}

		if (doc.documentEl?.getAttribute("data-recipe") != "true") return;

		if (typeof window.renderRecipeCard != "function") {
			console.error("Recipe page loaded but window.renderRecipeCard is unavailable. Is the recipe-view browser bundle missing?");
			return;
		}

		const payloadEl = doc.documentEl.querySelector("#recipe-payload");
		if (!payloadEl) return;

		let payload: {
			html: string;
			frontmatter: Record<string, unknown>;
			fileName: string;
		};
		try {
			payload = JSON.parse(payloadEl.textContent ?? "") as typeof payload;
		} catch (e) {
			console.error("Failed to parse recipe payload", e);
			return;
		}

		if (!payload?.html) return;

		const settings: RecipeViewData = ObsidianSite.metadata.recipeView;
		const settingsObj = {
			sideColumnRegex: settings.sideColumnRegex,
			treatH1AsFilename: settings.treatH1AsFilename,
			renderUnicodeFractions: settings.renderUnicodeFractions,
			singleColumnMaxWidth: settings.singleColumnMaxWidth,
			showBulletsTwoColumn: settings.showBulletsTwoColumn,
		};

		// hide the plain markdown document so only the card is shown
		const scrollRoot = doc.documentEl;
		if (!scrollRoot) return;

		// The `.obsidian-document` owns the page's vertical scrolling
		// (`overflow-y:auto`) and fills `#center-content` (`height:100%`). When
		// we hide it, we lose that scrollable, full-height container. Mount the
		// card into a wrapper that reproduces those metrics so the card's own
		// columns can scroll instead.
		scrollRoot.style.setProperty("display", "none", "important");
		const wrapper = document.createElement("div");
		wrapper.className = "recipe-view-card";
		wrapper.style.cssText =
			"display:flex;flex-direction:column;align-items:center;" +
			"width:100%;height:100%;overflow-y:auto;overflow-x:hidden;" +
			"flex-basis:100%;max-width:100%";
		scrollRoot.before(wrapper);

		const cardTeardown = window.renderRecipeCard({
			target: wrapper,
			html: payload.html,
			fileName: payload.fileName,
			frontmatter: payload.frontmatter,
			settings: settingsObj,
		});

		teardown = () => {
			if (cardTeardown) {
				try {
					cardTeardown();
				} catch (e) {
					console.error("Failed to tear down recipe card internals", e);
				}
			}
			wrapper.remove();
		};
	});
}