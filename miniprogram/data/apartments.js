const {
  getApartments,
  getApartmentById,
  getRoomById
} = require("./queries");

const api = {
  getApartments,
  getApartmentById,
  getRoomById
};

Object.defineProperty(api, "apartments", {
  enumerable: true,
  get: getApartments
});

module.exports = api;
