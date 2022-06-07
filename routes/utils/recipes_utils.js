const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const MySql = require("../utils/MySql");
const DButils = require("../utils/DButils");
const { promise } = require("bcrypt/promises");


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipeId) {
    return await axios.get(`${api_domain}/${recipeId}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRandomRecipies() {
    return await axios.get(`${api_domain}/random`, {
        params: {
            limitLicense: true,
            number:3,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function mapRecipesDetails(recipeInfo,userId){
    let userHasWatch;
    const userWatch = await DButils.execQuery(`select user_id from userHasWatch where user_id='${userId}'`)
    if (userWatch.length < 1)
        userHasWatch = false;
    else
        userHasWatch = true;
    let favoriterecipes;
    const userFavorite = await DButils.execQuery(`select user_id from favoriterecipes where user_id='${userId}'`)
    if (userFavorite.length < 1)
        favoriterecipes = false;
    else
        favoriterecipes = true;
    return {
        id:recipeInfo.id,
        title: recipeInfo.title,
        readyInMinutes: recipeInfo.readyInMinutes,
        image: recipeInfo.image,
        popularity: recipeInfo.aggregateLikes,
        vegan: recipeInfo.vegan,
        vegetarian: recipeInfo.vegetarian,
        glutenFree: recipeInfo.glutenFree,
        wasWatchedByUserBefore: userHasWatch,
        wasSavedByUser: favoriterecipes,
    }
}

async function getRecipeDetails(recipeId,userId) {
    let recipe_info = await getRecipeInformation(recipeId);
    const final_list = await Promise.all( recipe_info.data.recipes.map(function(x){return mapRecipesDetails(x,userId);}));
    return final_list;
}


async function getRandomRecipiesDetails(userId) {
    let recipe_info = await getRandomRecipies();
    const final_list = await Promise.all( recipe_info.data.recipes.map(function(x){return mapRecipesDetails(x,userId);}));
    return final_list;

}

async function addRecipe(reqBody){
    try{
        let recipe = {
        name: reqBody.name,
        timeToMake: reqBody.timeToMake,
        whoCanEatVegOrNot: reqBody.whoCanEatVegOrNot,
        glutenFree:reqBody.glutenFree,
        ingridients: reqBody.ingridients,
        instructions: reqBody.instructions,
        numberOfMeals: reqBody.numberOfMeals
        }
        let maxID = 0;
        maxID = await DButils.execQuery("SELECT MAX(id) from recipes;")
        await DButils.execQuery(
        `INSERT INTO recipes VALUES ('${maxID[0]['MAX(id)']+1}','${recipe.name}','${recipe.timeToMake}', '${0}', '${recipe.whoCanEatVegOrNot}', '${recipe.glutenFree}',
        '${recipe.ingridients}', '${recipe.instructions}', '${recipe.numberOfMeals}', '${""}')`
        );
        return true;
    }
    catch (error) {
        return false;
    }
}


async function getFullRecipe(recipeId,userId){
    let recipe_info = await getRecipeInformation(recipeId);
    let { id, title, readyInMinutes, aggregateLikes, vegan, glutenFree,instructions,servings } = recipe_info.data;
    let userHasWatch = true;
    const userWatch = await DButils.execQuery(`select user_id from userHasWatch where user_id='${userId}'`)
    if (userWatch.length < 1){
        await DButils.execQuery(`INSERT INTO userHasWatch VALUES ('${userId}','${recipeId}')`)
    }
    let favoriterecipes;
    const userFavorite = await DButils.execQuery(`select user_id from favoriterecipes where user_id='${userId}'`)
    if (userFavorite.length < 1)
        favoriterecipes = false;
    else
        favoriterecipes = true;

    return {
        id: id,
        name: title,
        timeToMake: readyInMinutes,
        popularity: aggregateLikes,
        vegOrNot: vegan,
        wasWatchedByUserBefore: userHasWatch,
        wasSavedByUser: favoriterecipes,
        glutenFree: glutenFree,
        ingridients: extendedIngredients,
        instructions: instructions,
        numberOfMeals: servings
        
    }
}




exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipiesDetails = getRandomRecipiesDetails;
exports.addRecipe = addRecipe;
exports.getFullRecipe = getFullRecipe;



