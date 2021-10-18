const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//Validation Middleware

//Dish must include a name
const hasName = (req, res, next) => {
  if (!res.locals.dish) res.locals.dish = req.body.data;
  const { dish: { name } = {} } = res.locals;
  if (!name)
    next({
      status: 400,
      message: "A 'name' property is required.",
    });
  next();
};

//Dish must include a description
const hasDescription = (req, res, next) => {
  if (!res.locals.dish) res.locals.dish = req.body.data;
  const { dish: { description } = {} } = res.locals;
  if (!description)
    next({
      status: 400,
      message: "A 'description' property is required.",
    });
  next();
};

//Dish must include a price that is an integer greater than 0
const validPrice = (req, res, next) => {
  if (!res.locals.dish) res.locals.dish = req.body.data;
  const { dish: { price } = {} } = res.locals;
  if (!(price > 0) || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "A price property greater than 0 is required.",
    });
  }
  next();
};

//Dish must include an image_url
const hasImageUrl = (req, res, next) => {
  if (!res.locals.dish) res.locals.dish = req.body.data;
  const { dish: { image_url } = {} } = res.locals;
  if (!image_url)
    next({
      status: 400,
      message: "An 'image_url' property is required.",
    });
  next();
};

//DishId must exist and id in the body must match :dishId in the route
const validDishId = (req, res, next) => {
  res.locals.dish = req.body.data;
  const { dishId } = req.params;
  const { dish: { id } = {} } = res.locals;
  if (dishId === id) next();
  if (!id) next();
  next({
    status: 400,
    message: `Invalid dish id: ${id}. A dish's id must match its url`,
  });
};

//Dish must exist in order to be updated
const dishExists = (req, res, next) => {
  res.locals.dishId = req.params.dishId;
  const { dishId } = res.locals;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}` });
};

//Containers for validators organized by handler
const validateCreate = [hasName, hasDescription, hasImageUrl, validPrice];
const validateUpdate = [dishExists, validDishId, validateCreate];

//Handler Functions

//Get all dishes
const list = (req, res, next) => {
  res.json({ data: dishes });
};

//Get a single dish
const read = (req, res, next) => {
  res.json({ data: res.locals.dish });
};

//Create a new dish
const create = (req, res, next) => {
  const {
    dish: { name, description, price, image_url },
  } = res.locals;
  dish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(dish);
  res.status(201).json({ data: dish });
};

//Update a dish
const update = (req, res, next) => {
  const { dishId } = res.locals;
  const { dish: { name, description, price, image_url } = {} } = res.locals;
  dish = {
    id: dishId,
    name,
    description,
    price,
    image_url,
  };
  res.json({ data: dish });
};

module.exports = {
  list,
  read: [dishExists, read],
  create: [validateCreate, create],
  update: [validateUpdate, update],
};
