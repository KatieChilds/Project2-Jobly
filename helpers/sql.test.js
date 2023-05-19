const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

jsToSql = {
  firstName: "first_name",
  lastName: "last_name",
  isAdmin: "is_admin",
};

describe("sqlForPartialUpdate", function () {
  test("works: no jsToSql needed", function () {
    const dataToUpdate = { email: "test@email.com" };
    const { setCols, values } = sqlForPartialUpdate(
      dataToUpdate,
      jsToSql
    );
    expect({ setCols, values }).toEqual({
      setCols: '"email"=$1',
      values: ["test@email.com"],
    });
  });

  test("works: any data type name", function () {
    const dataToUpdate = {
      firstName: "Jane",
      email: "test@email.com",
      isAdmin: false,
    };
    const { setCols, values } = sqlForPartialUpdate(
      dataToUpdate,
      jsToSql
    );
    expect({ setCols, values }).toEqual({
      setCols: '"first_name"=$1, "email"=$2, "is_admin"=$3',
      values: ["Jane", "test@email.com", false],
    });
  });

  test("works: returns error if no data", function () {
    const dataToUpdate = {};
    try {
      const { setCols, values } = sqlForPartialUpdate(
        dataToUpdate,
        jsToSql
      );
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
