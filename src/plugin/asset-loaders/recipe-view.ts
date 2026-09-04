import { Settings } from "src/plugin/settings/settings";
import { AssetLoader } from "./base-asset.js";
import { AssetType, InlinePolicy, LoadMethod, Mutability } from "./asset-types.js";
import { AssetHandler } from "./asset-handler.js";

/**
 * Loads the browser bundle and settings of the `obsidian-recipe-view` plugin so
 * that exported recipe notes can be rendered as the interactive `RecipeCard`.
 *
 * The browser bundle is a self contained IIFE that exposes `window.renderRecipeCard`
 * and carries the recipe card's scoped styles (they are injected by the bundle), so
 * no separate stylesheet is required.
 *
 * The plugin's own `data.json` is read so the export matches how the recipes render
 * in Obsidian (the tag that marks a note as a recipe, the side column regex, etc.).
 * The parsed settings are exposed through {@link RecipeView.settings} and copied into
 * the exported `WebsiteData` so the browser can supply them when rendering the card.
 */
export class RecipeView extends AssetLoader
{
	/**
	 * The settings read from the `recipe-view` plugin's `data.json`, or defaults.
	 */
	public static settings: {
		enabled: boolean;
		sideColumnRegex: string;
		treatH1AsFilename: boolean;
		renderUnicodeFractions: boolean;
		singleColumnMaxWidth: number;
		showBulletsTwoColumn: boolean;
		tag: string;
	} = {
		enabled: false,
		sideColumnRegex: "Ingrédients|Équipement",
		treatH1AsFilename: false,
		renderUnicodeFractions: true,
		singleColumnMaxWidth: 600,
		showBulletsTwoColumn: false,
		tag: "",
	};

	constructor()
	{
		super("recipe-view.js", "", null, AssetType.Script, InlinePolicy.InlineHead, false, Mutability.Dynamic, LoadMethod.Defer, 0);
	}

	override async load()
	{
		const dataPath = AssetHandler.vaultPluginsPath.joinString("recipe-view", "data.json");
		if (dataPath.exists)
		{
			const data = await dataPath.readAsString();
			if (data && typeof data == "string")
			{
				try
				{
					const parsed = JSON.parse(data);
					RecipeView.settings = Object.assign({}, RecipeView.settings, {
						sideColumnRegex: parsed.sideColumnRegex ?? RecipeView.settings.sideColumnRegex,
						treatH1AsFilename: parsed.treatH1AsFilename ?? RecipeView.settings.treatH1AsFilename,
						renderUnicodeFractions: parsed.renderUnicodeFractions ?? RecipeView.settings.renderUnicodeFractions,
						singleColumnMaxWidth: parsed.singleColumnMaxWidth ?? RecipeView.settings.singleColumnMaxWidth,
						showBulletsTwoColumn: parsed.showBulletsTwoColumn ?? RecipeView.settings.showBulletsTwoColumn,
						tag: parsed.tag ?? RecipeView.settings.tag,
					});
				}
				catch (e)
				{
					console.log("WARNING: Unable to parse recipe-view data.json", e);
				}
			}
		}

		RecipeView.settings.enabled = Settings.exportOptions.recipeViewOptions.enabled;

		if (!RecipeView.settings.enabled)
		{
			this.data = "";
			return;
		}

		const path = AssetHandler.vaultPluginsPath.joinString("recipe-view", "browser.js");
		this.data = path.exists ? (await path.readAsString()) ?? "" : "";
		if (!this.data) console.log("WARNING: Unable to load recipe-view browser.js. Recipe view will not render.");
	}
}