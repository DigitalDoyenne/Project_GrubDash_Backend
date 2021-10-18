const path = require("path");
//const { router } = require("../app");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//Validation Middleware

//Order must include deliverTo
const hasDeliverTo = (req, res, next) => {
  if (!res.locals.order) res.locals.order = req.body.data;
  const { order: { deliverTo } = {} } = res.locals;
  if (!deliverTo)
    next({
      status: 400,
      message: "A 'deliverTo' property is required.",
    });
  next();
};

//Order must include mobileNumber
const hasMobileNumber = (req, res, next) => {
  if (!res.locals.order) res.locals.order = req.body.data;
  const { order: { mobileNumber } = {} } = res.locals;
  if (!mobileNumber)
    next({
      status: 400,
      message: "A 'mobileNumber' property is required.",
    });
  next();
};

//Order must include at least one dish
const hasDishes = (req, res, next) => {
  const { order: { dishes } = {} } = res.locals;
  if (!dishes || !Array.isArray(dishes) || !dishes.length)
    next({
      status: 400,
      message: "A 'dishes' property is required.",
    });
  next();
};

//Order must have quantity that is an integer greater than 0
const validQuantity = (req, res, next) => {
  const { order: { dishes } = {} } = res.locals;
  for (dish of dishes) {
    const quantity = dish.quantity;
    if (!quantity || !Number.isInteger(quantity) || !(quantity > 0))
      next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`,
      });
  }
  next();
};

//Order id in the body must match :orderId in the route

const validOrderId = (req, res, next) => {
  res.locals.order = req.body.data;
  const { order: { id } = {} } = res.locals;
  const { orderId } = req.params;
  if (orderId === id) next();
  else if (!id) {
    res.locals.order.id = orderId;
    next();
  } else {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
};

//Order must have a status of pending, preparing, out-for-delivery, delivered
const validStatus = (req, res, next) => {
  const valStats = ["pending", "preparing", "out-for-delivery", "delivered"];
  const { order: { status } = {} } = res.locals;
  if (!valStats.includes(status))
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered.",
    });
  if (status === "delivered")
    next({
      status: 400,
      message: "A delivered order cannot be changed.",
    });
  next();
};

//Order must have a status of "pending" to be deleted
const statusPending = (req, res, next) => {
  const { order: { status } = {} } = res.locals;
  if (status !== "pending")
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  next();
};

//OrderId must exist in order to be updated (or deleted??)
const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (!foundOrder)
    next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  res.locals.order = foundOrder;
  next();
};

//Containers for validators organized by handler
const validateCreate = [
  hasDeliverTo,
  hasMobileNumber,
  hasDishes,
  validQuantity,
];
const validateUpdate = [orderExists, validOrderId, validStatus, validateCreate];
const validateDestroy = [orderExists, statusPending];

//Handler Functions

//Get all orders
const list = (req, res, next) => {
  res.status(200).json({ data: orders });
};

//Get one order
const read = (req, res, next) => {
  res.status(200).json({ data: res.locals.order });
};

//Create a new order
const create = (req, res, next) => {
  const { order: { deliverTo, mobileNumber, status, dishes } = {} } =
    res.locals;
  newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

//Update an existing order
const update = (req, res, next) => {
  const { orderId } = res.locals;
  const {
    order: { deliverTo, mobileNumber, status, dishes },
  } = res.locals;
  updatedOrder = {
    id: res.locals.order.id,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  res.json({ data: updatedOrder });
};

//Delete an existing order
const destroy = (req, res, next) => {
  const { orderId } = res.locals;
  const index = orders.findIndex(order => orderId === order.id);
  if (index) orders.splice(index, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  read: [orderExists, read],
  create: [validateCreate, create],
  update: [validateUpdate, update],
  destroy: [validateDestroy, destroy],
};
