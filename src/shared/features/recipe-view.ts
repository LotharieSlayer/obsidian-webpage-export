import { FeatureOptions } from "./feature-options-base";

/**
 * Options for the Recipe View integration. When enabled, markdown notes whose
 * frontmatter tags match the `recipe-view` plugin's configured tag are exported
 * so that the interactive recipe card (from the `obsidian-recipe-view` plugin)
 * is rendered instead of the plain markdown document.
 *
 * The recipe *tag* is intentionally not configured here - it is read from the
 * `recipe-view` plugin's own `data.json` at export time, so the two stay in sync.
 * If that field is empty, every exported markdown page is treated as a recipe.
 */
export class RecipeViewOptions extends FeatureOptions
{
	constructor()
	{
		super();
		this.featureId = "recipe-view";
		this.enabled = false;
	}
}