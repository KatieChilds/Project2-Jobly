const { BadRequestError } = require("../expressError");

/**
 * Takes dataToUpdate as an object,
 * dataToUpdate can include:
 * { password, firstName, lastName, email, isAdmin}
 * It does not need to have all data keys and values.
 *
 * Throws BadRequestError if no data is passed in.
 *
 * Otherwise, returns:
 * {setCols: "first_name=$1, email=$2",
 *  values: ["Joe", "test@email.com"]}
 **/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0)
    throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
