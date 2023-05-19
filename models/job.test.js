"use strict";

const db = require("../db.js");
const {
  BadRequestError,
  NotFoundError,
} = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New",
    salary: 100,
    equity: 0,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New",
      salary: 100,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id = ${job.id}`
    );

    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "New",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
});

/*************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.5",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.76543",
        companyHandle: "c3",
      },
      {
        id: 999999999,
        title: "test",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** filter */

describe("filter", function () {
  test("works: filter by title", async function () {
    let jobs = await Job.filter({ title: "j" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.5",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.76543",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: filter by minSalary", async function () {
    let jobs = await Job.filter({ minSalary: "3" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.76543",
        companyHandle: "c3",
      },
      {
        id: 999999999,
        title: "test",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: filter by hasEquity", async function () {
    let jobsTrue = await Job.filter({ hasEquity: "true" });
    expect(jobsTrue).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.5",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.76543",
        companyHandle: "c3",
      },
    ]);

    let jobsFalse = await Job.filter({
      hasEquity: "false",
    });
    expect(jobsFalse).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.5",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.76543",
        companyHandle: "c3",
      },
      {
        id: 999999999,
        title: "test",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: using more than one filter query", async function () {
    let jobs = await Job.filter({
      minSalary: "2",
      hasEquity: "true",
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.5",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.76543",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************ get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(999999999);
    expect(job).toEqual({
      id: 999999999,
      title: "test",
      salary: 100,
      equity: "0",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/********************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 10,
    equity: 0.1,
  };

  test("works", async function () {
    let job = await Job.update(999999999, updateData);
    expect(job).toEqual({
      id: 999999999,
      title: "New",
      salary: 10,
      equity: "0.1",
      companyHandle: "c1",
    });

    const result = await db.query(`
            SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id = 999999999`);

    expect(result.rows).toEqual([
      {
        id: 999999999,
        title: "New",
        salary: 10,
        equity: "0.1",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let jobNulls = await Job.update(
      999999999,
      updateDataSetNulls
    );
    expect(jobNulls).toEqual({
      id: 999999999,
      title: "New",
      salary: null,
      equity: null,
      companyHandle: "c1",
    });

    const resultNulls = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id = 999999999`
    );

    expect(resultNulls.rows).toEqual([
      {
        id: 999999999,
        title: "New",
        salary: null,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(999999999, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(999999999);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=999999999"
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
